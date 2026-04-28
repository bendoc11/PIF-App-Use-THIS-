import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Mail, MessageCircle, Star, Trophy, GripVertical } from "lucide-react";

type Stage = "contacted" | "replied" | "interest" | "offer";

interface OutreachItem {
  id: string;
  school_name: string;
  coach_name: string;
  status: "sent" | "replied" | "offer";
  sent_at: string;
}

interface OfferItem {
  id: string;
  school_name: string;
  coach_name: string;
}

interface Props {
  outreach: OutreachItem[];
  offers: OfferItem[];
  onChange: () => void;
}

const COLUMNS: { key: Stage; label: string; Icon: any; accent: string }[] = [
  { key: "contacted", label: "Contacted", Icon: Mail, accent: "border-t-muted-foreground/40" },
  { key: "replied", label: "Replied", Icon: MessageCircle, accent: "border-t-pif-blue" },
  { key: "interest", label: "Official Interest", Icon: Star, accent: "border-t-pif-gold" },
  { key: "offer", label: "Offer Received", Icon: Trophy, accent: "border-t-pif-green" },
];

interface Card {
  id: string;
  source: "outreach" | "offer";
  stage: Stage;
  school: string;
  coach: string;
}

export function RecruitingPipeline({ outreach, offers, onChange }: Props) {
  const { user } = useAuth();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<Stage | null>(null);

  const cards: Card[] = useMemo(() => {
    const bySchool = new Map<string, OutreachItem>();
    outreach.forEach((o) => {
      const existing = bySchool.get(o.school_name);
      if (!existing || new Date(o.sent_at) > new Date(existing.sent_at)) {
        bySchool.set(o.school_name, o);
      }
    });

    const list: Card[] = [];
    bySchool.forEach((o) => {
      let stage: Stage = "contacted";
      if (o.status === "replied") stage = "replied";
      else if (o.status === "offer") stage = "offer";
      list.push({
        id: `o:${o.id}`,
        source: "outreach",
        stage,
        school: o.school_name,
        coach: o.coach_name,
      });
    });

    offers.forEach((of) => {
      if (!list.some((c) => c.school.toLowerCase() === of.school_name.toLowerCase() && c.stage === "offer")) {
        list.push({
          id: `f:${of.id}`,
          source: "offer",
          stage: "offer",
          school: of.school_name,
          coach: of.coach_name,
        });
      }
    });

    return list;
  }, [outreach, offers]);

  const grouped = useMemo(() => {
    const g: Record<Stage, Card[]> = { contacted: [], replied: [], interest: [], offer: [] };
    cards.forEach((c) => g[c.stage].push(c));
    return g;
  }, [cards]);

  const moveCard = async (card: Card, target: Stage) => {
    if (card.stage === target) return;

    if (card.source === "offer") {
      toast({ title: "Offers stay in the trophy case", description: "Update offers from the Offers section." });
      return;
    }

    const id = card.id.slice(2);

    if (target === "offer") {
      if (user) {
        await supabase.from("recruiting_offers").insert({
          user_id: user.id,
          school_name: card.school,
          coach_name: card.coach,
        });
      }
      await supabase.from("outreach_history").update({ status: "offer" }).eq("id", id);
    } else if (target === "replied" || target === "interest") {
      await supabase.from("outreach_history").update({ status: "replied" }).eq("id", id);
    } else {
      await supabase.from("outreach_history").update({ status: "sent" }).eq("id", id);
    }
    onChange();
    toast({ title: "Pipeline updated", description: `${card.school} → ${COLUMNS.find((c) => c.key === target)!.label}` });
  };

  const onDragStart = (e: React.DragEvent, id: string) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
  };
  const onDrop = (e: React.DragEvent, stage: Stage) => {
    e.preventDefault();
    setOverCol(null);
    const id = dragId;
    setDragId(null);
    if (!id) return;
    const card = cards.find((c) => c.id === id);
    if (card) moveCard(card, stage);
  };

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-xl font-heading text-foreground">Recruiting Pipeline</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Drag schools as their interest level changes — your personal recruiting CRM.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {COLUMNS.map((col) => {
          const items = grouped[col.key];
          const isOver = overCol === col.key;
          return (
            <div
              key={col.key}
              onDragOver={(e) => {
                e.preventDefault();
                setOverCol(col.key);
              }}
              onDragLeave={() => setOverCol((c) => (c === col.key ? null : c))}
              onDrop={(e) => onDrop(e, col.key)}
              className={`rounded-xl border-t-2 ${col.accent} border-x border-b border-border bg-card p-3 min-h-[180px] transition-colors ${
                isOver ? "bg-secondary/10 border-secondary/50" : ""
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <col.Icon className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-[11px] uppercase tracking-wider font-semibold text-foreground">
                  {col.label}
                </p>
                <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                  {items.length}
                </span>
              </div>

              {items.length === 0 ? (
                <p className="text-xs text-muted-foreground/60 italic px-1 py-6 text-center">
                  {col.key === "contacted" && "No schools yet"}
                  {col.key === "replied" && "Awaiting first reply"}
                  {col.key === "interest" && "No coaches engaged yet"}
                  {col.key === "offer" && "Your first offer goes here"}
                </p>
              ) : (
                <div className="space-y-2">
                  {items.map((c) => (
                    <div
                      key={c.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, c.id)}
                      className="group rounded-lg border border-border/70 bg-background/50 p-2.5 cursor-grab active:cursor-grabbing hover:border-secondary/60 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground truncate">{c.school}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{c.coach}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
