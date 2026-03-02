import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Lock, Play, Bookmark, Share2, Loader2, Trophy } from "lucide-react";

interface Drill {
  id: string;
  title: string;
  category: string;
  vimeo_id: string;
  duration_seconds: number;
  level: string;
  is_free: boolean;
  description: string;
  coaching_tips: string[] | null;
  equipment_needed: string[] | null;
  sort_order: number;
}

interface Course {
  id: string;
  title: string;
  category: string;
  drill_count: number;
  coaches: { name: string; school: string; initials: string; avatar_color: string } | null;
}

const categoryColors: Record<string, string> = {
  "Ball Handling": "text-primary",
  "Shooting": "text-secondary",
  "Athletics": "text-pif-green",
  "Basketball IQ": "text-pif-gold",
};

export default function CoursePlayer() {
  const { courseId, drillIndex } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const currentIndex = parseInt(drillIndex || "1");

  const [course, setCourse] = useState<Course | null>(null);
  const [drills, setDrills] = useState<Drill[]>([]);
  const [completedDrills, setCompletedDrills] = useState<Set<string>>(new Set());
  const [completing, setCompleting] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);

  const currentDrill = drills[currentIndex - 1];
  const clampedCompleted = Math.min(completedDrills.size, drills.length);
  const progressPercent = drills.length > 0 ? (clampedCompleted / drills.length) * 100 : 0;

  useEffect(() => {
    if (!courseId) return;
    const fetchData = async () => {
      const [courseRes, drillsRes] = await Promise.all([
        supabase.from("courses").select("id, title, category, drill_count, coaches(name, school, initials, avatar_color)").eq("id", courseId).single(),
        supabase.from("drills").select("*").eq("course_id", courseId).order("sort_order"),
      ]);
      if (courseRes.data) setCourse(courseRes.data as any);
      if (drillsRes.data) setDrills(drillsRes.data as any);

      if (user && drillsRes.data) {
        const courseDrillIds = (drillsRes.data as any[]).map((d: any) => d.id);
        const { data: progressData } = await supabase
          .from("user_drill_progress")
          .select("drill_id")
          .eq("user_id", user.id)
          .eq("completed", true)
          .in("drill_id", courseDrillIds);
        if (progressData) {
          setCompletedDrills(new Set(progressData.map((p) => p.drill_id)));
        }
      }
    };
    fetchData();
  }, [courseId, user]);

  const handleMarkComplete = async () => {
    if (!currentDrill || !user) return;
    setCompleting(true);

    await supabase.from("user_drill_progress").upsert({
      user_id: user.id,
      drill_id: currentDrill.id,
      completed: true,
      completed_at: new Date().toISOString(),
    }, { onConflict: "user_id,drill_id" });

    await supabase.from("user_course_progress").upsert({
      user_id: user.id,
      course_id: courseId!,
      current_drill_index: currentIndex + 1,
      drills_completed: completedDrills.size + 1,
      completed: currentIndex >= drills.length,
      completed_at: currentIndex >= drills.length ? new Date().toISOString() : null,
    }, { onConflict: "user_id,course_id" });

    setCompletedDrills((prev) => new Set([...prev, currentDrill.id]));
    setCompleting(false);
    setJustCompleted(true);

    if (currentIndex >= drills.length) {
      setTimeout(() => setShowCompletion(true), 1000);
    } else {
      setTimeout(() => {
        setJustCompleted(false);
        navigate(`/courses/${courseId}/${currentIndex + 1}`);
      }, 2000);
    }
  };

  const getDrillStatus = (drill: Drill, index: number) => {
    if (completedDrills.has(drill.id)) return "completed";
    if (index + 1 === currentIndex) return "current";
    if (index + 1 <= completedDrills.size + 1) return "unlocked";
    return "locked";
  };

  if (!course || drills.length === 0) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
        {/* Left Panel - Course Progress Rail */}
        <div className="hidden lg:flex lg:w-80 flex-col bg-card border-r border-border overflow-y-auto shrink-0">
          <div className="p-5 space-y-4 border-b border-border">
            <Link to="/courses" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to Courses
            </Link>
            <h2 className="text-lg font-heading text-foreground">{course.title}</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                <span className="text-[9px] font-heading">{course.coaches?.initials}</span>
              </div>
              <span>{course.coaches?.name} · {course.coaches?.school}</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{clampedCompleted} / {drills.length}</span>
                <span className="text-primary font-heading">{Math.round(progressPercent)}% Complete</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>

          <div className="p-3 flex-1">
            <p className="text-xs font-heading tracking-widest text-muted-foreground px-2 mb-2">DRILLS</p>
            <div className="space-y-1">
              {drills.map((drill, i) => {
                const status = getDrillStatus(drill, i);
                return (
                  <button
                    key={drill.id}
                    disabled={status === "locked"}
                    onClick={() => status !== "locked" && navigate(`/courses/${courseId}/${i + 1}`)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all text-sm ${
                      status === "current"
                        ? "bg-primary/10 border border-primary/20 shadow-[0_0_12px_hsl(var(--pif-red)/0.15)]"
                        : status === "completed"
                        ? "hover:bg-muted/50"
                        : status === "locked"
                        ? "opacity-40 cursor-not-allowed"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                      {status === "completed" ? (
                        <Check className="h-4 w-4 text-pif-green" />
                      ) : status === "current" ? (
                        <Play className="h-4 w-4 text-primary" />
                      ) : status === "locked" ? (
                        <Lock className="h-3 w-3 text-muted-foreground" />
                      ) : (
                        <span className="text-xs text-muted-foreground">{i + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`truncate ${status === "current" ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                        {drill.title}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {Math.floor(drill.duration_seconds / 60)}:{String(drill.duration_seconds % 60).padStart(2, "0")}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>🔥 {profile?.streak_days || 0}-day streak</span>
              <span>⚡ {profile?.total_drills_completed || 0} drills</span>
            </div>
          </div>
        </div>

        {/* Mobile Progress Bar */}
        <div className="lg:hidden border-b border-border px-4 py-3 bg-card">
          <button onClick={() => setShowMobileDrawer(!showMobileDrawer)} className="w-full flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Drill {currentIndex} of {drills.length}</span>
            <div className="flex gap-1">
              {drills.map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full ${i + 1 <= completedDrills.size ? "bg-pif-green" : i + 1 === currentIndex ? "bg-primary" : "bg-muted"}`} />
              ))}
            </div>
          </button>
        </div>

        {/* Right Panel - Video + Content */}
        <div className="flex-1 overflow-y-auto">
          {currentDrill && (
            <div className="space-y-0">
              {/* Video */}
              <div className="aspect-video bg-background w-full">
                <iframe
                  key={currentDrill.id}
                  src={`https://player.vimeo.com/video/${currentDrill.vimeo_id}?color=E8453C&title=0&byline=0&portrait=0`}
                  className="w-full h-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              </div>

              {/* Drill Info Bar */}
              <div className="p-4 lg:p-6 border-b border-border space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-heading tracking-wider ${categoryColors[currentDrill.category] || "text-muted-foreground"}`}>
                    {currentDrill.category}
                  </span>
                  <span className="text-[10px] font-heading tracking-wider text-muted-foreground px-2 py-0.5 rounded bg-muted">{currentDrill.level}</span>
                  <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded bg-muted">
                    {Math.floor(currentDrill.duration_seconds / 60)}:{String(currentDrill.duration_seconds % 60).padStart(2, "0")}
                  </span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-heading text-foreground">{currentDrill.title}</h1>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-xs font-heading text-muted-foreground">{course.coaches?.initials}</span>
                    </div>
                    <div>
                      <p className="text-sm text-foreground">{course.coaches?.name}</p>
                      <p className="text-xs text-muted-foreground">{course.coaches?.school}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg hover:bg-muted transition-colors"><Bookmark className="h-4 w-4 text-muted-foreground" /></button>
                    <button className="p-2 rounded-lg hover:bg-muted transition-colors"><Share2 className="h-4 w-4 text-muted-foreground" /></button>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-border">
                <div className="flex px-4 lg:px-6">
                  {["overview", "tips"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setActiveTab(t)}
                      className={`px-4 py-3 text-sm font-heading tracking-wider border-b-2 transition-colors ${
                        activeTab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t === "overview" ? "Overview" : "Coaching Tips"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-4 lg:p-6">
                {activeTab === "overview" && (
                  <div className="space-y-6 max-w-2xl">
                    <p className="text-muted-foreground leading-relaxed">{currentDrill.description}</p>
                    {currentDrill.equipment_needed && currentDrill.equipment_needed.length > 0 && (
                      <div>
                        <h3 className="font-heading text-sm text-foreground mb-3">What You'll Need</h3>
                        <div className="flex flex-wrap gap-2">
                          {currentDrill.equipment_needed.map((item, i) => (
                            <span key={i} className="px-3 py-1.5 rounded-lg bg-muted text-sm text-muted-foreground">🏀 {item}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "tips" && (
                  <div className="space-y-3 max-w-2xl">
                    {(currentDrill.coaching_tips as string[] || []).map((tip, i) => {
                      const icons = ["🎯", "⚠️", "📈", "💡"];
                      const labels = ["Key Focus", "Common Mistake", "Progression", "Pro Tip"];
                      const colors = ["border-primary", "border-pif-gold", "border-secondary", "border-pif-purple"];
                      return (
                        <div key={i} className={`p-4 rounded-lg bg-muted border-l-4 ${colors[i % 4]}`}>
                          <p className="text-xs font-heading tracking-wider text-muted-foreground mb-1">{icons[i % 4]} {labels[i % 4]}</p>
                          <p className="text-sm text-foreground">{tip}</p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Mark Complete — always visible below tab content */}
                {!completedDrills.has(currentDrill.id) && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mt-6">
                    <Button
                      onClick={handleMarkComplete}
                      disabled={completing || justCompleted}
                      className={`w-full h-14 btn-cta text-base transition-all ${
                        justCompleted ? "bg-pif-green hover:bg-pif-green" : "bg-primary hover:bg-primary/90 glow-red-hover"
                      }`}
                    >
                      {completing ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : justCompleted ? (
                        <motion.span initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                          <Check className="h-5 w-5" /> Completed!
                        </motion.span>
                      ) : (
                        <>Mark Complete & Continue →</>
                      )}
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Course Completion Modal */}
      <AnimatePresence>
        {showCompletion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-card border border-border rounded-2xl p-8 max-w-md w-full text-center space-y-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                className="w-20 h-20 mx-auto rounded-full bg-pif-gold/20 flex items-center justify-center"
              >
                <Trophy className="h-10 w-10 text-pif-gold" />
              </motion.div>
              <h2 className="text-3xl font-heading text-foreground">Course Complete!</h2>
              <p className="text-lg text-muted-foreground">{course.title}</p>
              <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                <span>{drills.length} drills</span>
                <span>{Math.round(drills.reduce((a, d) => a + d.duration_seconds, 0) / 60)} min trained</span>
              </div>
              <Link to="/courses">
                <Button className="w-full h-12 btn-cta bg-primary hover:bg-primary/90 glow-red-hover">
                  Browse More Courses →
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
