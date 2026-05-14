interface Props {
  sent: number;
  goal: number;
}

export function WeeklyGoalDark({ sent, goal }: Props) {
  const filled = Math.min(sent, goal);
  const remaining = Math.max(0, goal - sent);

  return (
    <div
      style={{
        background: "var(--bg-sidebar)",
        borderRadius: 12,
        padding: "16px 18px",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.05em",
          color: "var(--text-secondary)",
          opacity: 0.8,
        }}
      >
        This week
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span
          style={{
            fontSize: 40,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: "#FFFFFF",
            fontFamily: "'Space Grotesk', 'Plus Jakarta Sans', system-ui, sans-serif",
            fontFeatureSettings: '"tnum" 1',
          }}
        >
          {sent}
        </span>
        <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          /{goal} coaches
        </span>
      </div>
      <div className="flex gap-[3px] mt-3">
        {Array.from({ length: goal }).map((_, i) => (
          <div
            key={i}
            className="flex-1"
            style={{
              height: 3,
              borderRadius: 2,
              background: i < filled ? "var(--accent)" : "#3D3D3F",
            }}
          />
        ))}
      </div>
      <p style={{ fontSize: 11, marginTop: 12, color: "var(--text-secondary)" }}>
        {remaining > 0 ? `${remaining} more to hit your goal` : "Goal hit"}
      </p>
    </div>
  );
}
