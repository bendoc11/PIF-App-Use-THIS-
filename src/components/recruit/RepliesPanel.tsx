import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { MailOpen, Inbox, Reply as ReplyIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ReplyComposer } from "./ReplyComposer";

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
}

export function RepliesPanel({ onCountChange }: Props = {}) {
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

  const handleClick = async (r: Reply) => {
    setExpanded(expanded === r.id ? null : r.id);
    if (!r.is_read) {
      await supabase.from("coach_replies").update({ is_read: true }).eq("id", r.id);
    }
  };

  if (loading) return null;

  return (
    <Card className="p-5 bg-white border-gray-200" id="replies-panel">
      <div className="flex items-center gap-2 mb-3">
        <Inbox className="h-4 w-4 text-gray-600" />
        <h3 className="font-semibold text-gray-900">Coach replies</h3>
        <span className="text-xs text-gray-400 ml-1">{replies.length}</span>
        {replies.filter((r) => !r.is_read).length > 0 && (
          <span className="ml-auto text-xs bg-pif-red text-white rounded-full px-2 py-0.5 font-medium">
            {replies.filter((r) => !r.is_read).length} new
          </span>
        )}
      </div>

      {replies.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-base font-semibold text-gray-800">No replies yet — but coaches are reading.</p>
          <p className="text-sm text-gray-500 mt-1">Keep going.</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {replies.map((r) => {
            const isOpen = expanded === r.id;
            const preview = (r.reply_body_text ?? "").slice(0, 140);
            return (
              <li key={r.id}>
                <div className="py-3 flex items-start gap-3">
                  <button
                    onClick={() => handleClick(r)}
                    className="flex-1 text-left flex items-start gap-3 hover:bg-gray-50 px-2 -mx-2 rounded transition-colors"
                  >
                    <div className="mt-0.5 shrink-0">
                      {!r.is_read ? (
                        <span className="block h-2 w-2 rounded-full bg-pif-red" aria-label="unread" />
                      ) : (
                        <MailOpen className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className={`text-sm truncate ${r.is_read ? "text-gray-700" : "text-gray-900 font-semibold"}`}>
                          {r.coach_name || r.coach_email || "Unknown coach"}
                        </p>
                        <span className="text-xs text-gray-400 shrink-0">
                          {formatDistanceToNow(new Date(r.received_at), { addSuffix: true })}
                        </span>
                      </div>
                      {r.school_name && <p className="text-xs text-gray-500 truncate">{r.school_name}</p>}
                      {r.reply_subject && <p className="text-xs text-gray-600 truncate mt-0.5">{r.reply_subject}</p>}
                      <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                        {isOpen ? r.reply_body_text : preview + (preview.length < (r.reply_body_text?.length ?? 0) ? "…" : "")}
                      </p>
                    </div>
                  </button>
                </div>
                {isOpen && r.coach_email && (
                  <div className="pl-9 pb-3">
                    <button
                      onClick={() => setReplyTo(r)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-1.5"
                    >
                      <ReplyIcon className="h-3.5 w-3.5" /> Reply
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
    </Card>
  );
}
