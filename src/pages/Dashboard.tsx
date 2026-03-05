import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { Flame, Play, TrendingUp, Trophy, ArrowRight, Lock } from "lucide-react";

interface CourseWithCoach {
  id: string;
  title: string;
  category: string;
  drill_count: number;
  level: string;
  is_free: boolean;
  thumbnail_url: string | null;
  coaches: { name: string; school: string; initials: string; avatar_color: string; avatar_url: string | null } | null;
}

interface DrillWithCoach {
  id: string;
  title: string;
  category: string;
  level: string;
  is_free: boolean;
  is_new: boolean;
  duration_seconds: number;
  thumbnail_url: string | null;
  coaches: { name: string; initials: string; avatar_color: string; avatar_url: string | null } | null;
}

const categoryColors: Record<string, string> = {
  "Ball Handling": "bg-primary",
  "Shooting": "bg-secondary",
  "Athletics": "bg-pif-green",
  "Basketball IQ": "bg-pif-gold",
  "Mental Game": "bg-pif-purple",
  "Scoring": "bg-pif-orange",
  "Post Game": "bg-pif-orange",
};

function AnimatedCounter({ value, label, icon: Icon, delay = 0 }: { value: number | string; label: string; icon: any; delay?: number }) {
  const [displayValue, setDisplayValue] = useState<string | number>(typeof value === "string" ? value : 0);
  useEffect(() => {
    if (typeof value === "string") {
      const timer = setTimeout(() => setDisplayValue(value), delay);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => {
      let start = 0;
      const step = Math.ceil(value / 20);
      const interval = setInterval(() => {
        start += step;
        if (start >= value) {
          setDisplayValue(value);
          clearInterval(interval);
        } else {
          setDisplayValue(start);
        }
      }, 40);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: delay / 1000 }}>
      <Card className="bg-card border-border hover:border-primary/20 transition-colors">
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-heading text-foreground">{displayValue}</p>
              <p className="text-xs text-muted-foreground font-heading tracking-wider">{label}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Dashboard() {
  const { profile, user, subscription, subscriptionLoading } = useAuth();
  const [courses, setCourses] = useState<CourseWithCoach[]>([]);
  const [drills, setDrills] = useState<DrillWithCoach[]>([]);
  const [statDrillsDone, setStatDrillsDone] = useState(0);
  const [statHours, setStatHours] = useState("0m");
  const [statRank, setStatRank] = useState("#—");

  useEffect(() => {
    const fetchData = async () => {
      const [coursesRes, drillsRes] = await Promise.all([
        supabase.from("courses").select("id, title, category, drill_count, level, is_free, thumbnail_url, coaches(name, school, initials, avatar_color, avatar_url)").eq("status", "live").eq("is_featured", true).order("sort_order").limit(6),
        supabase.from("drills").select("id, title, category, level, is_free, is_new, duration_seconds, thumbnail_url, coaches(name, initials, avatar_color, avatar_url)").eq("is_featured", true).order("created_at", { ascending: false }).limit(6),
      ]);
      if (coursesRes.data) setCourses(coursesRes.data as any);
      if (drillsRes.data) setDrills(drillsRes.data as any);
    };
    fetchData();
  }, []);

  // Fetch live stats for the logged-in user
  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      // 1. Drills Done — count completed drill progress rows
      const { count: drillCount } = await supabase
        .from("user_drill_progress")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("completed", true);
      const done = drillCount ?? 0;
      setStatDrillsDone(done);

      // 2. Hours Trained — sum duration_seconds from joined drills
      const { data: progressRows } = await supabase
        .from("user_drill_progress")
        .select("drill_id, drills(duration_seconds)")
        .eq("user_id", user.id)
        .eq("completed", true);
      const totalSeconds = (progressRows ?? []).reduce((sum, r: any) => {
        return sum + (r.drills?.duration_seconds ?? 0);
      }, 0);
      if (totalSeconds >= 3600) {
        setStatHours(`${(totalSeconds / 3600).toFixed(1)}h`);
      } else if (totalSeconds > 0) {
        setStatHours(`${Math.round(totalSeconds / 60)}m`);
      } else {
        setStatHours("0m");
      }

      // 3. Weekly Rank — count users with more drills this week
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0=Sun
      const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - mondayOffset);
      weekStart.setHours(0, 0, 0, 0);
      const weekStartISO = weekStart.toISOString();

      // Get current user's drill count this week
      const { count: myWeekCount } = await supabase
        .from("user_drill_progress")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("completed", true)
        .gte("completed_at", weekStartISO);
      const myCount = myWeekCount ?? 0;

      // Get all users' weekly counts to determine rank
      const { data: allWeekly } = await supabase
        .from("user_drill_progress")
        .select("user_id")
        .eq("completed", true)
        .gte("completed_at", weekStartISO);

      const userCounts: Record<string, number> = {};
      (allWeekly ?? []).forEach((r) => {
        userCounts[r.user_id] = (userCounts[r.user_id] || 0) + 1;
      });
      const usersAbove = Object.values(userCounts).filter((c) => c > myCount).length;
      setStatRank(`#${usersAbove + 1}`);
    };

    fetchStats();
  }, [user]);

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Personalized Greeting */}
        {profile?.first_name && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl md:text-3xl font-heading text-foreground">
              {(profile as any).primary_goal?.toLowerCase().includes("next level")
                ? `Let's get you to the next level, ${profile.first_name}`
                : (profile as any).primary_goal?.toLowerCase().includes("starting spot")
                ? `Let's earn that starting spot, ${profile.first_name}`
                : (profile as any).primary_goal?.toLowerCase().includes("make the team")
                ? `Let's make the team, ${profile.first_name}`
                : (profile as any).primary_goal?.toLowerCase().includes("professionally")
                ? `Let's go pro, ${profile.first_name}`
                : `Let's get to work, ${profile.first_name}`
              } 🏀
            </h1>
          </motion.div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <AnimatedCounter value={profile?.streak_days || 0} label="Day Streak" icon={Flame} delay={0} />
          <AnimatedCounter value={statDrillsDone} label="Drills Done" icon={Play} delay={100} />
          <AnimatedCounter value={statHours} label="Hours Trained" icon={TrendingUp} delay={200} />
          <AnimatedCounter value={statRank} label="Weekly Rank" icon={Trophy} delay={300} />
        </div>

        {/* Continue Where You Left Off */}
        {courses.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-card border-border overflow-hidden">
              <CardContent className="p-0">
                <Link to={`/courses/${courses[0].id}/1`} className="flex flex-col sm:flex-row gap-4 p-5 hover:bg-muted/30 transition-colors">
                  <div className="w-full sm:w-48 h-28 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center shrink-0">
                    <Play className="h-10 w-10 text-primary" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="animate-pulse-glow w-2 h-2 rounded-full bg-primary inline-block" />
                      <span className="text-xs font-heading tracking-wider text-primary">In Progress</span>
                    </div>
                    <h3 className="text-xl font-heading text-foreground">{courses[0].title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {courses[0].coaches?.name} · {courses[0].coaches?.school}
                    </p>
                    <div className="space-y-1">
                      <Progress value={33} className="h-1.5 bg-muted" />
                      <p className="text-xs text-muted-foreground">Drill 2 of {courses[0].drill_count} · 4 min left</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Featured Drills */}
        <div>
          <h2 className="text-xl font-heading text-foreground mb-4">Featured Drills This Week</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {drills.slice(0, 6).map((drill, i) => {
              const isAccessible = drill.is_free || subscription.subscribed || profile?.role === "admin" || profile?.role === "creator";
              const showLock = !isAccessible && !subscriptionLoading;
              return (
              <motion.div key={drill.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.05 }}>
                <Link to={isAccessible || subscriptionLoading ? `/drills/${drill.id}` : `/pricing`}>
                  <Card className="bg-card border-border hover:border-primary/20 transition-all group overflow-hidden">
                    <CardContent className="p-0">
                      <div className="relative h-36 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center overflow-hidden">
                        {drill.thumbnail_url ? (
                          <img src={drill.thumbnail_url} alt={drill.title} className="w-full h-full object-cover" />
                        ) : (
                          <Play className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                        )}
                        {drill.is_new && (
                          <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-heading tracking-wider bg-primary text-primary-foreground z-10">NEW</span>
                        )}
                        {showLock && (
                          <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                            <Lock className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded text-[10px] bg-background/80 text-foreground font-medium z-10">
                          {Math.floor((drill.duration_seconds || 0) / 60)}:{String((drill.duration_seconds || 0) % 60).padStart(2, "0")}
                        </span>
                      </div>
                      <div className="p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${categoryColors[drill.category] || "bg-muted-foreground"}`} />
                          <span className="text-xs text-muted-foreground font-heading tracking-wider">{drill.category}</span>
                        </div>
                        <h3 className="font-heading text-sm text-foreground">{drill.title}</h3>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                              {drill.coaches?.avatar_url ? (
                                <img src={drill.coaches.avatar_url} alt={drill.coaches.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xs font-heading text-muted-foreground">{drill.coaches?.initials}</span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">{drill.coaches?.name}</span>
                          </div>
                          <span className="text-[10px] font-heading tracking-wider text-muted-foreground px-2 py-0.5 rounded bg-muted">{drill.level}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
              );
            })}
          </div>
        </div>

        {/* Workouts */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-heading text-foreground">Workouts</h2>
            <Link to="/courses" className="text-sm text-primary hover:underline font-heading tracking-wider flex items-center gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.slice(0, 3).map((course, i) => (
              <motion.div key={course.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.05 }}>
                <Link to={`/courses/${course.id}/1`}>
                  <Card className="bg-card border-border hover:border-primary/20 transition-all overflow-hidden">
                    <CardContent className="p-0">
                      <div className="h-32 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center overflow-hidden">
                        {course.thumbnail_url ? (
                          <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                        ) : (
                          <Play className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="p-4 space-y-3">
                        <span className="text-[10px] font-heading tracking-widest text-muted-foreground">WORKOUT</span>
                        <h3 className="font-heading text-foreground">{course.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                            {course.coaches?.avatar_url ? (
                              <img src={course.coaches.avatar_url} alt={course.coaches.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs font-heading text-muted-foreground">{course.coaches?.initials}</span>
                            )}
                          </div>
                          <span>{course.coaches?.name}</span>
                          <span>·</span>
                          <span>{course.drill_count} drills</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${categoryColors[course.category] || "bg-muted-foreground"}`} />
                          <span className="text-xs text-muted-foreground">{course.category}</span>
                          <span className="ml-auto text-[10px] font-heading tracking-wider text-muted-foreground px-2 py-0.5 rounded bg-muted">{course.level}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
