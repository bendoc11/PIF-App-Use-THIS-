import { useMemo } from "react";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Flame, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Props {
  profileCompletion: number; // 0-100
  contacted: number;
  replies: number;
  offers: number;
  daysSinceLastOutreach: number | null;
  athleteName: string;
}

/**
 * Recruiting Momentum Score (0-100):
 *  - Profile completeness ........ 30 pts
 *  - Outreach volume ............. 25 pts (caps at 25 contacts)
 *  - Response rate ............... 20 pts
 *  - Offers ...................... 10 pts (caps at 5)
 *  - Recency of activity ......... 15 pts (full if <7d, decays to 0 by 30d)
 */
export function MomentumHero({
  profileCompletion,
  contacted,
  replies,
  offers,
  daysSinceLastOutreach,
  athleteName,
}: Props) {
  const { score, status, trend } = useMemo(() => {
    const profilePts = (Math.min(100, profileCompletion) / 100) * 30;
    const outreachPts = (Math.min(25, contacted) / 25) * 25;
    const replyRate = contacted > 0 ? replies / contacted : 0;
    const replyPts = Math.min(1, replyRate / 0.3) * 20; // 30% reply rate = full
    const offerPts = (Math.min(5, offers) / 5) * 10;

    let recencyPts = 0;
    if (daysSinceLastOutreach === null) {
      recencyPts = 0;
    } else if (daysSinceLastOutreach <= 7) {
      recencyPts = 15;
    } else if (daysSinceLastOutreach < 30) {
      recencyPts = 15 * (1 - (daysSinceLastOutreach - 7) / 23);
    }

    const total = Math.round(profilePts + outreachPts + replyPts + offerPts + recencyPts);

    let status = "Build your profile to get on coaches' radars";
    let trend: "up" | "flat" | "down" = "flat";

    if (total >= 80) {
      status = `Coaches are noticing you, ${athleteName}. Keep the pressure on.`;
      trend = "up";
    } else if (total >= 60) {
      status = "Your profile is gaining traction. Time to reach out to more coaches.";
      trend = "up";
    } else if (total >= 40) {
      status = "Solid foundation. Send 5 more messages this week to break through.";
      trend = "flat";
    } else if (total >= 20) {
      status = "Time to reach out to more coaches. Momentum starts with action.";
      trend = "down";
    } else {
      status = "Your recruiting journey starts now. Send your first message today.";
      trend = "down";
    }

    if (daysSinceLastOutreach !== null && daysSinceLastOutreach > 14) {
      trend = "down";
      status = `It's been ${daysSinceLastOutreach} days since your last outreach. Don't go cold.`;
    }

    return { score: total, status, trend };
  }, [profileCompletion, contacted, replies, offers, daysSinceLastOutreach, athleteName]);

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor =
    trend === "up" ? "text-pif-green" : trend === "down" ? "text-primary" : "text-muted-foreground";
  const trendLabel = trend === "up" ? "Trending up" : trend === "down" ? "Losing momentum" : "Holding steady";

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-border bg-card px-6 py-8 md:px-10 md:py-10"
      style={{
        backgroundImage:
          "radial-gradient(ellipse at top right, hsl(var(--pif-red) / 0.18) 0%, transparent 55%), radial-gradient(ellipse at bottom left, hsl(var(--pif-blue) / 0.10) 0%, transparent 60%)",
      }}
    >
      {/* dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.7) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative grid md:grid-cols-[auto_1fr] gap-6 md:gap-10 items-center">
        {/* Score */}
        <div className="text-center md:text-left">
          <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
            <Flame className="h-4 w-4 text-primary" />
            <p className="text-[11px] font-bold tracking-[0.22em] uppercase text-primary">
              Recruiting Momentum
            </p>
          </div>
          <div className="flex items-baseline gap-2 justify-center md:justify-start">
            <AnimatedNumber
              value={score}
              className="text-7xl md:text-8xl font-heading text-primary leading-none"
              bumpClassName="animate-metric-bump"
            />
            <span className="text-2xl md:text-3xl font-heading text-muted-foreground">/100</span>
          </div>
          <div className={`mt-3 inline-flex items-center gap-1.5 text-xs font-semibold ${trendColor}`}>
            <TrendIcon className="h-3.5 w-3.5" />
            {trendLabel}
          </div>
        </div>

        {/* Status + breakdown */}
        <div className="space-y-4">
          <p className="text-lg md:text-xl font-heading text-foreground leading-tight text-center md:text-left">
            {status}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { label: "Profile", value: `${profileCompletion}%` },
              { label: "Contacted", value: contacted },
              { label: "Replies", value: replies },
              { label: "Offers", value: offers },
            ].map((m) => (
              <div
                key={m.label}
                className="rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-center"
              >
                <p className="text-base font-heading text-foreground tabular-nums">{m.value}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                  {m.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
