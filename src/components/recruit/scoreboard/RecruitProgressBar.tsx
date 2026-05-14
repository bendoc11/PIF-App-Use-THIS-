import { Check } from "lucide-react";

interface Milestone {
  value: number;
  label: string;
}

interface Props {
  total: number;
  milestones?: Milestone[];
}

const DEFAULT_MILESTONES: Milestone[] = [
  { value: 10, label: "Getting noticed" },
  { value: 20, label: "Building momentum" },
  { value: 50, label: "Maximizing chances" },
];

const NAVY = "hsl(218 39% 5%)";
const RED = "#E8391D";
const RED_BRIGHT = "#FF5A2C";

/**
 * Full-width milestone progress bar shown at the top of the recruiting page.
 */
export function RecruitProgressBar({ total, milestones = DEFAULT_MILESTONES }: Props) {
  const max = milestones[milestones.length - 1].value;
  const clamped = Math.min(total, max);
  const pct = Math.min(100, (clamped / max) * 100);

  const next = milestones.find((m) => total < m.value);
  const headline =
    total === 0
      ? "Start your outreach"
      : total >= max
        ? "You're maximizing your chances"
        : `${total} coach${total === 1 ? "" : "es"} contacted`;
  const sub = next
    ? `${next.value - total} more to ${next.label.toLowerCase()}`
    : "Athletes who hit 50+ are in the top 5% of active recruits.";

  return (
    <div
      style={{
        background: NAVY,
        border: "1px solid hsla(0, 0%, 100%, 0.08)",
        borderRadius: 14,
        padding: "16px 18px 18px",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.01em" }}>
            {headline}
          </div>
          <div
            style={{
              fontSize: 12,
              color: RED_BRIGHT,
              marginTop: 3,
              fontWeight: 600,
              letterSpacing: "0.01em",
            }}
          >
            {sub}
          </div>
        </div>
        <div
          style={{
            fontSize: 13,
            color: "hsla(0, 0%, 100%, 0.45)",
            flexShrink: 0,
            whiteSpace: "nowrap",
            letterSpacing: "0.01em",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <span style={{ color: "#FFFFFF", fontWeight: 800, fontSize: 15 }}>{total}</span>
          <span style={{ margin: "0 2px" }}> / </span>
          <span style={{ fontWeight: 500 }}>{max}</span>
        </div>
      </div>

      <div style={{ position: "relative", paddingTop: 4, paddingBottom: 22 }}>
        {/* Track */}
        <div
          style={{
            position: "relative",
            height: 6,
            background: "hsla(0, 0%, 100%, 0.15)",
            borderRadius: 980,
            overflow: "visible",
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              background: `linear-gradient(90deg, #FF7A3D 0%, ${RED} 100%)`,
              borderRadius: 980,
              transition: "width 600ms cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: `0 0 12px ${RED}66`,
            }}
          />
          {/* Milestone markers */}
          {milestones.map((m) => {
            const left = (m.value / max) * 100;
            const passed = total >= m.value;
            return (
              <div
                key={m.value}
                style={{
                  position: "absolute",
                  left: `${left}%`,
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: passed ? RED : "#FFFFFF",
                  border: passed ? `1px solid ${RED}` : "1px solid hsla(0,0%,100%,0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: passed
                    ? `0 0 0 3px ${RED}33, 0 0 10px ${RED}99`
                    : "none",
                  transition: "background 300ms, border-color 300ms, box-shadow 300ms",
                }}
                aria-label={`${m.value} ${m.label}`}
              >
                {passed && <Check style={{ width: 7, height: 7, color: "#fff", strokeWidth: 4 }} />}
              </div>
            );
          })}
        </div>
        {/* Labels under markers */}
        {milestones.map((m) => {
          const left = (m.value / max) * 100;
          const passed = total >= m.value;
          return (
            <div
              key={`l-${m.value}`}
              style={{
                position: "absolute",
                left: `${left}%`,
                top: 24,
                transform: "translateX(-50%)",
                fontSize: 10,
                fontWeight: 600,
                color: passed ? "#FFFFFF" : "hsla(0, 0%, 100%, 0.5)",
                whiteSpace: "nowrap",
                letterSpacing: "0.02em",
              }}
            >
              {m.value} · {m.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
