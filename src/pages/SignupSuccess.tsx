import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function SignupSuccess() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Simply redirect to dashboard — no subscription polling needed
    const timer = setTimeout(() => {
      navigate("/dashboard", { replace: true });
    }, 1000);
    return () => clearTimeout(timer);
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <h1 className="text-3xl font-heading text-foreground">Welcome! 🏀</h1>
        <p className="text-muted-foreground">Redirecting to your dashboard…</p>
      </div>
    </div>
  );
}
