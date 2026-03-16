import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Circle } from "lucide-react";
import { motion } from "framer-motion";
import {
  type SessionType,
  SESSION_TYPE_LABELS,
  SESSION_TYPE_ICONS,
  SESSION_TYPE_COLORS,
  DAY_LABELS,
  getSessionsForDay,
} from "@/lib/schedule-utils";
import { ManualLogModal } from "./ManualLogModal";
import type { ScheduleEntry, TrainingLog } from "@/hooks/useTrainingSchedule";

interface Props {
  todaySessions: ScheduleEntry[];
  todaysLogs: TrainingLog[];
  schedule: ScheduleEntry[];
  todayDow: number;
  onLogged: () => void;
  needsSetup: boolean;
  onSetup: () => void;
  allComplete: boolean;
}

export function TodaysTraining({
  todaySessions,
  todaysLogs,
  schedule,
  todayDow,
  onLogged,
  needsSetup,
  onSetup,
  allComplete,
}: Props) {
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [logSessionType, setLogSessionType] = useState<SessionType>("skill_workout");

  if (needsSetup) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card className="bg-card border-border border-dashed">
          <CardContent className="p-6 text-center space-y-3">
            <p className="text-lg font-heading text-foreground">Set Up Your Training Schedule</p>
            <p className="text-sm text-muted-foreground">Get a personalized weekly plan based on your goals</p>
            <Button onClick={onSetup} className="btn-cta bg-primary hover:bg-primary/90">
              Build My Schedule →
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const nonRest = todaySessions.filter((s) => s.session_type !== "rest");
  const isRestDay = nonRest.length === 0;

  const isSessionDone = (sessionType: string) =>
    todaysLogs.some((l) => l.status === "completed" && l.session_type === sessionType);

  const openLog = (type: SessionType) => {
    setLogSessionType(type);
    setLogModalOpen(true);
  };

  // Tomorrow preview
  const tomorrowDow = (todayDow + 1) % 7;
  const tomorrowSessions = schedule
    .filter((s) => s.day_of_week === tomorrowDow)
    .sort((a, b) => a.order_index - b.order_index);

  const renderSessionAction = (session: ScheduleEntry) => {
    const type = session.session_type as SessionType;
    const done = isSessionDone(type);

    if (done) return null;

    switch (type) {
      case "skill_workout":
        return (
          <div className="flex gap-2">
            <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-xs">
              <Link to="/courses">Start PIF Workout</Link>
            </Button>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => openLog("skill_workout")}>
              Log Manual
            </Button>
          </div>
        );
      case "shooting":
        return (
          <div className="flex gap-2">
            <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-xs">
              <Link to="/courses">Start Drills</Link>
            </Button>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => openLog("shooting")}>
              Log Manual
            </Button>
          </div>
        );
      case "lifting":
      case "mobility":
        return (
          <Button size="sm" className="bg-primary hover:bg-primary/90 text-xs" onClick={() => openLog(type)}>
            Log Session
          </Button>
        );
      case "pickup":
      case "game":
        return (
          <Button size="sm" className="bg-primary hover:bg-primary/90 text-xs" onClick={() => openLog(type)}>
            Log Game
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card className={`bg-card border-border overflow-hidden ${allComplete && !isRestDay ? "border-pif-green/30" : ""}`}>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-heading tracking-widest text-muted-foreground">TODAY'S TRAINING</p>
              <span className="text-xs font-heading tracking-wider text-muted-foreground">{DAY_LABELS[todayDow]}</span>
            </div>

            {isRestDay ? (
              <div className="flex items-center gap-3 py-2">
                <span className="text-3xl">😴</span>
                <div>
                  <p className="text-lg font-heading text-foreground">Rest Day</p>
                  <p className="text-sm text-muted-foreground">Recovery is part of the process</p>
                </div>
              </div>
            ) : allComplete ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-pif-green">
                  <Check className="h-5 w-5" />
                  <span className="font-heading text-base">Today's Training Complete 🔥</span>
                </div>
                {tomorrowSessions.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Tomorrow:{" "}
                    {tomorrowSessions.map((s) => `${SESSION_TYPE_ICONS[s.session_type as SessionType]} ${SESSION_TYPE_LABELS[s.session_type as SessionType]}`).join(" · ")}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {todaySessions.map((session) => {
                  if (session.session_type === "rest") return null;
                  const type = session.session_type as SessionType;
                  const done = isSessionDone(type);

                  return (
                    <div
                      key={`${session.day_of_week}-${session.order_index}`}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        {done ? (
                          <div className="w-5 h-5 rounded-full bg-pif-green flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                        <span className="text-lg">{SESSION_TYPE_ICONS[type]}</span>
                        <span className={`text-sm font-heading ${done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                          {SESSION_TYPE_LABELS[type]}
                        </span>
                      </div>
                      {renderSessionAction(session)}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <ManualLogModal
        open={logModalOpen}
        onOpenChange={setLogModalOpen}
        sessionType={logSessionType}
        onSaved={onLogged}
      />
    </>
  );
}
