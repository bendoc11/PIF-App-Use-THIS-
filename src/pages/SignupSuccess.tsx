import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, CheckCircle } from "lucide-react";

export default function SignupSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, refreshSubscription } = useAuth();
  const [status, setStatus] = useState<"confirming" | "done">("confirming");

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    // ONLY show this screen when arriving from Stripe with a session_id
    if (!sessionId) {
      console.log("[SignupSuccess] No session_id in URL — redirecting to dashboard");
      navigate("/dashboard", { replace: true });
      return;
    }

    console.log("[SignupSuccess] Triggered by Stripe session_id:", sessionId);

    if (!user) {
      const timeout = setTimeout(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!session) {
            console.log("[SignupSuccess] No auth session — redirecting to login");
            navigate("/login", { replace: true });
          }
        });
      }, 1000);
      return () => clearTimeout(timeout);
    }

    const pollSubscription = async () => {
      const maxAttempts = 8;
      const intervalMs = 2000;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          const { data, error } = await supabase.functions.invoke("check-subscription");
          if (!error && data?.subscribed) {
            await supabase.from("profiles").update({
              subscription_status: JSON.stringify(data),
              subscription_checked_at: new Date().toISOString(),
            } as any).eq("id", user.id);

            sessionStorage.setItem("pif_subscription_confirmed", "true");
            await refreshSubscription();

            setStatus("done");
            // Clear the session_id from URL so refresh won't re-trigger
            window.history.replaceState({}, "", "/signup-success");
            setTimeout(() => navigate("/dashboard", { replace: true }), 1500);
            return;
          }
        } catch {
          // Keep polling
        }
        await new Promise((r) => setTimeout(r, intervalMs));
      }

      // After polling, redirect anyway
      sessionStorage.setItem("pif_subscription_confirmed", "true");
      await refreshSubscription();
      setStatus("done");
      window.history.replaceState({}, "", "/signup-success");
      setTimeout(() => navigate("/dashboard", { replace: true }), 1500);
    };

    pollSubscription();
  }, [user, navigate, refreshSubscription, sessionId]);

  // If no session_id, render nothing (redirect happens in useEffect)
  if (!sessionId) return null;

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
