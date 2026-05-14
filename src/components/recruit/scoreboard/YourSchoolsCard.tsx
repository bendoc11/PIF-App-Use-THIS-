interface Stat {
  contacted: number;
  interested: number;
  offers: number;
}

interface SchoolItem {
  name: string;
  status: "Contacted" | "Interested" | "Offer";
}

interface Props {
  stats: Stat;
  schools: SchoolItem[];
}

const STATUS_STYLE: Record<SchoolItem["status"], { bg: string; color: string; border: string }> = {
  Contacted: { bg: "#EAF2FF", color: "#0051A8", border: "#C5DCFF" },
  Interested: { bg: "#E8F1FD", color: "#004FB3", border: "#C5DCFF" },
  Offer: { bg: "#EDF7EE", color: "#1A6B2A", border: "#C0E4C5" },
};

export function YourSchoolsCard({ stats, schools }: Props) {
  const Stat = ({ value, label, color }: { value: number; label: string; color: string }) => (
    <div>
      <div
        style={{
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          lineHeight: 1,
          color,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.05em",
          color: "var(--text-tertiary)",
          marginTop: 4,
          opacity: 0.8,
        }}
      >
        {label}
      </div>
    </div>
  );

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "16px 18px",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.05em",
          color: "var(--text-tertiary)",
          marginBottom: 14,
          opacity: 0.8,
        }}
      >
        Your schools
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Stat value={stats.contacted} label="Contacted" color="var(--accent)" />
        <Stat value={stats.interested} label="Interested" color="var(--accent)" />
        <Stat value={stats.offers} label="Offers" color="var(--success)" />
      </div>
      {schools.length > 0 && (
        <ul
          className="space-y-2 pt-3"
          style={{ borderTop: "1px solid var(--border-light)" }}
        >
          {schools.slice(0, 3).map((s, i) => {
            const st = STATUS_STYLE[s.status];
            return (
              <li key={i} className="flex items-center justify-between">
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                  className="truncate"
                >
                  {s.name}
                </span>
                <span
                  className="ml-2 shrink-0"
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    padding: "2px 8px",
                    borderRadius: 980,
                    background: st.bg,
                    color: st.color,
                    border: `1px solid ${st.border}`,
                  }}
                >
                  {s.status}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
