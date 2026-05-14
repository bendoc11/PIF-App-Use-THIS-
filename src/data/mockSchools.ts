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
  conference?: string | null;
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
  const v = (name || "").trim();
  if (!v) return "";
  const upper = v.toUpperCase();
  // Already a 2-letter code, regardless of source casing/spacing.
  if (/^[A-Z]{2}$/.test(upper)) return upper;
  const normalizedName = v
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
  return STATE_TO_CODE[v] ?? STATE_TO_CODE[normalizedName] ?? upper.slice(0, 2);
}

const CODE_TO_STATE: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_TO_CODE).map(([k, v]) => [v, k]),
);

/** Convert any input (full name or 2-letter code) to full state name. */
export function toStateName(raw: string | null | undefined): string {
  if (!raw) return "";
  const v = raw.trim();
  if (v.length === 2) return CODE_TO_STATE[v.toUpperCase()] ?? v.toUpperCase();
  return v
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/** Approximate [lon, lat] center for each US state — fallback when DB lacks coords. */
export const STATE_CENTROIDS: Record<string, [number, number]> = {
  AL: [-86.79, 32.81], AK: [-152.40, 61.38], AZ: [-111.66, 33.73],
  AR: [-92.44, 34.97], CA: [-119.68, 36.12], CO: [-105.31, 39.06],
  CT: [-72.76, 41.60], DE: [-75.51, 38.99], FL: [-81.69, 27.77],
  GA: [-83.64, 33.04], HI: [-157.50, 21.09], ID: [-114.48, 44.24],
  IL: [-88.99, 40.35], IN: [-86.26, 39.85], IA: [-93.21, 42.01],
  KS: [-96.73, 38.53], KY: [-84.67, 37.67], LA: [-91.87, 31.17],
  ME: [-69.38, 44.69], MD: [-76.80, 39.06], MA: [-71.53, 42.23],
  MI: [-84.54, 43.33], MN: [-93.90, 45.69], MS: [-89.68, 32.74],
  MO: [-92.29, 38.46], MT: [-110.45, 46.92], NE: [-98.27, 41.13],
  NV: [-117.06, 38.31], NH: [-71.56, 43.45], NJ: [-74.52, 40.30],
  NM: [-106.25, 34.84], NY: [-74.95, 42.17], NC: [-79.81, 35.63],
  ND: [-99.78, 47.53], OH: [-82.76, 40.39], OK: [-96.93, 35.57],
  OR: [-122.07, 44.57], PA: [-77.21, 40.59], RI: [-71.51, 41.68],
  SC: [-80.95, 33.86], SD: [-99.44, 44.30], TN: [-86.69, 35.75],
  TX: [-97.56, 31.05], UT: [-111.86, 40.15], VT: [-72.71, 44.04],
  VA: [-78.17, 37.77], WA: [-121.49, 47.40], WV: [-80.95, 38.49],
  WI: [-89.62, 44.27], WY: [-107.30, 42.75], DC: [-77.03, 38.90],
};

/** Normalize raw DB division strings to our 5 buckets. */
export function normalizeDivision(raw: string | null | undefined): Division | null {
  if (!raw) return null;
  const v = raw.trim().toUpperCase().replace(/[\s-]+/g, " ");
  if (["NCAA D1", "NCAA DI", "NCAA DIVISION I", "DIVISION I", "D1", "DI"].includes(v)) return "D1";
  if (["NCAA DII", "NCAA D2", "NCAA DIVISION II", "DIVISION II", "D2", "DII"].includes(v)) return "D2";
  if (["NCAA DIII", "NCAA D3", "NCAA DIVISION III", "DIVISION III", "D3", "DIII"].includes(v)) return "D3";
  if (v.includes("NAIA")) return "NAIA";
  if (v.startsWith("JC") || v.includes("JUCO") || v.includes("JUNIOR COLLEGE")) return "JUCO";
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
