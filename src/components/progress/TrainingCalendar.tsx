import { useMemo, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { format, startOfWeek, eachDayOfInterval, subWeeks, isSameWeek } from "date-fns";
import { Flame, Trophy, Calendar } from "lucide-react";
import { motion } from "framer-motion";

interface TrainingCalendarProps {
  drillCompletedDates: string[];
  streakDays: number;
}

interface WeekData {
  weekStart: Date;
  daysTrained: number;
  goalMet: boolean;
  isCurrent: boolean;
  pct: number; // 0–1
}

export function TrainingCalendar({ drillCompletedDates, streakDays }: TrainingCalendarProps) {
  const { profile } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  const goal = profile?.training_days_per_week ?? 3;

  const { weeks, longestStreak, totalTrainingDays } = useMemo(() => {
    // Build set of trained dates
    const trainedSet = new Set<string>();
    drillCompletedDates.forEach((d) => {
      trainedSet.add(format(new Date(d), "yyyy-MM-dd"));
    });

    // Build 12 weeks of data (oldest → newest)
    const weeksList: WeekData[] = [];
    for (let i = 11; i >= 0; i--) {
      const ws = startOfWeek(subWeeks(today, i), { weekStartsOn: 1 });
      const we = new Date(ws);
      we.setDate(we.getDate() + 6);
      const days = eachDayOfInterval({ start: ws, end: we });
      let count = 0;
      days.forEach((day) => {
        if (day <= today && trainedSet.has(format(day, "yyyy-MM-dd"))) count++;
      });
      const pct = goal > 0 ? Math.min(count / goal, 1) : 0;
      weeksList.push({
        weekStart: ws,
        daysTrained: count,
        goalMet: pct >= 0.8,
        isCurrent: isSameWeek(ws, today, { weekStartsOn: 1 }),
        pct,
      });
    }

    // Longest streak from all trained dates
    const sortedDays = [...trainedSet].sort();
    let longest = 0;
    let current = 0;
    let prevDate: Date | null = null;
    sortedDays.forEach((ds) => {
      const d = new Date(ds + "T00:00:00");
      if (prevDate && d.getTime() - prevDate.getTime() === 86400000) {
        current++;
      } else {
        current = 1;
      }
      if (current > longest) longest = current;
      prevDate = d;
    });

    return { weeks: weeksList, longestStreak: longest, totalTrainingDays: trainedSet.size };
  }, [drillCompletedDates, goal]);

  // Auto-scroll to rightmost (current week)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [weeks]);

  if (drillCompletedDates.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-5">
          <h2 className="text-lg font-heading text-foreground mb-2">Training Consistency</h2>
          <p className="text-sm text-muted-foreground py-8 text-center">
            Complete your first drill to start tracking your consistency
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-5">
        <h2 className="text-lg font-heading text-foreground mb-4">Training Consistency</h2>

        {/* Scrollable rings row */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide"
          style={{ scrollBehavior: "smooth" }}
        >
          {weeks.map((w, idx) => (
            <WeekRing key={idx} week={w} goal={goal} index={idx} />
          ))}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-heading text-foreground">{streakDays}d</p>
              <p className="text-[10px] text-muted-foreground">Current Streak</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-pif-gold" />
            <div>
              <p className="text-sm font-heading text-foreground">{longestStreak}d</p>
              <p className="text-[10px] text-muted-foreground">Longest Streak</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-secondary" />
            <div>
              <p className="text-sm font-heading text-foreground">{totalTrainingDays}</p>
              <p className="text-[10px] text-muted-foreground">Total Days</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WeekRing({ week, goal, index }: { week: WeekData; goal: number; index: number }) {
  const size = week.isCurrent ? 64 : 56;
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = circumference * week.pct;

  return (
    <div className="flex flex-col items-center shrink-0" style={{ minWidth: size + 8 }}>
      <div
        className={`relative ${week.isCurrent ? "ring-2 ring-foreground/20 rounded-full" : ""}`}
        style={{ width: size, height: size }}
      >
        <svg width={size} height={size} className="-rotate-90">
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={stroke}
          />
          {/* Animated fill */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - filled }}
            transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.05 }}
          />
        </svg>
        {/* Center number */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-heading text-foreground ${week.isCurrent ? "text-lg" : "text-base"}`}>
            {week.daysTrained}
          </span>
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground mt-1.5">
        {format(week.weekStart, "MMM d")}
      </span>
      {week.goalMet && (
        <span className="text-[9px] font-heading text-primary tracking-wider mt-0.5">
          GOAL MET
        </span>
      )}
    </div>
  );
}
