import { Flame, Mail } from "lucide-react";

interface Props {
  firstName: string;
  weeklySent: number;
  weeklyGoal: number;
  onMessageClick: () => void;
}

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function RecruitTopBar({ firstName, weeklySent, weeklyGoal, onMessageClick }: Props) {
  return (
    <div className="rs-card flex items-center justify-between px-5 py-4 mb-5 rs-fade-up">
      <div>
        <h2 className="rs-display text-2xl leading-tight" style={{ color: "var(--brand-ink)" }}>
          {timeGreeting()}, <span style={{ color: "var(--brand-orange)" }}>{firstName || "Champ"}</span> 🏀
        </h2>
        <p className="text-[13px]" style={{ color: "var(--brand-muted)" }}>
          Let's get you recruited. Here's what's happening today.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold"
          style={{ background: "var(--brand-orange-light)", color: "var(--brand-orange)" }}
        >
          <Flame className="h-3.5 w-3.5" />
          {weeklySent}/{weeklyGoal} this week
        </div>
        <button
          onClick={onMessageClick}
          className="rs-btn-primary rs-pulse inline-flex items-center gap-2 px-4 py-2.5 text-[13px]"
        >
          <Mail className="h-4 w-4" />
          Message a coach
        </button>
      </div>
    </div>
  );
}
