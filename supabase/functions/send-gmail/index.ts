// Sends an email from the user's connected Gmail account.
// Requires authenticated caller. Looks up tokens server-side, refreshes if expired.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function base64UrlEncode(str: string): string {
  // UTF-8 safe base64url
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function buildRfc822(from: string, to: string, subject: string, body: string): string {
  // Encode subject as UTF-8 base64 per RFC 2047
  const subjectEncoded = `=?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  return [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subjectEncoded}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset="UTF-8"`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    body,
  ].join("\r\n");
}

const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";

function hasRequiredScope(scope: string | null | undefined, requiredScope: string) {
  return (scope ?? "").split(/\s+/).includes(requiredScope);
}

async function getAccessTokenScope(accessToken: string): Promise<string | null> {
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`);
  if (!res.ok) return null;

  const data = await res.json() as { scope?: string };
  return data.scope ?? null;
}

function isInsufficientScopeError(details: string) {
  return /insufficient authentication scopes|insufficient.*scope/i.test(details);
}

async function refreshAccessToken(refreshToken: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: Deno.env.get("GOOGLE_GMAIL_CLIENT_ID")!,
      client_secret: Deno.env.get("GOOGLE_GMAIL_CLIENT_SECRET")!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    throw new Error(`refresh_failed: ${await res.text()}`);
  }
  return await res.json() as { access_token: string; expires_in: number };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userData?.user?.id) return json({ error: "Unauthorized" }, 401);
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

    // Service-role lookup of the user's tokens
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: row, error: lookupErr } = await admin
      .from("gmail_tokens")
      .select("access_token, refresh_token, expires_at, email")
      .eq("user_id", userId)
      .maybeSingle();

    if (lookupErr) {
      console.error("[send-gmail] lookup error", lookupErr);
      return json({ error: "Lookup failed" }, 500);
    }
    if (!row) return json({ error: "Gmail not connected" }, 400);

    const persistRefreshedToken = async (tokenValue: string, expiresInSeconds: number) => {
      const newExpiry = new Date(Date.now() + expiresInSeconds * 1000).toISOString();
      await admin
        .from("gmail_tokens")
        .update({ access_token: tokenValue, expires_at: newExpiry })
        .eq("user_id", userId);
    };

    const refreshAndPersistToken = async () => {
      const refreshed = await refreshAccessToken(row.refresh_token);
      await persistRefreshedToken(refreshed.access_token, refreshed.expires_in);
      return refreshed.access_token;
    };

    let accessToken = row.access_token;
    let refreshedForScope = false;
    const expiresAt = new Date(row.expires_at).getTime();

    if (Date.now() > expiresAt - 60_000) {
      try {
        accessToken = await refreshAndPersistToken();
        refreshedForScope = true;
      } catch (e) {
        console.error("[send-gmail] refresh failed", e);
        return json({ error: "Token refresh failed. Please reconnect Gmail.", code: "token_refresh_failed" }, 401);
      }
    }

    let grantedScope = await getAccessTokenScope(accessToken);
    if (!hasRequiredScope(grantedScope, GMAIL_SEND_SCOPE) && !refreshedForScope) {
      try {
        accessToken = await refreshAndPersistToken();
        refreshedForScope = true;
        grantedScope = await getAccessTokenScope(accessToken);
      } catch (e) {
        console.error("[send-gmail] scope refresh failed", e);
      }
    }

    if (!hasRequiredScope(grantedScope, GMAIL_SEND_SCOPE)) {
      console.error("[send-gmail] missing gmail.send scope", { userId, email: row.email, grantedScope });
      await admin.from("gmail_tokens").delete().eq("user_id", userId);
      return json({
        error: "Your Gmail connection is missing send permission. Please reconnect Gmail and try again.",
        code: "missing_gmail_send_scope",
        details: grantedScope,
      }, 401);
    }

    const raw = base64UrlEncode(buildRfc822(row.email, body.to, body.subject, body.body));

    const sendRes = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw }),
      },
    );

    if (!sendRes.ok) {
      const errText = await sendRes.text();
      console.error("[send-gmail] gmail api error", sendRes.status, errText);

      if (sendRes.status === 403 && isInsufficientScopeError(errText)) {
        await admin.from("gmail_tokens").delete().eq("user_id", userId);
        return json({
          error: "Your Gmail connection is missing send permission. Please reconnect Gmail and try again.",
          code: "missing_gmail_send_scope",
          details: errText,
        }, 401);
      }

      return json({ error: "Gmail API error", details: errText }, 502);
    }

    const result = await sendRes.json();
    return json({ success: true, message_id: result.id, from: row.email });
  } catch (e) {
    console.error("[send-gmail] unexpected", e);
    return json({ error: "Unexpected error" }, 500);
  }
});
