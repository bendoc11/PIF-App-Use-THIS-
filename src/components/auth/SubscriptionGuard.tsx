import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function SubscriptionGuard({ children }: { children: ReactNode }) {
  const { profile, loading } = useAuth();

  // Wait for profile to load before deciding — otherwise admins/pro users get
  // redirected to /pricing on first render before their profile arrives.
  if (loading || !profile) {
    return null;
  }

  const isSubscribed =
    profile.subscription_status === "active" ||
    profile.plan === "pro" ||
    profile.role === "admin";

  if (!isSubscribed) {
    return <Navigate to="/pricing" replace />;
  }

  return <>{children}</>;
}
