import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: any) => {
  console.log(`[STRIPE-WEBHOOK] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

// Fire-and-forget GHL notification — never throws
function notifyGHL(payload: Record<string, any>) {
  const urlMap: Record<string, string> = {
    subscription_created: "GHL_WEBHOOK_SUBSCRIPTION_CREATED",
    trial_ending: "GHL_WEBHOOK_TRIAL_ENDING",
    payment_failed: "GHL_WEBHOOK_PAYMENT_FAILED",
  };
  const secretName = urlMap[payload.event];
  if (!secretName) {
    logStep("Unknown GHL event, skipping", { event: payload.event });
    return;
  }
  const ghlUrl = Deno.env.get(secretName);
  if (!ghlUrl) {
    logStep(`${secretName} not set, skipping notification`);
    return;
  }
  fetch(ghlUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then(() => logStep("GHL notified", { event: payload.event }))
    .catch((err) => logStep("GHL notify failed (non-blocking)", { error: String(err) }));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200 });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!stripeKey || !webhookSecret) {
    logStep("ERROR", { message: "Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET" });
    return new Response(JSON.stringify({ error: "Server misconfigured" }), { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  // Read raw body for signature verification
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    logStep("ERROR", { message: "No stripe-signature header" });
    return new Response(JSON.stringify({ error: "No signature" }), { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logStep("SIGNATURE VERIFICATION FAILED", { message: msg });
    return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
  }

  logStep("Event received", { type: event.type, id: event.id });

  try {
    switch (event.type) {
      case "customer.subscription.created":
        await handleSubscriptionCreated(supabase, event.data.object as any);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(supabase, event.data.object as any);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(supabase, event.data.object as any);
        break;
      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(supabase, stripe, event.data.object as any);
        break;
      case "invoice.payment_failed":
        await handlePaymentFailed(supabase, event.data.object as any);
        break;
      default:
        logStep("Unhandled event type", { type: event.type });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logStep("ERROR processing event", { type: event.type, message: msg });
    // Always return 200 to Stripe to prevent retries
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

// Helper: find profile by stripe_customer_id
async function findProfileByCustomerId(supabase: any, customerId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, subscription_status")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (error) {
    logStep("DB lookup error", { customerId, error: error.message });
    return null;
  }
  if (!data) {
    logStep("No profile found for customer", { customerId });
    return null;
  }
  return data;
}

// Helper: update subscription_status on profile
async function updateSubscriptionStatus(supabase: any, profileId: string, status: any) {
  const { error } = await supabase
    .from("profiles")
    .update({ subscription_status: JSON.stringify(status) })
    .eq("id", profileId);

  if (error) {
    logStep("Failed to update subscription_status", { profileId, error: error.message });
    throw error;
  }
  logStep("Updated subscription_status", { profileId, status });
}

async function handleSubscriptionCreated(supabase: any, subscription: any) {
  const customerId = typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer?.id;

  logStep("subscription.created", { customerId, status: subscription.status });

  const profile = await findProfileByCustomerId(supabase, customerId);
  if (!profile) return;

  const periodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null;

  await updateSubscriptionStatus(supabase, profile.id, {
    subscribed: true,
    subscription_status: subscription.status || "active",
    product_id: "pro",
    current_period_end: periodEnd,
    stripe_subscription_id: subscription.id,
  });

  // Notify GHL — new subscriber
  const { data: fullProfile } = await supabase
    .from("profiles")
    .select("email, first_name, last_name, phone")
    .eq("id", profile.id)
    .maybeSingle();

  if (fullProfile) {
    notifyGHL({
      event: "subscription_created",
      email: fullProfile.email || "",
      first_name: fullProfile.first_name || "",
      last_name: fullProfile.last_name || "",
      plan: "pro",
      trial_end: periodEnd,
      phone: fullProfile.phone || "",
    });
  }
}

async function handleSubscriptionUpdated(supabase: any, subscription: any) {
  const customerId = typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer?.id;

  logStep("subscription.updated", { customerId, status: subscription.status });

  const profile = await findProfileByCustomerId(supabase, customerId);
  if (!profile) return;

  const periodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null;

  let subscribed = false;
  let pastDue = false;
  const subStatus = subscription.status;

  if (subStatus === "active" || subStatus === "trialing") {
    subscribed = true;
  } else if (subStatus === "past_due") {
    subscribed = true;
    pastDue = true;
  }
  // canceled, unpaid, incomplete_expired → subscribed: false

  const statusObj: any = {
    subscribed,
    subscription_status: subStatus,
    product_id: subscribed ? "pro" : null,
    current_period_end: periodEnd,
    stripe_subscription_id: subscription.id,
  };
  if (pastDue) statusObj.past_due = true;

  await updateSubscriptionStatus(supabase, profile.id, statusObj);
}

async function handleSubscriptionDeleted(supabase: any, subscription: any) {
  const customerId = typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer?.id;

  logStep("subscription.deleted", { customerId });

  const profile = await findProfileByCustomerId(supabase, customerId);
  if (!profile) return;

  await updateSubscriptionStatus(supabase, profile.id, {
    subscribed: false,
    subscription_status: "canceled",
    product_id: null,
    stripe_subscription_id: subscription.id,
  });
}

async function handlePaymentSucceeded(supabase: any, stripe: any, invoice: any) {
  const customerId = typeof invoice.customer === "string"
    ? invoice.customer
    : invoice.customer?.id;

  logStep("payment_succeeded", { customerId, subscription: invoice.subscription });

  const profile = await findProfileByCustomerId(supabase, customerId);
  if (!profile) return;

  let periodEnd = null;
  if (invoice.subscription) {
    try {
      const sub = await stripe.subscriptions.retrieve(invoice.subscription);
      if (sub.current_period_end) {
        periodEnd = new Date(sub.current_period_end * 1000).toISOString();
      }
    } catch (err) {
      logStep("Failed to retrieve subscription for period end", { error: String(err) });
    }
  }

  await updateSubscriptionStatus(supabase, profile.id, {
    subscribed: true,
    subscription_status: "active",
    product_id: "pro",
    current_period_end: periodEnd,
    stripe_subscription_id: invoice.subscription,
  });

  // Notify GHL — payment succeeded (new subscriber welcome)
  const { data: fullProfile } = await supabase
    .from("profiles")
    .select("email, first_name, last_name, phone")
    .eq("id", profile.id)
    .maybeSingle();

  if (fullProfile) {
    notifyGHL({
      event: "subscription_created",
      email: fullProfile.email || "",
      first_name: fullProfile.first_name || "",
      last_name: fullProfile.last_name || "",
      plan: "pro",
      trial_end: periodEnd,
      phone: fullProfile.phone || "",
    });
  }
}

async function handlePaymentFailed(supabase: any, invoice: any) {
  const customerId = typeof invoice.customer === "string"
    ? invoice.customer
    : invoice.customer?.id;

  logStep("payment_failed", { customerId });

  const profile = await findProfileByCustomerId(supabase, customerId);
  if (!profile) return;

  // Parse existing status to preserve fields, just add payment_failed flag
  let existing: any = {};
  try {
    if (profile.subscription_status) {
      existing = typeof profile.subscription_status === "string"
        ? JSON.parse(profile.subscription_status)
        : profile.subscription_status;
    }
  } catch {
    existing = {};
  }

  await updateSubscriptionStatus(supabase, profile.id, {
    ...existing,
    payment_failed: true,
  });

  // Notify GHL — payment failed
  const { data: fullProfile } = await supabase
    .from("profiles")
    .select("email, first_name")
    .eq("id", profile.id)
    .maybeSingle();

  if (fullProfile) {
    notifyGHL({
      event: "payment_failed",
      email: fullProfile.email || "",
      first_name: fullProfile.first_name || "",
    });
  }
}
