import { useState } from "react";
import { Star, Flame, Trophy, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

  const SF = '-apple-system, "SF Pro Display", BlinkMacSystemFont, sans-serif';

  return (
    <div className="mb-5">
      {/* HERO — Coach Interest. Larger, gold gradient, eye-catching. */}
      <div
        style={{
          background:
            "linear-gradient(135deg, #FFE9A3 0%, #F5C545 55%, #D69912 100%)",
          border: "1px solid #C99413",
          borderRadius: 16,
          padding: "26px 26px",
          marginBottom: 12,
          boxShadow:
            "0 1px 0 rgba(255,255,255,0.5) inset, 0 10px 24px -12px rgba(201, 148, 19, 0.55)",
          position: "relative",
          overflow: "hidden",
          fontFamily: SF,
        }}
      >
        {/* decorative glow */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: -60,
            right: -40,
            width: 220,
            height: 220,
            background:
              "radial-gradient(circle, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#5A3F03",
          }}
        >
          <Flame className="h-3.5 w-3.5" />
          Coach Interest
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 14,
            marginTop: 10,
            color: "#3F2C00",
          }}
        >
          <div
            style={{
              fontSize: 88,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 0.95,
            }}
          >
            {schoolsInterestedInMe}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.85 }}>
            {schoolsInterestedInMe === 1 ? "school" : "schools"} replied
          </div>
        </div>

        <p
          style={{
            fontSize: 13,
            marginTop: 10,
            color: "#5A3F03",
            fontWeight: 500,
            maxWidth: 460,
            position: "relative",
          }}
        >
          {schoolsInterestedInMe > 0
            ? "Coaches are responding to you. This is real recruiting interest — keep building on it."
            : "Your first reply will land here. Stay consistent — coaches respond to athletes who keep showing up."}
        </p>
      </div>

      {/* Secondary row — three smaller stats */}
      <div className="grid grid-cols-3 gap-2.5">
        <SecondaryStat
          icon={<Star className="h-3 w-3" />}
          label="My List"
          value={schoolsBookmarked}
          sub="Bookmarked"
        />
        <SecondaryStat
          icon={<Mail className="h-3 w-3" />}
          label="Coaches Messaged"
          value={coachesMessaged}
          sub={remaining > 0 ? `${remaining} to weekly goal` : "Weekly goal hit"}
        />
        <SecondaryStat
          icon={<Trophy className="h-3 w-3" />}
          label="Offers"
          value={offersReceived}
          sub={offersReceived > 0 ? "Real momentum" : "None yet"}
        />
      </div>
    </div>
  );
}

function SecondaryStat({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub: string;
}) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "12px 14px",
      }}
    >
      <div
        className="rs-label"
        style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
      >
        {icon}
        {label}
      </div>
      <div
        style={{
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          lineHeight: 1,
          marginTop: 6,
          color: "var(--text-primary)",
          fontFamily: '-apple-system, "SF Pro Display", BlinkMacSystemFont, sans-serif',
        }}
      >
        {value}
      </div>
      <p style={{ fontSize: 11, marginTop: 4, color: "var(--text-secondary)" }}>{sub}</p>
    </div>
  );
}
