import { useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { MockSchool, Division } from "@/data/mockSchools";
import { ArrowRight, Star } from "lucide-react";

const GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const DIVISIONS: Division[] = ["D1", "D2", "D3", "JUCO", "NAIA"];

const DIV_DOT: Record<Division, string> = {
  D1: "#2E6B10",
  D2: "#1A5FA5",
  D3: "#A85B00",
  JUCO: "#4E3AB5",
  NAIA: "#666666",
};

interface Props {
  schools: MockSchool[];
  contactedNames: Set<string>;
  interestedNames: Set<string>;
  onSelectSchool: (school: MockSchool) => void;
  onMessageSchool: (school: MockSchool) => void;
  onToggleInterested: (school: MockSchool) => void;
  onBrowseAll: () => void;
}

export function FindYourSchoolMap({
  schools,
  contactedNames,
  interestedNames,
  onSelectSchool,
  onMessageSchool,
  onToggleInterested,
  onBrowseAll,
}: Props) {
  const [activeDivisions, setActiveDivisions] = useState<Set<Division>>(new Set(DIVISIONS));
  const [recentlyClicked, setRecentlyClicked] = useState<MockSchool | null>(null);
  const [hover, setHover] = useState<{ school: MockSchool; x: number; y: number } | null>(null);

  const validSchools = useMemo(
    () =>
      schools.filter((s) => {
        const c = s.coordinates;
        if (!Array.isArray(c) || c.length !== 2) return false;
        const [lon, lat] = c;
        if (typeof lon !== "number" || typeof lat !== "number") return false;
        if (!Number.isFinite(lon) || !Number.isFinite(lat)) return false;
        if (lon === 0 && lat === 0) return false;
        if (lat < 15 || lat > 72) return false;
        if (lon < -180 || lon > -65) return false;
        return true;
      }),
    [schools],
  );

  const recent = useMemo(() => {
    const list: MockSchool[] = [];
    if (recentlyClicked) list.push(recentlyClicked);
    for (const s of validSchools) {
      if (list.length >= 3) break;
      if (!list.find((x) => x.id === s.id)) list.push(s);
    }
    return list;
  }, [validSchools, recentlyClicked]);

  const toggleDivision = (d: Division) => {
    setActiveDivisions((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
  };

  return (
    <div className="rs-card overflow-hidden mb-5 rs-fade-up" style={{ animationDelay: "240ms" }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h3 className="rs-display text-[18px] tracking-wide" style={{ color: "var(--brand-ink)" }}>
            FIND YOUR SCHOOL
          </h3>
          <p className="text-[12px] mt-0.5" style={{ color: "var(--brand-muted)" }}>
            {validSchools.length.toLocaleString()} programs · tap any dot to explore
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {DIVISIONS.map((d) => {
            const active = activeDivisions.has(d);
            return (
              <button
                key={d}
                onClick={() => toggleDivision(d)}
                className={`rs-div-${d} text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all ${
                  active ? "ring-1 ring-current/30" : "opacity-40"
                }`}
                style={!active ? { background: "var(--brand-cream)", color: "var(--brand-muted)" } : undefined}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      {/* Map */}
      <div className="relative" style={{ background: "var(--brand-cream)" }}>
        <div style={{ height: 240 }}>
          <ComposableMap
            projection="geoAlbersUsa"
            projectionConfig={{ scale: 900 }}
            width={975}
            height={500}
            style={{ width: "100%", height: "100%" }}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#FFFFFF"
                    stroke="#E8E4DE"
                    strokeWidth={0.75}
                    style={{
                      default: { outline: "none" },
                      hover: { outline: "none", fill: "#FFFAF4" },
                      pressed: { outline: "none" },
                    }}
                  />
                ))
              }
            </Geographies>

            {validSchools.map((s) => {
              const visible = activeDivisions.has(s.division);
              const isContacted = contactedNames.has(s.name);
              const isInterested = interestedNames.has(s.name);
              const fill = isInterested ? "#E85C2C" : DIV_DOT[s.division];
              return (
                <Marker
                  key={s.id}
                  coordinates={s.coordinates}
                  onClick={() => {
                    setRecentlyClicked(s);
                    onSelectSchool(s);
                  }}
                  onMouseEnter={(e: any) => {
                    setHover({ school: s, x: e.clientX, y: e.clientY });
                  }}
                  onMouseLeave={() => setHover(null)}
                  style={{
                    default: { cursor: "pointer", transition: "opacity 200ms" },
                    hover: { cursor: "pointer" },
                  }}
                >
                  {isInterested && visible && (
                    <circle r={9} fill={fill} fillOpacity={0.25} className="rs-dot-pulse" />
                  )}
                  <circle
                    r={5}
                    fill={fill}
                    stroke={isContacted ? "#FFFFFF" : "#FFFFFF"}
                    strokeWidth={isContacted ? 2 : 1}
                    fillOpacity={visible ? 0.95 : 0}
                    style={{ transition: "fill-opacity 200ms, r 150ms" }}
                  >
                    <title>{`${s.name} (${s.division})`}</title>
                  </circle>
                </Marker>
              );
            })}
          </ComposableMap>
        </div>

        {hover && (
          <div
            className="pointer-events-none fixed z-50 px-2.5 py-1.5 rounded-md text-[11px] text-white shadow-lg"
            style={{
              left: hover.x + 12,
              top: hover.y - 8,
              background: "rgba(13,13,13,0.92)",
            }}
          >
            <div className="font-semibold">{hover.school.name}</div>
            <div style={{ color: "rgba(255,255,255,0.7)" }}>
              {hover.school.division} · {hover.school.coaches.length} coach
              {hover.school.coaches.length !== 1 ? "es" : ""}
            </div>
          </div>
        )}

        <button
          onClick={onBrowseAll}
          className="absolute right-4 bottom-4 rs-btn-primary inline-flex items-center gap-1.5 px-3.5 py-2 text-[12px] shadow-lg"
        >
          Browse all schools <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Recently viewed */}
      <div className="px-5 pt-3 pb-5">
        <div className="rs-label pb-2 mb-2 border-t pt-3" style={{ borderColor: "var(--brand-border)" }}>
          Recently viewed
        </div>
        <ul className="space-y-2">
          {recent.map((s) => {
            const isInterested = interestedNames.has(s.name);
            const isHighlighted = recentlyClicked?.id === s.id;
            return (
              <li
                key={s.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
                style={{ background: isHighlighted ? "#FFFAF8" : "transparent" }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold truncate" style={{ color: "var(--brand-ink)" }}>
                      {s.name}
                    </span>
                    {isInterested && (
                      <span
                        className="rs-pill-slide text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                        style={{ background: "var(--brand-orange-light)", color: "var(--brand-orange)" }}
                      >
                        ⭐ Interested
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] truncate" style={{ color: "var(--brand-muted)" }}>
                    {s.city}, {s.stateCode}
                    {s.avgGpa ? ` · GPA ${s.avgGpa.toFixed(1)}` : ""} · {s.coaches.length} coach
                    {s.coaches.length !== 1 ? "es" : ""}
                  </div>
                </div>
                <span className={`rs-div-${s.division} text-[10px] font-semibold px-2 py-0.5 rounded-full`}>
                  {s.division}
                </span>
                <button
                  onClick={() => onToggleInterested(s)}
                  className="text-[11px] font-medium inline-flex items-center gap-1 px-2 py-1 rounded-md border transition-all"
                  style={{
                    borderColor: isInterested ? "var(--brand-orange)" : "var(--brand-border)",
                    color: isInterested ? "var(--brand-orange)" : "var(--brand-ink)",
                    background: isInterested ? "var(--brand-orange-light)" : "transparent",
                  }}
                >
                  <Star className={`h-3 w-3 ${isInterested ? "fill-current" : ""}`} />
                  {isInterested ? "Interested" : "Mark interested"}
                </button>
                <button
                  onClick={() => onMessageSchool(s)}
                  className="rs-btn-primary text-[11px] px-2.5 py-1.5 inline-flex items-center gap-1"
                >
                  Message <ArrowRight className="h-3 w-3" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
