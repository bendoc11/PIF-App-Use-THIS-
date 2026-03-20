import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { ChevronUp, Clock, Repeat, X } from "lucide-react";
import { VideoPlayer } from "./VideoPlayer";

interface DrillActiveMobileProps {
  drillTitle: string;
  vimeoId: string | null;
  muxPlaybackId?: string | null;
  coachingTips: string[] | null;
  completing: boolean;
  onComplete: () => void;
  drillType?: string | null;
  durationSeconds?: number | null;
  reps?: number | null;
  sets?: number | null;
  category?: string;
  level?: string | null;
  coachName?: string | null;
  coachSchool?: string | null;
  drillIndex?: number | null;
  totalDrills?: number;
  description?: string | null;
}

const levelColors: Record<string, string> = {
  Beginner: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Intermediate: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Advanced: "bg-red-500/20 text-red-400 border-red-500/30",
};

export function DrillActiveMobile({
  drillTitle,
  vimeoId,
  muxPlaybackId,
  coachingTips,
  completing,
  onComplete,
  drillType,
  durationSeconds,
  reps,
  sets,
  category,
  level,
  coachName,
  coachSchool,
  drillIndex,
  totalDrills,
  description,
}: DrillActiveMobileProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const togglePlayPause = () => {
    if (!iframeRef.current) return;
    const msg = isPaused ? '{"method":"play"}' : '{"method":"pause"}';
    iframeRef.current.contentWindow?.postMessage(msg, "*");
    setIsPaused(!isPaused);
  };

  const metricsLabel = (() => {
    if (drillType === "timed" && durationSeconds) return `${durationSeconds}s`;
    if (drillType === "reps" && reps) return `${reps} reps`;
    if (drillType === "sets_reps" && (sets || reps)) return `${sets}×${reps}`;
    return null;
  })();

  return (
    <div className="fixed inset-0 z-40 bg-black flex flex-col">
      {/* Fullscreen video background */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden" onClick={togglePlayPause}>
        {vimeoId ? (
          <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
            <iframe
              ref={iframeRef}
              src={`https://player.vimeo.com/video/${vimeoId}?color=E8453C&title=0&byline=0&portrait=0&background=0&autoplay=1&loop=1`}
              className="absolute top-0 left-0 w-full h-full border-none"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-black">
            <span className="text-white/40 text-sm">Video not available</span>
          </div>
        )}
      </div>

      {/* Gradient overlays for readability */}
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/70 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-10" />

      {/* Top overlay — progress dots */}
      {drillIndex != null && totalDrills != null && totalDrills > 1 && (
        <div className="absolute top-0 inset-x-0 z-20 pt-[calc(env(safe-area-inset-top,0px)+12px)] px-4">
          <p className="text-white/70 text-[11px] font-heading tracking-widest text-center mb-2">
            DRILL {drillIndex} OF {totalDrills}
          </p>
          <div className="flex gap-1.5 justify-center">
            {Array.from({ length: totalDrills }).map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all ${
                  i + 1 < drillIndex!
                    ? "bg-white/60 flex-1"
                    : i + 1 === drillIndex
                    ? "bg-primary flex-[2]"
                    : "bg-white/20 flex-1"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Pause indicator */}
      <AnimatePresence>
        {isPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-15 flex items-center justify-center pointer-events-none"
          >
            <div className="w-20 h-20 rounded-full bg-black/50 flex items-center justify-center">
              <div className="w-0 h-0 border-t-[14px] border-t-transparent border-b-[14px] border-b-transparent border-l-[22px] border-l-white ml-1.5" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom overlay — drill info */}
      <div className="absolute bottom-0 inset-x-0 z-20 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] px-4">
        <div className="flex items-end justify-between gap-3">
          {/* Left side: drill info */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <h2 className="text-white text-lg font-heading leading-tight truncate">
              {drillTitle}
            </h2>
            {coachName && (
              <p className="text-white/60 text-xs">
                {coachName}{coachSchool ? ` · ${coachSchool}` : ""}
              </p>
            )}
            <div className="flex items-center gap-1.5 flex-wrap">
              {category && (
                <Badge variant="outline" className="text-[10px] font-heading tracking-wider border-white/20 text-white/70 bg-white/5 px-2 py-0.5">
                  {category}
                </Badge>
              )}
              {level && (
                <Badge variant="outline" className={`text-[10px] font-heading tracking-wider px-2 py-0.5 ${levelColors[level] || "border-white/20 text-white/70"}`}>
                  {level}
                </Badge>
              )}
              {metricsLabel && (
                <Badge variant="outline" className="text-[10px] font-heading tracking-wider border-white/20 text-white/70 bg-white/5 px-2 py-0.5">
                  {metricsLabel}
                </Badge>
              )}
            </div>

            {/* Swipe up hint */}
            <button
              onClick={(e) => { e.stopPropagation(); setDrawerOpen(true); }}
              className="flex items-center gap-1 text-white/40 text-[10px] font-heading tracking-widest mt-2 active:scale-95 transition-transform"
            >
              <ChevronUp className="h-3 w-3" />
              OVERVIEW & TIPS
            </button>
          </div>

          {/* Right side: Mark Complete button */}
          {!completing && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              onClick={(e) => { e.stopPropagation(); onComplete(); }}
              className="shrink-0 bg-primary hover:bg-primary/90 text-white font-heading text-sm tracking-wider px-5 py-3.5 rounded-full shadow-lg shadow-primary/30 active:scale-95 transition-transform"
            >
              Mark Complete →
            </motion.button>
          )}
        </div>
      </div>

      {/* Drawer overlay */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-black/40"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100) setDrawerOpen(false);
              }}
              className="fixed inset-x-0 bottom-0 z-40 bg-card rounded-t-2xl max-h-[75vh] overflow-y-auto"
              style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>

              <div className="px-5 pb-6 space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-heading text-foreground">Overview</h3>
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="p-1.5 rounded-full hover:bg-muted transition-colors"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>

                {/* Description */}
                {description && (
                  <div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                  </div>
                )}

                {/* Metrics */}
                <div className="flex items-center gap-3">
                  {drillType === "timed" && durationSeconds && (
                    <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-muted">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="text-sm font-heading text-foreground">{durationSeconds}s</span>
                    </div>
                  )}
                  {drillType === "reps" && reps && (
                    <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-muted">
                      <Repeat className="h-4 w-4 text-primary" />
                      <span className="text-sm font-heading text-foreground">{reps} reps</span>
                    </div>
                  )}
                  {drillType === "sets_reps" && (sets || reps) && (
                    <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-muted">
                      <Repeat className="h-4 w-4 text-primary" />
                      <span className="text-sm font-heading text-foreground">{sets}×{reps}</span>
                    </div>
                  )}
                </div>

                {/* Coaching Tips */}
                {coachingTips && coachingTips.length > 0 && (
                  <div>
                    <h4 className="text-sm font-heading tracking-wider text-muted-foreground mb-3">
                      COACHING TIPS
                    </h4>
                    <div className="space-y-2.5">
                      {coachingTips.map((tip, i) => (
                        <p key={i} className="text-sm text-foreground leading-relaxed">
                          <span className="text-primary mr-1.5">•</span>{tip}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {!description && (!coachingTips || coachingTips.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No additional info for this drill.
                  </p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
