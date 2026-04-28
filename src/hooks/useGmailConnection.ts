import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";

const GOOGLE_CLIENT_ID = "617641714400-jjlh0v9fpecmc6a4ccikrkure3bn8kmg.apps.googleusercontent.com";
const REDIRECT_URI = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/gmail-oauth-callback`;
const SCOPE = "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email";

export function useGmailConnection() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setConnectedEmail(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase.rpc("get_gmail_connection");
    setConnectedEmail((data as any)?.[0]?.email ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const startConnect = useCallback(async () => {
    if (!user) return;
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", GOOGLE_CLIENT_ID);
    url.searchParams.set("redirect_uri", REDIRECT_URI);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", SCOPE);
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");
    url.searchParams.set("state", user.id);
    if (Capacitor.isNativePlatform()) {
      await Browser.open({ url: url.toString() });
    } else {
      window.location.href = url.toString();
    }
  }, [user]);

  return {
    loading,
    connected: !!connectedEmail,
    connectedEmail,
    refresh,
    startConnect,
  };
}
