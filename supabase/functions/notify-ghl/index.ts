import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const logStep = (step: string, details?: any) => {
  console.log(`[NOTIFY-GHL] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200 });
  }

  const ghlUrl = Deno.env.get("GHL_WEBHOOK_URL");
  if (!ghlUrl) {
    logStep("ERROR", { message: "GHL_WEBHOOK_URL not configured" });
    return new Response(JSON.stringify({ error: "Not configured" }), { status: 500 });
  }

  try {
    const payload = await req.json();
    logStep("Sending to GHL", { event: payload.event, email: payload.email });

    // Fire and forget — don't await the full response
    fetch(ghlUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(() => logStep("GHL notification sent", { event: payload.event }))
      .catch((err) => logStep("GHL notification failed (non-blocking)", { error: String(err) }));

    return new Response(JSON.stringify({ sent: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    logStep("ERROR", { message: String(err) });
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
