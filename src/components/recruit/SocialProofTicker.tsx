import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
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
        fontSize: 12.5,
        color: "var(--text-secondary, #6E6E73)",
        marginBottom: 16,
        minHeight: 40,
      }}
      aria-live="polite"
    >
      <TrendingUp className="h-3.5 w-3.5 shrink-0" style={{ color: "#0E7A3B" }} />
      <span key={current} className="animate-fade-in" style={{ lineHeight: 1.4 }}>
        {current}
      </span>
    </div>
  );
}
