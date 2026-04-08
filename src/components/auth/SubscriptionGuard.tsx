import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function SubscriptionGuard({ children }: { children: ReactNode }) {
  const { profile } = useAuth();

  const isSubscribed =
    profile?.subscription_status === "active" ||
    profile?.plan === "pro" ||
    profile?.role === "admin";

  if (!isSubscribed) {
    return <Navigate to="/pricing" replace />;
  }

  return <>{children}</>;
}
