import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const ACTIVE_STATUSES = ["active", "trialing", "trial", "past_due"];

function isSubscribed(profile: any): boolean {
  if (!profile) return false;
  if (profile.role === "admin" || profile.role === "creator") return true;
  if (profile.plan && ["pro", "premium", "lifetime"].includes(profile.plan)) return true;
  if (profile.subscription_status && ACTIVE_STATUSES.includes(profile.subscription_status)) return true;
  return false;
}

export function SubscriptionGuard({ children }: { children: ReactNode }) {
  const { loading, profile } = useAuth();
  if (loading || !profile) return null;
  if (!isSubscribed(profile)) return <Navigate to="/paywall" replace />;
  return <>{children}</>;
}
