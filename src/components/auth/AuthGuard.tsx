import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const ACTIVE_STATUSES = ["active", "trialing", "trial", "past_due"];

function isSubscribed(profile: any): boolean {
  if (!profile) return false;
  if (profile.role === "admin" || profile.role === "creator") return true;
  if (profile.plan && ["pro", "premium", "lifetime"].includes(profile.plan)) return true;
  if (profile.subscription_status && ACTIVE_STATUSES.includes(profile.subscription_status)) return true;
  return false;
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading, profile } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Wait for profile to load before making routing decisions
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // PAYWALL FIRST: any signed-in user without an active subscription must
  // see the paywall before onboarding, settings, dashboard, or anything
  // else on the platform. Admins/creators bypass.
  const isPaywallRoute = location.pathname.startsWith("/paywall");
  const isAdminRoute = location.pathname.startsWith("/admin");
  if (!isSubscribed(profile) && !isPaywallRoute && !isAdminRoute) {
    return <Navigate to="/paywall" replace />;
  }

  // Subscribed users who haven't completed onboarding go through it first
  // (admins can still hit /admin and /settings directly).
  const isOnboardingRoute = location.pathname.startsWith("/onboarding");
  if (
    !profile.onboarding_completed &&
    !isOnboardingRoute &&
    !isAdminRoute &&
    !location.pathname.startsWith("/settings")
  ) {
    return <Navigate to="/onboarding" replace />;
  }

  // If onboarding is already complete and they somehow land on /onboarding,
  // bounce them to the Get Recruited page so they never see a blank screen.
  if (profile.onboarding_completed && isOnboardingRoute) {
    return <Navigate to="/recruit" replace />;
  }

  return <>{children}</>;
}
