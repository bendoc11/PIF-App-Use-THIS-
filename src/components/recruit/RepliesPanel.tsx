import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Mail, MailOpen, Inbox } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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

export function RepliesPanel() {
  const { user } = useAuth();
  const [replies, setReplies] = useState<Reply[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
        setReplies((data as Reply[]) ?? []);
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
  }, [user?.id]);

  const handleClick = async (r: Reply) => {
    setExpanded(expanded === r.id ? null : r.id);
    if (!r.is_read) {
      await supabase.from("coach_replies").update({ is_read: true }).eq("id", r.id);
    }
  };

  if (loading) return null;

  return (
    <Card className="p-5 bg-white border-gray-200 mt-4">
      <div className="flex items-center gap-2 mb-3">
        <Inbox className="h-4 w-4 text-gray-600" />
        <h3 className="font-semibold text-gray-900">Coach Replies</h3>
        {replies.filter(r => !r.is_read).length > 0 && (
          <span className="ml-auto text-xs bg-pif-red text-white rounded-full px-2 py-0.5 font-medium">
            {replies.filter(r => !r.is_read).length} new
          </span>
        )}
      </div>

      {replies.length === 0 ? (
        <p className="text-sm text-gray-500 py-4 text-center">No replies yet. Replies from coaches will appear here.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {replies.map((r) => {
            const isOpen = expanded === r.id;
            const preview = (r.reply_body_text ?? "").slice(0, 100);
            return (
              <li key={r.id}>
                <button
                  onClick={() => handleClick(r)}
                  className="w-full text-left py-3 flex items-start gap-3 hover:bg-gray-50 px-2 -mx-2 rounded transition-colors"
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
                    <p className="text-sm text-gray-600 mt-1">
                      {isOpen ? r.reply_body_text : preview + (preview.length < (r.reply_body_text?.length ?? 0) ? "…" : "")}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
