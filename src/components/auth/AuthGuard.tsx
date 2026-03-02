import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const PUBLIC_ROUTES = ["/pricing", "/settings"];
const ADMIN_PREFIX = "/admin";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading, subscription, profile } = useAuth();
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

  // Allow pricing, settings, and admin routes without subscription check
  const isAdminRoute = location.pathname.startsWith(ADMIN_PREFIX);
  const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname);
  const isAdminOrCreator = profile?.role === "admin" || profile?.role === "creator";

  if (!subscription.subscribed && !isPublicRoute && !(isAdminRoute && isAdminOrCreator)) {
    return <Navigate to="/pricing" replace />;
  }

  return <>{children}</>;
}
