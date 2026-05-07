interface Props {
  schoolsInterested: number;
  coachesMessaged: number;
  offersReceived: number;
  weeklyGoal: number;
  weeklySent: number;
}

export function HeroMetrics({
  schoolsInterested,
  coachesMessaged,
  offersReceived,
  weeklyGoal,
  weeklySent,
}: Props) {
  const remaining = Math.max(0, weeklyGoal - weeklySent);

  const numberStyle: React.CSSProperties = {
    fontSize: 56,
    fontWeight: 700,
    letterSpacing: "-0.03em",
    lineHeight: 1,
    fontFamily:
      '-apple-system, "SF Pro Display", BlinkMacSystemFont, sans-serif',
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
      {/* Featured — Schools Interested */}
      <div
        style={{
          background: "var(--accent-light)",
          border: "1px solid #C5DCFF",
          borderLeft: "3px solid var(--accent)",
          borderRadius: 12,
          padding: "20px 22px",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--accent-text)",
          }}
        >
          Schools Interested
        </div>
        <div style={{ ...numberStyle, color: "var(--accent)", marginTop: 10 }}>
          {schoolsInterested}
        </div>
        <p
          style={{
            fontSize: 12,
            marginTop: 8,
            color: "var(--accent)",
            opacity: 0.7,
          }}
        >
          Avg recruited athlete contacts 50+ schools
        </p>
      </div>

      {/* Coaches Messaged */}
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "20px 22px",
        }}
      >
        <div className="rs-label">Coaches Messaged</div>
        <div style={{ ...numberStyle, color: "var(--text-primary)", marginTop: 10 }}>
          {coachesMessaged}
        </div>
        <p style={{ fontSize: 12, marginTop: 8, color: "var(--text-secondary)" }}>
          {remaining > 0
            ? `${remaining} more to hit your weekly goal`
            : "Weekly goal hit"}
        </p>
      </div>

      {/* Offers Received */}
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "20px 22px",
        }}
      >
        <div className="rs-label">Offers Received</div>
        <div style={{ ...numberStyle, color: "var(--text-primary)", marginTop: 10 }}>
          {offersReceived}
        </div>
        <p style={{ fontSize: 12, marginTop: 8, color: "var(--text-secondary)" }}>
          {offersReceived > 0
            ? "You're building real momentum"
            : "Keep going — momentum is coming"}
        </p>
      </div>
    </div>
  );
}
