import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Target, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface ShotResult {
  id: string;
  drill_id: string;
  shots_made: number;
  shots_attempted: number;
  shooting_percentage: number;
  completed_at: string;
  drills: { title: string } | null;
}

type ShotCategory = "3PT" | "MID" | "FT" | "Other";

const CATEGORY_COLORS: Record<ShotCategory, string> = {
  "3PT": "hsl(210 90% 56%)",
  "MID": "hsl(45 93% 58%)",
  "FT": "hsl(142 71% 45%)",
  "Other": "hsl(0 0% 50%)",
};

function categorize(title: string): ShotCategory {
  const t = title.toLowerCase();
  if (t.includes("3") || t.includes("three")) return "3PT";
  if (t.includes("free throw") || t.includes("ft") || t.includes("foul")) return "FT";
  if (t.includes("mid") || t.includes("pull up") || t.includes("pull-up") || t.includes("pullup") || t.includes("elbow") || t.includes("baseline")) return "MID";
  return "Other";
}

export function ShootingTracker() {
  const { user } = useAuth();
  const [results, setResults] = useState<ShotResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("drill_shot_results" as any)
      .select("id, drill_id, shots_made, shots_attempted, shooting_percentage, completed_at, drills(title)")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .then(({ data }: any) => {
        if (data) setResults(data);
        setLoading(false);
      });
  }, [user]);

  const tagged = useMemo(() => {
    return results.map((r) => ({
      ...r,
      category: categorize(r.drills?.title || ""),
    }));
  }, [results]);

  const categoryStats = useMemo(() => {
    const stats: Record<"3PT" | "MID" | "FT", { made: number; attempted: number }> = {
      "3PT": { made: 0, attempted: 0 },
      "MID": { made: 0, attempted: 0 },
      "FT": { made: 0, attempted: 0 },
    };
    tagged.forEach((r) => {
      if (r.category !== "Other") {
        stats[r.category].made += r.shots_made;
        stats[r.category].attempted += r.shots_attempted;
      }
    });
    return stats;
  }, [tagged]);

  const pctFor = (cat: "3PT" | "MID" | "FT") => {
    const s = categoryStats[cat];
    return s.attempted > 0 ? Math.round((s.made / s.attempted) * 100) : 0;
  };

  const overallPct = useMemo(() => {
    const cats: ("3PT" | "MID" | "FT")[] = ["3PT", "MID", "FT"];
    const active = cats.filter((c) => categoryStats[c].attempted > 0);
    if (active.length === 0) return 0;
    return Math.round(active.reduce((s, c) => s + pctFor(c), 0) / active.length);
  }, [categoryStats]);

  const chartData = useMemo(() => {
    const byDate: Record<string, { date: string; "3PT"?: number; MID?: number; FT?: number }> = {};
    [...tagged].reverse().forEach((r) => {
      if (r.category === "Other") return;
      const d = format(new Date(r.completed_at), "M/d");
      if (!byDate[d]) byDate[d] = { date: d };
      byDate[d][r.category] = Math.round(r.shooting_percentage * 100) / 100;
    });
    return Object.values(byDate);
  }, [tagged]);

  const recent = useMemo(() => {
    const items = tagged.slice(0, 10);
    const countMap = new Map<string, number>();
    const indexMap = new Map<string, number>();
    items.forEach((r) => {
      const key = `${r.drills?.title || "Drill"}|${format(new Date(r.completed_at), "yyyy-MM-dd")}`;
      countMap.set(key, (countMap.get(key) || 0) + 1);
    });
    return items.map((r) => {
      const title = r.drills?.title || "Drill";
      const key = `${title}|${format(new Date(r.completed_at), "yyyy-MM-dd")}`;
      const total = countMap.get(key) || 1;
      if (total <= 1) return { ...r, displayTitle: title };
      const idx = (indexMap.get(key) || 0) + 1;
      indexMap.set(key, idx);
      return { ...r, displayTitle: `${title} #${total - idx + 1}` };
    });
  }, [tagged]);

  if (loading) return null;

  if (results.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <h2 className="text-lg font-heading text-foreground mb-2">Shooting Tracker</h2>
            <p className="text-sm text-muted-foreground py-8 text-center">
              Complete a shooting drill to start tracking your percentage
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
      <Card className="bg-card border-border">
        <CardContent className="p-5 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-heading text-foreground">Shooting Tracker</h2>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <span className="text-2xl font-heading text-foreground">{overallPct}%</span>
            </div>
          </div>

          {/* Category breakdowns */}
          <div className="grid grid-cols-3 gap-3">
            {(["3PT", "MID", "FT"] as const).map((cat) => {
              const pct = pctFor(cat);
              const label = cat === "3PT" ? "3PT" : cat === "MID" ? "MID" : "FT";
              return (
                <div key={cat} className="text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat] }} />
                    <span className="text-xs font-heading tracking-wider text-muted-foreground">{label}</span>
                  </div>
                  <p className="text-xl font-heading text-foreground tabular-nums">{pct}%</p>
                </div>
              );
            })}
          </div>

          {/* Chart */}
          {chartData.length > 1 && (
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(0 0% 100% / 0.5)" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(0 0% 100% / 0.5)" }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip
                    contentStyle={{ background: "hsl(220 40% 13%)", border: "1px solid hsl(0 0% 100% / 0.1)", borderRadius: 8, color: "#fff" }}
                    formatter={(value: number, name: string) => [`${value}%`, name]}
                  />
                  <Line type="monotone" dataKey="3PT" stroke={CATEGORY_COLORS["3PT"]} strokeWidth={2} dot={{ r: 3, fill: CATEGORY_COLORS["3PT"] }} connectNulls />
                  <Line type="monotone" dataKey="MID" stroke={CATEGORY_COLORS["MID"]} strokeWidth={2} dot={{ r: 3, fill: CATEGORY_COLORS["MID"] }} connectNulls />
                  <Line type="monotone" dataKey="FT" stroke={CATEGORY_COLORS["FT"]} strokeWidth={2} dot={{ r: 3, fill: CATEGORY_COLORS["FT"] }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Recent results */}
          <div className="space-y-2">
            <p className="text-xs font-heading tracking-wider text-muted-foreground">RECENT SESSIONS</p>
            {recent.map((r) => {
              const pct = Math.round(r.shooting_percentage);
              const color = pct >= 60 ? "text-pif-green" : pct >= 40 ? "text-pif-gold" : "text-primary";
              return (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[r.category] }} />
                    <div>
                      <p className="text-sm text-foreground">{r.displayTitle}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(r.completed_at), "MMM d, yyyy")} · {r.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-heading ${color}`}>{pct}%</p>
                    <p className="text-xs text-muted-foreground">{r.shots_made}/{r.shots_attempted}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
