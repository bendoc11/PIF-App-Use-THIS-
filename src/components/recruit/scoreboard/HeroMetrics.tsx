import { Star, Flame, Trophy } from "lucide-react";

interface Props {
  schoolsBookmarked: number;        // athlete's own list
  schoolsInterestedInMe: number;    // distinct schools that replied
  coachesMessaged: number;
  offersReceived: number;
  weeklyGoal: number;
  weeklySent: number;
}

export function HeroMetrics({
  schoolsBookmarked,
  schoolsInterestedInMe,
  coachesMessaged,
  offersReceived,
  weeklyGoal,
  weeklySent,
}: Props) {
  const remaining = Math.max(0, weeklyGoal - weeklySent);

  const numberStyle: React.CSSProperties = {
    fontSize: 48,
    fontWeight: 700,
    letterSpacing: "-0.03em",
    lineHeight: 1,
    fontFamily: '-apple-system, "SF Pro Display", BlinkMacSystemFont, sans-serif',
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
      {/* FEATURED — Coach interest (a coach replied to me) */}
      <div
        style={{
          background: "linear-gradient(135deg, #FFF7E0 0%, #FFE7B0 100%)",
          border: "1px solid #F2C964",
          borderLeft: "3px solid #C99413",
          borderRadius: 12,
          padding: "18px 18px",
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#7A5A0A",
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <Flame className="h-3 w-3" />
          Coach Interest
        </div>
        <div style={{ ...numberStyle, color: "#7A5A0A", marginTop: 8 }}>{schoolsInterestedInMe}</div>
        <p style={{ fontSize: 11.5, marginTop: 6, color: "#7A5A0A", opacity: 0.8 }}>
          {schoolsInterestedInMe > 0 ? "Schools that replied to you" : "First reply unlocks this"}
        </p>
      </div>

      {/* My list */}
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "18px 18px",
        }}
      >
        <div
          className="rs-label"
          style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
        >
          <Star className="h-3 w-3" /> My List
        </div>
        <div style={{ ...numberStyle, color: "var(--text-primary)", marginTop: 8 }}>
          {schoolsBookmarked}
        </div>
        <p style={{ fontSize: 11.5, marginTop: 6, color: "var(--text-secondary)" }}>
          Schools you're interested in
        </p>
      </div>

      {/* Coaches Messaged */}
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "18px 18px",
        }}
      >
        <div className="rs-label">Coaches Messaged</div>
        <div style={{ ...numberStyle, color: "var(--text-primary)", marginTop: 8 }}>
          {coachesMessaged}
        </div>
        <p style={{ fontSize: 11.5, marginTop: 6, color: "var(--text-secondary)" }}>
          {remaining > 0 ? `${remaining} more to hit your weekly goal` : "Weekly goal hit"}
        </p>
      </div>

      {/* Offers Received */}
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "18px 18px",
        }}
      >
        <div
          className="rs-label"
          style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
        >
          <Trophy className="h-3 w-3" /> Offers
        </div>
        <div style={{ ...numberStyle, color: "var(--text-primary)", marginTop: 8 }}>
          {offersReceived}
        </div>
        <p style={{ fontSize: 11.5, marginTop: 6, color: "var(--text-secondary)" }}>
          {offersReceived > 0 ? "You're building real momentum" : "Keep going — it's coming"}
        </p>
      </div>
    </div>
  );
}
