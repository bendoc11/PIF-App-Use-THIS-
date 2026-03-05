import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Clock, Loader2, Repeat } from "lucide-react";

interface DrillActiveProps {
  drillTitle: string;
  vimeoId: string | null;
  coachingTips: string[] | null;
  completing: boolean;
  onComplete: () => void;
  drillType?: string | null;
  durationSeconds?: number | null;
  reps?: number | null;
  sets?: number | null;
}

export function DrillActive({ drillTitle, vimeoId, coachingTips, completing, onComplete, drillType, durationSeconds, reps, sets }: DrillActiveProps) {
  const [tipsOpen, setTipsOpen] = useState(false);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Drill title */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-heading text-foreground">{drillTitle}</h1>
      </div>

      {/* Video — full width hero */}
      <div className="aspect-video bg-background w-full">
        {vimeoId ? (
          <iframe
            src={`https://player.vimeo.com/video/${vimeoId}?color=E8453C&title=0&byline=0&portrait=0`}
            className="w-full h-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <span className="text-muted-foreground text-sm">Video not available</span>
          </div>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom actions */}
      <div className="p-4 pb-[calc(2rem+env(safe-area-inset-bottom))] max-w-lg mx-auto w-full space-y-4">
        {/* Drill metrics badge */}
        {drillType === "timed" && durationSeconds && (
          <div className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-muted">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-sm font-heading font-semibold tracking-wider text-foreground">{durationSeconds} sec</span>
          </div>
        )}
        {drillType === "reps" && reps && (
          <div className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-muted">
            <Repeat className="h-4 w-4 text-primary" />
            <span className="text-sm font-heading font-semibold tracking-wider text-foreground">{reps} reps</span>
          </div>
        )}
        {drillType === "sets_reps" && (sets || reps) && (
          <div className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-muted">
            <Repeat className="h-4 w-4 text-primary" />
            <span className="text-sm font-heading font-semibold tracking-wider text-foreground">{sets} sets × {reps} reps</span>
          </div>
        )}
        {/* Coaching Notes — collapsible */}
        {coachingTips && coachingTips.length > 0 && (
          <Collapsible open={tipsOpen} onOpenChange={setTipsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 rounded-lg bg-muted text-sm text-muted-foreground hover:text-foreground transition-colors">
              <span className="font-heading tracking-wider text-xs">Coaching Notes</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${tipsOpen ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pt-3 space-y-2">
              {coachingTips.map((tip, i) => (
                <p key={i} className="text-sm text-muted-foreground leading-relaxed">• {tip}</p>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Complete button */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Button
            onClick={onComplete}
            disabled={completing}
            className="w-full h-16 text-lg btn-cta bg-primary hover:bg-primary/90 glow-red-hover"
          >
            {completing ? <Loader2 className="h-5 w-5 animate-spin" /> : "Mark Complete & Continue"}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
