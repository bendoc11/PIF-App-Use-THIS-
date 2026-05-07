import { useAuth } from "@/contexts/AuthContext";

const SF = "-apple-system, 'SF Pro Text', BlinkMacSystemFont, sans-serif";

const STRIPE_BASE =
  "https://subscribe.playitforward.app/b/5kQ3cudt57K017C423cEw02";

function checkoutUrl(email: string | null | undefined) {
  return email
    ? `${STRIPE_BASE}?prefilled_email=${encodeURIComponent(email)}`
    : STRIPE_BASE;
}

interface Props {
  open: boolean;
  variant: "post-send-3" | "upgrade";
  onClose: () => void;
}

export function FreemiumPaywall({ open, variant, onClose }: Props) {
  const { user } = useAuth();
  if (!open) return null;

  const url = checkoutUrl(user?.email);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        fontFamily: SF,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#FFFFFF",
          borderRadius: 20,
          maxWidth: 420,
          width: "100%",
          padding: 32,
          boxSizing: "border-box",
          fontFamily: SF,
        }}
      >
        {variant === "post-send-3" ? (
          <>
            {/* progress dots */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 0,
                marginBottom: 8,
              }}
            >
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ display: "flex", alignItems: "center" }}>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "#0071E3",
                      display: "block",
                    }}
                  />
                  {i < 2 && (
                    <span
                      style={{
                        width: 36,
                        height: 2,
                        background: "#0071E3",
                        display: "block",
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#0071E3",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              3 messages sent
            </div>

            <h2
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: "#1D1D1F",
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                textAlign: "center",
                margin: 0,
              }}
            >
              You're doing everything right.
            </h2>
            <p
              style={{
                fontSize: 14,
                color: "#6E6E73",
                textAlign: "center",
                marginTop: 8,
                lineHeight: 1.5,
              }}
            >
              Most recruited athletes send 50+ messages. Don't stop here.
            </p>

            <div style={{ height: 1, background: "#E8E8ED", margin: "20px 0" }} />

            <p
              style={{
                fontSize: 13,
                color: "#6E6E73",
                textAlign: "center",
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              Unlimited coach messages + reply access for $14/month. Cancel anytime.
            </p>

            <a
              href={url}
              style={{
                display: "block",
                width: "100%",
                background: "#0071E3",
                color: "#FFFFFF",
                borderRadius: 980,
                fontSize: 15,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                padding: "14px 24px",
                textAlign: "center",
                textDecoration: "none",
                marginTop: 16,
                boxSizing: "border-box",
              }}
            >
              Continue recruiting — $14/mo
            </a>
            <p
              style={{
                fontSize: 11,
                color: "#86868B",
                textAlign: "center",
                marginTop: 10,
              }}
            >
              Your 3 free messages have been delivered.
            </p>

            <div style={{ textAlign: "center", marginTop: 20 }}>
              <button
                onClick={onClose}
                style={{
                  fontSize: 12,
                  color: "#86868B",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  textDecoration: "none",
                  fontFamily: SF,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
              >
                Back to dashboard
              </button>
            </div>
          </>
        ) : (
          <>
            <h2
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "#1D1D1F",
                letterSpacing: "-0.02em",
                textAlign: "center",
                margin: 0,
              }}
            >
              Ready to go further?
            </h2>
            <p
              style={{
                fontSize: 14,
                color: "#6E6E73",
                textAlign: "center",
                marginTop: 8,
                lineHeight: 1.5,
              }}
            >
              You've built real momentum. Upgrade to keep messaging coaches and track every reply.
            </p>

            <div
              style={{
                background: "#F5F5F7",
                borderRadius: 10,
                padding: "10px 16px",
                margin: "20px 0",
                fontSize: 13,
                fontWeight: 600,
                color: "#1D1D1F",
                textAlign: "center",
              }}
            >
              7,800+ coaches{" "}
              <span style={{ color: "#D2D2D7" }}>·</span> All divisions{" "}
              <span style={{ color: "#D2D2D7" }}>·</span> Unlimited sends
            </div>

            <a
              href={url}
              style={{
                display: "block",
                width: "100%",
                background: "#0071E3",
                color: "#FFFFFF",
                borderRadius: 980,
                fontSize: 15,
                fontWeight: 600,
                padding: "14px 24px",
                textAlign: "center",
                textDecoration: "none",
                boxSizing: "border-box",
              }}
            >
              Upgrade for $14/mo
            </a>

            <div style={{ textAlign: "center", marginTop: 12 }}>
              <button
                onClick={onClose}
                style={{
                  fontSize: 12,
                  color: "#86868B",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: SF,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
              >
                Back to dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
