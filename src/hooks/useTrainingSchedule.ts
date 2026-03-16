import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { generateSchedule, type SessionType } from "@/lib/schedule-utils";

export interface ScheduleEntry {
  id?: string;
  day_of_week: number;
  session_type: SessionType;
}

export interface TrainingLog {
  id: string;
  log_date: string;
  session_type: string;
  status: string;
  duration_minutes: number | null;
  intensity: string | null;
  notes: string | null;
  workout_type: string | null;
}

export function useTrainingSchedule() {
  const { user, profile } = useAuth();
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [todaysLogs, setTodaysLogs] = useState<TrainingLog[]>([]);
  const [weekLogs, setWeekLogs] = useState<TrainingLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  // JS getDay: 0=Sun. We want 0=Mon
  const jsDow = today.getDay();
  const todayDow = jsDow === 0 ? 6 : jsDow - 1;

  // Get Monday of current week
  const mondayDate = new Date(today);
  mondayDate.setDate(today.getDate() - todayDow);
  const mondayStr = mondayDate.toISOString().split("T")[0];
  const sundayDate = new Date(mondayDate);
  sundayDate.setDate(mondayDate.getDate() + 6);
  const sundayStr = sundayDate.toISOString().split("T")[0];

  const fetchSchedule = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [schedRes, todayLogsRes, weekLogsRes] = await Promise.all([
      supabase
        .from("weekly_schedule_templates")
        .select("id, day_of_week, session_type")
        .eq("user_id", user.id)
        .order("day_of_week"),
      supabase
        .from("training_logs")
        .select("*")
        .eq("user_id", user.id)
        .eq("log_date", todayStr),
      supabase
        .from("training_logs")
        .select("*")
        .eq("user_id", user.id)
        .gte("log_date", mondayStr)
        .lte("log_date", sundayStr),
    ]);

    const schedData = (schedRes.data || []) as any[];
    setSchedule(schedData.map((r: any) => ({
      id: r.id,
      day_of_week: r.day_of_week,
      session_type: r.session_type as SessionType,
    })));

    setTodaysLogs((todayLogsRes.data || []) as TrainingLog[]);
    setWeekLogs((weekLogsRes.data || []) as TrainingLog[]);

    // Check if needs setup
    const hasSchedule = schedData.length > 0;
    const setupDone = (profile as any)?.schedule_setup_completed === true;
    setNeedsSetup(!hasSchedule && !setupDone);

    setLoading(false);
  }, [user, profile, todayStr, mondayStr, sundayStr]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const getTodaySession = (): SessionType => {
    const entry = schedule.find((s) => s.day_of_week === todayDow);
    return (entry?.session_type as SessionType) || "rest";
  };

  const isTodayComplete = (): boolean => {
    return todaysLogs.some((l) => l.status === "completed");
  };

  const getWeekCompletionMap = (): Record<number, boolean> => {
    const map: Record<number, boolean> = {};
    weekLogs.forEach((l) => {
      if (l.status === "completed") {
        const d = new Date(l.log_date + "T00:00:00");
        const dow = d.getDay();
        const mappedDow = dow === 0 ? 6 : dow - 1;
        map[mappedDow] = true;
      }
    });
    return map;
  };

  const sessionsLeftThisWeek = (): number => {
    const completionMap = getWeekCompletionMap();
    let count = 0;
    schedule.forEach((s) => {
      if (s.session_type !== "rest" && s.day_of_week >= todayDow && !completionMap[s.day_of_week]) {
        count++;
      }
    });
    return count;
  };

  const generateRecommended = (): SessionType[] => {
    return generateSchedule(profile?.primary_goal || null, profile?.training_days_per_week || null);
  };

  const saveSchedule = async (sessions: SessionType[]) => {
    if (!user) return;
    // Delete existing
    await supabase.from("weekly_schedule_templates").delete().eq("user_id", user.id);
    // Insert new
    const rows = sessions.map((s, i) => ({
      user_id: user.id,
      day_of_week: i,
      session_type: s,
      order_index: i,
    }));
    await supabase.from("weekly_schedule_templates").insert(rows);
    // Mark setup complete
    await supabase.from("profiles").update({ schedule_setup_completed: true } as any).eq("id", user.id);
    await fetchSchedule();
  };

  const logSession = async (params: {
    sessionType: string;
    logDate?: string;
    durationMinutes?: number;
    intensity?: string;
    notes?: string;
    workoutType?: string;
  }) => {
    if (!user) return;
    const { data } = await supabase.from("training_logs").insert({
      user_id: user.id,
      log_date: params.logDate || todayStr,
      session_type: params.sessionType,
      status: "completed",
      duration_minutes: params.durationMinutes || null,
      intensity: params.intensity || null,
      notes: params.notes || null,
      workout_type: params.workoutType || null,
    } as any).select().single();
    await fetchSchedule();
    return data;
  };

  return {
    schedule,
    todaysLogs,
    weekLogs,
    loading,
    needsSetup,
    todayDow,
    getTodaySession,
    isTodayComplete,
    getWeekCompletionMap,
    sessionsLeftThisWeek,
    generateRecommended,
    saveSchedule,
    logSession,
    refresh: fetchSchedule,
  };
}
