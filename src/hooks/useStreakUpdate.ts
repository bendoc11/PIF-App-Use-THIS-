import { supabase } from "@/integrations/supabase/client";

/**
 * Streak logic — uses UTC dates consistently to avoid timezone bugs.
 * 
 * - Different date from last_drill_date → increment streak, animate
 * - Same date → no increment, static
 * - More than 1 calendar day gap → reset to 1
 */
export async function updateStreak(userId: string): Promise<{ newStreak: number; animated: boolean }> {
  const todayUTC = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

  const { data: profile } = await supabase
    .from("profiles")
    .select("streak_days, last_drill_date")
    .eq("id", userId)
    .single();

  if (!profile) return { newStreak: 1, animated: true };

  const lastDate = profile.last_drill_date as string | null;
  const currentStreak = profile.streak_days || 0;

  if (lastDate === todayUTC) {
    // Same day — no change
    return { newStreak: currentStreak, animated: false };
  }

  let newStreak: number;

  if (!lastDate) {
    // First ever drill
    newStreak = 1;
  } else {
    // Calculate day difference in UTC
    const last = new Date(lastDate + "T00:00:00Z");
    const today = new Date(todayUTC + "T00:00:00Z");
    const diffDays = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      newStreak = currentStreak + 1;
    } else {
      // Gap > 1 day — reset
      newStreak = 1;
    }
  }

  await supabase
    .from("profiles")
    .update({ streak_days: newStreak, last_drill_date: todayUTC })
    .eq("id", userId);

  return { newStreak, animated: true };
}
