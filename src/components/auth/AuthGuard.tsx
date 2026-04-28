import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoadingScreen from "@/components/LoadingScreen";

const ACTIVE_STATUSES = ["active", "trialing", "trial", "past_due"];

export function isSubscribed(profile: any): boolean {
  if (!profile) return false;
  if (profile.role === "admin" || profile.role === "creator") return true;
  if (profile.plan && ["pro", "premium", "lifetime"].includes(profile.plan)) return true;
  if (profile.subscription_status && ACTIVE_STATUSES.includes(profile.subscription_status)) return true;
  return false;
}

/**
 * Single source of truth for auth + flow gating.
 *
 *  Not signed in           → /login
 *  Signed in, no sub       → /subscribe
 *  Subscribed, no onboard  → /onboarding
 *  Fully onboarded         → /dashboard
 *
 * Admin routes bypass the subscription/onboarding gates.
 * /settings is always reachable for signed-in users.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading, profile } = useAuth();
  const location = useLocation();
  const path = location.pathname;

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (!profile) return <LoadingScreen />;

  const isAdminRoute = path.startsWith("/admin");
  const isSettingsRoute = path.startsWith("/settings");
  const isSubscribeRoute = path === "/subscribe" || path === "/paywall";
  const isOnboardingRoute = path.startsWith("/onboarding");

  // Admins/creators bypass subscription + onboarding gates entirely.
  if (isAdminRoute) return <>{children}</>;

  const subscribed = isSubscribed(profile);
  const onboardingDone = !!profile.onboarding_completed;

  // Step 1: Subscription gate
  if (!subscribed) {
    if (isSubscribeRoute) return <>{children}</>;
    if (isSettingsRoute) return <>{children}</>;
    return <Navigate to="/subscribe" replace />;
  }

  // Step 2: Onboarding gate
  if (!onboardingDone) {
    if (isOnboardingRoute) return <>{children}</>;
    if (isSettingsRoute) return <>{children}</>;
    if (isSubscribeRoute) return <Navigate to="/onboarding" replace />;
    return <Navigate to="/onboarding" replace />;
  }

  // Step 3: Fully onboarded — never re-show subscribe/onboarding
  if (isSubscribeRoute || isOnboardingRoute) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
