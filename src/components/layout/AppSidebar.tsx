import { LogOut, Shield, Crosshair, UserCircle, TrendingUp, Inbox, Lock, Target, Users } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadReplies } from "@/hooks/useUnreadReplies";
import { isPaidSubscriber } from "@/lib/subscription";
import { useOutreachGating, getLockedBannerCopy } from "@/hooks/useOutreachGating";
import offeredLogo from "@/assets/offered-logo.svg.asset.json";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems: { title: string; url: string; icon: any; tourId?: string; badgeKey?: "replies" }[] = [
  { title: "Get Recruited", url: "/recruit", icon: Crosshair },
  { title: "Replies", url: "/replies", icon: Inbox, badgeKey: "replies" },
  { title: "Open Spots", url: "/open-spots", icon: Target },
  { title: "Get Assessed", url: "/coaches", icon: Users },
  { title: "My Profile", url: "/profile", icon: UserCircle },
  { title: "My Progress", url: "/progress", icon: TrendingUp, tourId: "nav-progress" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut, profile, hasActiveSubscription } = useAuth();
  const role = profile?.role || "user";
  const unreadReplies = useUnreadReplies();
  const isPaid = isPaidSubscriber(profile, hasActiveSubscription);
  const gating = useOutreachGating();
  const lockedBannerCopy = getLockedBannerCopy(gating);

  const initials = profile
    ? `${(profile.first_name || "")[0] || ""}${(profile.last_name || "")[0] || ""}`.toUpperCase()
    : "?";

  const isActiveRoute = (url: string) =>
    url === "/dashboard" ? location.pathname === url : location.pathname.startsWith(url);

  // Premium item base styles. Active state: left red indicator bar + 10% red tint.
  const itemBase =
    "group relative flex items-center gap-3.5 pl-4 pr-3 py-2.5 rounded-lg font-heading text-sm tracking-wider transition-colors";
  const itemIdle = "text-muted-foreground hover:bg-muted/50 hover:text-foreground";
  const itemActive = "text-pif-red bg-pif-red/10";

  // Slightly darker than main content for depth + subtle right border at ~15% white.
  const sidebarBgStyle = { backgroundColor: "hsl(218 39% 5%)" };
  const sidebarBorderStyle = { borderRight: "1px solid hsla(0, 0%, 100%, 0.15)" };

  const renderActiveBar = (active: boolean) =>
    active && !collapsed ? (
      <span
        aria-hidden
        className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r-full bg-pif-red"
      />
    ) : null;

  return (
    <Sidebar collapsible="icon" className="border-0" style={{ ...sidebarBgStyle, ...sidebarBorderStyle }}>
      <SidebarContent className="pt-2" style={sidebarBgStyle}>
        {/* Logo — more breathing room */}
        <div className="px-4 pt-6 pb-8">
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0"
                style={{
                  boxShadow:
                    "0 0 0 1px hsla(0, 0%, 100%, 0.06), 0 0 18px hsl(var(--pif-red) / 0.45), 0 4px 14px hsl(var(--pif-red) / 0.25)",
                }}
              >
                <span className="font-heading text-base text-primary-foreground">OFF</span>
              </div>
              <span
                className="font-heading text-[13px] text-foreground uppercase"
                style={{ letterSpacing: "0.09em" }}
              >
                Offered
              </span>
            </div>
          ) : (
            <div
              className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center mx-auto"
              style={{
                boxShadow:
                  "0 0 0 1px hsla(0, 0%, 100%, 0.06), 0 0 18px hsl(var(--pif-red) / 0.45), 0 4px 14px hsl(var(--pif-red) / 0.25)",
              }}
            >
              <span className="font-heading text-base text-primary-foreground">OFF</span>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {navItems.map((item) => {
                const isRepliesItem = item.badgeKey === "replies";
                const showLockedReplies = isRepliesItem && !isPaid && gating.sentCount >= 1;
                const showUnreadDot = isRepliesItem && isPaid && unreadReplies > 0;
                const showLockedPulse = isRepliesItem && !isPaid && !!lockedBannerCopy;
                const active = isActiveRoute(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/dashboard"}
                        className={`${itemBase} ${active ? itemActive : itemIdle}`}
                        activeClassName=""
                        {...(item.tourId ? { "data-tour": item.tourId } : {})}
                      >
                        {renderActiveBar(active)}
                        <div className="relative shrink-0">
                          <item.icon
                            style={{ width: 18, height: 18 }}
                            strokeWidth={active ? 2.25 : 2}
                          />
                          {(showUnreadDot || showLockedPulse) && collapsed && (
                            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-pif-red animate-pulse" />
                          )}
                        </div>
                        {!collapsed && (
                          <span className="flex items-center gap-1.5">
                            {item.title}
                            {showLockedReplies && <Lock className="h-3.5 w-3.5 opacity-80" />}
                          </span>
                        )}
                        {showUnreadDot && !collapsed && (
                          <span className="ml-auto bg-pif-red text-white rounded-full text-xs font-medium px-2 py-0.5 min-w-[20px] text-center">
                            {unreadReplies > 99 ? "99+" : unreadReplies}
                          </span>
                        )}
                        {showLockedPulse && !collapsed && (
                          <span className="ml-auto h-2.5 w-2.5 rounded-full bg-pif-red animate-pulse" />
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Link */}
        {(role === "admin" || role === "creator") && (
          <SidebarGroup className="mt-0 py-0">
            <div
              aria-hidden
              className="mx-3"
              style={{
                height: 1,
                backgroundColor: "hsla(0, 0%, 100%, 0.15)",
                marginTop: 16,
                marginBottom: 16,
              }}
            />
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    {(() => {
                      const active = location.pathname.startsWith("/admin");
                      return (
                        <NavLink
                          to="/admin/courses"
                          className={`${itemBase} ${active ? itemActive : itemIdle}`}
                          activeClassName=""
                        >
                          {renderActiveBar(active)}
                          <Shield style={{ width: 18, height: 18 }} strokeWidth={active ? 2.25 : 2} className="shrink-0" />
                          {!collapsed && <span>Admin</span>}
                        </NavLink>
                      );
                    })()}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-3" style={sidebarBgStyle}>
        {/* User profile */}
        {!collapsed && (
          <NavLink
            to="/settings"
            className="flex items-center gap-3 px-3 py-2.5 mb-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
            activeClassName=""
          >
            <div
              className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-xs font-heading text-primary overflow-hidden shrink-0"
              style={{ boxShadow: "0 0 0 2px hsl(var(--pif-red) / 0.55)" }}
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate leading-tight">
                {profile?.first_name} {profile?.last_name}
              </p>
              <p
                className="text-[11px] capitalize leading-tight mt-0.5"
                style={{ color: "hsla(0, 0%, 100%, 0.6)" }}
              >
                {(profile?.role === "admin" || profile?.role === "creator") ? "Admin" : "Member"}
              </p>
            </div>
          </NavLink>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={signOut}
              className="hover:bg-transparent hover:text-foreground"
              style={{ color: "hsla(0, 0%, 100%, 0.45)" }}
            >
              <LogOut style={{ width: 14, height: 14 }} strokeWidth={1.5} />
              {!collapsed && (
                <span className="font-heading text-[11px] tracking-wider">Sign Out</span>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
