// Shared types and constants for the Recruit feature.
// Real data is now loaded from the `college_coaches` table.

export type Division = "D1" | "D2" | "D3" | "JUCO" | "NAIA";
export type SchoolSize = "Small" | "Medium" | "Large";
export type AcademicLevel = "Good" | "Great" | "Elite";

export interface MockCoach {
  name: string;
  title: string;
  email: string;
  phone?: string;
  twitter?: string;
  instagram?: string;
}

export interface MockSchool {
  id: string;
  name: string;
  city: string;
  state: string;
  stateCode: string;
  /** [longitude, latitude] */
  coordinates: [number, number];
  division: Division;
  academicLevel: AcademicLevel;
  enrollment: number;
  size: SchoolSize;
  avgGpa: number | null;
  coaches: MockCoach[];
  teamTwitter?: string;
  teamInstagram?: string;
}

export const DIVISION_COLORS: Record<Division, string> = {
  D1: "#2563eb",   // blue-600
  D2: "#16a34a",   // green-600
  D3: "#ea580c",   // orange-600
  JUCO: "#9333ea", // purple-600
  NAIA: "#6b7280", // gray-500
};

export const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware",
  "Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky",
  "Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri",
  "Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York",
  "North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island",
  "South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington",
  "West Virginia","Wisconsin","Wyoming",
];

const STATE_TO_CODE: Record<string, string> = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA",
  Colorado: "CO", Connecticut: "CT", Delaware: "DE", Florida: "FL", Georgia: "GA",
  Hawaii: "HI", Idaho: "ID", Illinois: "IL", Indiana: "IN", Iowa: "IA", Kansas: "KS",
  Kentucky: "KY", Louisiana: "LA", Maine: "ME", Maryland: "MD", Massachusetts: "MA",
  Michigan: "MI", Minnesota: "MN", Mississippi: "MS", Missouri: "MO", Montana: "MT",
  Nebraska: "NE", Nevada: "NV", "New Hampshire": "NH", "New Jersey": "NJ",
  "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND",
  Ohio: "OH", Oklahoma: "OK", Oregon: "OR", Pennsylvania: "PA", "Rhode Island": "RI",
  "South Carolina": "SC", "South Dakota": "SD", Tennessee: "TN", Texas: "TX",
  Utah: "UT", Vermont: "VT", Virginia: "VA", Washington: "WA",
  "West Virginia": "WV", Wisconsin: "WI", Wyoming: "WY",
};

export function stateToCode(name: string): string {
  return STATE_TO_CODE[name] ?? name.slice(0, 2).toUpperCase();
}

/** Normalize raw DB division strings to our 5 buckets. */
export function normalizeDivision(raw: string | null | undefined): Division | null {
  if (!raw) return null;
  const v = raw.trim().toUpperCase();
  if (v === "NCAA D1" || v === "NCAA DI" || v === "D1") return "D1";
  if (v === "NCAA DII" || v === "NCAA D2" || v === "D2") return "D2";
  if (v === "NCAA DIII" || v === "NCAA D3" || v === "D3") return "D3";
  if (v === "NAIA") return "NAIA";
  if (v.startsWith("JC") || v === "JUCO") return "JUCO";
  return null;
}

/** Bucket enrollment number into school size. */
export function sizeFromEnrollment(n: number | null): SchoolSize | null {
  if (n == null || isNaN(n)) return null;
  if (n < 3000) return "Small";
  if (n <= 10000) return "Medium";
  return "Large";
}

/** Bucket GPA into academic level. */
export function academicFromGpa(g: number | null): AcademicLevel {
  if (g == null || isNaN(g)) return "Good";
  if (g >= 3.7) return "Elite";
  if (g >= 3.3) return "Great";
  return "Good";
}
