import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, CheckCircle } from "lucide-react";

export default function SignupSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, refreshSubscription } = useAuth();
  const [status, setStatus] = useState<"confirming" | "done">("confirming");
  const hasStartedPolling = useRef(false);

  const sessionId = searchParams.get("session_id");
  const verified = searchParams.get("verified") === "true";

  useEffect(() => {
    // No session_id and no verified flag — not a valid post-payment return
    if (!sessionId && !verified) {
      console.log("[SignupSuccess] No session_id or verified flag — redirecting to dashboard");
      navigate("/dashboard", { replace: true });
      return;
    }

    console.log("[SignupSuccess] Post-payment return detected", { sessionId, verified });

    // Wait for auth session to be restored (Supabase reads from localStorage)
    const waitForSessionAndPoll = async () => {
      if (hasStartedPolling.current) return;
      hasStartedPolling.current = true;

      // Give Supabase auth up to 5 seconds to restore the session
      let authUser = user;
      if (!authUser) {
        for (let i = 0; i < 10; i++) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            authUser = session.user;
            break;
          }
          await new Promise((r) => setTimeout(r, 500));
        }
      }

      if (!authUser) {
        // Session could not be restored — still don't send to login
        // Just route to dashboard; AuthGuard will handle it
        console.log("[SignupSuccess] Could not restore session — routing to dashboard anyway");
        sessionStorage.setItem("pif_subscription_confirmed", "true");
        navigate("/dashboard", { replace: true });
        return;
      }

      // Poll subscription status for up to 20 seconds
      const maxAttempts = 10;
      const intervalMs = 2000;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          const { data, error } = await supabase.functions.invoke("check-subscription");
          if (!error && data?.subscribed) {
            console.log("[SignupSuccess] Subscription confirmed on attempt", attempt + 1);
            sessionStorage.setItem("pif_subscription_confirmed", "true");
            await refreshSubscription();
            setStatus("done");
            window.history.replaceState({}, "", "/signup-success");
            setTimeout(() => navigate("/dashboard", { replace: true }), 1500);
            return;
          }
        } catch {
          // Keep polling
        }
        await new Promise((r) => setTimeout(r, intervalMs));
      }

      // Timeout after 20s — route to dashboard anyway, never to login
      console.log("[SignupSuccess] Polling timed out — routing to dashboard anyway");
      sessionStorage.setItem("pif_subscription_confirmed", "true");
      await refreshSubscription();
      setStatus("done");
      window.history.replaceState({}, "", "/signup-success");
      setTimeout(() => navigate("/dashboard", { replace: true }), 1500);
    };

    waitForSessionAndPoll();
  }, [user, navigate, refreshSubscription, sessionId, verified]);

  // If no valid post-payment params, render nothing (redirect happens in useEffect)
  if (!sessionId && !verified) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {status === "confirming" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <h1 className="text-3xl font-heading text-foreground">Setting Up Your Account…</h1>
            <p className="text-muted-foreground">Payment received! We're confirming your subscription now.</p>
          </>
        )}
        {status === "done" && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-pif-green/20 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-pif-green" />
            </div>
            <h1 className="text-3xl font-heading text-foreground">You're In! 🏀</h1>
            <p className="text-muted-foreground">Your account is ready. Redirecting to the dashboard…</p>
          </>
        )}
      </div>
    </div>
  );
}
