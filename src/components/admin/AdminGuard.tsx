import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface AdminGuardProps {
  children: ReactNode;
  requiredRole?: "admin" | "creator";
}

export function AdminGuard({ children, requiredRole }: AdminGuardProps) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/login" replace />;
  }

  const role = profile.role;

  if (role !== "admin" && role !== "creator") {
    return <Navigate to="/dashboard" replace />;
  }

  if (requiredRole === "admin" && role !== "admin") {
    return <Navigate to="/admin/courses" replace />;
  }

  return <>{children}</>;
}
