import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function SignupSuccess() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"creating" | "confirming" | "done" | "error">("creating");

  useEffect(() => {
    const createAccount = async () => {
      const raw = sessionStorage.getItem("pif_signup");
      if (!raw) {
        // No signup data — user may have already created account. Still poll for subscription.
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setStatus("confirming");
          await pollSubscription();
          return;
        }
        toast.success("Payment successful! Sign in to continue.");
        navigate("/login", { replace: true });
        return;
      }

      try {
        const parsed = JSON.parse(raw);
        const { email, firstName, lastName, position } = parsed;
        const password = atob(parsed.password);

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { first_name: firstName, last_name: lastName, position },
          },
        });

        if (signUpError) {
          if (signUpError.message?.includes("already registered") || signUpError.message?.includes("already been registered")) {
            const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
            if (signInError) throw signInError;
          } else {
            throw signUpError;
          }
        } else if (!signUpData?.session) {
          const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
          if (signInError) throw signInError;
        }

        sessionStorage.removeItem("pif_signup");

        // Now poll for subscription confirmation before navigating
        setStatus("confirming");
        await pollSubscription();
      } catch (err: any) {
        console.error("Account creation error:", err);
        setStatus("error");
        toast.error(err.message || "Failed to create account. Please try signing in.");
        setTimeout(() => navigate("/login", { replace: true }), 3000);
      }
    };

    const pollSubscription = async () => {
      const maxAttempts = 10;
      const intervalMs = 2000;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          // Call check-subscription directly (bypasses profile cache)
          const { data, error } = await supabase.functions.invoke("check-subscription");
          if (!error && data?.subscribed) {
            // Update the cached status in profiles so AuthGuard won't re-check
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              await supabase.from("profiles").update({
                subscription_status: JSON.stringify(data),
                subscription_checked_at: new Date().toISOString(),
              } as any).eq("id", user.id);
            }

            setStatus("done");
            // Signal to AuthContext to refresh on next mount
            sessionStorage.setItem("pif_subscription_confirmed", "true");
            setTimeout(() => navigate("/onboarding", { replace: true }), 1500);
            return;
          }
        } catch {
          // Ignore errors, keep polling
        }
        await new Promise((r) => setTimeout(r, intervalMs));
      }

      // After 20 seconds of polling, still redirect to dashboard — 
      // the subscription may take a moment but the user shouldn't be stuck
      setStatus("done");
      sessionStorage.setItem("pif_subscription_confirmed", "true");
      setTimeout(() => navigate("/onboarding", { replace: true }), 1500);
    };

    createAccount();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {status === "creating" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <h1 className="text-3xl font-heading text-foreground">Setting Up Your Account…</h1>
            <p className="text-muted-foreground">Payment received! We're creating your training account now.</p>
          </>
        )}
        {status === "confirming" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <h1 className="text-3xl font-heading text-foreground">Confirming Your Payment…</h1>
            <p className="text-muted-foreground">Almost there! We're verifying your subscription.</p>
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
        {status === "error" && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-destructive/20 flex items-center justify-center">
              <span className="text-3xl">⚠️</span>
            </div>
            <h1 className="text-3xl font-heading text-foreground">Something Went Wrong</h1>
            <p className="text-muted-foreground">Your payment was processed but we had trouble creating your account. Redirecting to sign in…</p>
          </>
        )}
      </div>
    </div>
  );
}
