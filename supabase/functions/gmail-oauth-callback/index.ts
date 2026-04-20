// Public callback endpoint Google redirects to after the user approves Gmail access.
// No JWT required (Google won't send one). User identity is carried in `state`.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const APP_URL = "https://playitforward.app";
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

function redirect(status: "connected" | "error", message?: string) {
  const url = new URL(`${APP_URL}/settings`);
  url.searchParams.set("gmail", status);
  if (message) url.searchParams.set("msg", message);
  return new Response(null, { status: 302, headers: { Location: url.toString() } });
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state"); // user_id
    const errParam = url.searchParams.get("error");

    if (errParam) return redirect("error", errParam);
    if (!code || !state) return redirect("error", "missing_code_or_state");

    const clientId = Deno.env.get("GOOGLE_GMAIL_CLIENT_ID")!;
    const clientSecret = Deno.env.get("GOOGLE_GMAIL_CLIENT_SECRET")!;
    const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/gmail-oauth-callback`;

    // Exchange auth code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const t = await tokenRes.text();
      console.error("[gmail-oauth-callback] token exchange failed", t);
      return redirect("error", "token_exchange_failed");
    }

    const tokens = await tokenRes.json() as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      scope?: string;
    };

    if (!tokens.refresh_token) {
      // Happens if user previously consented and Google didn't re-issue a refresh token.
      // We requested prompt=consent to force it, but guard anyway.
      return redirect("error", "no_refresh_token");
    }

    const grantedScope = (await getAccessTokenScope(tokens.access_token)) ?? tokens.scope ?? null;

    if (!hasRequiredScope(grantedScope, GMAIL_SEND_SCOPE)) {
      console.error("[gmail-oauth-callback] missing gmail.send scope", grantedScope);
      return redirect("error", "missing_gmail_send_scope");
    }

    // Fetch the connected email address
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await profileRes.json() as { email?: string };
    if (!profile.email) return redirect("error", "no_email");

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
      console.error("[gmail-oauth-callback] upsert failed", upsertErr);
      return redirect("error", "store_failed");
    }

    return redirect("connected");
  } catch (e) {
    console.error("[gmail-oauth-callback] unexpected", e);
    return redirect("error", "unexpected");
  }
});
