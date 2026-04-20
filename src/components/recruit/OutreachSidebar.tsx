import { useState } from "react";
import { PenSquare, Mail, ChevronRight, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface OutreachRow {
  id: string;
  coach_name: string;
  school_name: string;
  coach_email: string;
  coach_title?: string | null;
  subject: string;
  body: string;
  sent_at: string;
  status: "sent" | "replied" | "offer";
}

interface Props {
  rows: OutreachRow[];
  onChange: () => void;
  onCompose: () => void;
  onFollowUp: (row: OutreachRow) => void;
}

const STATUS_DOT: Record<string, string> = {
  sent: "bg-gray-300",
  replied: "bg-blue-500",
  offer: "bg-green-500",
};

const STATUS_LABEL: Record<string, string> = {
  sent: "Sent",
  replied: "Replied",
  offer: "Offer",
};

const NEXT_STATUS: Record<string, "sent" | "replied" | "offer"> = {
  sent: "replied",
  replied: "offer",
  offer: "sent",
};

function daysAgo(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function relativeTime(iso: string): string {
  const d = daysAgo(iso);
  if (d === 0) return "Today";
  if (d === 1) return "1d ago";
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

export function OutreachSidebar({ rows, onChange, onCompose, onFollowUp }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);

  const cycleStatus = async (e: React.MouseEvent, row: OutreachRow) => {
    e.stopPropagation();
    const next = NEXT_STATUS[row.status];
    const { error } = await supabase
      .from("outreach_history")
      .update({ status: next })
      .eq("id", row.id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    onChange();
  };

  return (
    <aside className="w-full lg:w-80 shrink-0 border-r border-gray-200 bg-white flex flex-col h-full">
      {/* Compose action — top, primary */}
      <div className="p-3 border-b border-gray-100">
        <button
          onClick={onCompose}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium transition-colors"
        >
          <PenSquare className="h-4 w-4" />
          Compose new outreach
        </button>
      </div>

      {/* Past outreach header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-2">
        <Mail className="h-3.5 w-3.5 text-gray-400" />
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Past outreach</h2>
        <span className="ml-auto text-xs text-gray-400 tabular-nums">{rows.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {rows.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Mail className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 font-medium">No outreach yet</p>
            <p className="text-xs text-gray-400 mt-1">Compose your first email to get started.</p>
          </div>
        ) : (
          <ul>
            {rows.map((r) => {
              const days = daysAgo(r.sent_at);
              const showFollowUp = r.status === "sent" && days >= 14;
              const isOpen = openId === r.id;
              return (
                <li key={r.id} className="border-b border-gray-50 last:border-b-0">
                  <button
                    onClick={() => setOpenId(isOpen ? null : r.id)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${STATUS_DOT[r.status]}`}
                        aria-label={STATUS_LABEL[r.status]}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <p className="font-medium text-gray-900 truncate text-sm">{r.coach_name}</p>
                          <span className="text-[11px] text-gray-400 shrink-0 tabular-nums">
                            {relativeTime(r.sent_at)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{r.school_name}</p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <button
                            onClick={(e) => cycleStatus(e, r)}
                            className="text-[11px] text-gray-500 hover:text-gray-900 px-1.5 py-0.5 rounded hover:bg-gray-100 capitalize transition-colors"
                          >
                            {STATUS_LABEL[r.status]}
                          </button>
                          {showFollowUp && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onFollowUp(r);
                              }}
                              className="inline-flex items-center gap-1 text-[11px] text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-1.5 py-0.5 rounded font-medium transition-colors"
                            >
                              <Clock className="h-2.5 w-2.5" />
                              Follow up?
                            </button>
                          )}
                        </div>
                      </div>
                      <ChevronRight
                        className={`h-3.5 w-3.5 text-gray-300 shrink-0 mt-1 transition-transform ${isOpen ? "rotate-90" : ""}`}
                      />
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-3 pl-9 text-xs">
                      <p className="font-medium text-gray-700 mb-1">{r.subject}</p>
                      <pre className="whitespace-pre-wrap font-sans text-gray-600 leading-relaxed">{r.body}</pre>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
