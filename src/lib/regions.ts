/**
 * Geographic regions for recommending schools that feel local to the athlete.
 */
export const REGIONS: Record<string, string[]> = {
  Northeast: [
    "Maine", "New Hampshire", "Vermont", "Massachusetts", "Rhode Island",
    "Connecticut", "New York", "New Jersey", "Pennsylvania",
  ],
  "Mid-Atlantic": [
    "Virginia", "West Virginia", "Maryland", "Delaware",
    "North Carolina", "South Carolina", "Washington, D.C.", "District of Columbia",
  ],
  South: [
    "Tennessee", "Kentucky", "Georgia", "Florida", "Alabama",
    "Mississippi", "Louisiana", "Arkansas",
  ],
  Midwest: [
    "Ohio", "Michigan", "Indiana", "Illinois", "Wisconsin",
    "Minnesota", "Iowa", "Missouri",
  ],
  Plains: ["North Dakota", "South Dakota", "Nebraska", "Kansas", "Oklahoma", "Texas"],
  Mountain: [
    "Montana", "Wyoming", "Colorado", "Utah", "Idaho",
    "New Mexico", "Arizona", "Nevada",
  ],
  West: ["Washington", "Oregon", "California", "Alaska", "Hawaii"],
};

export function regionForState(state: string): string | null {
  for (const [region, states] of Object.entries(REGIONS)) {
    if (states.includes(state)) return region;
  }
  return null;
}

export function statesInSameRegion(state: string): string[] {
  const region = regionForState(state);
  if (!region) return [];
  return REGIONS[region];
}
