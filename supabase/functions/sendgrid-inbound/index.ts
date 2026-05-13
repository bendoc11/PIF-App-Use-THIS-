// SendGrid Inbound Parse webhook. Receives multipart/form-data when a coach
// replies to <alias>@mail.playitforward.app. Stores reply and notifies athlete.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALIAS_DOMAIN = "mail.playitforward.app";
const NOTIFICATION_FROM = "notifications@mail.playitforward.app";

function parseAddress(raw: string | null): { email: string; name: string } {
  if (!raw) return { email: "", name: "" };
  // "Name <email@x.com>" or "email@x.com"
  const m = raw.match(/^\s*"?([^"<]*)"?\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1].trim(), email: m[2].trim().toLowerCase() };
  return { email: raw.trim().toLowerCase(), name: "" };
}

function extractAlias(toRaw: string | null): string | null {
  const { email } = parseAddress(toRaw);
  if (!email) return null;
  const [local, domain] = email.split("@");
  if (!domain || domain.toLowerCase() !== ALIAS_DOMAIN) return null;
  return local.toLowerCase();
}

Deno.serve(async (req) => {
  const reqId = crypto.randomUUID().slice(0, 8);
  console.log(`[sendgrid-inbound:${reqId}] incoming`, {
    method: req.method,
    url: req.url,
    contentType: req.headers.get("content-type"),
    contentLength: req.headers.get("content-length"),
  });

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method === "GET") {
    // Health check so SendGrid's "Test" button + manual curl confirm reachability.
    return new Response(JSON.stringify({ ok: true, function: "sendgrid-inbound" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SENDGRID = Deno.env.get("SENDGRID_API_KEY");
    const admin = createClient(SUPABASE_URL, SERVICE);

    let form: FormData;
    try {
      form = await req.formData();
    } catch (e) {
      console.error(`[sendgrid-inbound:${reqId}] formData parse error`, e);
      return new Response("ok", { status: 200 });
    }
    const to = form.get("to")?.toString() ?? "";
    const from = form.get("from")?.toString() ?? "";
    const subject = form.get("subject")?.toString() ?? "";
    const text = form.get("text")?.toString() ?? "";
    const envelope = form.get("envelope")?.toString() ?? "";

    console.log(`[sendgrid-inbound:${reqId}] payload`, {
      to,
      from,
      subject,
      envelope,
      textLen: text.length,
    });

    const alias = extractAlias(to);
    if (!alias) {
      console.warn(`[sendgrid-inbound:${reqId}] no alias parsed from "to"`, { to, envelope });
      return new Response("ok", { status: 200 });
    }
    console.log(`[sendgrid-inbound:${reqId}] alias`, { alias });

    const { data: profile } = await admin
      .from("profiles")
      .select("id, email, first_name, last_name")
      .eq("email_alias", alias)
      .maybeSingle();

    if (!profile) {
      console.warn("[sendgrid-inbound] no profile for alias", alias);
      return new Response("ok", { status: 200 });
    }

    const fromAddr = parseAddress(from);

    const { error: insErr } = await admin.from("coach_replies").insert({
      athlete_id: profile.id,
      coach_email: fromAddr.email,
      coach_name: fromAddr.name || null,
      school_name: null,
      reply_subject: subject || null,
      reply_body_text: text || null,
    });
    if (insErr) console.error("[sendgrid-inbound] insert error", insErr);

    // Notify athlete via email — celebratory tone
    if (SENDGRID && profile.email) {
      const coachLabel = fromAddr.name || fromAddr.email;
      const firstName = (profile as any).first_name || "there";

      // Pull stats for footer
      const { count: contactedCount } = await admin
        .from("outreach_history")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profile.id);
      const { count: repliedCount } = await admin
        .from("coach_replies")
        .select("id", { count: "exact", head: true })
        .eq("athlete_id", profile.id);
      const contacted = contactedCount ?? 0;
      const replied = repliedCount ?? 0;
      const rate = contacted > 0 ? Math.round((replied / contacted) * 100) : 0;

      const text = `Hey ${firstName} — ${coachLabel} just replied to your recruiting outreach.\n\nThis is exactly how it starts. Log in to read their message and keep the conversation going.\n\nRead their reply: https://playitforward.app/recruit\n\n— Your stats so far —\nYou have contacted ${contacted} coach${contacted === 1 ? "" : "es"}. ${replied} ${replied === 1 ? "has" : "have"} replied. Your reply rate is ${rate}%.\nKeep going.`;
      const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0F172A">
        <p style="font-size:14px;color:#64748B;margin:0 0 8px;letter-spacing:.06em;text-transform:uppercase">Play it Forward</p>
        <h1 style="font-size:26px;line-height:1.2;margin:0 0 16px">A college coach just replied to you.</h1>
        <p style="font-size:16px;line-height:1.5;margin:0 0 16px">Hey ${firstName} — <strong>${coachLabel}</strong> just replied to your recruiting outreach. This is exactly how it starts. Log in to read their message and keep the conversation going.</p>
        <p style="margin:24px 0"><a href="https://playitforward.app/recruit" style="background:#080D14;color:#fff;text-decoration:none;padding:14px 22px;border-radius:10px;font-weight:600;display:inline-block">Read Their Reply</a></p>
        <hr style="border:0;border-top:1px solid #E2E8F0;margin:28px 0" />
        <p style="font-size:13px;color:#475569;line-height:1.6;margin:0">You have contacted <strong>${contacted}</strong> coach${contacted === 1 ? "" : "es"}. <strong>${replied}</strong> ${replied === 1 ? "has" : "have"} replied. Your reply rate is <strong>${rate}%</strong>.<br/>Keep going.</p>
      </div>`;

      try {
        await fetch("https://api.sendgrid.com/v3/mail/send", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${SENDGRID}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: profile.email }] }],
            from: { email: NOTIFICATION_FROM, name: "Play it Forward" },
            subject: "A college coach just replied to you",
            content: [
              { type: "text/plain", value: text },
              { type: "text/html", value: html },
            ],
          }),
        });
      } catch (e) {
        console.error("[sendgrid-inbound] notify error", e);
      }
    }

    return new Response("ok", { status: 200 });
  } catch (e) {
    console.error("[sendgrid-inbound] unexpected", e);
    return new Response("ok", { status: 200 }); // always 200 so SendGrid doesn't retry-loop
  }
});
