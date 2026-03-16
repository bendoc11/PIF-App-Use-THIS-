import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  generateMultiSessionSchedule,
  getSessionsForDay,
  getNonRestSessionsForDay,
  type SessionType,
  type ScheduleRow,
} from "@/lib/schedule-utils";

export interface ScheduleEntry {
  id?: string;
  day_of_week: number;
  session_type: SessionType;
  order_index: number;
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
  const jsDow = today.getDay();
  const todayDow = jsDow === 0 ? 6 : jsDow - 1;

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
        .select("id, day_of_week, session_type, order_index")
        .eq("user_id", user.id)
        .order("day_of_week")
        .order("order_index"),
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
    setSchedule(
      schedData.map((r: any) => ({
        id: r.id,
        day_of_week: r.day_of_week,
        session_type: r.session_type as SessionType,
        order_index: r.order_index ?? 0,
      }))
    );

    setTodaysLogs((todayLogsRes.data || []) as TrainingLog[]);
    setWeekLogs((weekLogsRes.data || []) as TrainingLog[]);

    const hasSchedule = schedData.length > 0;
    const setupDone = (profile as any)?.schedule_setup_completed === true;
    setNeedsSetup(!hasSchedule && !setupDone);

    setLoading(false);
  }, [user, profile, todayStr, mondayStr, sundayStr]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const getTodaySessions = (): ScheduleEntry[] => {
    return schedule
      .filter((s) => s.day_of_week === todayDow)
      .sort((a, b) => a.order_index - b.order_index);
  };

  const getTodaySession = (): SessionType => {
    const sessions = getTodaySessions();
    if (sessions.length === 0) return "rest";
    return sessions[0].session_type;
  };

  const isSessionComplete = (sessionType: string, date?: string): boolean => {
    const logs = date ? weekLogs.filter((l) => l.log_date === date) : todaysLogs;
    return logs.some(
      (l) => l.status === "completed" && l.session_type === sessionType
    );
  };

  const isTodayComplete = (): boolean => {
    const sessions = getTodaySessions();
    const nonRest = sessions.filter((s) => s.session_type !== "rest");
    if (nonRest.length === 0) return true;
    return nonRest.every((s) =>
      todaysLogs.some(
        (l) => l.status === "completed" && l.session_type === s.session_type
      )
    );
  };

  const getWeekCompletionMap = (): Record<number, "complete" | "partial" | "none"> => {
    const map: Record<number, "complete" | "partial" | "none"> = {};
    for (let dow = 0; dow < 7; dow++) {
      const daySessions = schedule.filter((s) => s.day_of_week === dow);
      const nonRest = daySessions.filter((s) => s.session_type !== "rest");

      if (nonRest.length === 0) {
        map[dow] = "complete"; // rest days are "complete"
        continue;
      }

      // Get date for this dow
      const dayDate = new Date(mondayDate);
      dayDate.setDate(mondayDate.getDate() + dow);
      const dayStr = dayDate.toISOString().split("T")[0];

      const completedTypes = new Set(
        weekLogs
          .filter((l) => l.log_date === dayStr && l.status === "completed")
          .map((l) => l.session_type)
      );

      const completedCount = nonRest.filter((s) =>
        completedTypes.has(s.session_type)
      ).length;

      if (completedCount === 0) map[dow] = "none";
      else if (completedCount >= nonRest.length) map[dow] = "complete";
      else map[dow] = "partial";
    }
    return map;
  };

  const sessionsLeftThisWeek = (): number => {
    const completionMap = getWeekCompletionMap();
    let count = 0;
    for (let dow = todayDow; dow < 7; dow++) {
      const daySessions = schedule.filter((s) => s.day_of_week === dow);
      const nonRest = daySessions.filter((s) => s.session_type !== "rest");

      const dayDate = new Date(mondayDate);
      dayDate.setDate(mondayDate.getDate() + dow);
      const dayStr = dayDate.toISOString().split("T")[0];

      const completedTypes = new Set(
        weekLogs
          .filter((l) => l.log_date === dayStr && l.status === "completed")
          .map((l) => l.session_type)
      );

      nonRest.forEach((s) => {
        if (!completedTypes.has(s.session_type)) count++;
      });
    }
    return count;
  };

  const generateRecommended = (): ScheduleRow[] => {
    return generateMultiSessionSchedule(profile?.primary_goal || null);
  };

  const saveSchedule = async (rows: ScheduleRow[]) => {
    if (!user) return;
    await supabase.from("weekly_schedule_templates").delete().eq("user_id", user.id);
    const insertRows = rows.map((r) => ({
      user_id: user.id,
      day_of_week: r.day_of_week,
      session_type: r.session_type,
      order_index: r.order_index,
    }));
    await supabase.from("weekly_schedule_templates").insert(insertRows);
    await supabase
      .from("profiles")
      .update({ schedule_setup_completed: true } as any)
      .eq("id", user.id);
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
    const { data } = await supabase
      .from("training_logs")
      .insert({
        user_id: user.id,
        log_date: params.logDate || todayStr,
        session_type: params.sessionType,
        status: "completed",
        duration_minutes: params.durationMinutes || null,
        intensity: params.intensity || null,
        notes: params.notes || null,
        workout_type: params.workoutType || null,
      } as any)
      .select()
      .single();
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
    getTodaySessions,
    isSessionComplete,
    isTodayComplete,
    getWeekCompletionMap,
    sessionsLeftThisWeek,
    generateRecommended,
    saveSchedule,
    logSession,
    refresh: fetchSchedule,
  };
}
