// Notifies a free athlete by email when a college coach replies. Triggered by
// a Postgres AFTER INSERT trigger on public.coach_replies.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const NOTIFICATION_FROM = "notifications@mail.offered.pro";
const APP_URL = "https://offered.pro";

function isPaid(profile: any): boolean {
  if (!profile) return false;
  if (profile.role === "admin" || profile.role === "creator") return true;
  if (profile.plan && ["pro", "premium", "lifetime"].includes(profile.plan)) return true;
  if (profile.subscription_status && ["active", "trialing", "past_due"].includes(profile.subscription_status)) return true;
  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SENDGRID = Deno.env.get("SENDGRID_API_KEY");
    if (!SENDGRID) return new Response("no sendgrid", { status: 200 });

    const body = await req.json().catch(() => null) as { reply_id?: string } | null;
    if (!body?.reply_id) return new Response("missing reply_id", { status: 200 });

    const admin = createClient(SUPABASE_URL, SERVICE);

    const { data: reply } = await admin
      .from("coach_replies")
      .select("id, athlete_id, coach_name, school_name, coach_email")
      .eq("id", body.reply_id)
      .maybeSingle();
    if (!reply) return new Response("no reply", { status: 200 });

    // Check if active subscriber — if so, skip the free-user nudge.
    const { data: subRow } = await admin
      .from("subscriptions")
      .select("id")
      .eq("user_id", reply.athlete_id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    const { data: profile } = await admin
      .from("profiles")
      .select("first_name, last_name, email, role, plan, subscription_status")
      .eq("id", reply.athlete_id)
      .maybeSingle();
    if (!profile?.email) return new Response("no email", { status: 200 });

    if (subRow || isPaid(profile)) {
      return new Response("paid_user_skipped", { status: 200 });
    }

    const firstName = profile.first_name || "there";
    const coachName = reply.coach_name || "A college coach";
    const schoolName = reply.school_name || "their program";

    const subject = "A college coach replied to your recruiting outreach";
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1D1D1F;">
        <div style="text-align:center; margin-bottom: 28px;">
          <div style="display:inline-block; width:48px; height:48px; border-radius:10px; background:#E8391D; color:#fff; font-weight:700; line-height:48px; font-size:18px;">OFF</div>
        </div>
        <h1 style="font-size:22px; line-height:1.25; margin:0 0 16px; color:#1D1D1F;">Hey ${firstName} —</h1>
        <p style="font-size:16px; line-height:1.6; color:#1D1D1F; margin:0 0 16px;">
          <strong>${coachName}</strong> from <strong>${schoolName}</strong> just responded to your recruiting outreach.
        </p>
        <p style="font-size:16px; line-height:1.6; color:#6E6E73; margin:0 0 28px;">
          Subscribe to Offered to read their message and keep the conversation going.
        </p>
        <div style="text-align:center; margin: 24px 0 32px;">
          <a href="${APP_URL}/replies" style="display:inline-block; background:#E8391D; color:#fff; text-decoration:none; padding:14px 28px; border-radius:980px; font-weight:600; font-size:15px;">Read Their Reply</a>
        </div>
        <p style="font-size:12px; color:#86868B; text-align:center; margin: 0;">
          ${APP_URL}
        </p>
      </div>`;

    const text = `Hey ${firstName} — ${coachName} from ${schoolName} just responded to your recruiting outreach. Subscribe to Offered to read their message and keep the conversation going. Read it here: ${APP_URL}/replies`;

    const sgRes = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: profile.email }] }],
        from: { email: NOTIFICATION_FROM, name: "Offered" },
        subject,
        content: [
          { type: "text/plain", value: text },
          { type: "text/html", value: html },
        ],
      }),
    });

    if (!sgRes.ok) {
      console.error("[notify-reply-received] SendGrid error", sgRes.status, await sgRes.text());
      return new Response("sendgrid_error", { status: 200 });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    console.error("[notify-reply-received] unexpected", e);
    return new Response("error", { status: 200 });
  }
});
