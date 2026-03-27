import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  console.log(`[CREATE-CHECKOUT] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { email } = await req.json();
    if (!email) throw new Error("Email is required");
    logStep("Email received", { email });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const withTimeout = async <T>(promise: Promise<T>, ms: number, timeoutMessage: string): Promise<T> => {
      return await Promise.race([
        promise,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(timeoutMessage)), ms)
        ),
      ]);
    };

    const origin = req.headers.get("origin") || "http://localhost:3000";

    const session = await withTimeout(
      stripe.checkout.sessions.create({
        customer_email: email,
        line_items: [
          { price: "price_1T6WwJBPEetonI9eZgTrNOwK", quantity: 1 },
          { price: "price_1TFHVNBPEetonI9eERpV9Zav", quantity: 1 },
        ],
        mode: "subscription",
        subscription_data: {
          trial_period_days: 7,
        },
        success_url: `${origin}/signup-success?session_id={CHECKOUT_SESSION_ID}&verified=true`,
        cancel_url: `${origin}/login?checkout=cancelled`,
      }),
      9000,
      "Stripe checkout request timed out"
    );

    const sessionCustomerId = typeof session.customer === "string" ? session.customer : undefined;
    if (sessionCustomerId) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );

      const { error: updateError } = await withTimeout(
        supabase
          .from("profiles")
          .update({ stripe_customer_id: sessionCustomerId })
          .eq("email", email),
        2000,
        "Saving customer id timed out"
      );

      if (updateError) {
        logStep("Failed to save stripe_customer_id", { error: updateError.message });
      } else {
        logStep("Saved stripe_customer_id to profile", { customerId: sessionCustomerId, email });
      }
    }

    logStep("Checkout session created", { sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url }), {
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
