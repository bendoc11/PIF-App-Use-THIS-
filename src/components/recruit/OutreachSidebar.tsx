import { useState } from "react";
import { Mail, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface OutreachRow {
  id: string;
  coach_name: string;
  school_name: string;
  coach_email: string;
  subject: string;
  body: string;
  sent_at: string;
  status: "sent" | "replied" | "offer";
}

interface Props {
  rows: OutreachRow[];
  onChange: () => void;
}

const STATUS_STYLES: Record<string, string> = {
  sent: "bg-gray-100 text-gray-700 border-gray-200",
  replied: "bg-blue-50 text-blue-700 border-blue-200",
  offer: "bg-green-50 text-green-700 border-green-200",
};

const NEXT_STATUS: Record<string, "sent" | "replied" | "offer"> = {
  sent: "replied",
  replied: "offer",
  offer: "sent",
};

export function OutreachSidebar({ rows, onChange }: Props) {
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
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-gray-500" />
          <h2 className="font-semibold text-gray-900">Outreach</h2>
          <span className="ml-auto text-xs text-gray-500">{rows.length}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            No emails sent yet. Pick a school on the map to start.
          </div>
        ) : (
          rows.map((r) => (
            <div key={r.id} className="border-b border-gray-100">
              <button
                onClick={() => setOpenId(openId === r.id ? null : r.id)}
                className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate text-sm">{r.coach_name}</p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{r.school_name}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(r.sent_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <Badge
                    onClick={(e) => cycleStatus(e, r)}
                    className={`${STATUS_STYLES[r.status]} border cursor-pointer capitalize text-xs`}
                  >
                    {r.status}
                  </Badge>
                </div>
              </button>
              {openId === r.id && (
                <div className="px-4 pb-4 pt-1 bg-gray-50 text-xs">
                  <p className="font-medium text-gray-700 mb-1">Subject</p>
                  <p className="text-gray-600 mb-3">{r.subject}</p>
                  <p className="font-medium text-gray-700 mb-1">Message</p>
                  <pre className="whitespace-pre-wrap font-sans text-gray-600">{r.body}</pre>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
