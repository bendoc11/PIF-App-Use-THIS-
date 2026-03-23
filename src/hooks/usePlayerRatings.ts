import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PlayerRatings {
  ball_handling: number;
  shooting: number;
  finishing: number;
  overall: number;
}

interface GameAverages {
  ppg: number | null;
  rpg: number | null;
  apg: number | null;
  fgPct: number | null;
}

export function usePlayerRatings() {
  const { user, profile } = useAuth();
  const [ratings, setRatings] = useState<PlayerRatings | null>(null);
  const [gameAverages, setGameAverages] = useState<GameAverages>({ ppg: null, rpg: null, apg: null, fgPct: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !profile) return;

    const calculate = async () => {
      try {
        // 1. Get onboarding strengths/weaknesses for base ratings
        const { data: fullProfile } = await supabase
          .from("profiles")
          .select("strengths, weaknesses, created_at")
          .eq("id", user.id)
          .single();

        const strengths: string[] = (fullProfile as any)?.strengths || [];
        const weaknesses: string[] = (fullProfile as any)?.weaknesses || [];
        const accountCreated = fullProfile?.created_at ? new Date(fullProfile.created_at) : new Date();

        const getBase = (cat: string) => {
          const normalizedStrengths = strengths.map(s => s.toLowerCase());
          const normalizedWeaknesses = weaknesses.map(w => w.toLowerCase());
          const catLower = cat.toLowerCase();
          if (normalizedStrengths.some(s => s.includes(catLower) || catLower.includes(s))) return 58;
          if (normalizedWeaknesses.some(w => w.includes(catLower) || catLower.includes(w))) return 42;
          return 50;
        };

        const baseBH = getBase("ball handling");
        const baseShooting = getBase("shooting");
        const baseFinishing = getBase("finishing");

        // 2. Count completed drills by category (lifetime)
        // First get all completed drill IDs
        const { data: completedDrills } = await supabase
          .from("user_drill_progress")
          .select("drill_id, completed_at")
          .eq("user_id", user.id)
          .eq("completed", true);

        const drillIds = (completedDrills || []).map(d => d.drill_id);

        // Get drill categories - check both drill category AND workout categories array
        let drillCategories: Record<string, string[]> = {}; // drillId -> categories
        if (drillIds.length > 0) {
          const { data: drillData } = await supabase
            .from("drills")
            .select("id, category, course_id")
            .in("id", drillIds);

          // Get workout categories for drills that belong to workouts
          const courseIds = [...new Set((drillData || []).filter(d => d.course_id).map(d => d.course_id!))];
          let courseCategories: Record<string, string[]> = {};
          if (courseIds.length > 0) {
            const { data: courses } = await supabase
              .from("courses")
              .select("id, category, categories")
              .in("id", courseIds);
            (courses || []).forEach((c: any) => {
              const cats: string[] = [];
              if (c.categories && Array.isArray(c.categories)) {
                cats.push(...c.categories);
              } else if (c.category) {
                cats.push(c.category);
              }
              courseCategories[c.id] = cats;
            });
          }

          (drillData || []).forEach(d => {
            const cats: string[] = [];
            // Add drill's own category
            if (d.category) cats.push(d.category);
            // Add workout categories if drill belongs to a workout
            if (d.course_id && courseCategories[d.course_id]) {
              courseCategories[d.course_id].forEach(c => {
                if (!cats.includes(c)) cats.push(c);
              });
            }
            drillCategories[d.id] = cats;
          });
        }

        // Count drills per category
        let bhDrills = 0, shootingDrills = 0, finishingDrills = 0;
        drillIds.forEach(id => {
          const cats = drillCategories[id] || [];
          if (cats.some(c => c.toLowerCase().includes("ball handling"))) bhDrills++;
          if (cats.some(c => c.toLowerCase().includes("shooting"))) shootingDrills++;
          if (cats.some(c => c.toLowerCase().includes("finishing"))) finishingDrills++;
        });

        // 3. Get shooting sessions for shooting bonus
        const { data: shotLogs } = await supabase
          .from("practice_shot_logs")
          .select("total_makes, total_attempts")
          .eq("user_id", user.id);

        const manualSessions = (shotLogs || []).length;
        let totalMakes = 0, totalAttempts = 0;
        (shotLogs || []).forEach(s => {
          totalMakes += s.total_makes || 0;
          totalAttempts += s.total_attempts || 0;
        });

        // Also count drill shot results
        const { data: drillShots } = await supabase
          .from("drill_shot_results")
          .select("shots_made, shots_attempted")
          .eq("user_id", user.id);
        (drillShots || []).forEach(s => {
          totalMakes += s.shots_made || 0;
          totalAttempts += s.shots_attempted || 0;
        });

        const shootingPct = totalAttempts > 0 ? (totalMakes / totalAttempts) * 100 : 0;

        // 4. Calculate weekly caps — count drills completed this week
        const now = new Date();
        const dayOfWeek = now.getDay();
        const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - mondayOffset);
        weekStart.setHours(0, 0, 0, 0);

        // 5. Inactivity check
        const lastActivity = (completedDrills || []).reduce((latest, d) => {
          if (!d.completed_at) return latest;
          const dt = new Date(d.completed_at);
          return dt > latest ? dt : latest;
        }, accountCreated);

        const daysSinceActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
        let inactivityDrop = 0;
        if (daysSinceActivity > 14) {
          const weeksInactive = Math.floor((daysSinceActivity - 14) / 7);
          inactivityDrop = Math.min(weeksInactive, 5);
        }

        // 6. Calculate ratings
        let bhRating = baseBH + (bhDrills * 0.8);
        let shootingRating = baseShooting + (shootingDrills * 0.5) + (manualSessions * 0.3);
        let finishingRating = baseFinishing + (finishingDrills * 0.8);

        // Shooting % bonus
        if (shootingPct > 70) shootingRating += 8;
        else if (shootingPct > 60) shootingRating += 5;
        else if (shootingPct > 50) shootingRating += 3;

        // Apply inactivity drop (never below base)
        bhRating = Math.max(baseBH, bhRating - inactivityDrop);
        shootingRating = Math.max(baseShooting, shootingRating - inactivityDrop);
        finishingRating = Math.max(baseFinishing, finishingRating - inactivityDrop);

        // Cap at 99
        bhRating = Math.min(99, Math.round(bhRating));
        shootingRating = Math.min(99, Math.round(shootingRating));
        finishingRating = Math.min(99, Math.round(finishingRating));

        // Overall
        let overall = Math.round(bhRating * 0.33 + shootingRating * 0.34 + finishingRating * 0.33);
        overall = Math.max(40, Math.min(99, overall));

        const newRatings: PlayerRatings = {
          ball_handling: bhRating,
          shooting: shootingRating,
          finishing: finishingRating,
          overall,
        };

        setRatings(newRatings);

        // 7. Upsert to player_ratings
        const { data: existing } = await supabase
          .from("player_ratings" as any)
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("player_ratings" as any)
            .update({
              ball_handling: newRatings.ball_handling,
              shooting: newRatings.shooting,
              finishing: newRatings.finishing,
              overall: newRatings.overall,
              calculated_at: new Date().toISOString(),
            } as any)
            .eq("user_id", user.id);
        } else {
          await supabase
            .from("player_ratings" as any)
            .insert({
              user_id: user.id,
              ball_handling: newRatings.ball_handling,
              shooting: newRatings.shooting,
              finishing: newRatings.finishing,
              overall: newRatings.overall,
            } as any);
        }

        // 8. Fetch game averages
        const { data: games } = await supabase
          .from("game_logs")
          .select("points, rebounds, assists, fg_made, fg_attempted")
          .eq("user_id", user.id);

        if (games && games.length > 0) {
          const count = games.length;
          const totals = games.reduce(
            (acc, g) => ({
              pts: acc.pts + g.points,
              reb: acc.reb + g.rebounds,
              ast: acc.ast + g.assists,
              fgm: acc.fgm + g.fg_made,
              fga: acc.fga + g.fg_attempted,
            }),
            { pts: 0, reb: 0, ast: 0, fgm: 0, fga: 0 }
          );
          setGameAverages({
            ppg: Math.round((totals.pts / count) * 10) / 10,
            rpg: Math.round((totals.reb / count) * 10) / 10,
            apg: Math.round((totals.ast / count) * 10) / 10,
            fgPct: totals.fga > 0 ? Math.round((totals.fgm / totals.fga) * 100) : 0,
          });
        }
      } catch (err) {
        console.error("Rating calculation error:", err);
      } finally {
        setLoading(false);
      }
    };

    calculate();
  }, [user, profile]);

  return { ratings, gameAverages, loading };
}
