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

  // Log URL availability for debugging
  logStep("notifyGHL called", {
    event: payload.event,
    secretName,
    urlFirst20: ghlUrl ? ghlUrl.substring(0, 20) : "NULL/UNDEFINED",
    urlLength: ghlUrl ? ghlUrl.length : 0,
  });

  if (!ghlUrl) {
    logStep(`${secretName} not set, skipping notification`);
    return;
  }

  logStep("About to POST to GHL", { event: payload.event, email: payload.email });

  fetch(ghlUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then(async (res) => {
      const body = await res.text();
      logStep("GHL response received", { event: payload.event, status: res.status, body });
    })
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
        await handleSubscriptionCreated(supabase, stripe, event.data.object as any);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(supabase, stripe, event.data.object as any);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(supabase, stripe, event.data.object as any);
        break;
      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(supabase, stripe, event.data.object as any);
        break;
      case "invoice.payment_failed":
        await handlePaymentFailed(supabase, stripe, event.data.object as any);
        break;
      case "customer.subscription.trial_will_end":
        logStep("trial_will_end received", { subscriptionId: (event.data.object as any).id });
        break;
      default:
        logStep("Unhandled event type", { type: event.type });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logStep("ERROR processing event", { type: event.type, message: msg });
    // Always return 200 to Stripe to prevent retries
  }

  // --- Outbound GHL webhook calls (fire-and-forget, never block Stripe response) ---
  try {
    const GHL_URLS: Record<string, string> = {
      "customer.subscription.created": "https://services.leadconnectorhq.com/hooks/hNgWHJ2VuWmyxA4xDAAK/webhook-trigger/ZESbDcBswAS6yQ37kgzC",
      "invoice.payment_failed": "https://services.leadconnectorhq.com/hooks/hNgWHJ2VuWmyxA4xDAAK/webhook-trigger/1437ec68-fa21-42b2-adcb-976dc4fc78ec",
      "customer.subscription.trial_will_end": "https://services.leadconnectorhq.com/hooks/hNgWHJ2VuWmyxA4xDAAK/webhook-trigger/f53747a1-0ae3-4c39-ad0a-f94e0f0098f3",
    };

    const ghlUrl = GHL_URLS[event.type];
    if (ghlUrl) {
      let customerEmail = "";
      let customerName = "";

      if (event.type === "invoice.payment_failed") {
        const invoice = event.data.object as any;
        customerEmail = invoice.customer_email || "";
        customerName = invoice.customer_name || "";
      } else if (event.type === "customer.subscription.created" || event.type === "customer.subscription.trial_will_end") {
        const subscription = event.data.object as any;
        const custId = typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer?.id;
        if (custId) {
          try {
            const customer = await stripe.customers.retrieve(custId);
            if (customer && !customer.deleted) {
              customerEmail = (customer as any).email || "";
              customerName = (customer as any).name || "";
            }
          } catch (custErr) {
            logStep("GHL: failed to fetch customer", { event: event.type, error: String(custErr) });
          }
        }
      }

      let ghlPayload: Record<string, string>;

      if (event.type === "customer.subscription.created") {
        const spaceIdx = customerName.indexOf(" ");
        const firstName = spaceIdx > -1 ? customerName.substring(0, spaceIdx) : customerName;
        const lastName = spaceIdx > -1 ? customerName.substring(spaceIdx + 1) : "";
        ghlPayload = {
          email: customerEmail,
          first_name: firstName,
          last_name: lastName,
          event: event.type,
        };
      } else {
        ghlPayload = {
          email: customerEmail,
          name: customerName,
          event: event.type,
        };
      }

      logStep("GHL outbound call", { url: ghlUrl.substring(0, 40) + "...", payload: ghlPayload });

      fetch(ghlUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ghlPayload),
      })
        .then(async (res) => {
          const body = await res.text();
          logStep("GHL direct response", { event: event.type, status: res.status, body });
        })
        .catch((err) => logStep("GHL direct call failed (non-blocking)", { error: String(err) }));
    }
  } catch (ghlErr) {
    logStep("GHL outbound error (non-blocking)", { error: String(ghlErr) });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

// Helper: find profile by stripe_customer_id, with email fallback (also backfills customer id).
// Pass `stripe` so we can resolve the customer email when no profile matches the customer id.
async function findProfile(supabase: any, stripe: any, customerId: string | null) {
  if (customerId) {
    const { data } = await supabase
      .from("profiles")
      .select("id, role, subscription_status, email")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    if (data) return data;
    logStep("No profile by customer id, trying email fallback", { customerId });
  }

  // Email fallback — fetch the customer and look up the profile by email.
  if (!customerId) return null;
  let email: string | null = null;
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer && !customer.deleted) {
      email = ((customer as any).email || "").toLowerCase().trim() || null;
    }
  } catch (err) {
    logStep("Failed to fetch customer for email fallback", { customerId, error: String(err) });
    return null;
  }
  if (!email) {
    logStep("Customer has no email, cannot match profile", { customerId });
    return null;
  }

  const { data: byEmail } = await supabase
    .from("profiles")
    .select("id, role, subscription_status, email, stripe_customer_id")
    .ilike("email", email)
    .maybeSingle();

  if (!byEmail) {
    logStep("No profile found by customer id or email", { customerId, email });
    return null;
  }

  // Backfill stripe_customer_id so future webhooks match directly.
  if (byEmail.stripe_customer_id !== customerId) {
    await supabase
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", byEmail.id);
    logStep("Backfilled stripe_customer_id", { profileId: byEmail.id, customerId });
  }
  return byEmail;
}

// Maps a Stripe subscription status to our internal "active row should exist" flag.
function isActiveStatus(status: string | null | undefined) {
  return status === "active" || status === "trialing" || status === "past_due";
}

// Persist subscription state in BOTH places the app reads from:
//  1. profiles.subscription_status (plain status string) + plan
//  2. subscriptions table (active/canceled row keyed by user_id)
async function syncSubscriptionState(
  supabase: any,
  profileId: string,
  stripeStatus: string,
) {
  const active = isActiveStatus(stripeStatus);

  const { error: profileErr } = await supabase
    .from("profiles")
    .update({
      subscription_status: stripeStatus,
      plan: active ? "pro" : "free",
    })
    .eq("id", profileId);
  if (profileErr) {
    logStep("Failed to update profile subscription fields", { profileId, error: profileErr.message });
  }

  if (active) {
    const { error: upsertErr } = await supabase
      .from("subscriptions")
      .upsert(
        { user_id: profileId, status: "active", updated_at: new Date().toISOString() },
        { onConflict: "user_id" },
      );
    if (upsertErr) {
      logStep("Failed to upsert subscriptions row", { profileId, error: upsertErr.message });
    }
  } else {
    const { error: cancelErr } = await supabase
      .from("subscriptions")
      .update({ status: "canceled", updated_at: new Date().toISOString() })
      .eq("user_id", profileId);
    if (cancelErr) {
      logStep("Failed to mark subscriptions row canceled", { profileId, error: cancelErr.message });
    }
  }

  logStep("Synced subscription state", { profileId, stripeStatus, active });
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
    logStep("Calling notifyGHL for subscription_created", {
      email: fullProfile.email,
      first_name: fullProfile.first_name,
    });
    notifyGHL({
      event: "subscription_created",
      email: fullProfile.email || "",
      first_name: fullProfile.first_name || "",
      last_name: fullProfile.last_name || "",
      plan: "pro",
      trial_end: periodEnd,
      phone: fullProfile.phone || "",
    });
  } else {
    logStep("No fullProfile found, skipping GHL notification", { profileId: profile.id });
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
    logStep("Calling notifyGHL for subscription_created (payment_succeeded)", {
      email: fullProfile.email,
      first_name: fullProfile.first_name,
    });
    notifyGHL({
      event: "subscription_created",
      email: fullProfile.email || "",
      first_name: fullProfile.first_name || "",
      last_name: fullProfile.last_name || "",
      plan: "pro",
      trial_end: periodEnd,
      phone: fullProfile.phone || "",
    });
  } else {
    logStep("No fullProfile found, skipping GHL notification (payment_succeeded)", { profileId: profile.id });
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
    logStep("Calling notifyGHL for payment_failed", { email: fullProfile.email });
    notifyGHL({
      event: "payment_failed",
      email: fullProfile.email || "",
      first_name: fullProfile.first_name || "",
    });
  }
}
