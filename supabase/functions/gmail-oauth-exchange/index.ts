// Public endpoint called by the playitforward.app /gmail/callback page
// after Google redirects the user back with an auth code.
// Performs the token exchange using the playitforward.app redirect URI
// (which must match what was registered in Google Cloud Console).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";
// Must EXACTLY match the URI registered in Google Cloud Console
const REDIRECT_URI = "https://playitforward.app/gmail/callback";

function hasRequiredScope(scope: string | null | undefined, requiredScope: string) {
  return (scope ?? "").split(/\s+/).includes(requiredScope);
}

async function getAccessTokenScope(accessToken: string): Promise<string | null> {
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`);
  if (!res.ok) return null;
  const data = await res.json() as { scope?: string };
  return data.scope ?? null;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, state } = await req.json() as { code?: string; state?: string };
    if (!code || !state) return json({ error: "missing_code_or_state" }, 400);

    const clientId = Deno.env.get("GOOGLE_GMAIL_CLIENT_ID")!;
    const clientSecret = Deno.env.get("GOOGLE_GMAIL_CLIENT_SECRET")!;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const t = await tokenRes.text();
      console.error("[gmail-oauth-exchange] token exchange failed", t);
      return json({ error: "token_exchange_failed" }, 400);
    }

    const tokens = await tokenRes.json() as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      scope?: string;
    };

    if (!tokens.refresh_token) {
      return json({ error: "no_refresh_token" }, 400);
    }

    const grantedScope = (await getAccessTokenScope(tokens.access_token)) ?? tokens.scope ?? null;
    if (!hasRequiredScope(grantedScope, GMAIL_SEND_SCOPE)) {
      console.error("[gmail-oauth-exchange] missing gmail.send scope", grantedScope);
      return json({ error: "missing_gmail_send_scope" }, 400);
    }

    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await profileRes.json() as { email?: string };
    if (!profile.email) return json({ error: "no_email" }, 400);

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error: upsertErr } = await supabase
      .from("gmail_tokens")
      .upsert({
        user_id: state,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt,
        email: profile.email,
      }, { onConflict: "user_id" });

    if (upsertErr) {
      console.error("[gmail-oauth-exchange] upsert failed", upsertErr);
      return json({ error: "store_failed" }, 500);
    }

    return json({ success: true, email: profile.email });
  } catch (e) {
    console.error("[gmail-oauth-exchange] unexpected", e);
    return json({ error: "unexpected" }, 500);
  }
});
