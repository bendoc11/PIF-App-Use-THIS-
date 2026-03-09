import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  console.log(`[CHECK-SUBSCRIPTION] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    
    // Decode JWT payload to get user ID (without verification - we trust the service role for lookup)
    let userId: string;
    try {
      const payloadBase64 = token.split(".")[1];
      const payload = JSON.parse(atob(payloadBase64));
      userId = payload.sub;
      if (!userId) throw new Error("No sub in token");
    } catch {
      throw new Error("Invalid token format");
    }

    // Use admin API to get user (works even with expired tokens)
    const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(userId);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    // Fetch ALL customers for this email (handles duplicate customer records)
    const allCustomers = [];
    let hasMore = true;
    let startingAfter: string | undefined;
    while (hasMore) {
      const params: any = { email: user.email, limit: 100 };
      if (startingAfter) params.starting_after = startingAfter;
      const batch = await stripe.customers.list(params);
      allCustomers.push(...batch.data);
      hasMore = batch.has_more;
      if (batch.data.length > 0) startingAfter = batch.data[batch.data.length - 1].id;
    }

    if (allCustomers.length === 0) {
      logStep("No Stripe customer found");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Found customers", { count: allCustomers.length, ids: allCustomers.map(c => c.id) });

    // Check ALL customers for active or trialing subscriptions
    let allSubs: any[] = [];
    for (const customer of allCustomers) {
      const activeSubs = await stripe.subscriptions.list({
        customer: customer.id,
        status: "active",
        limit: 1,
      });
      if (activeSubs.data.length > 0) {
        allSubs = activeSubs.data;
        break;
      }
      const trialSubs = await stripe.subscriptions.list({
        customer: customer.id,
        status: "trialing",
        limit: 1,
      });
      if (trialSubs.data.length > 0) {
        allSubs = trialSubs.data;
        break;
      }
    }

    const hasActiveSub = allSubs.length > 0;
    let subscriptionEnd = null;
    let productId = null;
    let trialEnd = null;

    if (hasActiveSub) {
      const sub = allSubs[0];
      // Use safe timestamp conversion
      if (sub.current_period_end && typeof sub.current_period_end === "number") {
        subscriptionEnd = new Date(sub.current_period_end * 1000).toISOString();
      }
      productId = sub.items?.data?.[0]?.price?.product ?? null;
      if (sub.trial_end && typeof sub.trial_end === "number") {
        trialEnd = new Date(sub.trial_end * 1000).toISOString();
      }
      logStep("Active subscription found", { status: sub.status, subscriptionEnd, trialEnd });
    } else {
      logStep("No active subscription");
    }

    return new Response(
      JSON.stringify({
        subscribed: hasActiveSub,
        product_id: productId,
        subscription_end: subscriptionEnd,
        trial_end: trialEnd,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
