import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, Users, Shield, MessageSquare, ArrowLeft } from "lucide-react";

const adminNavItems = [
  { title: "Courses", url: "/admin/courses", icon: BookOpen, roles: ["admin", "creator"] },
  { title: "Creators", url: "/admin/creators", icon: Shield, roles: ["admin"] },
  { title: "Users", url: "/admin/users", icon: Users, roles: ["admin"] },
  { title: "Moderation", url: "/admin/moderation", icon: MessageSquare, roles: ["admin"] },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { profile } = useAuth();
  const role = profile?.role || "user";

  const visibleItems = adminNavItems.filter((item) => item.roles.includes(role));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                to="/dashboard"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to App</span>
              </Link>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                  <span className="font-heading text-xs text-primary-foreground">PIF</span>
                </div>
                <span className="font-heading text-base tracking-wider text-foreground">Admin</span>
              </div>
            </div>
            <nav className="flex items-center gap-1">
              {visibleItems.map((item) => {
                const isActive = location.pathname.startsWith(item.url);
                return (
                  <Link
                    key={item.url}
                    to={item.url}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-heading tracking-wider transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="hidden md:inline">{item.title}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}
