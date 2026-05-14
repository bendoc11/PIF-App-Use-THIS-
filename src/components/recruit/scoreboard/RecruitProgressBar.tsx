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

/**
 * Full-width milestone progress bar shown at the top of the recruiting page.
 * Replaces the previous thin blue line with a clear, motivating visual.
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
        background: "#FFFFFF",
        border: "1px solid #D2D2D7",
        borderRadius: 14,
        padding: "16px 18px 18px",
        fontFamily: "-apple-system, 'SF Pro Text', sans-serif",
      }}
    >
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.01em" }}>
            {headline}
          </div>
          <div style={{ fontSize: 12, color: "#6E6E73", marginTop: 2 }}>{sub}</div>
        </div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#1D1D1F",
            background: "#F2F2F7",
            border: "1px solid #E5E5EA",
            borderRadius: 980,
            padding: "3px 10px",
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
        >
          {total} / {max}
        </div>
      </div>

      <div style={{ position: "relative", paddingTop: 4, paddingBottom: 22 }}>
        {/* Track */}
        <div
          style={{
            position: "relative",
            height: 10,
            background: "#E8E8ED",
            borderRadius: 980,
            overflow: "visible",
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              background: "linear-gradient(90deg, #E8391D, #ff7a3d)",
              borderRadius: 980,
              transition: "width 600ms cubic-bezier(0.4, 0, 0.2, 1)",
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
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: passed ? "#E8391D" : "#FFFFFF",
                  border: passed ? "2px solid #E8391D" : "2px solid #C7C7CC",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: passed ? "0 0 0 3px rgba(232,57,29,0.15)" : "none",
                  transition: "background 300ms, border-color 300ms, box-shadow 300ms",
                }}
                aria-label={`${m.value} ${m.label}`}
              >
                {passed && <Check style={{ width: 11, height: 11, color: "#fff", strokeWidth: 3 }} />}
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
                top: 28,
                transform: "translateX(-50%)",
                fontSize: 10,
                fontWeight: 600,
                color: passed ? "#1D1D1F" : "#86868B",
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
