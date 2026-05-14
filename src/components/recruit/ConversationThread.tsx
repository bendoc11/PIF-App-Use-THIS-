import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Send, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface OutreachRow {
  subject: string | null;
  body: string | null;
  sent_at: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  coachEmail: string;
  coachName: string | null;
  schoolName: string | null;
  originalSubject: string | null;
  originalReply: string | null;
  receivedAt: string;
  onSent?: () => void;
}

export function ConversationThread({
  open,
  onClose,
  coachEmail,
  coachName,
  schoolName,
  originalSubject,
  originalReply,
  receivedAt,
  onSent,
}: Props) {
  const { user, profile } = useAuth();
  const p: any = profile ?? {};
  const alias = p.email_alias as string | undefined;
  const fromAddress = alias ? `${alias}@mail.playitforward.app` : null;

  const [outreach, setOutreach] = useState<OutreachRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const replySubject = useMemo(() => {
    const base = originalSubject || outreach?.subject || "Recruiting";
    return base.toLowerCase().startsWith("re:") ? base : `Re: ${base}`;
  }, [originalSubject, outreach?.subject]);

  useEffect(() => {
    if (!open || !user || !coachEmail) return;
    let cancelled = false;
    setLoading(true);
    supabase
      .from("outreach_history")
      .select("subject, body, sent_at")
      .eq("user_id", user.id)
      .ilike("coach_email", coachEmail)
      .order("sent_at", { ascending: true })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setOutreach((data as OutreachRow) ?? null);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, user?.id, coachEmail]);

  useEffect(() => {
    if (!loading && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [loading]);

  if (!open) return null;

  const send = async () => {
    if (!user || !draft.trim()) return;
    if (!fromAddress) {
      toast({ title: "Email alias missing", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-outreach-email", {
        body: { to: coachEmail, subject: replySubject, body: draft },
      });
      if (error || (data as any)?.error) {
        const msg = (data as any)?.message || (error as any)?.message || "Send failed";
        toast({ title: "Send failed", description: msg, variant: "destructive" });
        return;
      }
      await supabase.from("outreach_history").insert({
        user_id: user.id,
        coach_name: coachName || coachEmail,
        coach_title: null,
        school_name: schoolName || "",
        coach_email: coachEmail,
        subject: replySubject,
        body: draft,
        status: "replied",
        pipeline_stage: "in_conversation",
      } as any);
      toast({ title: "Reply sent" });
      setDraft("");
      onSent?.();
      onClose();
    } finally {
      setSending(false);
    }
  };

  const displayName = coachName || coachEmail;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-3">
      <div
        className="w-full max-w-xl flex flex-col shadow-2xl rounded-2xl overflow-hidden"
        style={{ background: "#0F1620", border: "1px solid #1E2733", maxHeight: "90vh" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: "1px solid #1E2733", background: "#0B1018" }}
        >
          <div className="min-w-0">
            <h3 className="font-semibold text-white truncate">{displayName}</h3>
            {schoolName && (
              <p className="text-[12px] truncate" style={{ color: "#A0ADB8" }}>
                {schoolName}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white shrink-0 ml-3"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Thread */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-5 space-y-4"
          style={{ background: "#0F1620" }}
        >
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin" style={{ color: "#A0ADB8" }} />
            </div>
          ) : (
            <>
              {/* Outgoing original email (right-aligned, blue) */}
              {outreach && (
                <div className="flex flex-col items-end">
                  <div
                    className="max-w-[85%] rounded-2xl rounded-tr-md px-4 py-3"
                    style={{ background: "#0071E3", color: "#FFFFFF" }}
                  >
                    {outreach.subject && (
                      <div className="text-[11px] font-semibold opacity-80 mb-1">
                        {outreach.subject}
                      </div>
                    )}
                    <div className="text-[14px] leading-relaxed whitespace-pre-wrap">
                      {outreach.body}
                    </div>
                  </div>
                  <span className="text-[10px] mt-1 mr-1" style={{ color: "#6B7785" }}>
                    You · {formatDistanceToNow(new Date(outreach.sent_at), { addSuffix: true })}
                  </span>
                </div>
              )}

              {/* Incoming coach reply (left-aligned, grey) */}
              <div className="flex flex-col items-start">
                <div
                  className="max-w-[85%] rounded-2xl rounded-tl-md px-4 py-3"
                  style={{ background: "#1E2733", color: "#F3F5F7" }}
                >
                  {originalSubject && (
                    <div
                      className="text-[11px] font-semibold mb-1"
                      style={{ color: "#A0ADB8" }}
                    >
                      {originalSubject}
                    </div>
                  )}
                  {originalReply ? (
                    <div className="text-[14px] leading-relaxed whitespace-pre-wrap">
                      {originalReply}
                    </div>
                  ) : (
                    <div className="text-[13px] italic" style={{ color: "#A0ADB8" }}>
                      The coach's message body wasn't captured — reply below to keep the conversation going.
                    </div>
                  )}
                </div>
                <span className="text-[10px] mt-1 ml-1" style={{ color: "#6B7785" }}>
                  {displayName} · {formatDistanceToNow(new Date(receivedAt), { addSuffix: true })}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Compose */}
        <div
          className="px-3 py-3"
          style={{ borderTop: "1px solid #1E2733", background: "#0B1018" }}
        >
          <div
            className="flex items-center gap-2 px-2 pb-2 text-[11px]"
            style={{ color: "#A0ADB8" }}
          >
            <span style={{ color: "#6B7785" }}>To:</span>
            <span style={{ color: "#E6EAF0", fontWeight: 500 }}>{coachEmail}</span>
          </div>
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a reply…"
              rows={2}
              className="flex-1 resize-none rounded-2xl px-4 py-2.5 text-[14px] outline-none"
              style={{
                background: "#1E2733",
                color: "#FFFFFF",
                border: "1px solid #2A3441",
                minHeight: 44,
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <button
              onClick={send}
              disabled={sending || !draft.trim()}
              className="shrink-0 rounded-full flex items-center justify-center transition-opacity"
              style={{
                background: draft.trim() ? "#0071E3" : "#1E2733",
                width: 44,
                height: 44,
                color: "#FFFFFF",
                opacity: sending ? 0.6 : 1,
                cursor: !draft.trim() || sending ? "not-allowed" : "pointer",
              }}
              aria-label="Send reply"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
          {fromAddress && (
            <p className="text-[10px] mt-2 ml-2" style={{ color: "#6B7785" }}>
              From {fromAddress}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
