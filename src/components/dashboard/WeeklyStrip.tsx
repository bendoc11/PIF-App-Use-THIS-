import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { type SessionType, SESSION_TYPE_ICONS, DAY_LABELS_SHORT } from "@/lib/schedule-utils";
import { ManualLogModal } from "./ManualLogModal";
import type { ScheduleEntry, TrainingLog } from "@/hooks/useTrainingSchedule";

interface Props {
  schedule: ScheduleEntry[];
  weekCompletionMap: Record<number, boolean>;
  todayDow: number;
  weekLogs: TrainingLog[];
  onLogged: () => void;
}

export function WeeklyStrip({ schedule, weekCompletionMap, todayDow, weekLogs, onLogged }: Props) {
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [logSessionType, setLogSessionType] = useState<SessionType>("skill_workout");
  const [logDate, setLogDate] = useState<string | undefined>();

  const handleDayClick = (dow: number) => {
    const entry = schedule.find((s) => s.day_of_week === dow);
    const sessionType = (entry?.session_type || "rest") as SessionType;

    if (sessionType === "rest") return;

    if (weekCompletionMap[dow]) {
      // Already completed, could show details - for now just return
      return;
    }

    if (dow > todayDow) {
      // Future day - don't allow logging
      return;
    }

    // Open log modal for this day
    const today = new Date();
    const mondayDate = new Date(today);
    mondayDate.setDate(today.getDate() - todayDow);
    const targetDate = new Date(mondayDate);
    targetDate.setDate(mondayDate.getDate() + dow);

    setLogSessionType(sessionType);
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
                const entry = schedule.find((s) => s.day_of_week === dow);
                const sessionType = (entry?.session_type || "rest") as SessionType;
                const isToday = dow === todayDow;
                const isComplete = weekCompletionMap[dow] === true;
                const isPast = dow < todayDow;
                const isRest = sessionType === "rest";
                const isMissed = isPast && !isComplete && !isRest;

                return (
                  <button
                    key={dow}
                    onClick={() => handleDayClick(dow)}
                    className={`flex flex-col items-center gap-1.5 flex-1 py-2 rounded-lg transition-colors ${
                      isToday ? "bg-muted/50" : ""
                    } ${!isRest && !isComplete && dow <= todayDow ? "cursor-pointer hover:bg-muted/30" : "cursor-default"}`}
                  >
                    <span className={`text-[10px] font-heading tracking-wider ${isToday ? "text-foreground" : "text-muted-foreground"}`}>
                      {DAY_LABELS_SHORT[dow]}
                    </span>
                    <span className="text-sm">{SESSION_TYPE_ICONS[sessionType]}</span>
                    <div
                      className={`w-3 h-3 rounded-full border-2 ${
                        isComplete
                          ? "bg-primary border-primary"
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
