import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const PUBLIC_ROUTES = ["/pricing", "/settings"];

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading, subscription } = useAuth();
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

  // Allow pricing and settings pages without subscription
  if (!subscription.subscribed && !PUBLIC_ROUTES.includes(location.pathname)) {
    return <Navigate to="/pricing" replace />;
  }

  return <>{children}</>;
}
