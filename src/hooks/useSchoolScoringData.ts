import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  athleteBucket,
  rosterPositionGroups,
  RosterIntel,
  PositionBucket,
} from "@/lib/schoolScoring";

interface Result {
  rosterMap: Map<string, RosterIntel>;
  notInterestedNames: Set<string>;
  bucket: PositionBucket | null;
}

export function useSchoolScoringData(): Result {
  const { user, profile } = useAuth();
  const userPosition = ((profile as any)?.position as string | undefined) ?? "";
  const bucket = athleteBucket(userPosition);

  const [rosterMap, setRosterMap] = useState<Map<string, RosterIntel>>(new Map());
  const [notInterestedNames, setNotInterestedNames] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!bucket) {
        setRosterMap(new Map());
        return;
      }
      const { data } = await supabase
        .from("school_rosters")
        .select("school_name, position, class_year")
        .in("class_year", ["SR", "JR", "Senior", "Junior", "Sr", "Jr"]);
      if (cancelled || !data) return;
      const map = new Map<string, RosterIntel>();
      const seen = new Set<string>();
      for (const r of data as Array<{ school_name: string | null; position: string | null; class_year: string | null }>) {
        if (!r.school_name) continue;
        const key = r.school_name.toLowerCase().trim();
        seen.add(key);
        const groups = rosterPositionGroups(r.position);
        if (!groups.includes(bucket)) continue;
        const yr = (r.class_year || "").toUpperCase();
        const isSr = yr === "SR" || yr === "SENIOR";
        const isJr = yr === "JR" || yr === "JUNIOR";
        if (!isSr && !isJr) continue;
        const cur = map.get(key) ?? { hasData: true, seniors: 0, juniors: 0 };
        cur.hasData = true;
        if (isSr) cur.seniors += 1;
        else cur.juniors += 1;
        map.set(key, cur);
      }
      for (const k of seen) if (!map.has(k)) map.set(k, { hasData: true, seniors: 0, juniors: 0 });
      setRosterMap(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [bucket]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) {
        setNotInterestedNames(new Set());
        return;
      }
      const { data } = await supabase
        .from("target_schools")
        .select("school_name, classification, status")
        .eq("user_id", user.id);
      if (cancelled || !data) return;
      const s = new Set<string>();
      for (const r of data as Array<{ school_name: string | null; classification: string | null; status: string | null }>) {
        if (!r.school_name) continue;
        if (r.classification === "not_interested" || r.status === "not_interested") {
          s.add(r.school_name);
        }
      }
      setNotInterestedNames(s);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return { rosterMap, notInterestedNames, bucket };
}
