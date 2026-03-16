import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { startOfWeek, isWithinInterval, endOfWeek } from "date-fns";
import { Settings } from "lucide-react";
import { Link } from "react-router-dom";

interface WeeklyStatusCardProps {
  drillCompletedDates: string[];
}

export function WeeklyStatusCard({ drillCompletedDates }: WeeklyStatusCardProps) {
  const { profile } = useAuth();
  const firstName = profile?.first_name || "Player";
  const goal = profile?.training_days_per_week;

  const daysTrainedThisWeek = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const uniqueDays = new Set<string>();
    drillCompletedDates.forEach((dateStr) => {
      const d = new Date(dateStr);
      if (isWithinInterval(d, { start: weekStart, end: weekEnd })) {
        uniqueDays.add(d.toISOString().slice(0, 10));
      }
    });
    return uniqueDays.size;
  }, [drillCompletedDates]);

  if (!goal) {
    return (
      <Card className="bg-card border-border border-l-4 border-l-muted-foreground">
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-heading text-foreground">SET YOUR WEEKLY GOAL</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Set your weekly training goal in Settings to track your progress
            </p>
          </div>
          <Link to="/settings" className="p-2 rounded-lg hover:bg-muted transition-colors">
            <Settings className="h-5 w-5 text-muted-foreground" />
          </Link>
        </CardContent>
      </Card>
    );
  }

  const pct = goal > 0 ? daysTrainedThisWeek / goal : 0;
  const onTrack = pct >= 0.8;

  return (
    <Card className={`bg-card border-border border-l-4 ${onTrack ? "border-l-pif-green" : "border-l-pif-orange"}`}>
      <CardContent className="p-5">
        <h2 className="text-2xl font-heading text-foreground">
          {onTrack
            ? `Strong Week, ${firstName}. 🔥`
            : `Time to Get Back In The Gym, ${firstName}.`}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {onTrack
            ? `You've trained ${daysTrainedThisWeek} of your ${goal} days this week. Keep it going.`
            : `You've trained ${daysTrainedThisWeek} of your ${goal} days this week. Your goal is ${goal} days.`}
        </p>
      </CardContent>
    </Card>
  );
}
