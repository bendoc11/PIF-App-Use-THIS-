import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  MockSchool,
  MockCoach,
  normalizeDivision,
  sizeFromEnrollment,
  academicFromGpa,
  stateToCode,
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

async function fetchAllCoaches(): Promise<CoachRow[]> {
  const all: CoachRow[] = [];
  let from = 0;
  // Loop until fewer than PAGE_SIZE rows returned
  // Safety cap: 20 pages (20k rows) — current data ~7.8k
  for (let i = 0; i < 20; i++) {
    const { data, error } = await supabase
      .from("college_coaches")
      .select(
        "school_name,city,state,conference,division,public_private,school_size,avg_gpa,acceptance_rate,yearly_cost,undergrad_enrollment,first_name,last_name,full_name,title,email,phone,gender,latitude,longitude,twitter_individual,instagram_individual,twitter_team,instagram_team"
      )
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
      const enrollment = r.undergrad_enrollment ? parseInt(r.undergrad_enrollment.replace(/[^0-9]/g, ""), 10) : NaN;
      const enrollmentNum = isNaN(enrollment) ? 0 : enrollment;
      const gpaNum = r.avg_gpa ? parseFloat(r.avg_gpa) : NaN;
      const stateName = r.state ?? "";
      const lon = r.longitude == null ? NaN : Number(r.longitude);
      const lat = r.latitude == null ? NaN : Number(r.latitude);
      const coords: [number, number] = [
        Number.isFinite(lon) ? lon : 0,
        Number.isFinite(lat) ? lat : 0,
      ];

      school = {
        id: key.replace(/\s+/g, "-").toLowerCase(),
        name: r.school_name,
        city: r.city ?? "",
        state: stateName,
        stateCode: stateToCode(stateName),
        coordinates: coords,
        division,
        academicLevel: academicFromGpa(isNaN(gpaNum) ? null : gpaNum),
        enrollment: enrollmentNum,
        size: sizeFromEnrollment(enrollmentNum) ?? "Medium",
        avgGpa: isNaN(gpaNum) ? null : gpaNum,
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
  const [schools, setSchools] = useState<MockSchool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const rows = await fetchAllCoaches();
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
  }, []);

  return { schools, loading, error };
}
