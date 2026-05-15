import { Mail, Flame } from "lucide-react";

interface Props {
  firstName: string;
  weeklySent: number;
  weeklyGoal: number;
  sendStreak?: number;
  coachesMessaged?: number;
  onMessageClick: () => void;
}

function recruitingGreeting(name: string, count: number) {
  const n = name || "there";
  if (count === 0) return `Your recruiting journey starts today, ${n}.`;
  if (count < 10) return `You're just getting started, ${n}. Keep pushing.`;
  if (count < 20) return `You're getting noticed, ${n}. Don't stop now.`;
  if (count < 50) return `You're building real momentum, ${n}.`;
  return `You're putting in the work, ${n}. This is how it happens.`;
}

export function RecruitTopBar({ firstName, weeklySent, weeklyGoal, sendStreak = 0, coachesMessaged = 0, onMessageClick }: Props) {
  return (
    <div
      className="flex items-center justify-between mb-5"
      style={{
        background: "transparent",
        height: 52,
        padding: "0 4px",
      }}
    >
      <div
        style={{
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          fontSize: 24,
          fontWeight: 700,
          color: "var(--text-primary)",
          letterSpacing: "-0.02em",
          lineHeight: 1.15,
          paddingRight: 16,
          minWidth: 0,
          flex: 1,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {recruitingGreeting(firstName, coachesMessaged)}
      </div>
      <div className="flex items-center gap-2.5">
        {sendStreak >= 2 && (
          <div
            className="hidden sm:inline-flex items-center gap-1"
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#B14513",
              background: "#FFF1E6",
              border: "1px solid #FFD3B0",
              borderRadius: 20,
              padding: "5px 10px",
            }}
            title={`${sendStreak}-day send streak`}
          >
            <Flame className="h-3 w-3" />
            {sendStreak}-day streak
          </div>
        )}
        <div
          className="hidden sm:inline-flex items-center"
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "var(--text-secondary)",
            background: "hsla(0, 0%, 100%, 0.08)",
            border: "none",
            borderRadius: 20,
            padding: "6px 12px",
          }}
        >
          {weeklySent} / {weeklyGoal} this week
        </div>
        <button
          onClick={onMessageClick}
          className="inline-flex items-center text-white"
          style={{
            padding: "9px 18px",
            gap: 8,
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            fontWeight: 600,
            fontSize: 14,
            letterSpacing: "-0.01em",
            borderRadius: 10,
            background: "linear-gradient(180deg, #FF3D2E 0%, #C8261A 100%)",
            boxShadow:
              "inset 0 1px 0 hsla(0, 0%, 100%, 0.20), 0 1px 2px hsla(0, 0%, 0%, 0.15)",
            border: "none",
            cursor: "pointer",
          }}
        >
          <Mail strokeWidth={1.75} className="h-4 w-4" />
          Message a coach
        </button>
      </div>
    </div>
  );
}
