import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoadingScreen from "@/components/LoadingScreen";

const CHECKOUT_URL =
  "https://pay.philadelphiabasketballschool.com/b/cNi28q0NS5hBa3Z7Ud9R60S";

// Kept for any legacy imports; trivial check used elsewhere.
export function isSubscribed(_profile: any): boolean {
  return true;
}

/**
 * Auth gate.
 *  - Not signed in            → /login
 *  - Signed in, no active sub → static paywall div (no router, no state)
 *  - Signed in, subscribed    → render children
 *
 * Onboarding gating is intentionally NOT enforced here — Stripe success
 * lands users on /onboarding and we want them to see it.
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

  // The /onboarding route handles its own subscription grant after Stripe redirect.
  if (path.startsWith("/onboarding")) return <>{children}</>;

  if (!hasActiveSubscription) return <Paywall />;

  return <>{children}</>;
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
            $50 <span style={{ fontSize: 18, color: "#A0ADB8", fontWeight: 400 }}>/ month</span>
          </div>
          <div style={{ color: "#A0ADB8", fontSize: 13, marginTop: 6 }}>Cancel anytime.</div>
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
          START MY FREE TRIAL
        </a>
      </div>
    </div>
  );
}
