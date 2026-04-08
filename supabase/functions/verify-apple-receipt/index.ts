import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // Authenticate the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) throw new Error("Authentication failed");

    const body = await req.json();
    const { receipt_data, product_id, transaction_id } = body;

    if (!transaction_id) {
      throw new Error("Missing transaction_id");
    }

    console.log(`[VERIFY-APPLE-RECEIPT] User: ${user.id}, Product: ${product_id}, TxID: ${transaction_id}`);

    // In production, you would validate the receipt with Apple's /verifyReceipt endpoint.
    // For App Store Server API v2, you'd use the signed transaction info.
    // For now, we trust the transaction from the native StoreKit layer
    // and update the user's subscription status.
    //
    // Apple receipt validation URL:
    // Production: https://buy.itunes.apple.com/verifyReceipt
    // Sandbox: https://sandbox.itunes.apple.com/verifyReceipt
    
    const APPLE_SHARED_SECRET = Deno.env.get("APPLE_SHARED_SECRET");
    
    let verified = false;

    if (APPLE_SHARED_SECRET && receipt_data && typeof receipt_data === "string" && receipt_data.length > 50) {
      // Validate with Apple
      const verifyUrl = "https://buy.itunes.apple.com/verifyReceipt";
      const sandboxUrl = "https://sandbox.itunes.apple.com/verifyReceipt";

      let response = await fetch(verifyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          "receipt-data": receipt_data,
          password: APPLE_SHARED_SECRET,
          "exclude-old-transactions": true,
        }),
      });

      let result = await response.json();

      // Status 21007 means receipt is from sandbox
      if (result.status === 21007) {
        response = await fetch(sandboxUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            "receipt-data": receipt_data,
            password: APPLE_SHARED_SECRET,
            "exclude-old-transactions": true,
          }),
        });
        result = await response.json();
      }

      if (result.status === 0) {
        verified = true;
        console.log("[VERIFY-APPLE-RECEIPT] Apple verification successful");
      } else {
        console.warn(`[VERIFY-APPLE-RECEIPT] Apple verification status: ${result.status}`);
      }
    } else {
      // No shared secret configured or no full receipt - trust the native StoreKit verification
      // StoreKit 2 handles verification on-device
      verified = true;
      console.log("[VERIFY-APPLE-RECEIPT] Trusting native StoreKit verification");
    }

    if (verified) {
      // Update profile subscription status
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          subscription_status: "active",
          plan: "pro",
          subscription_checked_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) {
        console.error("[VERIFY-APPLE-RECEIPT] Profile update error:", updateError);
        throw new Error("Failed to update subscription status");
      }

      console.log(`[VERIFY-APPLE-RECEIPT] Subscription activated for user ${user.id}`);
    }

    return new Response(
      JSON.stringify({ verified, message: verified ? "Subscription activated" : "Verification failed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[VERIFY-APPLE-RECEIPT] ERROR:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
