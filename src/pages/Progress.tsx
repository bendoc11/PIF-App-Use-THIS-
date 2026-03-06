import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Flame, Target, Clock, Trophy, Zap, Star, Award } from "lucide-react";
import { ShootingTracker } from "@/components/progress/ShootingTracker";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";

interface DrillProgress {
  drill_id: string;
  completed_at: string | null;
  drills: { category: string } | null;
}

interface Badge {
  icon: React.ElementType;
  title: string;
  description: string;
  earned: boolean;
  color: string;
}

export default function Progress() {
  const { user, profile } = useAuth();
  const [drillProgress, setDrillProgress] = useState<DrillProgress[]>([]);
  const [courseCount, setCourseCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_drill_progress")
      .select("drill_id, completed_at, drills(category)")
      .eq("user_id", user.id)
      .eq("completed", true)
      .then(({ data }) => { if (data) setDrillProgress(data as any); });

    supabase
      .from("user_course_progress")
      .select("id")
      .eq("user_id", user.id)
      .eq("completed", true)
      .then(({ data }) => { if (data) setCourseCount(data.length); });
  }, [user]);

  // Heatmap data (last 16 weeks)
  const heatmapData = useMemo(() => {
    const today = startOfDay(new Date());
    const start = subDays(today, 112); // 16 weeks
    const days = eachDayOfInterval({ start, end: today });
    const countMap: Record<string, number> = {};
    drillProgress.forEach((dp) => {
      if (dp.completed_at) {
        const key = format(new Date(dp.completed_at), "yyyy-MM-dd");
        countMap[key] = (countMap[key] || 0) + 1;
      }
    });
    return days.map((d) => ({
      date: d,
      dateStr: format(d, "yyyy-MM-dd"),
      count: countMap[format(d, "yyyy-MM-dd")] || 0,
    }));
  }, [drillProgress]);

  // Skill breakdown
  const skillBreakdown = useMemo(() => {
    const cats: Record<string, number> = {};
    drillProgress.forEach((dp) => {
      const cat = dp.drills?.category || "Unknown";
      cats[cat] = (cats[cat] || 0) + 1;
    });
    const total = drillProgress.length || 1;
    const colors: Record<string, string> = {
      "Ball Handling": "bg-primary",
      Shooting: "bg-secondary",
      Athletics: "bg-pif-green",
      "Basketball IQ": "bg-pif-gold",
      "Mental Game": "bg-pif-purple",
    };
    return Object.entries(cats)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({
        name,
        count,
        pct: Math.round((count / total) * 100),
        color: colors[name] || "bg-muted-foreground",
      }));
  }, [drillProgress]);

  const totalDrills = profile?.total_drills_completed || drillProgress.length;
  const streakDays = profile?.streak_days || 0;

  // Calculate actual hours from duration_seconds of completed drills
  const [hoursDisplay, setHoursDisplay] = useState("0m");
  useEffect(() => {
    if (!user) return;
    const fetchHours = async () => {
      const { data: progressRows } = await supabase
        .from("user_drill_progress")
        .select("drill_id, drills(duration_seconds)")
        .eq("user_id", user.id)
        .eq("completed", true);
      const totalSeconds = (progressRows ?? []).reduce((sum, r: any) => {
        return sum + (r.drills?.duration_seconds ?? 0);
      }, 0);
      if (totalSeconds >= 3600) {
        setHoursDisplay(`${(totalSeconds / 3600).toFixed(1)}h`);
      } else if (totalSeconds > 0) {
        setHoursDisplay(`${Math.round(totalSeconds / 60)}m`);
      } else {
        setHoursDisplay("0m");
      }
    };
    fetchHours();
  }, [user, drillProgress]);

  // Badges
  const badges: Badge[] = [
    { icon: Flame, title: "First Flame", description: "Complete your first drill", earned: totalDrills >= 1, color: "text-primary" },
    { icon: Target, title: "Sharpshooter", description: "Complete 10 drills", earned: totalDrills >= 10, color: "text-secondary" },
    { icon: Zap, title: "On Fire", description: "3-day streak", earned: streakDays >= 3, color: "text-pif-gold" },
    { icon: Star, title: "Dedicated", description: "Complete 25 drills", earned: totalDrills >= 25, color: "text-pif-green" },
    { icon: Trophy, title: "Workout Master", description: "Complete a full workout", earned: courseCount >= 1, color: "text-pif-purple" },
    { icon: Award, title: "Elite", description: "7-day streak", earned: streakDays >= 7, color: "text-primary" },
  ];

  const getHeatColor = (count: number) => {
    if (count === 0) return "bg-muted";
    if (count === 1) return "bg-primary/20";
    if (count === 2) return "bg-primary/40";
    if (count <= 4) return "bg-primary/60";
    return "bg-primary";
  };

  // Group by weeks for heatmap grid
  const weeks = useMemo(() => {
    const w: typeof heatmapData[number][][] = [];
    for (let i = 0; i < heatmapData.length; i += 7) {
      w.push(heatmapData.slice(i, i + 7));
    }
    return w;
  }, [heatmapData]);

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-heading text-foreground">My Progress</h1>
          <p className="text-muted-foreground mt-1">Track your training journey</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Streak", value: `${streakDays}d`, icon: Flame, color: "text-primary" },
            { label: "Drills Done", value: totalDrills, icon: Target, color: "text-secondary" },
            { label: "Hours Trained", value: hoursDisplay, icon: Clock, color: "text-pif-green" },
            { label: "Workouts Done", value: courseCount, icon: Trophy, color: "text-pif-gold" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="bg-card border-border">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-heading text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Training Heatmap */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <h2 className="text-lg font-heading text-foreground mb-4">Training Activity</h2>
              <div className="overflow-x-auto">
                <div className="flex gap-[3px]">
                  {weeks.map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-[3px]">
                      {week.map((day) => (
                        <div
                          key={day.dateStr}
                          className={`w-3 h-3 rounded-sm ${getHeatColor(day.count)} transition-colors`}
                          title={`${format(day.date, "MMM d")}: ${day.count} drills`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                <span>Less</span>
                {[0, 1, 2, 3, 5].map((c) => (
                  <div key={c} className={`w-3 h-3 rounded-sm ${getHeatColor(c)}`} />
                ))}
                <span>More</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Shooting Tracker */}
        <ShootingTracker />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Skill Breakdown */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-card border-border h-full">
              <CardContent className="p-5 space-y-4">
                <h2 className="text-lg font-heading text-foreground">Skill Breakdown</h2>
                {skillBreakdown.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">Complete drills to see your skill breakdown</p>
                ) : (
                  <div className="space-y-3">
                    {skillBreakdown.map((skill) => (
                      <div key={skill.name} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-foreground">{skill.name}</span>
                          <span className="text-muted-foreground">{skill.count} drills · {skill.pct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${skill.color}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${skill.pct}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Badges */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-card border-border h-full">
              <CardContent className="p-5 space-y-4">
                <h2 className="text-lg font-heading text-foreground">Badges</h2>
                <div className="grid grid-cols-3 gap-3">
                  {badges.map((badge) => (
                    <div
                      key={badge.title}
                      className={`flex flex-col items-center text-center p-3 rounded-xl transition-all ${
                        badge.earned ? "bg-muted" : "bg-muted/30 opacity-40"
                      }`}
                    >
                      <badge.icon className={`h-8 w-8 mb-2 ${badge.earned ? badge.color : "text-muted-foreground"}`} />
                      <p className="text-xs font-heading text-foreground">{badge.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{badge.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
