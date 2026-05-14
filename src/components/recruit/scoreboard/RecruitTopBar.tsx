import { Mail, Flame } from "lucide-react";

interface Props {
  firstName: string;
  weeklySent: number;
  weeklyGoal: number;
  sendStreak?: number;
  onMessageClick: () => void;
}

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function RecruitTopBar({ firstName, weeklySent, weeklyGoal, sendStreak = 0, onMessageClick }: Props) {
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
          fontSize: 18,
          fontWeight: 600,
          color: "var(--text-primary)",
          letterSpacing: "-0.01em",
        }}
      >
        {timeGreeting()}, {firstName || "there"}
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
