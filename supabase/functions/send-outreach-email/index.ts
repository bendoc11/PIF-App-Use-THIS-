// Send outreach email via SendGrid using the athlete's personal alias.
// Daily-limit model: free users may send up to FREE_DAILY_LIMIT per day; paid
// subscribers have no limit.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALIAS_DOMAIN = "mail.playitforward.app";
const FREE_DAILY_LIMIT = 30;

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

    const { data: profile, error: pErr } = await admin
      .from("profiles")
      .select("first_name, last_name, grad_year, email_alias, subscription_status, role, plan")
      .eq("id", userId)
      .maybeSingle();
    if (pErr || !profile) return json({ error: "Profile not found" }, 400);

    let alias = profile.email_alias as string | null;
    if (!alias) {
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

    // Determine paid vs free.
    const profileLooksPaid =
      profile.role === "admin" ||
      profile.role === "creator" ||
      ["pro", "premium", "lifetime"].includes(profile.plan ?? "") ||
      ["active", "trialing", "past_due"].includes(profile.subscription_status ?? "");

    let isPaid = profileLooksPaid;
    if (!isPaid) {
      const { data: subRow } = await admin
        .from("subscriptions")
        .select("id")
        .eq("user_id", userId)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();
      if (subRow) isPaid = true;
    }

    // Free users: enforce daily 30 cap.
    const today = new Date().toISOString().slice(0, 10);
    let currentCount = 0;
    if (!isPaid) {
      const { data: counter } = await admin
        .from("email_send_counters")
        .select("count")
        .eq("user_id", userId)
        .eq("day", today)
        .maybeSingle();
      currentCount = counter?.count ?? 0;
      if (currentCount >= FREE_DAILY_LIMIT) {
        return json({
          error: "daily_limit_reached",
          limit: FREE_DAILY_LIMIT,
          message: `You've reached your daily limit of ${FREE_DAILY_LIMIT} coach contacts. Subscribe to unlock unlimited daily sends.`,
        }, 429);
      }
    }

    const fromEmail = `${alias}@${ALIAS_DOMAIN}`;
    const fromName = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || "Offered Athlete";

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

    // Increment daily counter for free users (best-effort).
    if (!isPaid) {
      const newCount = currentCount + 1;
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
      return json({ success: true, from: fromEmail, daily_count: newCount, daily_limit: FREE_DAILY_LIMIT });
    }

    return json({ success: true, from: fromEmail, unlimited: true });
  } catch (e) {
    console.error("[send-outreach-email] unexpected", e);
    return json({ error: "Unexpected error" }, 500);
  }
});
