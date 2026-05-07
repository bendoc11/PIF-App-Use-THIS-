import { useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { MockSchool, Division } from "@/data/mockSchools";
import { ChevronRight, Star } from "lucide-react";

const GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const DIVISIONS: Division[] = ["D1", "D2", "D3", "JUCO", "NAIA"];

const DIV_DOT: Record<Division, string> = {
  D1: "#2E8B57",
  D2: "#0071E3",
  D3: "#FF1F1F",
  JUCO: "#E5FF00",
  NAIA: "#86868B",
};

const DIV_TEXT: Record<Division, string> = {
  D1: "#0051A8",
  D2: "#1A6B2A",
  D3: "#A80000",
  JUCO: "#6B6B00",
  NAIA: "#6E6E73",
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
    <div
      className="mb-5 overflow-hidden"
      style={{
        background: "#1D1D1F",
        border: "1px solid transparent",
        borderRadius: 14,
      }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex items-start justify-between flex-wrap gap-3">
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#F5F5F7",
            }}
          >
            Find your school
          </div>
          <p style={{ fontSize: 13, color: "#6E6E73", marginTop: 4 }}>
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
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "5px 12px",
                  borderRadius: 980,
                  background: active ? "#FFFFFF" : "#2D2D2F",
                  border: active
                    ? `1.5px solid ${DIV_DOT[d]}`
                    : "1px solid #3D3D3F",
                  color: active ? DIV_TEXT[d] : "#86868B",
                  transition: "all 150ms",
                }}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      {/* Map */}
      <div className="relative" style={{ background: "#1D1D1F" }}>
        <div style={{ height: 280 }}>
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
                    stroke="#D2D2D7"
                    strokeWidth={1}
                    style={{
                      default: { outline: "none" },
                      hover: { outline: "none", fill: "#F5F5F7" },
                      pressed: { outline: "none" },
                    }}
                  />
                ))
              }
            </Geographies>

            {validSchools.map((s) => {
              const visible = activeDivisions.has(s.division);
              const isInterested = interestedNames.has(s.name);
              const fill = isInterested ? "#0071E3" : DIV_DOT[s.division];
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
                    <circle
                      r={12}
                      fill="none"
                      stroke="#0071E3"
                      strokeWidth={1.5}
                      opacity={0.9}
                    />
                  )}
                  <circle
                    r={5}
                    fill={fill}
                    fillOpacity={visible ? 1 : 0}
                    style={{ transition: "fill-opacity 200ms" }}
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
            className="pointer-events-none fixed z-50"
            style={{
              left: hover.x + 12,
              top: hover.y - 8,
              background: "#FFFFFF",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "8px 12px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
              {hover.school.name}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
              {hover.school.division} · {hover.school.city}, {hover.school.stateCode}
            </div>
          </div>
        )}

        <button
          onClick={onBrowseAll}
          className="absolute right-4 bottom-4 rs-btn-primary inline-flex items-center gap-1"
          style={{ padding: "7px 14px", fontSize: 13 }}
        >
          Browse all schools
          <ChevronRight strokeWidth={1.5} className="h-4 w-4" />
        </button>
      </div>

      {/* Recently viewed */}
      <div style={{ borderTop: "1px solid #2D2D2F", background: "#FFFFFF" }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--text-tertiary)",
            padding: "10px 20px",
          }}
        >
          Recently viewed
        </div>
        <ul>
          {recent.map((s) => {
            const isInterested = interestedNames.has(s.name);
            return (
              <li
                key={s.id}
                className="flex items-center gap-3"
                style={{
                  padding: "14px 20px",
                  borderTop: "1px solid var(--border-light)",
                }}
              >
                <div className="flex-1 min-w-0">
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                    }}
                    className="truncate"
                  >
                    {s.name}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      marginTop: 2,
                    }}
                    className="truncate"
                  >
                    {s.city}, {s.stateCode}
                    {s.avgGpa ? ` · GPA ${s.avgGpa.toFixed(1)}` : ""} · {s.coaches.length} coach
                    {s.coaches.length !== 1 ? "es" : ""}
                  </div>
                </div>
                <span
                  className={`rs-div-${s.division}`}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "3px 10px",
                    borderRadius: 980,
                  }}
                >
                  {s.division}
                </span>
                <button
                  onClick={() => onToggleInterested(s)}
                  className="inline-flex items-center gap-1.5"
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    padding: "6px 14px",
                    borderRadius: 980,
                    border: `1px solid ${isInterested ? "var(--accent)" : "var(--border)"}`,
                    color: isInterested ? "var(--accent)" : "var(--text-secondary)",
                    background: "#FFFFFF",
                    transition: "all 150ms",
                  }}
                >
                  <Star
                    strokeWidth={1.5}
                    className="h-3.5 w-3.5"
                    style={{
                      fill: isInterested ? "var(--accent)" : "none",
                      color: isInterested ? "var(--accent)" : "var(--text-secondary)",
                    }}
                  />
                  {isInterested ? "Interested" : "Mark interested"}
                </button>
                <button
                  onClick={() => onMessageSchool(s)}
                  className="rs-btn-primary inline-flex items-center gap-1"
                  style={{ fontSize: 12, padding: "6px 16px" }}
                >
                  Message
                  <ChevronRight strokeWidth={1.5} className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
