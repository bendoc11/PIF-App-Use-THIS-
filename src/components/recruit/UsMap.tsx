import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { MockSchool, DIVISION_COLORS } from "@/data/mockSchools";

// TopoJSON of US states from the react-simple-maps maintainer's CDN
const GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

interface Props {
  schools: MockSchool[];
  onSelect: (school: MockSchool) => void;
}

export function UsMap({ schools, onSelect }: Props) {
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

        {schools.map((s) => (
          <Marker
            key={s.id}
            coordinates={s.coordinates}
            onClick={() => onSelect(s)}
            style={{ default: { cursor: "pointer" } }}
          >
            <circle
              r={6}
              fill={DIVISION_COLORS[s.division]}
              stroke="#fff"
              strokeWidth={1.5}
              className="transition-all hover:r-8"
            >
              <title>{`${s.name} (${s.division})`}</title>
            </circle>
          </Marker>
        ))}
      </ComposableMap>
    </div>
  );
}
