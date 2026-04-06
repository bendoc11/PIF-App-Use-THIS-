import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const LOGIN_FALLBACK_DELAY_MS = 8000;

function getOAuthErrorMessage() {
  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));

  return (
    searchParams.get("error_description") ||
    hashParams.get("error_description") ||
    searchParams.get("error") ||
    hashParams.get("error")
  );
}

export default function OAuthCallback() {
  const navigate = useNavigate();
  const { user, profile, loading, refreshProfile } = useAuth();
  const [codeExchanged, setCodeExchanged] = useState(false);
  const exchangeAttempted = useRef(false);

  const errorMessage = useMemo(() => getOAuthErrorMessage(), []);

  useEffect(() => {
    if (!errorMessage) return;
    toast.error(decodeURIComponent(errorMessage));
  }, [errorMessage]);

  // Exchange the auth code for a session on mount
  useEffect(() => {
    if (exchangeAttempted.current) return;
    exchangeAttempted.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          console.error("Code exchange failed:", error.message);
          toast.error("Sign-in failed. Please try again.");
        }
        setCodeExchanged(true);
      });
    } else {
      // No code param — session may already exist via hash fragment or prior exchange
      setCodeExchanged(true);
    }
  }, []);

  useEffect(() => {
    if (!codeExchanged || loading || !user || profile) return;

    void refreshProfile();
    const intervalId = window.setInterval(() => {
      void refreshProfile();
    }, 750);

    return () => window.clearInterval(intervalId);
  }, [codeExchanged, loading, user, profile, refreshProfile]);

  useEffect(() => {
    if (!codeExchanged || loading) return;

    if (user && profile) {
      navigate(profile.onboarding_completed ? "/dashboard" : "/onboarding", { replace: true });
      return;
    }

    if (!user) {
      // Give auth state time to propagate before falling back
      const timeoutId = window.setTimeout(() => {
        navigate("/login", { replace: true });
      }, LOGIN_FALLBACK_DELAY_MS);

      return () => window.clearTimeout(timeoutId);
    }
  }, [codeExchanged, loading, user, profile, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="flex max-w-sm flex-col items-center text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <h1 className="mt-6 text-2xl font-heading text-foreground">Completing sign-in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We&apos;re routing you to your training plan now.
        </p>
      </div>
    </div>
  );
}