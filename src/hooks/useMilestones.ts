import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Returns helpers for one-time milestone celebrations.
 *
 * - `achieved`: set of milestone keys the user has already seen.
 * - `claim(key)`: marks a milestone as achieved (idempotent). Returns true the
 *   first time it actually inserted (i.e. the celebration should fire), false
 *   on subsequent calls.
 * - `loaded`: true once the initial fetch resolves.
 */
export function useMilestones() {
  const { user } = useAuth();
  const [achieved, setAchieved] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
      setAchieved(new Set());
      setLoaded(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("user_milestones" as any)
        .select("milestone_key")
        .eq("user_id", user.id);
      if (cancelled) return;
      const set = new Set<string>((data ?? []).map((r: any) => r.milestone_key));
      setAchieved(set);
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const claim = useCallback(
    async (key: string): Promise<boolean> => {
      if (!user) return false;
      if (achieved.has(key)) return false;
      // Optimistically mark — guard against duplicate fires within the same session.
      setAchieved((prev) => {
        const next = new Set(prev);
        next.add(key);
        return next;
      });
      const { error } = await supabase
        .from("user_milestones" as any)
        .insert({ user_id: user.id, milestone_key: key });
      // PK conflict means another tab already claimed it — that's fine.
      if (error && !`${error.message}`.toLowerCase().includes("duplicate")) {
        // eslint-disable-next-line no-console
        console.warn("milestone insert failed", error);
      }
      return true;
    },
    [user?.id, achieved],
  );

  return { achieved, loaded, claim };
}

/** ISO week key like "2026-W20" using local time. */
export function currentWeekKey(d = new Date()): string {
  // Monday-based week
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = (date.getUTCDay() + 6) % 7; // 0=Mon
  date.setUTCDate(date.getUTCDate() - day + 3); // Thursday in this week
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week =
    1 +
    Math.round(
      ((date.getTime() - firstThursday.getTime()) / 86400000 -
        3 +
        ((firstThursday.getUTCDay() + 6) % 7)) /
        7,
    );
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
