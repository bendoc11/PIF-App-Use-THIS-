// Send outreach email via SendGrid using the athlete's personal alias.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALIAS_DOMAIN = "mail.playitforward.app";
const FREE_LIFETIME_LIMIT = 20;
const PAID_DAILY_LIMIT = 50;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
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

    const body = await req.json().catch(() => null) as
      | { to?: string; subject?: string; body?: string }
      | null;
    if (!body?.to || !body?.subject || !body?.body) {
      return json({ error: "Missing to, subject, or body" }, 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.to)) {
      return json({ error: "Invalid recipient email" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE);

    // Load profile
    const { data: profile, error: pErr } = await admin
      .from("profiles")
      .select("first_name, last_name, grad_year, email_alias, subscription_status")
      .eq("id", userId)
      .maybeSingle();
    if (pErr || !profile) return json({ error: "Profile not found" }, 400);

    let alias = profile.email_alias as string | null;
    if (!alias) {
      // Try to generate now
      if (profile.first_name && profile.last_name && profile.grad_year) {
        const { data: gen } = await admin.rpc("generate_email_alias", {
          _first: profile.first_name,
          _last: profile.last_name,
          _grad: profile.grad_year,
        });
        if (gen) {
          alias = gen as string;
          await admin.from("profiles").update({ email_alias: alias }).eq("id", userId);
        }
      }
    }
    if (!alias) {
      return json({ error: "Your email alias is not set. Please complete your profile (name and graduation year)." }, 400);
    }

    const isPaid = ["active", "trialing", "past_due"].includes(profile.subscription_status ?? "");

    // Quota
    if (!isPaid) {
      const { count } = await admin
        .from("outreach_history")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      if ((count ?? 0) >= FREE_LIFETIME_LIMIT) {
        return json({
          error: "free_limit_reached",
          message: "You've used your 20 free outreach emails. Upgrade to keep contacting coaches.",
        }, 402);
      }
    } else {
      const today = new Date().toISOString().slice(0, 10);
      const { data: counter } = await admin
        .from("email_send_counters")
        .select("count")
        .eq("user_id", userId)
        .eq("day", today)
        .maybeSingle();
      if ((counter?.count ?? 0) >= PAID_DAILY_LIMIT) {
        return json({
          error: "daily_limit_reached",
          message: "You have reached your daily outreach limit. This protects our sending reputation and ensures your emails continue to reach coaches. Your limit resets tomorrow.",
        }, 429);
      }
    }

    const fromEmail = `${alias}@${ALIAS_DOMAIN}`;
    const fromName = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || "Play it Forward Athlete";

    const sgRes = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: body.to }] }],
        from: { email: fromEmail, name: fromName },
        reply_to: { email: fromEmail, name: fromName },
        subject: body.subject,
        content: [{ type: "text/plain", value: body.body }],
      }),
    });

    if (!sgRes.ok) {
      const txt = await sgRes.text();
      console.error("[send-outreach-email] SendGrid error", sgRes.status, txt);
      return json({ error: "Email provider error", details: txt }, 502);
    }

    // Increment daily counter (paid only) — best-effort
    if (isPaid) {
      const today = new Date().toISOString().slice(0, 10);
      const { data: existing } = await admin
        .from("email_send_counters")
        .select("count")
        .eq("user_id", userId)
        .eq("day", today)
        .maybeSingle();
      if (existing) {
        await admin.from("email_send_counters")
          .update({ count: existing.count + 1 })
          .eq("user_id", userId).eq("day", today);
      } else {
        await admin.from("email_send_counters").insert({ user_id: userId, day: today, count: 1 });
      }
    }

    return json({ success: true, from: fromEmail });
  } catch (e) {
    console.error("[send-outreach-email] unexpected", e);
    return json({ error: "Unexpected error" }, 500);
  }
});
