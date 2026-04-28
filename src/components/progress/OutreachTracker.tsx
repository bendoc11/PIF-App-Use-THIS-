import { useMemo } from "react";
import { Mail, MessageCircle, Clock, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from "recharts";

interface OutreachItem {
  id: string;
  sent_at: string;
  status: "sent" | "replied" | "offer";
  school_name: string;
  coach_name: string;
}

interface Props {
  rows: OutreachItem[];
}

function trendBadge(trend: "up" | "flat" | "down") {
  if (trend === "up")
    return { Icon: TrendingUp, color: "text-pif-green", bg: "bg-pif-green/15", label: "Trending up" };
  if (trend === "down")
    return { Icon: TrendingDown, color: "text-primary", bg: "bg-primary/15", label: "Declining" };
  return { Icon: Minus, color: "text-pif-gold", bg: "bg-pif-gold/15", label: "Flat" };
}

export function OutreachTracker({ rows }: Props) {
  const stats = useMemo(() => {
    const total = rows.length;
    const replies = rows.filter((r) => r.status === "replied" || r.status === "offer").length;
    const pending = rows.filter((r) => r.status === "sent").length;
    const replyRate = total > 0 ? Math.round((replies / total) * 100) : 0;

    // Days since most recent pending outreach
    const pendingRows = rows.filter((r) => r.status === "sent");
    let daysSincePending: number | null = null;
    if (pendingRows.length > 0) {
      const latest = pendingRows.reduce((max, r) =>
        new Date(r.sent_at) > new Date(max.sent_at) ? r : max,
      );
      daysSincePending = Math.floor(
        (Date.now() - new Date(latest.sent_at).getTime()) / (1000 * 60 * 60 * 24),
      );
    }

    // 30-day chart, bucketed by day
    const buckets: { day: string; count: number; ts: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      buckets.push({
        day: d.toLocaleDateString(undefined, { month: "numeric", day: "numeric" }),
        count: 0,
        ts: d.getTime(),
      });
    }
    rows.forEach((r) => {
      const t = new Date(r.sent_at).setHours(0, 0, 0, 0);
      const b = buckets.find((b) => b.ts === t);
      if (b) b.count++;
    });

    // Trend: compare last 15 days vs prior 15
    const recent = buckets.slice(15).reduce((s, b) => s + b.count, 0);
    const prior = buckets.slice(0, 15).reduce((s, b) => s + b.count, 0);
    let outreachTrend: "up" | "flat" | "down" = "flat";
    if (recent > prior + 1) outreachTrend = "up";
    else if (recent < prior - 1) outreachTrend = "down";

    let replyTrend: "up" | "flat" | "down" = "flat";
    if (replyRate >= 25) replyTrend = "up";
    else if (replyRate < 10 && total >= 5) replyTrend = "down";

    let pendingTrend: "up" | "flat" | "down" = "flat";
    if (daysSincePending !== null && daysSincePending > 10) pendingTrend = "down";
    else if (pending === 0 && total > 0) pendingTrend = "up";

    return {
      total,
      replies,
      pending,
      replyRate,
      daysSincePending,
      buckets,
      outreachTrend,
      replyTrend,
      pendingTrend,
    };
  }, [rows]);

  const cards = [
    {
      label: "Coaches Contacted",
      value: stats.total,
      sub: stats.total === 0 ? "Send your first message" : "Total outreach sent",
      Icon: Mail,
      trend: stats.outreachTrend,
    },
    {
      label: "Replies Received",
      value: stats.replies,
      sub: `${stats.replyRate}% response rate`,
      Icon: MessageCircle,
      trend: stats.replyTrend,
    },
    {
      label: "Pending",
      value: stats.pending,
      sub:
        stats.daysSincePending !== null
          ? `${stats.daysSincePending}d since last sent`
          : "All caught up",
      Icon: Clock,
      trend: stats.pendingTrend,
    },
  ];

  return (
    <section className="space-y-4">
      <header className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-heading text-foreground">Outreach Tracker</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Are you sending more or fewer messages over time?
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {cards.map((c) => {
          const t = trendBadge(c.trend);
          return (
            <div
              key={c.label}
              className="relative rounded-xl border border-border bg-card p-4 overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                    {c.label}
                  </p>
                  <AnimatedNumber
                    value={c.value}
                    className="text-4xl font-heading text-foreground mt-1 block"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{c.sub}</p>
                </div>
                <div
                  className={`shrink-0 rounded-lg p-2 ${t.bg}`}
                  title={t.label}
                >
                  <c.Icon className={`h-4 w-4 ${t.color}`} />
                </div>
              </div>
              <div
                className={`absolute bottom-0 left-0 right-0 h-1 ${
                  c.trend === "up"
                    ? "bg-pif-green"
                    : c.trend === "down"
                    ? "bg-primary"
                    : "bg-pif-gold"
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* 30-day activity chart */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Last 30 days of outreach
          </p>
          <p className="text-xs text-muted-foreground">
            {stats.buckets.reduce((s, b) => s + b.count, 0)} sent
          </p>
        </div>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.buckets}>
              <XAxis
                dataKey="day"
                tick={{ fontSize: 9, fill: "hsl(0 0% 100% / 0.4)" }}
                axisLine={false}
                tickLine={false}
                interval={4}
              />
              <Tooltip
                cursor={{ fill: "hsl(0 0% 100% / 0.04)" }}
                contentStyle={{
                  background: "hsl(220 40% 13%)",
                  border: "1px solid hsl(0 0% 100% / 0.1)",
                  borderRadius: 8,
                  color: "#fff",
                  fontSize: 12,
                }}
                formatter={(v: number) => [`${v} sent`, ""]}
              />
              <Bar dataKey="count" fill="hsl(var(--pif-red))" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
