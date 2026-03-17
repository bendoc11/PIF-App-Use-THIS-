import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const logStep = (step: string, details?: any) => {
  console.log(`[NOTIFY-GHL] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200 });
  }

  try {
    const payload = await req.json();
    const event = payload.event as string;

    logStep("notify-ghl called with event", { event });

    // Map event to its dedicated webhook URL secret
    const urlMap: Record<string, string> = {
      subscription_created: "GHL_WEBHOOK_SUBSCRIPTION_CREATED",
      trial_ending: "GHL_WEBHOOK_TRIAL_ENDING",
      payment_failed: "GHL_WEBHOOK_PAYMENT_FAILED",
    };

    const secretName = urlMap[event];
    if (!secretName) {
      logStep("Unknown event type, skipping", { event });
      return new Response(JSON.stringify({ skipped: true, reason: "unknown event" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const ghlUrl = Deno.env.get(secretName);

    // Log first 20 chars of URL to confirm it's set
    logStep("URL check", {
      secretName,
      urlFirst20: ghlUrl ? ghlUrl.substring(0, 20) : "NULL/UNDEFINED",
      urlLength: ghlUrl ? ghlUrl.length : 0,
    });

    if (!ghlUrl) {
      logStep("ERROR", { message: `${secretName} not configured` });
      return new Response(JSON.stringify({ error: `${secretName} not configured` }), { status: 500 });
    }

    logStep("Sending to GHL", { event, secret: secretName, email: payload.email });
    logStep("sending to URL", { url: ghlUrl.substring(0, 20) + "..." });
    logStep("Full payload being sent", { payload });

    try {
      const response = await fetch(ghlUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseBody = await response.text();
      logStep("GHL response status", { status: response.status });
      logStep("GHL response body", { body: responseBody });
    } catch (fetchErr) {
      logStep("GHL fetch error", { error: String(fetchErr) });
    }

    return new Response(JSON.stringify({ sent: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    logStep("ERROR", { message: String(err) });
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
