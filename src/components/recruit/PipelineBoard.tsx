import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { OutreachRow } from "./OutreachSidebar";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Props {
  rows: OutreachRow[];
  onChange: () => void;
}

const STAGES = [
  { key: "contacted", label: "Contacted", tone: "bg-gray-100 text-gray-700 border-gray-200" },
  { key: "replied", label: "Replied", tone: "bg-blue-50 text-blue-800 border-blue-200" },
  { key: "in_conversation", label: "In Conversation", tone: "bg-indigo-50 text-indigo-800 border-indigo-200" },
  { key: "official_interest", label: "Official Interest", tone: "bg-emerald-50 text-emerald-800 border-emerald-200" },
] as const;

type StageKey = typeof STAGES[number]["key"];

interface SchoolCard {
  school: string;
  stage: StageKey;
  count: number;
  ids: string[];
}

export function PipelineBoard({ rows, onChange }: Props) {
  const schools = useMemo(() => {
    const map = new Map<string, SchoolCard>();
    for (const r of rows) {
      const stage = ((r as any).pipeline_stage ?? "contacted") as StageKey;
      const existing = map.get(r.school_name);
      const stageRank = STAGES.findIndex((s) => s.key === stage);
      if (!existing) {
        map.set(r.school_name, { school: r.school_name, stage, count: 1, ids: [r.id] });
      } else {
        existing.count++;
        existing.ids.push(r.id);
        const existingRank = STAGES.findIndex((s) => s.key === existing.stage);
        if (stageRank > existingRank) existing.stage = stage;
      }
    }
    return Array.from(map.values());
  }, [rows]);

  const move = async (card: SchoolCard, dir: 1 | -1) => {
    const idx = STAGES.findIndex((s) => s.key === card.stage);
    const next = STAGES[idx + dir];
    if (!next) return;
    const { error } = await supabase
      .from("outreach_history")
      .update({ pipeline_stage: next.key })
      .in("id", card.ids);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    onChange();
  };

  if (rows.length === 0) return null;

  return (
    <Card className="p-4 bg-white border-gray-200">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Recruiting pipeline</h3>
        <span className="text-[11px] text-gray-500">Tap arrows to advance a school</span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STAGES.map((stage) => {
          const inStage = schools.filter((s) => s.stage === stage.key);
          return (
            <div key={stage.key} className="bg-gray-50 rounded-lg p-2.5 min-h-[120px]">
              <div className={`inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${stage.tone} mb-2`}>
                {stage.label} · {inStage.length}
              </div>
              <div className="space-y-1.5">
                {inStage.length === 0 ? (
                  <p className="text-[11px] text-gray-400 italic px-1">No schools</p>
                ) : (
                  inStage.map((card) => {
                    const idx = STAGES.findIndex((s) => s.key === card.stage);
                    return (
                      <div
                        key={card.school}
                        className="bg-white border border-gray-200 rounded-md px-2 py-1.5 text-xs flex items-center gap-1"
                      >
                        <button
                          onClick={() => move(card, -1)}
                          disabled={idx === 0}
                          className="text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed"
                          aria-label="Move back"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </button>
                        <span className="flex-1 truncate font-medium text-gray-800">{card.school}</span>
                        <button
                          onClick={() => move(card, 1)}
                          disabled={idx === STAGES.length - 1}
                          className="text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed"
                          aria-label="Move forward"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
