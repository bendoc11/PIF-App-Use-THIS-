import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  console.log(`[MANAGE-SUBSCRIPTION] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const { action } = await req.json().catch(() => ({ action: "get" }));
    logStep("Action requested", { action });

    // Find Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      return new Response(JSON.stringify({
        has_subscription: false,
        customer: null,
        subscription: null,
        invoices: [],
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customer = customers.data[0];
    logStep("Found customer", { customerId: customer.id });

    // ACTION: Cancel subscription
    if (action === "cancel") {
      const subs = await stripe.subscriptions.list({
        customer: customer.id,
        status: "all",
        limit: 1,
      });

      const activeSub = subs.data.find(s => ["active", "trialing", "past_due"].includes(s.status));
      if (!activeSub) {
        return new Response(JSON.stringify({ error: "No active subscription to cancel" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      const updated = await stripe.subscriptions.update(activeSub.id, {
        cancel_at_period_end: true,
      });
      logStep("Subscription set to cancel at period end", { subId: updated.id });

      return new Response(JSON.stringify({
        success: true,
        cancel_at_period_end: true,
        cancel_at: updated.cancel_at ? new Date(updated.cancel_at * 1000).toISOString() : null,
        current_period_end: new Date(updated.current_period_end * 1000).toISOString(),
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // ACTION: Reactivate (undo cancel_at_period_end)
    if (action === "reactivate") {
      const subs = await stripe.subscriptions.list({
        customer: customer.id,
        status: "all",
        limit: 1,
      });

      const cancelingSub = subs.data.find(s => s.cancel_at_period_end && ["active", "trialing"].includes(s.status));
      if (!cancelingSub) {
        return new Response(JSON.stringify({ error: "No subscription pending cancellation" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      await stripe.subscriptions.update(cancelingSub.id, {
        cancel_at_period_end: false,
      });
      logStep("Subscription reactivated", { subId: cancelingSub.id });

      return new Response(JSON.stringify({ success: true, reactivated: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // DEFAULT ACTION: Get subscription details
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: "all",
      limit: 5,
      expand: ["data.default_payment_method"],
    });

    const activeSub = subscriptions.data.find(s =>
      ["active", "trialing", "past_due", "incomplete"].includes(s.status)
    ) || subscriptions.data.find(s => s.cancel_at_period_end);

    // Fetch recent invoices
    const invoices = await stripe.invoices.list({
      customer: customer.id,
      limit: 10,
    });

    let subscriptionData = null;
    if (activeSub) {
      const priceItem = activeSub.items.data[0];
      const pm = activeSub.default_payment_method as Stripe.PaymentMethod | null;

      subscriptionData = {
        id: activeSub.id,
        status: activeSub.status,
        cancel_at_period_end: activeSub.cancel_at_period_end,
        cancel_at: activeSub.cancel_at ? new Date(activeSub.cancel_at * 1000).toISOString() : null,
        current_period_start: new Date(activeSub.current_period_start * 1000).toISOString(),
        current_period_end: new Date(activeSub.current_period_end * 1000).toISOString(),
        trial_start: activeSub.trial_start ? new Date(activeSub.trial_start * 1000).toISOString() : null,
        trial_end: activeSub.trial_end ? new Date(activeSub.trial_end * 1000).toISOString() : null,
        plan: {
          name: priceItem?.price?.nickname || "Pro Membership",
          amount: priceItem?.price?.unit_amount ? priceItem.price.unit_amount / 100 : null,
          currency: priceItem?.price?.currency || "usd",
          interval: priceItem?.price?.recurring?.interval || "month",
        },
        payment_method: pm && pm.type === "card" ? {
          brand: pm.card?.brand || null,
          last4: pm.card?.last4 || null,
          exp_month: pm.card?.exp_month || null,
          exp_year: pm.card?.exp_year || null,
        } : null,
      };
    }

    const invoiceData = invoices.data.map(inv => ({
      id: inv.id,
      number: inv.number,
      amount_paid: inv.amount_paid / 100,
      currency: inv.currency,
      status: inv.status,
      created: new Date(inv.created * 1000).toISOString(),
      hosted_invoice_url: inv.hosted_invoice_url,
      pdf: inv.invoice_pdf,
    }));

    logStep("Returning subscription data", {
      hasSub: !!subscriptionData,
      invoiceCount: invoiceData.length,
    });

    return new Response(JSON.stringify({
      has_subscription: !!subscriptionData,
      customer: {
        id: customer.id,
        email: customer.email,
      },
      subscription: subscriptionData,
      invoices: invoiceData,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
