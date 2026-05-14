import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Stats {
  messages_this_week: number;
  athletes_replied_this_week: number;
}

/**
 * Subtle rotating ticker showing real platform-wide activity, anonymized.
 * Falls back to a generic line if numbers are too low to be meaningful.
 */
export function SocialProofTicker() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.rpc("get_platform_activity_stats" as any);
      if (cancelled || !data) return;
      const row = Array.isArray(data) ? data[0] : data;
      if (row) {
        setStats({
          messages_this_week: Number(row.messages_this_week) || 0,
          athletes_replied_this_week: Number(row.athletes_replied_this_week) || 0,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const lines: string[] = [];
  if (stats) {
    if (stats.messages_this_week >= 25) {
      lines.push(`Athletes sent ${stats.messages_this_week.toLocaleString()} messages to coaches this week.`);
    }
    if (stats.athletes_replied_this_week >= 3) {
      lines.push(
        `${stats.athletes_replied_this_week} athlete${stats.athletes_replied_this_week === 1 ? "" : "s"} heard back from a coach this week.`,
      );
    }
  }
  if (lines.length === 0) {
    lines.push("Athletes who reach 20+ programs are 4× more likely to hear back.");
    lines.push("Coaches respond fastest to short, personal emails sent before noon.");
  }

  useEffect(() => {
    if (lines.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % lines.length), 5000);
    return () => clearInterval(t);
  }, [lines.length]);

  const current = lines[index % lines.length];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        background: "var(--bg-card, #fff)",
        border: "1px solid var(--border, #D2D2D7)",
        borderRadius: 10,
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        fontSize: 13,
        fontWeight: 500,
        color: "rgba(255,255,255,0.80)",
        marginBottom: 16,
        minHeight: 40,
      }}
      aria-live="polite"
    >
      <span
        aria-hidden
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: "#4ade80",
          flexShrink: 0,
          animation: "rs-live-pulse 2s ease-in-out infinite",
          boxShadow: "0 0 0 0 rgba(74,222,128,0.6)",
        }}
      />
      <style>{`@keyframes rs-live-pulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: 0.7; } }`}</style>
      <span key={current} className="animate-fade-in" style={{ lineHeight: 1.4 }}>
        {current}
      </span>
    </div>
  );
}
