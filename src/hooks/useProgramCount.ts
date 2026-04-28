import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Module-level cache so we only hit the DB once per session.
let cached: number | null = null;
let inFlight: Promise<number> | null = null;

const FALLBACK = 1850;

async function loadCount(): Promise<number> {
  if (cached !== null) return cached;
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      // Distinct school_name count via PostgREST head request isn't supported,
      // so we approximate with row-level group count via RPC-free path:
      // request only school_name, then unique client-side. Cheap enough.
      const { data, error } = await supabase
        .from("college_coaches")
        .select("school_name");
      if (error || !data) return FALLBACK;
      const unique = new Set(data.map((r: any) => r.school_name)).size;
      cached = unique || FALLBACK;
      return cached;
    } catch {
      return FALLBACK;
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

/** Returns the number of distinct college programs available on the platform. */
export function useProgramCount(): number {
  const [count, setCount] = useState<number>(cached ?? FALLBACK);
  useEffect(() => {
    let alive = true;
    loadCount().then((n) => {
      if (alive) setCount(n);
    });
    return () => {
      alive = false;
    };
  }, []);
  return count;
}

/** Format a number with thousands separators (e.g. 1850 → "1,850"). */
export function formatProgramCount(n: number): string {
  return n.toLocaleString("en-US");
}
