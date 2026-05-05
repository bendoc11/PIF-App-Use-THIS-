import { supabase } from "@/integrations/supabase/client";

export interface MatchedCoach {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  title: string | null;
  email: string | null;
  school_name: string | null;
  state: string | null;
  city: string | null;
  division: string | null;
  conference: string | null;
  avg_gpa: string | null;
}

const REGION_TO_STATES: Record<string, string[]> = {
  Northeast: ["CT", "ME", "MA", "NH", "NJ", "NY", "PA", "RI", "VT"],
  Southeast: ["AL", "AR", "FL", "GA", "KY", "LA", "MS", "NC", "SC", "TN", "VA", "WV"],
  South: ["TX", "OK", "AL", "AR", "LA", "MS", "TN", "KY", "FL", "GA"],
  Midwest: ["IL", "IN", "IA", "KS", "MI", "MN", "MO", "NE", "ND", "OH", "SD", "WI"],
  Southwest: ["AZ", "NM", "TX", "OK"],
  West: ["AK", "CA", "CO", "HI", "ID", "MT", "NV", "OR", "UT", "WA", "WY"],
};

function divisionMatchClause(target: string | null): string[] | null {
  if (!target || /open/i.test(target)) return null;
  const t = target.toUpperCase();
  if (t.includes("D1")) return ["NCAA D1"];
  if (t.includes("D2")) return ["NCAA DII"];
  if (t.includes("D3")) return ["NCAA DIII"];
  if (t.includes("NAIA")) return ["NAIA"];
  if (t.includes("JUCO") || t.includes("JC")) return ["JC", "JC-CCCAA", "JC-D1", "JC-D2", "JC-D3", "JC-NWAC"];
  return null;
}

function statesFromGeoPreference(geo: string | null): string[] | null {
  if (!geo || /open/i.test(geo)) return null;
  const regions = geo.split(/,\s*/).map((r) => r.trim());
  const states = new Set<string>();
  for (const r of regions) {
    const list = REGION_TO_STATES[r];
    if (list) list.forEach((s) => states.add(s));
  }
  return states.size > 0 ? Array.from(states) : null;
}

async function fetchCoaches(opts: {
  divisions: string[] | null;
  states: string[] | null;
  limit: number;
}): Promise<MatchedCoach[]> {
  let q = supabase
    .from("college_coaches")
    .select("id, full_name, first_name, last_name, title, email, school_name, state, city, division, conference, avg_gpa")
    .not("email", "is", null)
    .limit(opts.limit);
  if (opts.divisions && opts.divisions.length > 0) q = q.in("division", opts.divisions);
  if (opts.states && opts.states.length > 0) q = q.in("state", opts.states);
  const { data, error } = await q;
  if (error) {
    console.warn("[coach-matching] fetch failed", error);
    return [];
  }
  return (data ?? []) as MatchedCoach[];
}

/** Find 5 coach matches with progressive filter loosening. */
export async function findMatchedCoaches(profile: {
  target_division?: string | null;
  geo_preference?: string | null;
  gpa?: number | string | null;
}): Promise<MatchedCoach[]> {
  const divisions = divisionMatchClause(profile.target_division ?? null);
  const states = statesFromGeoPreference(profile.geo_preference ?? null);

  // Tier 1: division + region
  let results = await fetchCoaches({ divisions, states, limit: 25 });
  if (results.length >= 5) return pickFive(results);

  // Tier 2: division only
  if (results.length < 5 && states) {
    const more = await fetchCoaches({ divisions, states: null, limit: 25 });
    results = dedupe([...results, ...more]);
    if (results.length >= 5) return pickFive(results);
  }

  // Tier 3: region only
  if (results.length < 5 && divisions) {
    const more = await fetchCoaches({ divisions: null, states, limit: 25 });
    results = dedupe([...results, ...more]);
    if (results.length >= 5) return pickFive(results);
  }

  // Tier 4: any
  if (results.length < 5) {
    const more = await fetchCoaches({ divisions: null, states: null, limit: 25 });
    results = dedupe([...results, ...more]);
  }
  return pickFive(results);
}

function dedupe(list: MatchedCoach[]): MatchedCoach[] {
  const seen = new Set<string>();
  const out: MatchedCoach[] = [];
  for (const c of list) {
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    out.push(c);
  }
  return out;
}

function pickFive(list: MatchedCoach[]): MatchedCoach[] {
  // Prefer one coach per school for variety.
  const bySchool = new Map<string, MatchedCoach>();
  for (const c of list) {
    const key = c.school_name ?? c.id;
    if (!bySchool.has(key)) bySchool.set(key, c);
    if (bySchool.size >= 5) break;
  }
  const out = Array.from(bySchool.values());
  // Backfill if unique-school list < 5
  if (out.length < 5) {
    for (const c of list) {
      if (out.find((x) => x.id === c.id)) continue;
      out.push(c);
      if (out.length >= 5) break;
    }
  }
  return out.slice(0, 5);
}

export async function ensureMatchedCoaches(userId: string, profile: any): Promise<MatchedCoach[]> {
  const existing: MatchedCoach[] = Array.isArray(profile?.matched_coaches) ? profile.matched_coaches : [];
  if (existing.length >= 5) return existing.slice(0, 5);

  const matches = await findMatchedCoaches({
    target_division: profile?.target_division,
    geo_preference: profile?.geo_preference,
    gpa: profile?.gpa,
  });
  if (matches.length > 0) {
    await supabase
      .from("profiles")
      .update({ matched_coaches: matches as any })
      .eq("id", userId);
  }
  return matches;
}
