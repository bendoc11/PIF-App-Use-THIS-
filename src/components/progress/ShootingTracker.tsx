import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Target } from "lucide-react";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface ShotResult {
  id: string;
  drill_id: string;
  shots_made: number;
  shots_attempted: number;
  shooting_percentage: number;
  completed_at: string;
  drills: { title: string } | null;
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

  const overallPct = useMemo(() => {
    const totalMade = results.reduce((s, r) => s + r.shots_made, 0);
    const totalAttempted = results.reduce((s, r) => s + r.shots_attempted, 0);
    return totalAttempted > 0 ? Math.round((totalMade / totalAttempted) * 100) : 0;
  }, [results]);

  const chartData = useMemo(() => {
    return [...results]
      .reverse()
      .map((r) => ({
        date: format(new Date(r.completed_at), "M/d"),
        pct: Math.round(r.shooting_percentage * 100) / 100,
      }));
  }, [results]);

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

  const recent = results.slice(0, 10);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
      <Card className="bg-card border-border">
        <CardContent className="p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-heading text-foreground">Shooting Tracker</h2>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <span className="text-2xl font-heading text-foreground">{overallPct}%</span>
            </div>
          </div>

          {/* Chart */}
          {chartData.length > 1 && (
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(0 0% 100% / 0.5)" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(0 0% 100% / 0.5)" }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip
                    contentStyle={{ background: "hsl(220 40% 13%)", border: "1px solid hsl(0 0% 100% / 0.1)", borderRadius: 8, color: "#fff" }}
                    formatter={(value: number) => [`${value}%`, "Shooting %"]}
                  />
                  <Line type="monotone" dataKey="pct" stroke="hsl(5 78% 55%)" strokeWidth={2} dot={{ r: 3, fill: "hsl(5 78% 55%)" }} />
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
                  <div>
                    <p className="text-sm text-foreground">{r.drills?.title || "Drill"}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(r.completed_at), "MMM d, yyyy")}</p>
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
