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

function AnimatedCounter({ value, label, icon: Icon, delay = 0 }: { value: number; label: string; icon: any; delay?: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      let start = 0;
      const step = Math.ceil(value / 20);
      const interval = setInterval(() => {
        start += step;
        if (start >= value) {
          setCount(value);
          clearInterval(interval);
        } else {
          setCount(start);
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
              <p className="text-2xl font-heading text-foreground">{count}</p>
              <p className="text-xs text-muted-foreground font-heading tracking-wider">{label}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Dashboard() {
  const { profile, user } = useAuth();
  const [courses, setCourses] = useState<CourseWithCoach[]>([]);
  const [drills, setDrills] = useState<DrillWithCoach[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [coursesRes, drillsRes] = await Promise.all([
        supabase.from("courses").select("id, title, category, drill_count, level, is_free, coaches(name, school, initials, avatar_color, avatar_url)").eq("status", "live").eq("is_featured", true).order("sort_order").limit(6),
        supabase.from("drills").select("id, title, category, level, is_free, is_new, duration_seconds, thumbnail_url, coaches(name, initials, avatar_color, avatar_url)").eq("is_featured", true).order("created_at", { ascending: false }).limit(6),
      ]);
      if (coursesRes.data) setCourses(coursesRes.data as any);
      if (drillsRes.data) setDrills(drillsRes.data as any);
    };
    fetchData();
  }, []);

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <AnimatedCounter value={profile?.streak_days || 0} label="Day Streak" icon={Flame} delay={0} />
          <AnimatedCounter value={profile?.total_drills_completed || 0} label="Drills Done" icon={Play} delay={100} />
          <AnimatedCounter value={Math.round((profile?.total_drills_completed || 0) * 5 / 60)} label="Hours Trained" icon={TrendingUp} delay={200} />
          <AnimatedCounter value={0} label="Weekly Rank" icon={Trophy} delay={300} />
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
            {drills.slice(0, 6).map((drill, i) => (
              <motion.div key={drill.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.05 }}>
                <Link to={drill.is_free ? `/courses` : `/pricing`}>
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
                        {!drill.is_free && (
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
            ))}
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
                      <div className="h-32 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                        <Play className="h-8 w-8 text-muted-foreground" />
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
