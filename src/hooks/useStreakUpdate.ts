import { supabase } from "@/integrations/supabase/client";

/**
 * Streak logic — uses the user's LOCAL calendar date for comparisons.
 *
 * - Same local date as last_drill_date → no increment, static
 * - Next calendar day → increment streak
 * - Gap > 1 calendar day → reset to 1
 */
export async function updateStreak(userId: string): Promise<{ newStreak: number; animated: boolean }> {
  // Use user's local date, formatted as YYYY-MM-DD
  const now = new Date();
  const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const { data: profile } = await supabase
    .from("profiles")
    .select("streak_days, last_drill_date")
    .eq("id", userId)
    .single();

  if (!profile) return { newStreak: 1, animated: true };

  const lastDate = profile.last_drill_date as string | null;
  const currentStreak = profile.streak_days || 0;

  if (lastDate === todayLocal) {
    // Same day — no change
    return { newStreak: currentStreak, animated: false };
  }

  let newStreak: number;

  if (!lastDate) {
    // First ever drill
    newStreak = 1;
  } else {
    // Calculate day difference using local midnight dates
    const lastParts = lastDate.split("-").map(Number);
    const lastMidnight = new Date(lastParts[0], lastParts[1] - 1, lastParts[2]);
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.round((todayMidnight.getTime() - lastMidnight.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      newStreak = currentStreak + 1;
    } else {
      // Gap > 1 day — reset
      newStreak = 1;
    }
  }

  await supabase
    .from("profiles")
    .update({ streak_days: newStreak, last_drill_date: todayLocal })
    .eq("id", userId);

  return { newStreak, animated: true };
}
