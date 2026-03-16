import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import {
  type SessionType,
  SESSION_TYPE_ICONS,
  DAY_LABELS_SHORT,
  getSessionsForDay,
} from "@/lib/schedule-utils";
import { ManualLogModal } from "./ManualLogModal";
import type { ScheduleEntry, TrainingLog } from "@/hooks/useTrainingSchedule";

interface Props {
  schedule: ScheduleEntry[];
  weekCompletionMap: Record<number, "complete" | "partial" | "none">;
  todayDow: number;
  weekLogs: TrainingLog[];
  onLogged: () => void;
}

export function WeeklyStrip({ schedule, weekCompletionMap, todayDow, weekLogs, onLogged }: Props) {
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [logSessionType, setLogSessionType] = useState<SessionType>("skill_workout");
  const [logDate, setLogDate] = useState<string | undefined>();

  const handleDayClick = (dow: number) => {
    const daySessions = schedule
      .filter((s) => s.day_of_week === dow)
      .sort((a, b) => a.order_index - b.order_index);
    const nonRest = daySessions.filter((s) => s.session_type !== "rest");

    if (nonRest.length === 0) return;
    if (dow > todayDow) return;

    const completion = weekCompletionMap[dow];
    if (completion === "complete") return;

    const today = new Date();
    const mondayDate = new Date(today);
    mondayDate.setDate(today.getDate() - todayDow);
    const targetDate = new Date(mondayDate);
    targetDate.setDate(mondayDate.getDate() + dow);

    // Find first incomplete session type
    const firstIncomplete = nonRest[0];
    setLogSessionType(firstIncomplete.session_type as SessionType);
    setLogDate(targetDate.toISOString().split("T")[0]);
    setLogModalOpen(true);
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-[10px] font-heading tracking-widest text-muted-foreground mb-3">THIS WEEK</p>
            <div className="flex justify-between gap-1">
              {Array.from({ length: 7 }, (_, dow) => {
                const daySessions = schedule
                  .filter((s) => s.day_of_week === dow)
                  .sort((a, b) => a.order_index - b.order_index);
                const nonRest = daySessions.filter((s) => s.session_type !== "rest");
                const isToday = dow === todayDow;
                const isRest = nonRest.length === 0;
                const completion = weekCompletionMap[dow] || "none";
                const isPast = dow < todayDow;
                const isMissed = isPast && completion === "none" && !isRest;

                return (
                  <button
                    key={dow}
                    onClick={() => handleDayClick(dow)}
                    className={`flex flex-col items-center gap-1 flex-1 py-2 rounded-lg transition-colors ${
                      isToday ? "bg-muted/50" : ""
                    } ${!isRest && completion !== "complete" && dow <= todayDow ? "cursor-pointer hover:bg-muted/30" : "cursor-default"}`}
                  >
                    <span className={`text-[10px] font-heading tracking-wider ${isToday ? "text-foreground" : "text-muted-foreground"}`}>
                      {DAY_LABELS_SHORT[dow]}
                    </span>

                    {/* Session icons */}
                    <div className="flex flex-col items-center gap-0.5 min-h-[20px]">
                      {isRest ? (
                        <span className="text-xs">🌙</span>
                      ) : (
                        <div className="flex gap-0.5">
                          {nonRest.slice(0, 3).map((s, i) => (
                            <span key={i} className="text-[10px] leading-none">
                              {SESSION_TYPE_ICONS[s.session_type as SessionType]}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Status indicator */}
                    <div
                      className={`w-3 h-3 rounded-full border-2 ${
                        completion === "complete" && !isRest
                          ? "bg-primary border-primary"
                          : completion === "partial"
                          ? "bg-primary/40 border-primary"
                          : isRest
                          ? "bg-muted border-muted"
                          : isMissed
                          ? "border-destructive bg-transparent"
                          : isToday
                          ? "border-foreground bg-transparent"
                          : "border-muted-foreground/30 bg-transparent"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <ManualLogModal
        open={logModalOpen}
        onOpenChange={setLogModalOpen}
        sessionType={logSessionType}
        logDate={logDate}
        onSaved={onLogged}
      />
    </>
  );
}
