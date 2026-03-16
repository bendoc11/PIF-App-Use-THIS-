import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { type SessionType, SESSION_TYPE_LABELS, SESSION_TYPE_ICONS, DAY_LABELS } from "@/lib/schedule-utils";
import { ManualLogModal } from "./ManualLogModal";
import type { ScheduleEntry } from "@/hooks/useTrainingSchedule";

interface Props {
  todaySession: SessionType;
  isComplete: boolean;
  schedule: ScheduleEntry[];
  todayDow: number;
  onLogged: () => void;
  needsSetup: boolean;
  onSetup: () => void;
}

export function TodaysTraining({ todaySession, isComplete, schedule, todayDow, onLogged, needsSetup, onSetup }: Props) {
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

  // Find tomorrow's session
  const tomorrowDow = (todayDow + 1) % 7;
  const tomorrowEntry = schedule.find((s) => s.day_of_week === tomorrowDow);
  const tomorrowSession = (tomorrowEntry?.session_type || "rest") as SessionType;

  const openLog = (type: SessionType) => {
    setLogSessionType(type);
    setLogModalOpen(true);
  };

  const renderCTA = () => {
    if (isComplete) {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-pif-green">
            <Check className="h-5 w-5" />
            <span className="font-heading text-base">Session Complete</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Tomorrow: {SESSION_TYPE_ICONS[tomorrowSession]} {SESSION_TYPE_LABELS[tomorrowSession]}
          </p>
        </div>
      );
    }

    if (todaySession === "rest") {
      return (
        <div>
          <p className="text-muted-foreground text-sm">Recovery is part of the process</p>
        </div>
      );
    }

    switch (todaySession) {
      case "skill_workout":
        return (
          <div className="flex flex-wrap gap-3">
            <Button asChild className="btn-cta bg-primary hover:bg-primary/90">
              <Link to="/courses">Start a PIF Workout</Link>
            </Button>
            <Button variant="outline" onClick={() => openLog("skill_workout")}>Log Manual Workout</Button>
          </div>
        );
      case "shooting":
        return (
          <div className="flex flex-wrap gap-3">
            <Button asChild className="btn-cta bg-primary hover:bg-primary/90">
              <Link to="/courses">Start Shooting Drills</Link>
            </Button>
            <Button variant="outline" onClick={() => openLog("shooting")}>Log Shot Session</Button>
          </div>
        );
      case "lifting":
        return <Button className="btn-cta bg-primary hover:bg-primary/90" onClick={() => openLog("lifting")}>Log Lifting Session</Button>;
      case "mobility":
        return <Button className="btn-cta bg-primary hover:bg-primary/90" onClick={() => openLog("mobility")}>Log Mobility Session</Button>;
      case "pickup":
        return <Button className="btn-cta bg-primary hover:bg-primary/90" onClick={() => openLog("pickup")}>Log Pickup Game</Button>;
      case "game":
        return <Button className="btn-cta bg-primary hover:bg-primary/90" onClick={() => openLog("game")}>Log Game</Button>;
      default:
        return null;
    }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card className={`bg-card border-border overflow-hidden ${isComplete ? "border-pif-green/30" : ""}`}>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{SESSION_TYPE_ICONS[todaySession]}</span>
                <div>
                  <p className="text-[10px] font-heading tracking-widest text-muted-foreground">TODAY'S TRAINING</p>
                  <p className="text-xl font-heading text-foreground">{SESSION_TYPE_LABELS[todaySession]}</p>
                </div>
              </div>
              <span className="text-xs font-heading tracking-wider text-muted-foreground">{DAY_LABELS[todayDow]}</span>
            </div>
            {renderCTA()}
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
