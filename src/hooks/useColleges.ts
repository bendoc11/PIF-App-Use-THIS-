import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getCoachTable } from "@/lib/getCoachTable";
import {
  MockSchool,
  MockCoach,
  normalizeDivision,
  sizeFromEnrollment,
  academicFromGpa,
  stateToCode,
  toStateName,
  STATE_CENTROIDS,
} from "@/data/mockSchools";

interface CoachRow {
  school_name: string | null;
  city: string | null;
  state: string | null;
  conference: string | null;
  division: string | null;
  public_private: string | null;
  school_size: string | null;
  avg_gpa: string | null;
  acceptance_rate: string | null;
  yearly_cost: string | null;
  undergrad_enrollment: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  gender: string | null;
  latitude: number | null;
  longitude: number | null;
  twitter_individual: string | null;
  instagram_individual: string | null;
  twitter_team: string | null;
  instagram_team: string | null;
}

const PAGE_SIZE = 1000;

function parseDbNumber(value: string | null): number | null {
  if (!value) return null;
  const normalized = value.replace(/,/g, "").trim();
  const match = normalized.match(/\d+(?:\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function spreadAroundState([lon, lat]: [number, number], seed: string): [number, number] {
  const hash = hashString(seed);
  const x = ((hash & 0xffff) / 0xffff - 0.5) * 4.8;
  const y = (((hash >>> 16) & 0xffff) / 0xffff - 0.5) * 2.8;
  return [Number((lon + x).toFixed(4)), Number((lat + y).toFixed(4))];
}

async function fetchAllCoaches(table: "college_coaches" | "coaches_womens_basketball"): Promise<CoachRow[]> {
  const all: CoachRow[] = [];
  let from = 0;
  // Loop until fewer than PAGE_SIZE rows returned
  // Safety cap: 20 pages (20k rows)
  for (let i = 0; i < 20; i++) {
    const { data, error } = await (supabase as any)
      .from(table)
      .select(
        "school_name,city,state,conference,division,public_private,school_size,avg_gpa,acceptance_rate,yearly_cost,undergrad_enrollment,first_name,last_name,full_name,title,email,phone,gender,latitude,longitude,twitter_individual,instagram_individual,twitter_team,instagram_team"
      )
      .order("school_name", { ascending: true })
      .order("state", { ascending: true })
      .order("full_name", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...(data as CoachRow[]));
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return all;
}

function groupRowsToSchools(rows: CoachRow[]): MockSchool[] {
  const map = new Map<string, MockSchool>();

  for (const r of rows) {
    const division = normalizeDivision(r.division);
    if (!division) continue;
    if (!r.school_name) continue;

    const key = `${r.school_name}|${r.state ?? ""}`;
    let school = map.get(key);

    if (!school) {
      const enrollmentNum = parseDbNumber(r.undergrad_enrollment) ?? 0;
      const gpaNum = parseDbNumber(r.avg_gpa);
      const stateName = toStateName(r.state);
      const stateCode = stateToCode(r.state ?? "");
      const lon = r.longitude == null ? NaN : Number(r.longitude);
      const lat = r.latitude == null ? NaN : Number(r.latitude);
      const fallback = STATE_CENTROIDS[stateCode];
      const coords: [number, number] =
        Number.isFinite(lon) && Number.isFinite(lat) && (lon !== 0 || lat !== 0)
          ? [lon, lat]
          : fallback
            ? spreadAroundState(fallback, key)
            : [0, 0];

      school = {
        id: key.replace(/\s+/g, "-").toLowerCase(),
        name: r.school_name,
        city: r.city ?? "",
        state: stateName,
        stateCode,
        coordinates: coords,
        division,
        academicLevel: academicFromGpa(gpaNum),
        enrollment: enrollmentNum,
        size: sizeFromEnrollment(enrollmentNum) ?? "Medium",
        avgGpa: gpaNum,
        conference: r.conference || null,
        coaches: [],
        teamTwitter: r.twitter_team || undefined,
        teamInstagram: r.instagram_team || undefined,
      };
      map.set(key, school);
    }

    const name =
      r.full_name ||
      [r.first_name, r.last_name].filter(Boolean).join(" ") ||
      "Unknown";
    const email = r.email || `${name.toLowerCase().replace(/\s+/g, ".")}@${(r.school_name || "school").toLowerCase().replace(/[^a-z]/g, "")}.edu`;

    const coach: MockCoach = {
      name,
      title: r.title || "Coach",
      email,
      phone: r.phone || undefined,
      twitter: r.twitter_individual || undefined,
      instagram: r.instagram_individual || undefined,
    };
    school.coaches.push(coach);
  }

  // Filter out schools that have no usable coordinates (can't show on map)
  // but still include them in the list — UsMap already skips invalid ones.
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function useColleges() {
  const { user, profile } = useAuth();
  const sport = (profile as any)?.sport ?? "mens_basketball";
  const table = getCoachTable(sport);
  const [schools, setSchools] = useState<MockSchool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait until auth is ready — RLS requires an authenticated session,
    // otherwise we'd silently get 0 rows on first login.
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const rows = await fetchAllCoaches(table);
        if (cancelled) return;
        setSchools(groupRowsToSchools(rows));
      } catch (e: any) {
        if (cancelled) return;
        setError(e.message || "Failed to load colleges");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [table, user?.id]);

  return { schools, loading, error };
}
