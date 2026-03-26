import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { DrillIntro } from "@/components/drill/DrillIntro";
import { DrillActive } from "@/components/drill/DrillActive";
import { DrillComplete } from "@/components/drill/DrillComplete";
import { ShotInputScreen } from "@/components/drill/ShotInputScreen";
import { ShotResultFlash } from "@/components/drill/ShotResultFlash";
import { updateStreak } from "@/hooks/useStreakUpdate";
import { Loader2, Check, Flame } from "lucide-react";
import { motion } from "framer-motion";

type ScreenState = "intro" | "active" | "shot-input" | "shot-result" | "flash" | "complete";

interface Drill {
  id: string;
  title: string;
  description: string | null;
  category: string;
  vimeo_id: string | null;
  mux_playback_id: string | null;
  duration_seconds: number | null;
  level: string | null;
  is_free: boolean;
  coaching_tips: any;
  equipment_needed: string[] | null;
  sort_order: number;
  course_id: string | null;
  drill_type: string | null;
  reps: number | null;
  sets: number | null;
  enable_shot_tracking?: boolean;
  shot_attempts?: number | null;
  coaches?: { name: string; school: string | null; avatar_url?: string | null } | null;
}

interface Course {
  id: string;
  title: string;
  drill_count: number;
}

export default function DrillExperience() {
  const { drillId, courseId, drillIndex } = useParams();
  const navigate = useNavigate();

  const { user, profile, refreshProfile } = useAuth();
  const [screen, setScreen] = useState<ScreenState>("intro");
  const [drill, setDrill] = useState<Drill | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [allCourseDrills, setAllCourseDrills] = useState<Drill[]>([]);
  const [completing, setCompleting] = useState(false);
  const [streakResult, setStreakResult] = useState({ newStreak: 0, animated: false });
  const [loading, setLoading] = useState(true);
  const [shotResultPct, setShotResultPct] = useState<number | null>(null);

  const currentIndex = drillIndex ? parseInt(drillIndex) : null;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      if (drillId) {
        const { data } = await supabase.from("drills").select("*, coaches(name, school, avatar_url)").eq("id", drillId).single();
        if (data) {
          setDrill(data as any);
          if (data.course_id) {
            const { data: courseData } = await supabase.from("courses").select("id, title, drill_count").eq("id", data.course_id).single();
            if (courseData) setCourse(courseData);
          }
        }
      } else if (courseId && currentIndex) {
        const [courseRes, junctionRes] = await Promise.all([
          supabase.from("courses").select("id, title, drill_count").eq("id", courseId).single(),
          supabase.from("workout_drills").select("position, drills(*, coaches(name, school, avatar_url))").eq("workout_id", courseId).order("position"),
        ]);
        if (courseRes.data) setCourse(courseRes.data);
        if (junctionRes.data) {
          const drillsFromJunction = (junctionRes.data as any[]).map((j: any) => j.drills).filter(Boolean);
          setAllCourseDrills(drillsFromJunction);
          const d = drillsFromJunction[currentIndex - 1];
          if (d) setDrill(d);
        }
      }

      setLoading(false);
    };
    fetchData();
  }, [drillId, courseId, currentIndex]);

  const isInCourse = !!courseId && !!currentIndex;
  const isLastDrill = isInCourse && currentIndex >= allCourseDrills.length;

  const hasShotTracking = !!(drill as any)?.enable_shot_tracking && (drill as any)?.shot_attempts > 0;

  const handleMarkComplete = async () => {
    if (hasShotTracking) {
      setScreen("shot-input");
      return;
    }
    await completeAndAdvance();
  };

  const handleShotSave = async (shotsMade: number) => {
    if (!drill || !user) return;
    const shotAttempts = (drill as any).shot_attempts || 0;
    const pct = shotAttempts > 0 ? Math.round((shotsMade / shotAttempts) * 100) : 0;

    await supabase.from("drill_shot_results" as any).insert({
      user_id: user.id,
      drill_id: drill.id,
      workout_id: courseId || null,
      shots_made: shotsMade,
      shots_attempted: shotAttempts,
      shooting_percentage: pct,
    } as any);

    setShotResultPct(pct);
    setScreen("shot-result");
  };

  const handleShotSkip = async () => {
    await completeAndAdvance();
  };

  // Show shot result for 800ms then proceed
  useEffect(() => {
    if (screen !== "shot-result") return;
    const timer = setTimeout(() => {
      completeAndAdvance();
    }, 800);
    return () => clearTimeout(timer);
  }, [screen]);

  const completeAndAdvance = async () => {
    if (!drill || !user) return;
    setCompleting(true);

    await supabase.from("user_drill_progress").upsert({
      user_id: user.id,
      drill_id: drill.id,
      completed: true,
      completed_at: new Date().toISOString(),
    }, { onConflict: "user_id,drill_id" });

    if (courseId && currentIndex) {
      await supabase.from("user_course_progress").upsert({
        user_id: user.id,
        course_id: courseId,
        current_drill_index: currentIndex + 1,
        drills_completed: currentIndex,
        completed: isLastDrill,
        completed_at: isLastDrill ? new Date().toISOString() : null,
      }, { onConflict: "user_id,course_id" });
    }

    const result = await updateStreak(user.id);
    setStreakResult(result);

    await supabase.from("profiles").update({
      total_drills_completed: (profile?.total_drills_completed || 0) + 1,
    }).eq("id", user.id);

    await refreshProfile();
    setCompleting(false);

    if (isLastDrill) {
      setScreen("complete");
      return;
    }

    setScreen("flash");
  };

  // Auto-advance after flash
  useEffect(() => {
    if (screen !== "flash") return;
    const timer = setTimeout(() => {
      if (isInCourse && currentIndex) {
        navigate(`/drill/${courseId}/${currentIndex + 1}`, { replace: true });
      } else {
        navigate("/courses", { replace: true });
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [screen, isInCourse, courseId, currentIndex, navigate]);

  const athleteName = profile
    ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Athlete"
    : "Athlete";

  const introDisplayName = drill?.coaches?.name || athleteName;
  const introDisplayAvatar = drill?.coaches?.avatar_url ?? profile?.avatar_url ?? null;

  if (loading || !drill) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const coachingTips = Array.isArray(drill.coaching_tips) ? drill.coaching_tips as string[] : null;

  return (
    <AppLayout>
      {screen === "intro" && (
        <DrillIntro
          athleteName={introDisplayName}
          athleteAvatar={introDisplayAvatar}
          drillTitle={drill.title}
          drillDescription={drill.description}
          level={drill.level}
          equipmentNeeded={drill.equipment_needed}
          courseName={isInCourse ? course?.title : null}
          courseId={isInCourse ? courseId : null}
          drillIndexInCourse={currentIndex || undefined}
          totalDrillsInCourse={isInCourse ? allCourseDrills.length : undefined}
          onStart={() => setScreen("active")}
          backTo={isInCourse ? `/courses/${courseId}/1` : "/courses"}
          backLabel={isInCourse ? "Back to Course" : "Back to Library"}
        />
      )}

      {screen === "active" && (
        <DrillActive
          drillTitle={drill.title}
          vimeoId={drill.vimeo_id}
          muxPlaybackId={drill.mux_playback_id}
          coachingTips={coachingTips}
          completing={completing}
          onComplete={handleMarkComplete}
          drillType={drill.drill_type}
          durationSeconds={drill.duration_seconds}
          reps={drill.reps}
          sets={drill.sets}
          category={drill.category}
          level={drill.level}
          coachName={drill.coaches?.name || null}
          coachSchool={drill.coaches?.school || null}
          drillIndex={currentIndex || undefined}
          totalDrills={isInCourse ? allCourseDrills.length : undefined}
          description={drill.description}
        />
      )}

      {screen === "shot-input" && hasShotTracking && (
        <ShotInputScreen
          shotAttempts={(drill as any).shot_attempts}
          onSave={handleShotSave}
          onSkip={handleShotSkip}
        />
      )}

      {screen === "shot-result" && shotResultPct !== null && (
        <ShotResultFlash percentage={shotResultPct} />
      )}

      {screen === "flash" && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <Check className="h-20 w-20" style={{ color: "#22c55e" }} strokeWidth={3} />
          </motion.div>
          {streakResult.animated && streakResult.newStreak > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-4 flex items-center gap-2"
            >
              <Flame className="h-5 w-5 text-pif-gold" />
              <span className="text-sm text-white font-heading">
                {streakResult.newStreak} day streak
              </span>
            </motion.div>
          )}
        </div>
      )}

      {screen === "complete" && (
        <DrillComplete
          drillTitle={drill.title}
          athleteName={athleteName}
          streakCount={streakResult.newStreak}
          streakAnimated={streakResult.animated}
          courseId={isInCourse ? courseId : null}
          courseName={course?.title}
          nextDrillIndex={null}
          totalDrills={allCourseDrills.length}
          isLastDrill={isLastDrill}
        />
      )}
    </AppLayout>
  );
}
