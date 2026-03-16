import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { format, subDays, startOfDay, eachDayOfInterval, startOfWeek, isSameDay, isAfter } from "date-fns";
import { Flame, Trophy, Calendar } from "lucide-react";

interface TrainingCalendarProps {
  drillCompletedDates: string[];
  streakDays: number;
}

export function TrainingCalendar({ drillCompletedDates, streakDays }: TrainingCalendarProps) {
  const today = startOfDay(new Date());

  const { weeks, dayLabels, trainedDaysSet, totalTrainingDays, longestStreak } = useMemo(() => {
    const trainedSet = new Set<string>();
    drillCompletedDates.forEach((d) => {
      trainedSet.add(format(new Date(d), "yyyy-MM-dd"));
    });

    // 10 weeks back from start of current week
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    const start = subDays(currentWeekStart, 9 * 7); // 9 more weeks back
    const allDays = eachDayOfInterval({ start, end: today });

    // Group into weeks (Mon-Sun)
    const wks: { date: Date; dateStr: string }[][] = [];
    let currentWk: { date: Date; dateStr: string }[] = [];
    allDays.forEach((d) => {
      const dow = d.getDay();
      const mondayIdx = dow === 0 ? 6 : dow - 1;
      if (mondayIdx === 0 && currentWk.length > 0) {
        wks.push(currentWk);
        currentWk = [];
      }
      currentWk.push({ date: d, dateStr: format(d, "yyyy-MM-dd") });
    });
    if (currentWk.length > 0) wks.push(currentWk);

    // Longest streak calculation
    const sortedDays = [...trainedSet].sort();
    let longest = 0;
    let current = 0;
    let prevDate: Date | null = null;
    sortedDays.forEach((ds) => {
      const d = new Date(ds);
      if (prevDate && (d.getTime() - prevDate.getTime()) === 86400000) {
        current++;
      } else {
        current = 1;
      }
      if (current > longest) longest = current;
      prevDate = d;
    });

    return {
      weeks: wks,
      dayLabels: ["M", "T", "W", "T", "F", "S", "S"],
      trainedDaysSet: trainedSet,
      totalTrainingDays: trainedSet.size,
      longestStreak: longest,
    };
  }, [drillCompletedDates, today]);

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-5">
        <h2 className="text-lg font-heading text-foreground mb-4">Training Consistency</h2>

        <div className="overflow-x-auto">
          <div className="inline-flex gap-[3px]">
            {/* Day labels column */}
            <div className="flex flex-col gap-[3px] mr-1">
              {dayLabels.map((label, i) => (
                <div key={i} className="h-6 w-6 flex items-center justify-center text-[10px] text-muted-foreground font-medium">
                  {label}
                </div>
              ))}
            </div>

            {/* Week columns */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {/* Pad if week doesn't start on Monday */}
                {week.length < 7 && wi === 0 &&
                  Array.from({ length: 7 - week.length }).map((_, pi) => (
                    <div key={`pad-${pi}`} className="h-6 w-6" />
                  ))
                }
                {week.map((day) => {
                  const isFuture = isAfter(day.date, today);
                  if (isFuture) return null;
                  const trained = trainedDaysSet.has(day.dateStr);
                  const isToday = isSameDay(day.date, today);
                  return (
                    <div
                      key={day.dateStr}
                      className={`h-6 w-6 rounded-sm transition-colors ${
                        trained ? "bg-primary" : "bg-muted"
                      } ${isToday ? "ring-1 ring-foreground/40" : ""}`}
                      title={`${format(day.date, "MMM d")}: ${trained ? "Trained" : "Rest day"}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
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
