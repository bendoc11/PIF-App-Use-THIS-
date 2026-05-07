import { useEffect, useRef, useState } from "react";

interface Props {
  schoolsInterested: number;
  coachesMessaged: number;
  offersReceived: number;
  weeklyGoal: number;
  weeklySent: number;
}

function PoppingNumber({ value }: { value: number }) {
  const prev = useRef(value);
  const [pop, setPop] = useState(false);
  useEffect(() => {
    if (prev.current !== value) {
      setPop(true);
      const t = setTimeout(() => setPop(false), 320);
      prev.current = value;
      return () => clearTimeout(t);
    }
  }, [value]);
  return <span className={pop ? "rs-pop" : ""}>{value}</span>;
}

export function HeroMetrics({ schoolsInterested, coachesMessaged, offersReceived, weeklyGoal, weeklySent }: Props) {
  const remaining = Math.max(0, weeklyGoal - weeklySent);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
      {/* Card 1 — featured orange */}
      <div
        className="relative overflow-hidden rounded-[14px] p-5 rs-fade-up"
        style={{ background: "var(--brand-orange)", animationDelay: "0ms" }}
      >
        <div
          className="absolute -right-10 -top-10 w-40 h-40 rounded-full"
          style={{ background: "rgba(255,255,255,0.08)" }}
          aria-hidden
        />
        <div className="relative">
          <div className="rs-label" style={{ color: "rgba(255,255,255,0.65)" }}>
            Schools Interested
          </div>
          <div
            className="rs-display text-white leading-none mt-2"
            style={{ fontSize: "56px" }}
          >
            <PoppingNumber value={schoolsInterested} />
          </div>
          <p className="text-[12px] mt-2" style={{ color: "rgba(255,255,255,0.55)" }}>
            Avg recruited athlete contacts 50+ schools
          </p>
        </div>
      </div>

      {/* Card 2 */}
      <div className="rs-card p-5 rs-fade-up" style={{ animationDelay: "80ms" }}>
        <div className="rs-label">Coaches Messaged</div>
        <div className="rs-display leading-none mt-2" style={{ fontSize: "56px", color: "var(--brand-ink)" }}>
          <PoppingNumber value={coachesMessaged} />
        </div>
        <p className="text-[12px] mt-2" style={{ color: "var(--brand-muted)" }}>
          {remaining > 0 ? `${remaining} more to hit your weekly goal` : "Weekly goal hit — keep stacking"}
        </p>
      </div>

      {/* Card 3 */}
      <div className="rs-card p-5 rs-fade-up" style={{ animationDelay: "160ms" }}>
        <div className="rs-label">Offers Received</div>
        <div className="rs-display leading-none mt-2" style={{ fontSize: "56px", color: "var(--brand-ink)" }}>
          <PoppingNumber value={offersReceived} />
        </div>
        <p className="text-[12px] mt-2" style={{ color: "var(--brand-muted)" }}>
          {offersReceived > 0 ? "You're building real momentum" : "Keep going — momentum is coming"}
        </p>
      </div>
    </div>
  );
}
