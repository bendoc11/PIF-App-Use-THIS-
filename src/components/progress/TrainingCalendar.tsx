import { useMemo, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  subWeeks,
  isSameWeek,
  startOfDay,
} from "date-fns";
import { Flame, Trophy, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface TrainingCalendarProps {
  drillCompletedDates: string[];
  streakDays: number;
}

interface WeekData {
  weekStart: Date;
  weekEnd: Date;
  daysTrained: number;
  goal: number;
  percentage: number;
  isCurrent: boolean;
  goalMet: boolean;
}

function ProgressRing({
  percentage,
  daysTrained,
  size,
  isCurrent,
}: {
  percentage: number;
  daysTrained: number;
  size: number;
  isCurrent: boolean;
}) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = Math.min(percentage, 1) * circumference;

  return (
    <svg width={size} height={size} className="block">
      {/* Background ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="hsl(var(--muted))"
        strokeWidth={strokeWidth}
      />
      {/* Filled ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${circumference}`}
        strokeDashoffset={`${circumference - filled}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-[stroke-dashoffset] duration-[800ms] ease-out"
        style={{
          animation: "ring-fill 800ms ease-out forwards",
        }}
      />
      {/* Center text */}
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-foreground font-heading text-base"
        fontSize={isCurrent ? 20 : 16}
        fontWeight="bold"
      >
        {daysTrained}
      </text>
    </svg>
  );
}

export function TrainingCalendar({ drillCompletedDates, streakDays }: TrainingCalendarProps) {
  const { profile } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const today = startOfDay(new Date());
  const weeklyGoal = profile?.training_days_per_week ?? 3;

  const { weeks, trainedDaysSet, totalTrainingDays, longestStreak, currentWeekTrained } = useMemo(() => {
    const trainedSet = new Set<string>();
    drillCompletedDates.forEach((d) => {
      trainedSet.add(format(new Date(d), "yyyy-MM-dd"));
    });

    // Build 12 weeks of data
    const weeksData: WeekData[] = [];
    for (let i = 11; i >= 0; i--) {
      const ws = startOfWeek(subWeeks(today, i), { weekStartsOn: 1 });
      const we = endOfWeek(ws, { weekStartsOn: 1 });
      const days = eachDayOfInterval({ start: ws, end: we > today ? today : we });
      let count = 0;
      days.forEach((d) => {
        if (trainedSet.has(format(d, "yyyy-MM-dd"))) count++;
      });
      const pct = weeklyGoal > 0 ? count / weeklyGoal : 0;
      weeksData.push({
        weekStart: ws,
        weekEnd: we,
        daysTrained: count,
        goal: weeklyGoal,
        percentage: pct,
        isCurrent: isSameWeek(ws, today, { weekStartsOn: 1 }),
        goalMet: pct >= 0.8,
      });
    }

    // Current week trained count
    const currentWeek = weeksData.find((w) => w.isCurrent);

    // Longest streak
    const sortedDays = [...trainedSet].sort();
    let longest = 0;
    let current = 0;
    let prevDate: Date | null = null;
    sortedDays.forEach((ds) => {
      const d = new Date(ds);
      if (prevDate && d.getTime() - prevDate.getTime() === 86400000) {
        current++;
      } else {
        current = 1;
      }
      if (current > longest) longest = current;
      prevDate = d;
    });

    return {
      weeks: weeksData,
      trainedDaysSet: trainedSet,
      totalTrainingDays: trainedSet.size,
      longestStreak: longest,
      currentWeekTrained: currentWeek?.daysTrained ?? 0,
    };
  }, [drillCompletedDates, today.getTime(), weeklyGoal]);

  // Scroll to right on load
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      requestAnimationFrame(() => {
        el.scrollLeft = el.scrollWidth;
      });
    }
  }, [weeks]);

  const hasData = drillCompletedDates.length > 0;

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-heading text-foreground tracking-wider">TRAINING CONSISTENCY</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your goal: {weeklyGoal} days/week
            </p>
          </div>
          <span className="text-xs font-heading tracking-wider bg-primary/15 text-primary px-3 py-1.5 rounded-full">
            {currentWeekTrained} of {weeklyGoal} days this week
          </span>
        </div>

        {/* Rings row */}
        {hasData ? (
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto pb-2 scrollbar-none"
            style={{ scrollbarWidth: "none" }}
          >
            {weeks.map((week) => {
              const ringSize = week.isCurrent ? 64 : 56;
              return (
                <div
                  key={format(week.weekStart, "yyyy-MM-dd")}
                  className={`flex flex-col items-center flex-shrink-0 ${
                    week.isCurrent
                      ? "rounded-xl p-2 shadow-[0_0_12px_hsl(var(--foreground)/0.1)] border border-foreground/10"
                      : "p-2"
                  }`}
                >
                  <ProgressRing
                    percentage={week.percentage}
                    daysTrained={week.daysTrained}
                    size={ringSize}
                    isCurrent={week.isCurrent}
                  />
                  <span className="text-[10px] text-muted-foreground mt-1.5">
                    {format(week.weekStart, "MMM d")}
                  </span>
                  {week.goalMet && (
                    <span className="text-[9px] font-heading tracking-wider text-primary mt-0.5">
                      GOAL MET
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Complete your first drill to start tracking your consistency
            </p>
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-6 mt-5 pt-4 border-t border-border">
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
