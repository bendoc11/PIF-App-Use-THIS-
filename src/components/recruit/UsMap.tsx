import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { MockSchool, DIVISION_COLORS } from "@/data/mockSchools";

const GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

interface Props {
  schools: MockSchool[];
  onSelect: (school: MockSchool) => void;
}

export function UsMap({ schools, onSelect }: Props) {
  // Only render markers with valid numeric coordinates within plausible US bounds
  const mapped = schools.filter((s) => {
    const c = s.coordinates;
    if (!Array.isArray(c) || c.length !== 2) return false;
    const [lon, lat] = c;
    if (typeof lon !== "number" || typeof lat !== "number") return false;
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) return false;
    if (lon === 0 && lat === 0) return false;
    // Rough bounds for US + territories handled by geoAlbersUsa
    if (lat < 15 || lat > 72) return false;
    if (lon < -180 || lon > -65) return false;
    return true;
  });

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <ComposableMap
        projection="geoAlbersUsa"
        projectionConfig={{ scale: 1000 }}
        width={975}
        height={550}
        style={{ width: "100%", height: "auto" }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#F8FAFC"
                stroke="#E2E8F0"
                strokeWidth={0.75}
                style={{
                  default: { outline: "none" },
                  hover: { outline: "none", fill: "#F1F5F9" },
                  pressed: { outline: "none" },
                }}
              />
            ))
          }
        </Geographies>

        {mapped.map((s) => (
          <Marker
            key={s.id}
            coordinates={s.coordinates}
            onClick={() => onSelect(s)}
            style={{ default: { cursor: "pointer" } }}
          >
            <circle
              r={4}
              fill={DIVISION_COLORS[s.division]}
              stroke="#fff"
              strokeWidth={1}
              fillOpacity={0.85}
              className="transition-all"
            >
              <title>{`${s.name} (${s.division})`}</title>
            </circle>
          </Marker>
        ))}
      </ComposableMap>
    </div>
  );
}
