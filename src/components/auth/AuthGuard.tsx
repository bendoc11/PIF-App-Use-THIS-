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

  // Onboarding is done. Subscribed users see everything.
  if (hasActiveSubscription) return <>{children}</>;

  // Unpaid but onboarded: allow profile/settings/paywall, gate everything else.
  const isAllowed = ALWAYS_ALLOWED_PREFIXES.some((p) => path === p || path.startsWith(p + "/") || path === p);
  if (isAllowed) return <>{children}</>;

  return <Navigate to="/paywall" replace />;
}

function Paywall() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        backgroundColor: "#0A0F1E",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          textAlign: "center",
          color: "#FFFFFF",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            backgroundColor: "#E8391D",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 32px",
            color: "#fff",
            fontWeight: 700,
            letterSpacing: 1,
          }}
        >
          PIF
        </div>

        <h1
          style={{
            fontSize: 48,
            lineHeight: 1,
            margin: "0 0 16px",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "#FFFFFF",
          }}
        >
          GET RECRUITED
        </h1>
        <p style={{ color: "#A0ADB8", fontSize: 16, lineHeight: 1.5, margin: "0 0 32px" }}>
          Contact every college coach in the country. Build your profile. Track every offer.
        </p>

        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: "0 0 32px",
            textAlign: "left",
          }}
        >
          {[
            "1,852+ college programs — every D1, D2, D3, JUCO and NAIA coach",
            "Send recruiting emails directly from your own Gmail",
            "Track responses, offers, visits, and your full pipeline",
          ].map((line) => (
            <li
              key={line}
              style={{
                color: "#FFFFFF",
                fontSize: 15,
                lineHeight: 1.5,
                marginBottom: 12,
                paddingLeft: 24,
                position: "relative",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  color: "#3B82F6",
                  fontWeight: 700,
                }}
              >
                ✓
              </span>
              {line}
            </li>
          ))}
        </ul>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 40, fontWeight: 800, color: "#FFFFFF" }}>
            Free <span style={{ fontSize: 18, color: "#A0ADB8", fontWeight: 400 }}>for 7 days</span>
          </div>
          <div style={{ color: "#A0ADB8", fontSize: 12, marginTop: 6 }}>then $49.99 per month. Cancel anytime.</div>
        </div>

        <a
          href={CHECKOUT_URL}
          style={{
            display: "block",
            width: "100%",
            backgroundColor: "#E8391D",
            color: "#FFFFFF",
            textDecoration: "none",
            padding: "16px 20px",
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "0.05em",
            boxSizing: "border-box",
          }}
        >
          START FOR FREE
        </a>
      </div>
    </div>
  );
}
