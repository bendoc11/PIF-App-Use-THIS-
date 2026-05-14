import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Lock, Inbox } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ConversationThread } from "./ConversationThread";
import { STRIPE_CHECKOUT_URL } from "@/lib/subscription";

interface Reply {
  id: string;
  coach_email: string | null;
  coach_name: string | null;
  school_name: string | null;
  reply_subject: string | null;
  reply_body_text: string | null;
  received_at: string;
  is_read: boolean;
}

interface Props {
  onCountChange?: (total: number) => void;
  locked?: boolean;
  /** Optional override; defaults to opening the Stripe checkout link. */
  onLockedClick?: () => void;
}

// Deterministic color per school (school colors palette)
const SCHOOL_PALETTE = [
  "#C8102E", // crimson
  "#0F4D92", // royal blue
  "#FF6F00", // orange
  "#046A38", // forest green
  "#582C83", // purple
  "#FFB81C", // gold
  "#00538C", // navy
  "#6F263D", // maroon
  "#1A8A4A", // green
  "#E8391D", // PIF red
  "#0071E3", // blue
  "#2D7A7A", // teal
];

function colorForSchool(seed: string | null): string {
  if (!seed) return "#1E2733";
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return SCHOOL_PALETTE[h % SCHOOL_PALETTE.length];
}

function initialsOf(name: string | null, email: string | null): string {
  const src = (name || email || "?").trim();
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

function previewOf(text: string | null, max = 60): string {
  if (!text) return "";
  const cleaned = text.replace(/\s+/g, " ").trim();
  return cleaned.length > max ? cleaned.slice(0, max).trimEnd() + "…" : cleaned;
}

// Shared dark surface tokens
const SURFACE = "#0F1620";
const SURFACE_ELEVATED = "#141C28";
const BORDER = "#1E2733";
const TEXT_PRIMARY = "#F3F5F7";
const TEXT_SECONDARY = "#A0ADB8";
const TEXT_TERTIARY = "#6B7785";

export function RepliesPanel({ onCountChange, locked, onLockedClick }: Props = {}) {
  const { user } = useAuth();
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Reply | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const load = async () => {
      const { data } = await supabase
        .from("coach_replies")
        .select("*")
        .eq("athlete_id", user.id)
        .order("received_at", { ascending: false });
      if (!cancelled) {
        const list = (data as Reply[]) ?? [];
        setReplies(list);
        onCountChange?.(list.length);
        setLoading(false);
      }
    };
    load();

    const channel = supabase
      .channel(`coach_replies_${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "coach_replies", filter: `athlete_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user?.id, onCountChange]);

  const goToCheckout = () => {
    if (onLockedClick) onLockedClick();
    else window.location.href = STRIPE_CHECKOUT_URL;
  };

  const openReply = async (r: Reply) => {
    setActive(r);
    if (!r.is_read) {
      await supabase.from("coach_replies").update({ is_read: true }).eq("id", r.id);
    }
  };

  if (loading) {
    return (
      <div
        id="replies-panel"
        style={{
          background: SURFACE,
          border: `1px solid ${BORDER}`,
          borderRadius: 16,
          minHeight: 240,
        }}
        className="flex items-center justify-center"
      >
        <div
          className="h-8 w-8 rounded-full animate-pulse"
          style={{ background: SURFACE_ELEVATED }}
        />
      </div>
    );
  }

  // ===== LOCKED variant =====
  if (locked) {
    return (
      <div
        id="replies-panel"
        style={{
          background: SURFACE,
          border: `1px solid ${BORDER}`,
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <div className="flex items-center justify-between px-4 py-3.5">
          <h3 style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, letterSpacing: "0.04em" }}>
            COACH REPLIES
          </h3>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 26,
              height: 26,
              background: SURFACE_ELEVATED,
              border: `1px solid ${BORDER}`,
              borderRadius: 980,
            }}
            aria-label="Locked"
          >
            <Lock style={{ width: 12, height: 12, color: TEXT_SECONDARY }} />
          </span>
        </div>

        <div style={{ borderTop: `1px solid ${BORDER}` }} />

        <ul>
          {[0, 1, 2, 3].map((i) => (
            <li
              key={i}
              role="button"
              onClick={goToCheckout}
              className="cursor-pointer relative"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 16px",
                borderBottom: i < 3 ? `1px solid ${BORDER}` : "none",
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: SURFACE_ELEVATED,
                  flexShrink: 0,
                  filter: "blur(6px)",
                }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                <div
                  style={{
                    width: "55%",
                    height: 11,
                    background: SURFACE_ELEVATED,
                    borderRadius: 4,
                    filter: "blur(5px)",
                  }}
                />
                <div
                  style={{
                    width: "75%",
                    height: 9,
                    background: SURFACE_ELEVATED,
                    borderRadius: 4,
                    filter: "blur(5px)",
                  }}
                />
                <div
                  style={{
                    width: "40%",
                    height: 8,
                    background: SURFACE_ELEVATED,
                    borderRadius: 4,
                    filter: "blur(5px)",
                  }}
                />
              </div>
              <span
                className="absolute"
                style={{
                  right: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 28,
                  height: 28,
                  background: "rgba(15,22,32,0.85)",
                  border: `1px solid ${BORDER}`,
                  borderRadius: 980,
                  backdropFilter: "blur(2px)",
                }}
              >
                <Lock style={{ width: 13, height: 13, color: TEXT_SECONDARY }} />
              </span>
            </li>
          ))}
        </ul>

        <div style={{ padding: "14px 16px 16px" }}>
          <button
            onClick={goToCheckout}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              minHeight: 48,
              background: "#E8391D",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "12px 16px",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 0.4,
              cursor: "pointer",
            }}
          >
            <Lock className="h-4 w-4 mr-2" />
            UNLOCK REPLIES — $19.99/MONTH
          </button>
        </div>
      </div>
    );
  }

  // ===== SUBSCRIBED variant =====
  return (
    <>
      <div
        id="replies-panel"
        style={{
          background: SURFACE,
          border: `1px solid ${BORDER}`,
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5">
          <h3 style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, letterSpacing: "0.04em" }}>
            COACH REPLIES
          </h3>
          {replies.length > 0 && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                background: SURFACE_ELEVATED,
                border: `1px solid ${BORDER}`,
                color: TEXT_SECONDARY,
                borderRadius: 980,
                padding: "3px 10px",
                lineHeight: 1.2,
              }}
            >
              {replies.length}
            </span>
          )}
        </div>

        <div style={{ borderTop: `1px solid ${BORDER}` }} />

        {replies.length === 0 ? (
          <div className="flex flex-col items-center text-center px-6 py-14">
            <div
              className="flex items-center justify-center mb-4"
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: SURFACE_ELEVATED,
                border: `1px solid ${BORDER}`,
              }}
            >
              <Inbox style={{ width: 26, height: 26, color: TEXT_SECONDARY }} />
            </div>
            <h4
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: TEXT_PRIMARY,
                marginBottom: 6,
              }}
            >
              No replies yet
            </h4>
            <p style={{ fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.5, maxWidth: 320 }}>
              Coaches typically respond within 3–7 days. Keep messaging to increase your chances.
            </p>
          </div>
        ) : (
          <ul>
            {replies.map((r, idx) => {
              const color = colorForSchool(r.school_name || r.coach_name);
              const preview = previewOf(r.reply_body_text, 60);
              return (
                <li
                  key={r.id}
                  style={{
                    borderBottom: idx < replies.length - 1 ? `1px solid ${BORDER}` : "none",
                  }}
                >
                  <button
                    onClick={() => openReply(r)}
                    className="w-full text-left transition-colors"
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      padding: "14px 16px 14px 12px",
                      background: "transparent",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = SURFACE_ELEVATED)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {/* Unread dot column */}
                    <div
                      style={{
                        width: 8,
                        marginTop: 16,
                        flexShrink: 0,
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      {!r.is_read && (
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "#0A84FF",
                            display: "block",
                            boxShadow: "0 0 0 3px rgba(10,132,255,0.18)",
                          }}
                        />
                      )}
                    </div>
                    {/* Avatar */}
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: color,
                        color: "#FFFFFF",
                        fontSize: 13,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        letterSpacing: 0.4,
                      }}
                    >
                      {initialsOf(r.coach_name, r.coach_email)}
                    </div>
                    {/* Body */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          justifyContent: "space-between",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: r.is_read ? 600 : 700,
                            color: TEXT_PRIMARY,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {r.coach_name || r.coach_email || "Unknown coach"}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            color: TEXT_TERTIARY,
                            flexShrink: 0,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatDistanceToNow(new Date(r.received_at), { addSuffix: true })}
                        </span>
                      </div>
                      {r.school_name && (
                        <div
                          style={{
                            fontSize: 12,
                            color: TEXT_SECONDARY,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            marginTop: 2,
                          }}
                        >
                          {r.school_name}
                        </div>
                      )}
                      {preview && (
                        <div
                          style={{
                            fontSize: 11.5,
                            color: TEXT_TERTIARY,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            marginTop: 3,
                          }}
                        >
                          {preview}
                        </div>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {active && active.coach_email && (
        <ConversationThread
          open={!!active}
          onClose={() => setActive(null)}
          coachEmail={active.coach_email}
          coachName={active.coach_name}
          schoolName={active.school_name}
          originalSubject={active.reply_subject}
          originalReply={active.reply_body_text}
          receivedAt={active.received_at}
        />
      )}
    </>
  );
}
