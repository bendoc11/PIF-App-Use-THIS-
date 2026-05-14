import { useMemo } from "react";
import { MockSchool } from "@/data/mockSchools";
import { useAuth } from "@/contexts/AuthContext";

const SF = "-apple-system, 'SF Pro Text', BlinkMacSystemFont, sans-serif";

// Region neighbors for proximity expansion when fewer than 5 D3 in user's state
const REGION_GROUPS: string[][] = [
  ["Maine","New Hampshire","Vermont","Massachusetts","Rhode Island","Connecticut","New York","New Jersey","Pennsylvania"],
  ["Virginia","West Virginia","Maryland","Delaware","North Carolina","South Carolina","Tennessee","Kentucky","Washington, D.C.","District of Columbia"],
  ["Georgia","Florida","Alabama","Mississippi","Louisiana","Arkansas"],
  ["Ohio","Michigan","Indiana","Illinois","Wisconsin","Minnesota","Iowa","Missouri"],
  ["North Dakota","South Dakota","Nebraska","Kansas","Oklahoma","Texas"],
  ["Montana","Wyoming","Colorado","Utah","Idaho","New Mexico","Arizona","Nevada"],
  ["Washington","Oregon","California","Alaska","Hawaii"],
];

function neighborStates(state: string): string[] {
  const group = REGION_GROUPS.find((g) => g.includes(state));
  return group ?? [];
}

interface Props {
  schools: MockSchool[];
  contactedNames: Set<string>;
  repliedNames?: Set<string>;
  onMessage: (school: MockSchool) => void;
  onReadReply?: (school: MockSchool) => void;
}

export function RecommendedSchools({ schools, contactedNames, repliedNames, onMessage, onReadReply }: Props) {
  const { profile } = useAuth();
  const userState = ((profile as any)?.state as string | undefined) ?? "";

  const recommended = useMemo(() => {
    // dedupe by id
    const seen = new Set<string>();
    const d3 = schools.filter((s) => {
      if (s.division !== "D3") return false;
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });

    const inState = d3.filter((s) => s.state === userState);
    const neighbors = neighborStates(userState);
    const inRegion = d3.filter(
      (s) => s.state !== userState && neighbors.includes(s.state),
    );
    const rest = d3.filter(
      (s) => s.state !== userState && !neighbors.includes(s.state),
    );

    const ordered: MockSchool[] = [];
    const addedIds = new Set<string>();
    for (const list of [inState, inRegion, rest]) {
      for (const s of list) {
        if (ordered.length >= 5) break;
        if (addedIds.has(s.id)) continue;
        addedIds.add(s.id);
        ordered.push(s);
      }
      if (ordered.length >= 5) break;
    }
    return ordered;
  }, [schools, userState]);

  if (recommended.length === 0) return null;

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #D2D2D7",
        borderRadius: 14,
        overflow: "hidden",
        marginBottom: 20,
        fontFamily: SF,
      }}
    >
      <div style={{ padding: "16px 20px 12px" }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "#86868B",
          }}
        >
          Recommended For You
        </div>
        <div style={{ fontSize: 13, color: "#6E6E73", marginTop: 4 }}>
          Based on your profile — D3 programs actively recruiting your position.
        </div>
      </div>

      {recommended.map((s) => {
        const messaged = contactedNames.has(s.name);
        return (
          <div
            key={s.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: "12px 20px",
              borderTop: "1px solid #E8E8ED",
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#1D1D1F",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {s.name}
              </div>
              <div style={{ fontSize: 12, color: "#6E6E73" }}>
                {[s.city, s.state].filter(Boolean).join(", ")}
                {s.coaches.length > 0 && ` · ${s.coaches.length} coach${s.coaches.length === 1 ? "" : "es"}`}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              <span
                style={{
                  background: "#F0EDFF",
                  color: "#4B35B0",
                  border: "1px solid #C8BEFF",
                  fontSize: 10,
                  fontWeight: 600,
                  borderRadius: 4,
                  padding: "3px 8px",
                }}
              >
                D3
              </span>
              {messaged ? (
                <span
                  style={{
                    background: "#E8F8EE",
                    color: "#0E7A3B",
                    border: "1px solid #B6E5C5",
                    borderRadius: 980,
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "6px 14px",
                  }}
                >
                  ✓ Messaged
                </span>
              ) : (
                <button
                  onClick={() => onMessage(s)}
                  style={{
                    background: "#0071E3",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 980,
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "6px 16px",
                    cursor: "pointer",
                    fontFamily: SF,
                  }}
                >
                  Message →
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
