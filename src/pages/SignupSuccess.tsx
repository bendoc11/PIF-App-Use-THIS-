import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function SignupSuccess() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"creating" | "done" | "error">("creating");

  useEffect(() => {
    const createAccount = async () => {
      const raw = sessionStorage.getItem("pif_signup");
      if (!raw) {
        // No signup data — maybe returning subscriber or refreshed page
        toast.success("Payment successful! Sign in to continue.");
        navigate("/login", { replace: true });
        return;
      }

      try {
        const { email, password, firstName, lastName, position } = JSON.parse(raw);

        // Try to create account
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { first_name: firstName, last_name: lastName, position },
          },
        });

        if (signUpError) {
          // If user already exists, try signing in instead
          if (signUpError.message?.includes("already registered") || signUpError.message?.includes("already been registered")) {
            const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
            if (signInError) throw signInError;
          } else {
            throw signUpError;
          }
        }

        // Clear stored signup data
        sessionStorage.removeItem("pif_signup");
        setStatus("done");

        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 2000);
      } catch (err: any) {
        console.error("Account creation error:", err);
        setStatus("error");
        toast.error(err.message || "Failed to create account. Please try signing in.");
        setTimeout(() => navigate("/login", { replace: true }), 3000);
      }
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
