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
        background: "#FFFFFF",
        borderBottom: "1px solid var(--border)",
        height: 52,
        padding: "0 16px",
        borderRadius: 12,
        border: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          fontSize: 16,
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
            background: "var(--bg-page)",
            border: "1px solid var(--border)",
            borderRadius: 20,
            padding: "5px 12px",
          }}
        >
          {weeklySent} / {weeklyGoal} this week
        </div>
        <button
          onClick={onMessageClick}
          className="rs-btn-primary inline-flex items-center gap-1.5"
          style={{ padding: "8px 18px" }}
        >
          <Mail strokeWidth={1.5} className="h-4 w-4" />
          Message a coach
        </button>
      </div>
    </div>
  );
}
