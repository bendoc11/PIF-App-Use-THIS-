interface Props {
  sent: number;
  goal: number;
}

export function WeeklyGoalDark({ sent, goal }: Props) {
  const filled = Math.min(sent, goal);
  const remaining = Math.max(0, goal - sent);
  return (
    <div className="rounded-[14px] p-4" style={{ background: "var(--brand-black)" }}>
      <div className="rs-label" style={{ color: "rgba(255,255,255,0.35)" }}>
        This Week
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="rs-display text-white leading-none" style={{ fontSize: "40px" }}>
          {sent}
        </span>
        <span className="text-[13px]" style={{ color: "rgba(255,255,255,0.45)" }}>
          /{goal} coaches
        </span>
      </div>
      <div className="flex gap-1 mt-3">
        {Array.from({ length: goal }).map((_, i) => (
          <div
            key={i}
            className="rs-bar flex-1 h-2 rounded-sm"
            style={{
              background: i < filled ? "var(--brand-orange)" : "#1E1E1E",
              animationDelay: `${i * 50}ms`,
            }}
          />
        ))}
      </div>
      <p className="text-[11px] mt-3" style={{ color: "rgba(255,255,255,0.45)" }}>
        {remaining > 0 ? `${remaining} more to hit your goal 🔥` : "Goal hit. Keep stacking 🔥"}
      </p>
    </div>
  );
}
