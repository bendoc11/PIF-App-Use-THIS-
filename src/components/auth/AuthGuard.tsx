import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoadingScreen from "@/components/LoadingScreen";

// Kept for any legacy imports.
export function isSubscribed(_profile: any): boolean {
  return true;
}

// Routes a signed-in, unpaid user can always access — own profile, settings,
// the paywall itself, and auxiliary pages. Anything not in this list and not
// matched explicitly below will route through the paywall once onboarding
// is complete.
const ALWAYS_ALLOWED_PREFIXES = [
  "/profile",
  "/settings",
  "/paywall",
  "/p/",
  "/athlete/",
  "/privacy",
  "/terms",
];

/**
 * Auth gate.
 *  Flow:
 *   - Not signed in                                   → /login
 *   - Signed in, onboarding NOT complete              → /onboarding
 *   - Signed in, onboarding complete, no active sub   → /paywall
 *     (except /profile, /settings, /paywall — always allowed)
 *   - Signed in, subscribed                            → render children
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading, profile, hasActiveSubscription } = useAuth();
  const location = useLocation();
  const path = location.pathname;

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (!profile) return <LoadingScreen />;

  // Admins/creators bypass everything.
  const isAdminUser = profile.role === "admin" || profile.role === "creator";
  if (path.startsWith("/admin")) return <>{children}</>;
  if (isAdminUser) return <>{children}</>;

  const onboardingDone = (profile as any).onboarding_completed === true;

  // Onboarding always takes precedence — finish profile build first.
  if (path.startsWith("/onboarding")) {
    return <>{children}</>;
  }
  if (!onboardingDone) {
    return <Navigate to="/onboarding" replace />;
  }

  // Paywall temporarily disabled — allow all onboarded users through.
  return <>{children}</>;
}

