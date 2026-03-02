import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { DrillIntro } from "@/components/drill/DrillIntro";
import { DrillActive } from "@/components/drill/DrillActive";
import { DrillComplete } from "@/components/drill/DrillComplete";
import { updateStreak } from "@/hooks/useStreakUpdate";
import { Loader2 } from "lucide-react";

type ScreenState = "intro" | "active" | "complete";

interface Drill {
  id: string;
  title: string;
  description: string | null;
  category: string;
  vimeo_id: string | null;
  duration_seconds: number | null;
  level: string | null;
  is_free: boolean;
  coaching_tips: any;
  equipment_needed: string[] | null;
  sort_order: number;
  course_id: string | null;
}

interface Course {
  id: string;
  title: string;
  drill_count: number;
}

export default function DrillExperience() {
  // Supports two route patterns:
  // /drills/:drillId (standalone)
  // /drill/:courseId/:drillIndex (course context)
  const { drillId, courseId, drillIndex } = useParams();

  const { user, profile, refreshProfile } = useAuth();
  const [screen, setScreen] = useState<ScreenState>("intro");
  const [drill, setDrill] = useState<Drill | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [allCourseDrills, setAllCourseDrills] = useState<Drill[]>([]);
  const [completing, setCompleting] = useState(false);
  const [streakResult, setStreakResult] = useState({ newStreak: 0, animated: false });
  const [loading, setLoading] = useState(true);

  const currentIndex = drillIndex ? parseInt(drillIndex) : null;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      if (drillId) {
        // Standalone drill
        const { data } = await supabase.from("drills").select("*").eq("id", drillId).single();
        if (data) {
          setDrill(data as any);
          // If drill belongs to a course, fetch course info
          if (data.course_id) {
            const { data: courseData } = await supabase.from("courses").select("id, title, drill_count").eq("id", data.course_id).single();
            if (courseData) setCourse(courseData);
          }
        }
      } else if (courseId && currentIndex) {
        // Course drill
        const [courseRes, drillsRes] = await Promise.all([
          supabase.from("courses").select("id, title, drill_count").eq("id", courseId).single(),
          supabase.from("drills").select("*").eq("course_id", courseId).order("sort_order"),
        ]);
        if (courseRes.data) setCourse(courseRes.data);
        if (drillsRes.data) {
          setAllCourseDrills(drillsRes.data as any);
          const d = (drillsRes.data as any)[currentIndex - 1];
          if (d) setDrill(d);
        }
      }

      setLoading(false);
    };
    fetchData();
  }, [drillId, courseId, currentIndex]);

  const handleComplete = async () => {
    if (!drill || !user) return;
    setCompleting(true);

    // Mark drill complete
    await supabase.from("user_drill_progress").upsert({
      user_id: user.id,
      drill_id: drill.id,
      completed: true,
      completed_at: new Date().toISOString(),
    }, { onConflict: "user_id,drill_id" });

    // Update course progress if in course context
    if (courseId && currentIndex) {
      const isLastDrill = currentIndex >= allCourseDrills.length;
      await supabase.from("user_course_progress").upsert({
        user_id: user.id,
        course_id: courseId,
        current_drill_index: currentIndex + 1,
        drills_completed: currentIndex,
        completed: isLastDrill,
        completed_at: isLastDrill ? new Date().toISOString() : null,
      }, { onConflict: "user_id,course_id" });
    }

    // Update streak
    const result = await updateStreak(user.id);
    setStreakResult(result);

    // Increment total drills on profile
    await supabase.from("profiles").update({
      total_drills_completed: (profile?.total_drills_completed || 0) + 1,
    }).eq("id", user.id);

    await refreshProfile();
    setCompleting(false);
    setScreen("complete");
  };

  const athleteName = profile
    ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Athlete"
    : "Athlete";

  if (loading || !drill) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const isInCourse = !!courseId && !!currentIndex;
  const isLastDrill = isInCourse && currentIndex >= allCourseDrills.length;
  const coachingTips = Array.isArray(drill.coaching_tips) ? drill.coaching_tips as string[] : null;

  return (
    <AppLayout>
      {screen === "intro" && (
        <DrillIntro
          athleteName={athleteName}
          athleteAvatar={profile?.avatar_url}
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
          coachingTips={coachingTips}
          completing={completing}
          onComplete={handleComplete}
        />
      )}

      {screen === "complete" && (
        <DrillComplete
          drillTitle={drill.title}
          athleteName={athleteName}
          streakCount={streakResult.newStreak}
          streakAnimated={streakResult.animated}
          courseId={isInCourse ? courseId : null}
          courseName={course?.title}
          nextDrillIndex={isInCourse && !isLastDrill ? currentIndex + 1 : null}
          totalDrills={allCourseDrills.length}
          isLastDrill={isLastDrill}
        />
      )}
    </AppLayout>
  );
}
