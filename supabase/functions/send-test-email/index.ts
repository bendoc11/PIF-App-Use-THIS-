// Admin-only edge function for the Deliverability tab. Sends a one-off test
// email via SendGrid from a mail.offered.pro alias and logs the send to
// test_email_sends. Increments times_emailed on any matching test_contacts row.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALIAS_DOMAIN = "mail.offered.pro";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function buildTemplate(template: string, name: string, custom?: { subject?: string; body?: string }) {
  const first = (name || "there").split(" ")[0];
  if (template === "outreach") {
    return {
      subject: `${first} — quick intro from a 2027 guard`,
      body:
`Hi ${first},

My name is Brendan Daugherty and I'm a 2027 guard out of Ohio. I've been following your program and love what you're building — the way your guards play with pace really stood out to me on film.

I'd love the chance to share my highlights and stats with you. Quick snapshot:
• Position: Combo guard
• Height: 6'2"
• GPA: 3.8 unweighted
• Highlight film: https://offered.pro/p/brendan-daugherty

If you'd be open to it, I'd love to stay in touch as the season progresses. Thanks for your time, coach.

Best,
Brendan`,
    };
  }
  if (template === "reply") {
    return {
      subject: `Re: ${first} — quick follow-up`,
      body:
`Hey ${first},

Just wanted to circle back on my note from earlier this week. I have new game film up from this past weekend if you'd like to take a look:

https://offered.pro/p/brendan-daugherty

Appreciate the time. Talk soon.

Brendan`,
    };
  }
  return {
    subject: custom?.subject?.trim() || `A note for ${first}`,
    body: custom?.body?.trim() || `Hi ${first},\n\nThanks for helping us with deliverability testing.\n\n— Offered Team`,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SENDGRID = Deno.env.get("SENDGRID_API_KEY");
    if (!SENDGRID) return json({ error: "SendGrid not configured" }, 500);

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser(auth.replace("Bearer ", ""));
    if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
    const userId = userData.user.id;

    const admin = createClient(SUPABASE_URL, SERVICE);

    const { data: profile } = await admin
      .from("profiles")
      .select("role, first_name, last_name, email_alias")
      .eq("id", userId)
      .maybeSingle();
    if (!profile || profile.role !== "admin") return json({ error: "Admin only" }, 403);

    const body = (await req.json().catch(() => null)) as
      | { to?: string; name?: string; template?: string; subject?: string; body?: string; contactId?: string }
      | null;
    if (!body?.to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.to)) {
      return json({ error: "Invalid recipient email" }, 400);
    }
    const template = body.template || "outreach";
    const tpl = buildTemplate(template, body.name || "", { subject: body.subject, body: body.body });

    const alias = profile.email_alias || "warmup";
    const fromEmail = `${alias}@${ALIAS_DOMAIN}`;
    const fromName =
      `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() ||
      "Brendan Daugherty";

    const sgRes = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${SENDGRID}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: body.to, name: body.name || undefined }] }],
        from: { email: fromEmail, name: fromName },
        reply_to: { email: fromEmail, name: fromName },
        subject: tpl.subject,
        content: [{ type: "text/plain", value: tpl.body }],
      }),
    });

    if (!sgRes.ok) {
      const txt = await sgRes.text();
      console.error("[send-test-email] SendGrid error", sgRes.status, txt);
      return json({ error: "Email provider error", details: txt }, 502);
    }

    await admin.from("test_email_sends").insert({
      contact_id: body.contactId ?? null,
      recipient_name: body.name ?? null,
      recipient_email: body.to,
      template,
      subject: tpl.subject,
      body_preview: tpl.body.slice(0, 240),
      sent_by: userId,
    });

    // Bump times_emailed if a contact exists for this email
    const { data: contact } = await admin
      .from("test_contacts")
      .select("id, times_emailed")
      .ilike("email", body.to)
      .maybeSingle();
    if (contact) {
      await admin
        .from("test_contacts")
        .update({ times_emailed: (contact.times_emailed ?? 0) + 1 })
        .eq("id", contact.id);
    }

    return json({ success: true, from: fromEmail, sentAt: new Date().toISOString() });
  } catch (e) {
    console.error("[send-test-email] unexpected", e);
    return json({ error: "Unexpected error" }, 500);
  }
});
