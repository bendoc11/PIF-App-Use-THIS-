import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Reply as ReplyIcon, Lock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ReplyComposer } from "./ReplyComposer";
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

function initialsOf(name: string | null, email: string | null): string {
  const src = (name || email || "?").trim();
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

export function RepliesPanel({ onCountChange, locked, onLockedClick }: Props = {}) {
  const { user } = useAuth();
  const [replies, setReplies] = useState<Reply[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<Reply | null>(null);

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

  const handleClick = async (r: Reply) => {
    if (locked) {
      goToCheckout();
      return;
    }
    setExpanded(expanded === r.id ? null : r.id);
    if (!r.is_read) {
      await supabase.from("coach_replies").update({ is_read: true }).eq("id", r.id);
    }
  };

  if (loading) return null;

  // ===== LOCKED (unsubscribed) variant =====
  if (locked) {
    return (
      <div
        id="replies-panel"
        role="button"
        tabIndex={0}
        onClick={goToCheckout}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            goToCheckout();
          }
        }}
        className="cursor-pointer"
        style={{
          background: "#FFFFFF",
          border: "1px solid #D2D2D7",
          borderRadius: 12,
        }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <h3 style={{ fontSize: 13, fontWeight: 600, color: "#1D1D1F", margin: 0 }}>
            Coach Replies
          </h3>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 24,
              height: 24,
              background: "#F5F5F7",
              border: "1px solid #D2D2D7",
              borderRadius: 980,
            }}
            aria-label="Locked"
          >
            <Lock style={{ width: 12, height: 12, color: "#6E6E73" }} />
          </span>
        </div>

        <div style={{ borderTop: "1px solid #E8E8ED" }} />

        <ul>
          {[0, 1, 2].map((i) => (
            <li
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                borderBottom: i < 2 ? "1px solid #E8E8ED" : "none",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "#F5F5F7",
                  flexShrink: 0,
                  filter: "blur(2px)",
                }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                <div
                  style={{
                    width: 120,
                    height: 10,
                    background: "#F5F5F7",
                    borderRadius: 4,
                    filter: "blur(3px)",
                  }}
                />
                <div
                  style={{
                    width: 200,
                    height: 8,
                    background: "#F5F5F7",
                    borderRadius: 4,
                    filter: "blur(3px)",
                  }}
                />
              </div>
              <Lock style={{ width: 14, height: 14, color: "#86868B", flexShrink: 0 }} />
            </li>
          ))}
        </ul>

        <div style={{ padding: "14px 16px 16px", textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "#1D1D1F", fontWeight: 600, margin: 0, marginBottom: 12 }}>
            Your replies inbox is locked.
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToCheckout();
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              minHeight: 48,
              background: "#E8391D",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "12px 16px",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 0.5,
              cursor: "pointer",
            }}
          >
            SEE WHO RESPONDED — $19.99/MONTH
          </button>
        </div>
      </div>
    );
  }

  // ===== SUBSCRIBED variant =====
  return (
    <div
      id="replies-panel"
      style={{
        background: "#FFFFFF",
        border: "1px solid #D2D2D7",
        borderRadius: 12,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <h3 style={{ fontSize: 13, fontWeight: 600, color: "#1D1D1F", margin: 0 }}>
          Coach Replies
        </h3>
        <span
          style={{
            fontSize: 11,
            background: "#F5F5F7",
            border: "1px solid #D2D2D7",
            color: "#6E6E73",
            borderRadius: 980,
            padding: "2px 8px",
            lineHeight: 1.2,
          }}
        >
          {replies.length}
        </span>
      </div>

      <div style={{ borderTop: "1px solid #E8E8ED" }} />

      {replies.length === 0 ? (
        <>
          <ul>
            {[0, 1, 2].map((i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  borderBottom: i < 2 ? "1px solid #E8E8ED" : "none",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "#F5F5F7",
                    flexShrink: 0,
                  }}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ width: 120, height: 10, background: "#F5F5F7", borderRadius: 4 }} />
                  <div style={{ width: 200, height: 8, background: "#F5F5F7", borderRadius: 4 }} />
                </div>
              </li>
            ))}
          </ul>
          <div
            style={{
              textAlign: "center",
              padding: "14px 16px 18px",
              fontSize: 12,
              color: "#86868B",
            }}
          >
            Waiting for replies — keep messaging coaches.
          </div>
        </>
      ) : (
        <ul>
          {replies.map((r, idx) => {
            const isOpen = expanded === r.id;
            const preview = (r.reply_body_text ?? "").replace(/\s+/g, " ").trim();
            return (
              <li key={r.id} style={{ borderBottom: idx < replies.length - 1 ? "1px solid #E8E8ED" : "none" }}>
                <button
                  onClick={() => handleClick(r)}
                  className="w-full text-left"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    background: "transparent",
                    transition: "background 120ms",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#F5F5F7")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ width: 6, display: "flex", justifyContent: "center", flexShrink: 0 }}>
                    {!r.is_read && (
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "#0071E3",
                          display: "block",
                        }}
                      />
                    )}
                  </div>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "#E8F1FD",
                      color: "#0071E3",
                      fontSize: 12,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {initialsOf(r.coach_name, r.coach_email)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#1D1D1F",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {r.coach_name || r.coach_email || "Unknown coach"}
                      </span>
                      <span style={{ fontSize: 11, color: "#86868B", flexShrink: 0 }}>
                        {formatDistanceToNow(new Date(r.received_at), { addSuffix: true })}
                      </span>
                    </div>
                    {r.school_name && (
                      <div
                        style={{
                          fontSize: 13,
                          color: "#6E6E73",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {r.school_name}
                      </div>
                    )}
                    <div
                      style={{
                        fontSize: 12,
                        color: "#86868B",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: isOpen ? "pre-wrap" : "nowrap",
                        marginTop: 2,
                      }}
                    >
                      {isOpen ? r.reply_body_text : preview}
                    </div>
                  </div>
                </button>
                {isOpen && r.coach_email && (
                  <div style={{ padding: "0 16px 12px 66px" }}>
                    <button
                      onClick={() => setReplyTo(r)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        background: "#0071E3",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        padding: "6px 12px",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      <ReplyIcon style={{ width: 14, height: 14 }} /> Reply
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {replyTo && (
        <ReplyComposer
          open={!!replyTo}
          onClose={() => setReplyTo(null)}
          coachEmail={replyTo.coach_email!}
          coachName={replyTo.coach_name}
          schoolName={replyTo.school_name}
          originalSubject={replyTo.reply_subject}
          originalBody={replyTo.reply_body_text}
        />
      )}
    </div>
  );
}
