/**
 * Returns the correct college-coach table for the user's sport.
 * Men's basketball -> college_coaches
 * Women's basketball -> coaches_womens_basketball
 */
export type Sport = "mens_basketball" | "womens_basketball" | null | undefined;

export function getCoachTable(sport: Sport): "college_coaches" | "coaches_womens_basketball" {
  if (sport === "womens_basketball") return "coaches_womens_basketball";
  return "college_coaches";
}
