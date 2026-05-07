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

const STATUS_STYLE: Record<SchoolItem["status"], { bg: string; color: string }> = {
  Contacted: { bg: "#E3F0FC", color: "#1A5FA5" },
  Interested: { bg: "#FFF0EB", color: "#E85C2C" },
  Offer: { bg: "#E8F5E2", color: "#2E6B10" },
};

export function YourSchoolsCard({ stats, schools }: Props) {
  return (
    <div className="rs-card p-4">
      <div className="rs-label mb-3">Your Schools</div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div>
          <div className="rs-display text-[26px] leading-none" style={{ color: "#1A5FA5" }}>
            {stats.contacted}
          </div>
          <div className="text-[10px]" style={{ color: "var(--brand-muted)" }}>Contacted</div>
        </div>
        <div>
          <div className="rs-display text-[26px] leading-none" style={{ color: "var(--brand-orange)" }}>
            {stats.interested}
          </div>
          <div className="text-[10px]" style={{ color: "var(--brand-muted)" }}>Interested</div>
        </div>
        <div>
          <div className="rs-display text-[26px] leading-none" style={{ color: "#2E6B10" }}>
            {stats.offers}
          </div>
          <div className="text-[10px]" style={{ color: "var(--brand-muted)" }}>Offers</div>
        </div>
      </div>
      {schools.length > 0 && (
        <ul className="space-y-1.5 pt-2 border-t" style={{ borderColor: "var(--brand-border)" }}>
          {schools.slice(0, 3).map((s, i) => {
            const st = STATUS_STYLE[s.status];
            return (
              <li key={i} className="flex items-center justify-between text-[12px]">
                <span className="truncate font-medium" style={{ color: "var(--brand-ink)" }}>
                  {s.name}
                </span>
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full ml-2 shrink-0"
                  style={{ background: st.bg, color: st.color }}
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
