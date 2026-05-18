import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { REGIONS } from "@/lib/regions";
import { PrefsData } from "./StepPrefs";

interface PreviewSchool {
  school_name: string;
  division: string | null;
  state: string | null;
}

interface Props {
  prefs: PrefsData;
  onNext: () => void;
}

function regionsToStates(geoPreference: string): string[] {
  const tokens = (geoPreference || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (tokens.length === 0 || tokens.includes("Open to all") || tokens.includes("Stay close to home")) {
    return [];
  }
  const states = new Set<string>();
  for (const t of tokens) {
    const list = REGIONS[t];
    if (list) list.forEach((s) => states.add(s));
  }
  return Array.from(states);
}

export default function StepMatchReveal({ prefs, onNext }: Props) {
  const [count, setCount] = useState<number | null>(null);
  const [display, setDisplay] = useState(0);
  const [previews, setPreviews] = useState<PreviewSchool[]>([]);

  const states = useMemo(() => regionsToStates(prefs.geoPreference), [prefs.geoPreference]);
  const hasDiv = !!prefs.targetDivision && prefs.targetDivision !== "Open to all";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let q: any = supabase
        .from("college_coaches")
        .select("school_name, division, state", { count: "exact" });
      if (hasDiv) q = q.eq("division", prefs.targetDivision);
      if (states.length > 0) q = q.in("state", states);
      q = q.limit(800);
      const { data, count: c, error } = await q;
      if (cancelled || error) {
        if (!cancelled) {
          setCount(0);
          setPreviews([]);
        }
        return;
      }
      const seen = new Set<string>();
      const uniqueRows: PreviewSchool[] = [];
      for (const r of (data || []) as PreviewSchool[]) {
        const key = `${r.school_name}|${r.state ?? ""}`;
        if (seen.has(key)) continue;
        seen.add(key);
        uniqueRows.push(r);
      }
      const total = uniqueRows.length;
      setCount(total);
      // Take 3 for the blurred preview cards
      setPreviews(uniqueRows.slice(0, 3));
    })();
    return () => {
      cancelled = true;
    };
  }, [prefs.targetDivision, prefs.geoPreference]); // eslint-disable-line

  // Count-up animation (~1.5s)
  useEffect(() => {
    if (count == null) return;
    const start = performance.now();
    const duration = 1500;
    let raf = 0;
    const tick = (t: number) => {
      const pct = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - pct, 3);
      setDisplay(Math.round(eased * count));
      if (pct < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [count]);

  return (
    <div className="min-h-[100dvh] flex flex-col px-6 pt-16 pb-32">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col items-center text-center">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-[11px] font-heading tracking-[0.18em] text-primary uppercase mb-8"
        >
          Based on your profile
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="font-heading text-foreground tabular-nums leading-none"
          style={{
            fontSize: "clamp(96px, 22vw, 144px)",
            letterSpacing: "-0.04em",
            textShadow: "0 0 60px hsl(5 78% 55% / 0.35)",
          }}
        >
          {count == null ? "—" : display.toLocaleString()}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-base text-muted-foreground mt-4 max-w-sm leading-relaxed"
        >
          programs are recruiting your position right now
        </motion.p>

        {/* Blurred preview cards */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="w-full mt-10 space-y-2.5"
        >
          {(previews.length > 0
            ? previews
            : [
                { school_name: "Preview School", division: prefs.targetDivision || "D1", state: "" },
                { school_name: "Preview School", division: prefs.targetDivision || "D1", state: "" },
                { school_name: "Preview School", division: prefs.targetDivision || "D1", state: "" },
              ]
          ).map((s, i) => (
            <div
              key={i}
              className="relative rounded-xl border border-border bg-card p-4 text-left overflow-hidden"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-heading text-foreground truncate">
                    {s.school_name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {[s.division, s.state].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div
                  className="flex items-center gap-1.5 text-[11px] font-heading uppercase tracking-wider text-muted-foreground"
                  style={{
                    filter: "blur(4px)",
                    userSelect: "none",
                  }}
                  aria-hidden
                >
                  <Lock className="h-3 w-3" /> coach@school.edu
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 p-5 bg-background/95 backdrop-blur-sm z-20"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
        <div className="max-w-md mx-auto">
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.9 }}
            whileTap={{ scale: 0.97 }}
            onClick={onNext}
            className="w-full h-14 rounded-xl bg-primary text-primary-foreground glow-red text-base font-heading flex items-center justify-center gap-2"
          >
            See My Matches <ArrowRight className="h-4 w-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
