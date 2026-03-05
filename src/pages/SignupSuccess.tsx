import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, CheckCircle } from "lucide-react";

export default function SignupSuccess() {
  const navigate = useNavigate();
  const { user, refreshSubscription } = useAuth();
  const [status, setStatus] = useState<"confirming" | "done">("confirming");

  useEffect(() => {
    // If no session at all, redirect to login
    if (!user) {
      // Wait a moment for auth state to hydrate from localStorage
      const timeout = setTimeout(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!session) {
            navigate("/login", { replace: true });
          }
        });
      }, 1000);
      return () => clearTimeout(timeout);
    }

    // User is authenticated — poll for subscription confirmation
    const pollSubscription = async () => {
      const maxAttempts = 8; // ~16 seconds
      const intervalMs = 2000;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          const { data, error } = await supabase.functions.invoke("check-subscription");
          if (!error && data?.subscribed) {
            // Cache the result
            await supabase.from("profiles").update({
              subscription_status: JSON.stringify(data),
              subscription_checked_at: new Date().toISOString(),
            } as any).eq("id", user.id);

            // Signal AuthContext to force refresh
            sessionStorage.setItem("pif_subscription_confirmed", "true");
            await refreshSubscription();

            setStatus("done");
            setTimeout(() => navigate("/dashboard", { replace: true }), 1500);
            return;
          }
        } catch {
          // Keep polling
        }
        await new Promise((r) => setTimeout(r, intervalMs));
      }

      // After polling, redirect anyway — subscription may take a moment
      sessionStorage.setItem("pif_subscription_confirmed", "true");
      await refreshSubscription();
      setStatus("done");
      setTimeout(() => navigate("/dashboard", { replace: true }), 1500);
    };

    pollSubscription();
  }, [user, navigate, refreshSubscription]);

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
