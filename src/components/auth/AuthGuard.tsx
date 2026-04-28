import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoadingScreen from "@/components/LoadingScreen";
import PaywallOverlay from "@/components/auth/PaywallOverlay";

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
 *  Signed in, no sub       → render PaywallOverlay on top of current page
 *  Subscribed, no onboard  → /onboarding
 *  Fully onboarded         → normal access
 *
 * Admin routes bypass the subscription/onboarding gates.
 * /settings is always reachable (overlay still shown if unsubscribed).
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
  const isOnboardingRoute = path.startsWith("/onboarding");

  // Admins/creators bypass everything.
  if (isAdminRoute) return <>{children}</>;

  const subscribed = isSubscribed(profile);
  const onboardingDone = !!profile.onboarding_completed;

  // Subscription gate — render the overlay on top of whatever page they hit.
  if (!subscribed) {
    return (
      <>
        {isSettingsRoute ? children : null}
        <PaywallOverlay />
      </>
    );
  }

  // Onboarding gate
  if (!onboardingDone) {
    if (isOnboardingRoute || isSettingsRoute) return <>{children}</>;
    return <Navigate to="/onboarding" replace />;
  }

  // Fully onboarded — never re-show onboarding
  if (isOnboardingRoute) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
