import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { WeeklyStatusCard } from "@/components/progress/WeeklyStatusCard";
import { TrainingCalendar } from "@/components/progress/TrainingCalendar";
import { ShootingTracker } from "@/components/progress/ShootingTracker";
import { GameLog } from "@/components/progress/GameLog";
import { DrillStatsRow } from "@/components/progress/DrillStatsRow";
import { Separator } from "@/components/ui/separator";

export default function Progress() {
  const { user, profile } = useAuth();
  const [completedDates, setCompletedDates] = useState<string[]>([]);
  const [drillCategories, setDrillCategories] = useState<string[]>([]);
  const [hoursDisplay, setHoursDisplay] = useState("0m");
  const [totalDrills, setTotalDrills] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Fetch completed drill dates and categories
    supabase
      .from("user_drill_progress")
      .select("completed_at, drills(category, duration_seconds)")
      .eq("user_id", user.id)
      .eq("completed", true)
      .then(({ data }) => {
        if (!data) return;
        const dates: string[] = [];
        const cats: string[] = [];
        let totalSeconds = 0;
        (data as any[]).forEach((row) => {
          if (row.completed_at) dates.push(row.completed_at);
          if (row.drills?.category) cats.push(row.drills.category);
          totalSeconds += row.drills?.duration_seconds ?? 0;
        });
        setCompletedDates(dates);
        setDrillCategories(cats);
        setTotalDrills(data.length);

        if (totalSeconds >= 3600) {
          setHoursDisplay(`${(totalSeconds / 3600).toFixed(1)}h`);
        } else if (totalSeconds > 0) {
          setHoursDisplay(`${Math.round(totalSeconds / 60)}m`);
        }
      });
  }, [user]);

  const topSkill = useMemo(() => {
    if (drillCategories.length === 0) return "";
    const counts: Record<string, number> = {};
    drillCategories.forEach(c => { counts[c] = (counts[c] || 0) + 1; });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return `${top[0]} — ${top[1]} drills`;
  }, [drillCategories]);

  const streakDays = profile?.streak_days || 0;

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-3xl font-heading text-foreground">MY PROGRESS</h1>
          <p className="text-muted-foreground text-sm mt-1">Your basketball development at a glance</p>
        </div>

        {/* Section 1: Weekly Status */}
        <WeeklyStatusCard drillCompletedDates={completedDates} />

        <Separator className="bg-border" />

        {/* Section 2: Training Calendar */}
        <TrainingCalendar drillCompletedDates={completedDates} streakDays={streakDays} />

        <Separator className="bg-border" />

        {/* Section 3: Shooting Tracker */}
        <ShootingTracker />

        <Separator className="bg-border" />

        {/* Section 4: Game Log */}
        <GameLog />

        <Separator className="bg-border" />

        {/* Section 5: Drill Stats */}
        <DrillStatsRow
          totalDrills={totalDrills || profile?.total_drills_completed || 0}
          hoursDisplay={hoursDisplay}
          topSkill={topSkill}
          streakDays={streakDays}
        />
      </div>
    </AppLayout>
  );
}
