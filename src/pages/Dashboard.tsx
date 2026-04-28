import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { Flame, Play, TrendingUp, Trophy, ArrowRight, Lock, Mail, Target } from "lucide-react";
import { GmailReminderBanner } from "@/components/dashboard/GmailReminderBanner";

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

interface OutreachRow {
  id: string;
  coach_name: string;
  school_name: string;
  status: string;
  sent_at: string;
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

const RECRUIT_LEVELS = [
  { label: "Unrecruited", min: 0 },
  { label: "On the Radar", min: 5 },
  { label: "Getting Noticed", min: 15 },
  { label: "In Demand", min: 30 },
  { label: "Recruited", min: 50 },
] as const;

function getRecruitLevel(contacted: number) {
  for (let i = RECRUIT_LEVELS.length - 1; i >= 0; i--) {
    if (contacted >= RECRUIT_LEVELS[i].min) return { index: i, ...RECRUIT_LEVELS[i] };
  }
  return { index: 0, ...RECRUIT_LEVELS[0] };
}

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

function relativeDate(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d}d ago`;
  return `${Math.floor(d / 7)}w ago`;
}

export default function Dashboard() {
  const { profile, user } = useAuth();
  const [courses, setCourses] = useState<CourseWithCoach[]>([]);
  const [drills, setDrills] = useState<DrillWithCoach[]>([]);
  const [statDrillsDone, setStatDrillsDone] = useState(0);
  const [statHours, setStatHours] = useState("0m");
  const [statRank, setStatRank] = useState("#—");
  const [outreach, setOutreach] = useState<OutreachRow[]>([]);
  const [drillsThisWeek, setDrillsThisWeek] = useState(0);
  const [coachesThisWeek, setCoachesThisWeek] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const [coursesRes, drillsRes] = await Promise.all([
        supabase.from("courses").select("id, title, category, drill_count, level, is_free, thumbnail_url, coaches(name, school, initials, avatar_color, avatar_url)").eq("status", "live").eq("is_featured", true).order("sort_order").limit(6),
        supabase.from("drills").select("id, title, category, level, is_free, is_new, duration_seconds, thumbnail_url, coaches(name, initials, avatar_color, avatar_url)").eq("is_featured", true).order("sort_order").limit(6),
      ]);
      if (coursesRes.data) setCourses(coursesRes.data as any);
      if (drillsRes.data) setDrills(drillsRes.data as any);
    };
    fetchData();
  }, []);

  // Week start helper
  const weekStartISO = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - mondayOffset);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart.toISOString();
  }, []);

  // Fetch live stats for the logged-in user
  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      // 1. Drills Done
      const { count: drillCount } = await supabase
        .from("user_drill_progress")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("completed", true);
      const done = drillCount ?? 0;
      setStatDrillsDone(done);

      // 2. Hours Trained
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

      // 3. Weekly Rank
      const { count: myWeekCount } = await supabase
        .from("user_drill_progress")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("completed", true)
        .gte("completed_at", weekStartISO);
      const myCount = myWeekCount ?? 0;
      setDrillsThisWeek(myCount);

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

      // 4. Outreach data
      const { data: outreachData } = await supabase
        .from("outreach_history")
        .select("id, coach_name, school_name, status, sent_at")
        .eq("user_id", user.id)
        .order("sent_at", { ascending: false })
        .limit(5);
      setOutreach((outreachData as any) ?? []);

      // 5. Coaches contacted this week
      const { count: weekCoaches } = await supabase
        .from("outreach_history")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("sent_at", weekStartISO);
      setCoachesThisWeek(weekCoaches ?? 0);
    };

    fetchStats();
  }, [user, weekStartISO]);

  const totalContacted = outreach.length > 0
    ? outreach.length // We fetched limit(5), so use a count query for exact total
    : 0;

  // Use a separate count for total contacted (not capped at 5)
  const [totalContactedCount, setTotalContactedCount] = useState(0);
  useEffect(() => {
    if (!user) return;
    supabase
      .from("outreach_history")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .then(({ count }) => setTotalContactedCount(count ?? 0));
  }, [user, outreach.length]);

  const recruitLevel = getRecruitLevel(totalContactedCount);
  const levelProgress = recruitLevel.index === RECRUIT_LEVELS.length - 1
    ? 100
    : Math.min(100, ((totalContactedCount - recruitLevel.min) / (RECRUIT_LEVELS[recruitLevel.index + 1].min - recruitLevel.min)) * 100);

  // Dynamic headline logic
  const greeting = useMemo(() => {
    const name = profile?.first_name || "";
    if (!name) return null;

    const hasOutreach = totalContactedCount > 0;
    const p = profile as any;

    // Pool of headlines
    const trainingHeadlines = [
      p?.primary_goal?.toLowerCase().includes("next level")
        ? `Let's get you to the next level, ${name}`
        : p?.primary_goal?.toLowerCase().includes("starting spot")
        ? `Let's earn that starting spot, ${name}`
        : p?.primary_goal?.toLowerCase().includes("make the team")
        ? `Let's make the team, ${name}`
        : p?.primary_goal?.toLowerCase().includes("professionally")
        ? `Let's go pro, ${name}`
        : `Let's get to work, ${name}`,
    ];

    if (!hasOutreach) return { text: trainingHeadlines[0], emoji: "🏀" };

    const recruitingHeadlines = [
      { text: `Keep building your recruiting profile, ${name}`, emoji: "🏀" },
      { text: `You're ${recruitLevel.label} — keep going, ${name}`, emoji: "🎯" },
      { text: `${totalContactedCount} coaches and counting, ${name}`, emoji: "📬" },
    ];

    // Rotate based on current minute for variety
    const pool = [...trainingHeadlines.map(t => ({ text: t, emoji: "🏀" })), ...recruitingHeadlines];
    const pick = pool[Math.floor(Date.now() / 60000) % pool.length];
    return pick;
  }, [profile, totalContactedCount, recruitLevel.label]);

  const statusDot: Record<string, string> = {
    sent: "bg-muted-foreground/40",
    replied: "bg-primary",
    offer: "bg-pif-green",
  };

  return (
    <AppLayout>
      
      <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Personalized Greeting */}
        {greeting && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative">
            <div className="absolute -top-8 -left-8 w-72 h-48 rounded-full bg-[radial-gradient(ellipse_at_top_left,hsl(var(--pif-red)/0.09),transparent_70%)] pointer-events-none" />
            <h1 className="text-2xl md:text-3xl font-heading text-foreground relative z-10">
              {greeting.text} {greeting.emoji}
            </h1>
          </motion.div>
        )}

        {/* Stats Row — 6 cards: existing 4 + 2 recruiting */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <AnimatedCounter value={profile?.streak_days || 0} label="Day Streak" icon={Flame} delay={0} />
          <AnimatedCounter value={statDrillsDone} label="Drills Done" icon={Play} delay={100} />
          <AnimatedCounter value={statHours} label="Hours Trained" icon={TrendingUp} delay={200} />
          <AnimatedCounter value={statRank} label="Weekly Rank" icon={Trophy} delay={300} />
          <AnimatedCounter value={totalContactedCount} label="Schools Contacted" icon={Mail} delay={400} />
          <AnimatedCounter value={recruitLevel.label} label="Current Level" icon={Target} delay={500} />
        </div>

        {/* This Week Summary — Training + Recruiting side by side */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <h3 className="text-xs font-heading tracking-wider text-muted-foreground uppercase mb-4">This Week</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-heading text-foreground">{drillsThisWeek}</p>
                  <p className="text-xs text-muted-foreground mt-1">Drills Completed</p>
                </div>
                <div className="text-center border-l border-border">
                  <p className="text-3xl font-heading text-foreground">{coachesThisWeek}</p>
                  <p className="text-xs text-muted-foreground mt-1">Coaches Contacted</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Today's Training / Continue Where You Left Off */}
        {courses.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} data-tour="todays-training">
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
              const isAccessible = true;
              const showLock = false;
              return (
              <motion.div key={drill.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.05 }} {...(i === 0 ? { "data-tour": "first-drill" } : {})}>
                <Link to={`/drills/${drill.id}`}>
                  <Card className="bg-card border-border hover:border-primary/20 transition-all group overflow-hidden">
                    <CardContent className="p-0">
                      <div className="relative h-52 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center overflow-hidden">
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
                            <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
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

        {/* Your Recruiting Journey */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card className="bg-card border-border overflow-hidden">
            <CardContent className="p-5 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-heading text-foreground">Your Recruiting Journey</h2>
                <Link
                  to="/recruit"
                  className="text-sm text-primary hover:underline font-heading tracking-wider flex items-center gap-1"
                >
                  Contact More Coaches <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {/* Level progress bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  {RECRUIT_LEVELS.map((lvl, i) => (
                    <span
                      key={lvl.label}
                      className={`text-[10px] font-heading tracking-wider ${
                        i <= recruitLevel.index ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {lvl.label}
                    </span>
                  ))}
                </div>
                <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-700"
                    style={{
                      width: `${((recruitLevel.index / (RECRUIT_LEVELS.length - 1)) * 100) + (levelProgress / (RECRUIT_LEVELS.length - 1))}%`,
                    }}
                  />
                </div>
                {/* Level stage dots */}
                <div className="relative h-0">
                  {RECRUIT_LEVELS.map((_, i) => (
                    <div
                      key={i}
                      className={`absolute -top-[13px] w-3 h-3 rounded-full border-2 border-card ${
                        i <= recruitLevel.index ? "bg-primary" : "bg-muted"
                      }`}
                      style={{ left: `${(i / (RECRUIT_LEVELS.length - 1)) * 100}%`, transform: "translateX(-50%)" }}
                    />
                  ))}
                </div>
              </div>

              {/* Recent outreach or empty state */}
              <div className="pt-2">
                {totalContactedCount === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground mb-3">You haven't contacted any coaches yet.</p>
                    <Link
                      to="/recruit"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-heading tracking-wider hover:bg-primary/90 transition-colors"
                    >
                      Start your recruiting journey <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-heading tracking-wider uppercase">Recent Outreach</p>
                    {outreach.slice(0, 3).map((row) => (
                      <div key={row.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${statusDot[row.status] || "bg-muted-foreground/40"}`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">{row.school_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{row.coach_name}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-muted-foreground">{relativeDate(row.sent_at)}</span>
                          <span className="block text-[10px] font-heading tracking-wider text-muted-foreground capitalize">{row.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

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
                      <div className="h-52 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center overflow-hidden">
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
                          <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
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
