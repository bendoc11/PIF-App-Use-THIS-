import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const FALLBACK = [
  "Duke University has 2 Point Guard openings in 2026 — D1",
  "Penn State has 3 Guard spots available — D1",
  "Elon University has 2 Small Forward openings — D1",
  "Villanova has 1 Center opening in 2026 — D1",
  "Drexel University has 4 Guard openings — D1",
  "Hofstra has 2 Forward spots available — D1",
  "James Madison has 3 Guard openings in 2026 — D1",
  "UMBC has 2 Point Guard spots — D1",
  "High Point has 3 Wing openings — D1",
  "Longwood has 2 Guard spots available — D1",
];

const POS_MAP: Record<string, string> = {
  G: "Guard", F: "Forward", C: "Center",
  "G/F": "Guard/Forward", "F/C": "Forward/Center",
  PG: "Point Guard", SG: "Shooting Guard", SF: "Small Forward", PF: "Power Forward",
};

function expandPos(p?: string | null) {
  if (!p) return "Player";
  return POS_MAP[p.trim()] || p;
}

function shortDiv(d?: string | null) {
  if (!d) return "";
  return d.replace(/NCAA\s*/i, "").trim();
}

const CACHE_KEY = "offered:ticker:v1";
const CACHE_TTL = 24 * 60 * 60 * 1000;

export function LiveOpeningsTicker() {
  const [items, setItems] = useState<string[]>(FALLBACK);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.ts && Date.now() - parsed.ts < CACHE_TTL && Array.isArray(parsed.items) && parsed.items.length >= 10) {
          setItems(parsed.items);
          return;
        }
      }
    } catch {}

    (async () => {
      const { data, error } = await (supabase as any).rpc("get_ticker_openings");
      let lines: string[] = [];
      if (!error && Array.isArray(data)) {
        lines = data.map((r: any) =>
          `${r.school_name} has ${r.graduating_count} ${expandPos(r.position)} spot${r.graduating_count > 1 ? "s" : ""} opening in ${r.graduation_year} — ${shortDiv(r.division)}`
        );
      }
      if (lines.length < 10) lines = FALLBACK;
      setItems(lines);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), items: lines })); } catch {}
    })();
  }, []);

  // Duplicate items for seamless loop
  const loop = [...items, ...items];

  return (
    <div className="relative w-full overflow-hidden border-b border-white/10" style={{ background: "#0A0F1E", height: 44 }}>
      <div className="absolute inset-y-0 left-0 w-[3px]" style={{ background: "hsl(var(--primary))" }} />
      <div className="flex items-center h-full">
        <div className="flex items-center gap-3 px-4 h-full border-r border-white/10 shrink-0 bg-[#0A0F1E] z-10">
          <span className="text-primary font-bold uppercase tracking-[0.15em]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10 }}>
            ● LIVE OPENINGS
          </span>
        </div>
        <div className="relative flex-1 overflow-hidden">
          <div
            className="flex whitespace-nowrap items-center"
            style={{ animation: "ticker-scroll 120s linear infinite" }}
          >
            {loop.map((t, i) => (
              <span key={i} className="flex items-center text-white/85 text-[13px]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <span className="px-6">🏀 {t}</span>
                <span className="text-white/30">•</span>
              </span>
            ))}
          </div>
        </div>
      </div>
      <style>{`@keyframes ticker-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
    </div>
  );
}
