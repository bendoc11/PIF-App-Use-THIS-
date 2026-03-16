import { Card, CardContent } from "@/components/ui/card";
import { Target, Clock, Flame, Award } from "lucide-react";

interface DrillStatsRowProps {
  totalDrills: number;
  hoursDisplay: string;
  topSkill: string;
  streakDays: number;
}

export function DrillStatsRow({ totalDrills, hoursDisplay, topSkill, streakDays }: DrillStatsRowProps) {
  const stats = [
    { label: "Drills Completed", value: totalDrills, icon: Target, color: "text-primary" },
    { label: "Hours Trained", value: hoursDisplay, icon: Clock, color: "text-pif-green" },
    { label: "Top Skill", value: topSkill || "—", icon: Award, color: "text-pif-gold", small: true },
    { label: "Current Streak", value: `${streakDays}d`, icon: Flame, color: "text-pif-orange" },
  ];

  return (
    <div>
      <h2 className="text-lg font-heading text-foreground mb-3">Drill Stats</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className={`font-heading text-foreground truncate ${stat.small ? "text-sm" : "text-xl"}`}>{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
