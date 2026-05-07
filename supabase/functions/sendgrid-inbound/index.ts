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
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SENDGRID = Deno.env.get("SENDGRID_API_KEY");
    const admin = createClient(SUPABASE_URL, SERVICE);

    const form = await req.formData();
    const to = form.get("to")?.toString() ?? "";
    const from = form.get("from")?.toString() ?? "";
    const subject = form.get("subject")?.toString() ?? "";
    const text = form.get("text")?.toString() ?? "";

    const alias = extractAlias(to);
    if (!alias) {
      console.warn("[sendgrid-inbound] no alias parsed", { to });
      return new Response("ok", { status: 200 });
    }

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

    // Notify athlete via email
    if (SENDGRID && profile.email) {
      const coachLabel = fromAddr.name || fromAddr.email;
      const notifBody = `Coach ${coachLabel} replied to your recruiting outreach.\n\nLog in to see their message: https://playitforward.app`;
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
            subject: `New reply from Coach ${coachLabel}`,
            content: [{ type: "text/plain", value: notifBody }],
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
