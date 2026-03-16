import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  isAfter,
  startOfDay,
} from "date-fns";
import { Flame, Trophy, Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface TrainingCalendarProps {
  drillCompletedDates: string[];
  streakDays: number;
}

export function TrainingCalendar({ drillCompletedDates, streakDays }: TrainingCalendarProps) {
  const today = startOfDay(new Date());
  const minMonth = subMonths(startOfMonth(today), 5);
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(today));

  const canGoBack = isAfter(currentMonth, minMonth) || currentMonth.getTime() === minMonth.getTime() ? currentMonth.getTime() > minMonth.getTime() : false;
  const canGoForward = currentMonth.getTime() < startOfMonth(today).getTime();

  const { calendarDays, trainedDaysSet, totalTrainingDays, longestStreak, monthTrainingCount } = useMemo(() => {
    const trainedSet = new Set<string>();
    drillCompletedDates.forEach((d) => {
      trainedSet.add(format(new Date(d), "yyyy-MM-dd"));
    });

    // Build calendar grid for currentMonth
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: calStart, end: calEnd });

    // Count training days this month
    let monthCount = 0;
    eachDayOfInterval({ start: monthStart, end: monthEnd }).forEach((d) => {
      if (trainedSet.has(format(d, "yyyy-MM-dd"))) monthCount++;
    });

    // Longest streak calculation
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
      calendarDays: days,
      trainedDaysSet: trainedSet,
      totalTrainingDays: trainedSet.size,
      longestStreak: longest,
      monthTrainingCount: monthCount,
    };
  }, [drillCompletedDates, currentMonth]);

  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-5">
        {/* Header row */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
              disabled={!canGoBack}
              className="h-8 w-8 flex items-center justify-center rounded-md bg-muted text-foreground disabled:opacity-30 hover:bg-muted/80 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h2 className="text-lg font-heading text-foreground tracking-wider">
              {format(currentMonth, "MMMM yyyy").toUpperCase()}
            </h2>
            <button
              onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
              disabled={!canGoForward}
              className="h-8 w-8 flex items-center justify-center rounded-md bg-muted text-foreground disabled:opacity-30 hover:bg-muted/80 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <span className="text-xs font-heading tracking-wider bg-primary/15 text-primary px-3 py-1.5 rounded-full">
            {monthTrainingCount} training day{monthTrainingCount !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Day of week headers */}
        <div className="grid grid-cols-7 gap-[3px] mb-[3px]">
          {dayLabels.map((label, i) => (
            <div
              key={i}
              className="h-8 flex items-center justify-center text-[11px] font-semibold text-muted-foreground tracking-wider"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-[3px]">
          {calendarDays.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const inMonth = isSameMonth(day, currentMonth);
            const isFuture = isAfter(day, today);
            const isToday = isSameDay(day, today);
            const trained = trainedDaysSet.has(dateStr);

            if (!inMonth) {
              return <div key={dateStr} className="aspect-square min-h-[36px]" />;
            }

            let cellClasses =
              "aspect-square min-h-[36px] rounded-lg flex items-center justify-center text-xs font-body transition-all relative ";

            if (isFuture) {
              cellClasses += "text-muted-foreground/25";
            } else if (trained && isToday) {
              cellClasses +=
                "bg-primary text-primary-foreground font-bold shadow-[inset_0_1px_8px_hsl(var(--primary)/0.4),0_0_12px_hsl(var(--primary)/0.3)]";
            } else if (trained) {
              cellClasses +=
                "bg-primary text-primary-foreground font-bold shadow-[inset_0_1px_6px_hsl(var(--primary)/0.3)]";
            } else if (isToday) {
              cellClasses += "text-foreground ring-1 ring-foreground/50";
            } else {
              cellClasses += "bg-muted/50 text-muted-foreground/50";
            }

            return (
              <div key={dateStr} className={cellClasses}>
                {day.getDate()}
              </div>
            );
          })}
        </div>

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
