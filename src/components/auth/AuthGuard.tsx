import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

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

  // Redirect to onboarding if not completed (skip for settings/admin/onboarding routes)
  const isOnboardingRoute = location.pathname.startsWith("/onboarding");
  if (
    !profile.onboarding_completed &&
    !isOnboardingRoute &&
    !location.pathname.startsWith("/settings") &&
    !location.pathname.startsWith("/admin")
  ) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
