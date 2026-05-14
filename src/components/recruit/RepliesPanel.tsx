import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Lock, Inbox, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ConversationThread } from "./ConversationThread";
import { STRIPE_CHECKOUT_URL } from "@/lib/subscription";
import { resolveCoachDisplayName, initialsFromCoach } from "@/lib/coachIdentity";

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

interface OutreachLite {
  coach_email: string | null;
  coach_name: string | null;
  school_name: string | null;
  coach_title: string | null;
}

interface Thread {
  key: string;
  coachEmail: string;
  coachName: string;
  schoolName: string | null;
  coachTitle: string | null;
  replies: Reply[];
  latest: Reply;
  unreadCount: number;
}

interface Props {
  onCountChange?: (total: number) => void;
  locked?: boolean;
  onLockedClick?: () => void;
}

const SCHOOL_PALETTE = [
  "#C8102E", "#0F4D92", "#FF6F00", "#046A38", "#582C83", "#FFB81C",
  "#00538C", "#6F263D", "#1A8A4A", "#E8391D", "#0071E3", "#2D7A7A",
];

function colorForSchool(seed: string | null): string {
  if (!seed) return "#1E2733";
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return SCHOOL_PALETTE[h % SCHOOL_PALETTE.length];
}

function initialsOf(name: string | null, fallback: string | null): string {
  const src = (name || fallback || "?").trim();
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

function previewOf(text: string | null, max = 60): string {
  if (!text) return "";
  const cleaned = text.replace(/\s+/g, " ").trim();
  return cleaned.length > max ? cleaned.slice(0, max).trimEnd() + "…" : cleaned;
}

const SURFACE = "#0F1620";
const SURFACE_ELEVATED = "#141C28";
const BORDER = "#1E2733";
const TEXT_PRIMARY = "#F3F5F7";
const TEXT_SECONDARY = "#A0ADB8";
const TEXT_TERTIARY = "#6B7785";
const ACCENT = "#E8391D";

export function RepliesPanel({ onCountChange, locked, onLockedClick }: Props = {}) {
  const { user } = useAuth();
  const [replies, setReplies] = useState<Reply[]>([]);
  const [outreach, setOutreach] = useState<OutreachLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Thread | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const load = async () => {
      const [repliesRes, outreachRes] = await Promise.all([
        supabase
          .from("coach_replies")
          .select("*")
          .eq("athlete_id", user.id)
          .order("received_at", { ascending: false }),
        supabase
          .from("outreach_history")
          .select("coach_email, coach_name, school_name, coach_title")
          .eq("user_id", user.id),
      ]);
      if (cancelled) return;
      const list = (repliesRes.data as Reply[]) ?? [];
      setReplies(list);
      setOutreach((outreachRes.data as OutreachLite[]) ?? []);
      onCountChange?.(list.length);
      setLoading(false);
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

  // Build outreach lookup by lowercased email — prefer the most complete record (with school_name).
  const outreachByEmail = useMemo(() => {
    const map = new Map<string, OutreachLite>();
    for (const o of outreach) {
      const key = (o.coach_email || "").toLowerCase().trim();
      if (!key) continue;
      const existing = map.get(key);
      if (!existing || (!existing.school_name && o.school_name)) {
        map.set(key, o);
      }
    }
    return map;
  }, [outreach]);

  // Group replies into threads by coach_email + school
  const threads = useMemo<Thread[]>(() => {
    const map = new Map<string, Thread>();
    for (const r of replies) {
      const email = (r.coach_email || "").toLowerCase().trim();
      const o = email ? outreachByEmail.get(email) : undefined;
      const coachName = o?.coach_name || r.coach_name || r.coach_email || "Coach";
      const schoolName = o?.school_name || r.school_name || null;
      const key = `${email}|${(schoolName || "").toLowerCase()}`;
      const existing = map.get(key);
      if (existing) {
        existing.replies.push(r);
        if (new Date(r.received_at) > new Date(existing.latest.received_at)) existing.latest = r;
        if (!r.is_read) existing.unreadCount += 1;
      } else {
        map.set(key, {
          key,
          coachEmail: r.coach_email || "",
          coachName,
          schoolName,
          coachTitle: o?.coach_title ?? null,
          replies: [r],
          latest: r,
          unreadCount: r.is_read ? 0 : 1,
        });
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.latest.received_at).getTime() - new Date(a.latest.received_at).getTime(),
    );
  }, [replies, outreachByEmail]);

  const goToCheckout = () => {
    if (onLockedClick) onLockedClick();
    else window.location.href = STRIPE_CHECKOUT_URL;
  };

  const openThread = async (t: Thread) => {
    setActive(t);
    const unreadIds = t.replies.filter((r) => !r.is_read).map((r) => r.id);
    if (unreadIds.length > 0) {
      await supabase.from("coach_replies").update({ is_read: true }).in("id", unreadIds);
    }
  };

  if (loading) {
    return (
      <div
        id="replies-panel"
        style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, minHeight: 240 }}
        className="flex items-center justify-center"
      >
        <div className="h-8 w-8 rounded-full animate-pulse" style={{ background: SURFACE_ELEVATED }} />
      </div>
    );
  }

  // ===== LOCKED =====
  if (locked) {
    return (
      <div
        id="replies-panel"
        style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden" }}
      >
        <div className="flex items-center justify-between px-4 py-3.5">
          <h3 style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, letterSpacing: "0.04em" }}>
            COACH REPLIES
          </h3>
          <span
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 26, height: 26, background: SURFACE_ELEVATED,
              border: `1px solid ${BORDER}`, borderRadius: 980,
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
                display: "flex", alignItems: "center", gap: 12,
                padding: "14px 16px",
                borderBottom: i < 3 ? `1px solid ${BORDER}` : "none",
              }}
            >
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: SURFACE_ELEVATED, flexShrink: 0, filter: "blur(6px)" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                <div style={{ width: "55%", height: 11, background: SURFACE_ELEVATED, borderRadius: 4, filter: "blur(5px)" }} />
                <div style={{ width: "75%", height: 9, background: SURFACE_ELEVATED, borderRadius: 4, filter: "blur(5px)" }} />
                <div style={{ width: "40%", height: 8, background: SURFACE_ELEVATED, borderRadius: 4, filter: "blur(5px)" }} />
              </div>
              <span
                className="absolute"
                style={{
                  right: 16, top: "50%", transform: "translateY(-50%)",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 28, height: 28, background: "rgba(15,22,32,0.85)",
                  border: `1px solid ${BORDER}`, borderRadius: 980, backdropFilter: "blur(2px)",
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
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: "100%", minHeight: 48, background: ACCENT, color: "#fff",
              border: "none", borderRadius: 10, padding: "12px 16px",
              fontSize: 14, fontWeight: 700, letterSpacing: 0.4, cursor: "pointer",
            }}
          >
            <Lock className="h-4 w-4 mr-2" />
            UNLOCK REPLIES — $19.99/MONTH
          </button>
        </div>
      </div>
    );
  }

  // ===== SUBSCRIBED =====
  const showNudge = threads.length < 5;

  return (
    <>
      <div
        id="replies-panel"
        style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden" }}
      >
        <div className="flex items-center justify-between px-4 py-3.5">
          <h3 style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, letterSpacing: "0.04em" }}>
            COACH REPLIES
          </h3>
          {threads.length > 0 && (
            <span
              style={{
                fontSize: 11, fontWeight: 600,
                background: SURFACE_ELEVATED, border: `1px solid ${BORDER}`,
                color: TEXT_SECONDARY, borderRadius: 980, padding: "3px 10px", lineHeight: 1.2,
              }}
            >
              {threads.length}
            </span>
          )}
        </div>
        <div style={{ borderTop: `1px solid ${BORDER}` }} />

        {threads.length === 0 ? (
          <div className="flex flex-col items-center text-center px-6 py-14">
            <div
              className="flex items-center justify-center mb-4"
              style={{
                width: 64, height: 64, borderRadius: "50%",
                background: SURFACE_ELEVATED, border: `1px solid ${BORDER}`,
              }}
            >
              <Inbox style={{ width: 26, height: 26, color: TEXT_SECONDARY }} />
            </div>
            <h4 style={{ fontSize: 15, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 6 }}>
              No replies yet
            </h4>
            <p style={{ fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.5, maxWidth: 320 }}>
              Coaches typically respond within 3–7 days. Keep messaging to increase your chances.
            </p>
          </div>
        ) : (
          <ul>
            {threads.map((t, idx) => {
              const color = colorForSchool(t.schoolName || t.coachName);
              const preview = previewOf(t.latest.reply_body_text, 60);
              const hasUnread = t.unreadCount > 0;
              const subline = [t.schoolName, t.coachTitle].filter(Boolean).join(" · ");
              return (
                <li
                  key={t.key}
                  style={{ borderBottom: idx < threads.length - 1 ? `1px solid ${BORDER}` : "none" }}
                >
                  <button
                    onClick={() => openThread(t)}
                    className="w-full text-left transition-colors"
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 12,
                      padding: "14px 16px 14px 12px", background: "transparent",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = SURFACE_ELEVATED)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ width: 8, marginTop: 16, flexShrink: 0, display: "flex", justifyContent: "center" }}>
                      {hasUnread && (
                        <span
                          style={{
                            width: 9, height: 9, borderRadius: "50%",
                            background: ACCENT, display: "block",
                            boxShadow: `0 0 0 3px ${ACCENT}33`,
                          }}
                        />
                      )}
                    </div>
                    <div
                      style={{
                        width: 40, height: 40, borderRadius: "50%",
                        background: color, color: "#FFFFFF",
                        fontSize: 13, fontWeight: 700,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, letterSpacing: 0.4,
                      }}
                    >
                      {initialsOf(t.coachName, t.schoolName)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                        <span
                          style={{
                            fontSize: 14, fontWeight: hasUnread ? 700 : 600,
                            color: TEXT_PRIMARY,
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            display: "inline-flex", alignItems: "center", gap: 8,
                          }}
                        >
                          {t.coachName}
                          {t.replies.length > 1 && (
                            <span
                              style={{
                                fontSize: 10, fontWeight: 700,
                                background: SURFACE_ELEVATED, color: TEXT_SECONDARY,
                                border: `1px solid ${BORDER}`,
                                borderRadius: 980, padding: "1px 7px", lineHeight: 1.4,
                              }}
                            >
                              {t.replies.length}
                            </span>
                          )}
                        </span>
                        <span
                          style={{
                            fontSize: 11, color: TEXT_TERTIARY,
                            flexShrink: 0, whiteSpace: "nowrap",
                          }}
                        >
                          {formatDistanceToNow(new Date(t.latest.received_at), { addSuffix: true })}
                        </span>
                      </div>
                      {subline && (
                        <div
                          style={{
                            fontSize: 12, color: TEXT_SECONDARY,
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            marginTop: 2,
                          }}
                        >
                          {subline}
                        </div>
                      )}
                      {preview && (
                        <div
                          style={{
                            fontSize: 11.5, color: TEXT_TERTIARY,
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
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

      {showNudge && (
        <div
          style={{
            marginTop: 16,
            background: SURFACE,
            border: `1px solid ${BORDER}`,
            borderRadius: 16,
            padding: "20px 20px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div>
            <h4 style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 6 }}>
              Keep messaging
            </h4>
            <p style={{ fontSize: 13.5, color: TEXT_SECONDARY, lineHeight: 1.5 }}>
              Athletes who contact 20+ programs are <strong style={{ color: TEXT_PRIMARY }}>4× more likely</strong> to hear back.
            </p>
          </div>
          <Link
            to="/recruit"
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
              alignSelf: "flex-start",
              minHeight: 44, padding: "10px 18px",
              background: ACCENT, color: "#fff",
              borderRadius: 10, fontSize: 13.5, fontWeight: 700,
              letterSpacing: 0.3, textDecoration: "none",
            }}
          >
            Message more coaches
            <ArrowRight style={{ width: 15, height: 15 }} />
          </Link>
        </div>
      )}

      {active && active.coachEmail && (
        <ConversationThread
          open={!!active}
          onClose={() => setActive(null)}
          coachEmail={active.coachEmail}
          coachName={active.coachName}
          schoolName={active.schoolName}
          originalSubject={active.latest.reply_subject}
          originalReply={active.latest.reply_body_text}
          receivedAt={active.latest.received_at}
        />
      )}
    </>
  );
}
