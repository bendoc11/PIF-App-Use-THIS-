import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

// Subscription gating is currently disabled — any authenticated user can
// access the app. AuthGuard already ensures the user is signed in.
export function SubscriptionGuard({ children }: { children: ReactNode }) {
  const { loading, profile } = useAuth();
  if (loading || !profile) return null;
  return <>{children}</>;
}
