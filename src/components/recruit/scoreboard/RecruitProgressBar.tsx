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
        borderRadius: 12,
        padding: "20px 22px 26px",
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
            flexShrink: 0,
            whiteSpace: "nowrap",
            fontVariantNumeric: "tabular-nums",
            paddingRight: 4,
          }}
        >
          <span
            style={{
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: 18,
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              letterSpacing: "-0.01em",
            }}
          >
            {total}
          </span>
          <span
            style={{
              color: "hsla(0, 0%, 100%, 0.4)",
              fontWeight: 400,
              fontSize: 14,
              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
              marginLeft: 2,
            }}
          >
            /{max}
          </span>
        </div>
      </div>

      <div style={{ position: "relative", paddingTop: 4, paddingBottom: 38 }}>
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
        {/* Two-line labels under markers */}
        {milestones.map((m) => {
          const left = (m.value / max) * 100;
          const passed = total >= m.value;
          // Edge alignment: first/last labels align to their edges to avoid clipping
          const isFirst = left < 15;
          const isLast = left > 85;
          const transform = isFirst
            ? "translateX(0)"
            : isLast
              ? "translateX(-100%)"
              : "translateX(-50%)";
          const textAlign = isFirst ? "left" : isLast ? "right" : "center";
          return (
            <div
              key={`l-${m.value}`}
              style={{
                position: "absolute",
                left: `${left}%`,
                top: 22,
                transform,
                textAlign: textAlign as any,
                whiteSpace: "nowrap",
              }}
            >
              <div
                style={{
                  fontFamily: "'Space Grotesk', system-ui, sans-serif",
                  fontWeight: 600,
                  fontSize: 12,
                  color: passed ? "#FFFFFF" : "hsla(0, 0%, 100%, 0.7)",
                  lineHeight: 1.1,
                  letterSpacing: "-0.01em",
                }}
              >
                {m.value}
              </div>
              <div
                style={{
                  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                  fontWeight: 400,
                  fontSize: 10,
                  color: "hsla(0, 0%, 100%, 0.5)",
                  marginTop: 2,
                  letterSpacing: "0.01em",
                }}
              >
                {m.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
