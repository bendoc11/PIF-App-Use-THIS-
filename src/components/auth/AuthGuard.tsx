import { ReactNode } from "react";
import { Navigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const PUBLIC_ROUTES = ["/pricing", "/settings", "/onboarding/results"];
const ADMIN_PREFIX = "/admin";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading, subscription, subscriptionLoading, profile } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Detect Stripe return — skip onboarding & paywall checks entirely
  const isStripeReturn = searchParams.has("session_id") || searchParams.get("verified") === "true";
  const isSignupSuccessRoute = location.pathname.startsWith("/signup-success");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    // Never redirect to login if returning from Stripe
    if (isStripeReturn || isSignupSuccessRoute) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }
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

  // Skip all onboarding & subscription checks on Stripe return pages
  if (isStripeReturn || isSignupSuccessRoute) {
    return <>{children}</>;
  }

  // Redirect to onboarding if not completed (skip for pricing/settings/admin/onboarding routes)
  const isOnboardingRoute = location.pathname.startsWith("/onboarding");
  if (
    !profile.onboarding_completed &&
    !isOnboardingRoute &&
    !location.pathname.startsWith("/pricing") &&
    !location.pathname.startsWith("/settings") &&
    !location.pathname.startsWith("/admin") &&
    !location.pathname.startsWith("/signup-success")
  ) {
    return <Navigate to="/onboarding" replace />;
  }

  // Allow pricing, settings, and admin routes without subscription check
  const isAdminRoute = location.pathname.startsWith(ADMIN_PREFIX);
  const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname);
  const isAdminOrCreator = profile?.role === "admin" || profile?.role === "creator";

  // Don't redirect to pricing while subscription is still loading
  if (!isPublicRoute && !isOnboardingRoute && !isAdminOrCreator && subscriptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!subscription.subscribed && !isPublicRoute && !isOnboardingRoute && !isAdminOrCreator) {
    return <Navigate to="/pricing" replace />;
  }

  return <>{children}</>;
}
