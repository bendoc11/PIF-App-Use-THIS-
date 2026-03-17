import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: any) => {
  console.log(`[CHECK-TRIAL-ENDING] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

serve(async (_req) => {
  const ghlUrl = Deno.env.get("GHL_WEBHOOK_URL");
  if (!ghlUrl) {
    logStep("ERROR", { message: "GHL_WEBHOOK_URL not configured" });
    return new Response(JSON.stringify({ error: "Not configured" }), { status: 500 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // Get all profiles with active subscriptions
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, email, first_name, subscription_status")
      .not("subscription_status", "is", null);

    if (error) {
      logStep("DB error", { error: error.message });
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    let notified = 0;
    const now = Date.now();
    const fortyEightHours = 48 * 60 * 60 * 1000;

    for (const profile of profiles || []) {
      try {
        if (!profile.subscription_status) continue;
        
        const status = typeof profile.subscription_status === "string"
          ? JSON.parse(profile.subscription_status)
          : profile.subscription_status;

        if (!status.subscribed || !status.current_period_end) continue;

        const periodEnd = new Date(status.current_period_end).getTime();
        const timeUntilEnd = periodEnd - now;

        // Within 48 hours but not already past
        if (timeUntilEnd > 0 && timeUntilEnd <= fortyEightHours) {
          logStep("Trial ending soon", { email: profile.email, periodEnd: status.current_period_end });

          fetch(ghlUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              event: "trial_ending",
              email: profile.email || "",
              first_name: profile.first_name || "",
              trial_end: status.current_period_end,
            }),
          }).catch((err) => logStep("GHL send failed", { error: String(err) }));

          notified++;
        }
      } catch {
        // Skip profiles with unparseable status
      }
    }

    logStep("Complete", { profilesChecked: profiles?.length || 0, notified });
    return new Response(JSON.stringify({ checked: profiles?.length || 0, notified }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    logStep("ERROR", { message: String(err) });
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
