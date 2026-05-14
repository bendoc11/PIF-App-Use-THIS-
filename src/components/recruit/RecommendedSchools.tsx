import { useEffect, useMemo, useState } from "react";
import { MockSchool } from "@/data/mockSchools";
import { useAuth } from "@/contexts/AuthContext";

const SF = "-apple-system, 'SF Pro Text', BlinkMacSystemFont, sans-serif";

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

function regionLabel(state: string): string {
  if (!state) return "your area";
  const group = REGION_GROUPS.find((g) => g.includes(state));
  if (!group) return state;
  // simple human label
  if (group.includes("Maine")) return "the Northeast";
  if (group.includes("Virginia")) return "the Mid-Atlantic";
  if (group.includes("Florida")) return "the Southeast";
  if (group.includes("Ohio")) return "the Midwest";
  if (group.includes("Texas")) return "the South Central";
  if (group.includes("Colorado")) return "the Mountain West";
  if (group.includes("California")) return "the West Coast";
  return state;
}

interface Props {
  schools: MockSchool[];
  contactedNames: Set<string>;
  repliedNames?: Set<string>;
  onMessage: (school: MockSchool) => void;
  onReadReply?: (school: MockSchool) => void;
}

const DIVISION_STYLE: Record<string, { bg: string; fg: string; border: string }> = {
  D1: { bg: "#E6F0FF", fg: "#1D4ED8", border: "#B6CCFF" },
  D2: { bg: "#E6F7EE", fg: "#15803D", border: "#B6E5C5" },
  D3: { bg: "#F0EDFF", fg: "#4B35B0", border: "#C8BEFF" },
  JUCO: { bg: "#F4E8FF", fg: "#6B21A8", border: "#DCC4F2" },
  NAIA: { bg: "#F1F1F4", fg: "#374151", border: "#D7D7DD" },
};

export function RecommendedSchools({
  schools,
  contactedNames,
  repliedNames,
  onMessage,
  onReadReply,
}: Props) {
  const { profile } = useAuth();
  const userState = ((profile as any)?.state as string | undefined) ?? "";
  const userPosition = ((profile as any)?.position as string | undefined) ?? "";
  const targetDivision = ((profile as any)?.target_division as string | undefined) ?? "";

  const ordered = useMemo(() => {
    const seen = new Set<string>();
    const pool = schools.filter((s) => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });

    const matchesDivision = (s: MockSchool) =>
      !targetDivision || targetDivision === "Any" || s.division === targetDivision;

    const eligible = pool.filter(matchesDivision);
    const fallback = pool.filter((s) => s.division === "D3");
    const base = eligible.length >= 5 ? eligible : fallback;

    const inState = base.filter((s) => s.state === userState);
    const neighbors = neighborStates(userState);
    const inRegion = base.filter(
      (s) => s.state !== userState && neighbors.includes(s.state),
    );
    const rest = base.filter(
      (s) => s.state !== userState && !neighbors.includes(s.state),
    );

    const out: MockSchool[] = [];
    const added = new Set<string>();
    for (const list of [inState, inRegion, rest]) {
      for (const s of list) {
        if (added.has(s.id)) continue;
        added.add(s.id);
        out.push(s);
      }
    }
    return out;
  }, [schools, userState, targetDivision]);

  // Skip schools the athlete has already messaged
  const queue = useMemo(
    () => ordered.filter((s) => !contactedNames.has(s.name)),
    [ordered, contactedNames],
  );

  const [index, setIndex] = useState(0);

  // If queue shrinks below current index (e.g. school became contacted), reset.
  useEffect(() => {
    if (index >= queue.length) setIndex(0);
  }, [queue.length, index]);

  if (queue.length === 0) return null;

  const featured = queue[index];
  if (!featured) return null;

  const remaining = Math.max(0, queue.length - 1);
  const hasReply = repliedNames?.has(featured.name) ?? false;
  const ds = DIVISION_STYLE[featured.division] ?? DIVISION_STYLE.D3;

  const positionLabel = userPosition ? userPosition.toLowerCase() : "your position";
  const region = regionLabel(featured.state || userState);
  const contextLine = hasReply
    ? `${featured.name} replied to your last message. Open the thread to continue.`
    : `Actively recruiting ${positionLabel} in ${region}.`;

  const next = () => setIndex((i) => (i + 1) % queue.length);

  return (
    <div style={{ marginBottom: 20, fontFamily: SF }}>
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #D2D2D7",
          borderRadius: 16,
          padding: "20px 22px 18px",
          boxShadow: "0 1px 0 rgba(0,0,0,0.02), 0 8px 24px -16px rgba(0,0,0,0.12)",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "#86868B",
            marginBottom: 10,
          }}
        >
          {userState ? "Recruiting in your region" : "Recommended for you"}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 14,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "#1D1D1F",
                lineHeight: 1.15,
              }}
            >
              {featured.name}
            </div>
            <div
              style={{
                marginTop: 6,
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  background: ds.bg,
                  color: ds.fg,
                  border: `1px solid ${ds.border}`,
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: 6,
                  padding: "3px 8px",
                }}
              >
                {featured.division}
              </span>
              <span style={{ fontSize: 13, color: "#6E6E73" }}>
                {[featured.city, featured.state].filter(Boolean).join(", ")}
              </span>
            </div>
            <p
              style={{
                fontSize: 14,
                color: "#3A3A3F",
                marginTop: 10,
                lineHeight: 1.45,
              }}
            >
              {contextLine}
            </p>
          </div>
        </div>

        <div
          style={{
            marginTop: 18,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          {hasReply ? (
            <button
              onClick={() => onReadReply?.(featured)}
              style={{
                flex: 1,
                background: "#0071E3",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 700,
                padding: "13px 18px",
                cursor: "pointer",
                fontFamily: SF,
              }}
            >
              Read Reply →
            </button>
          ) : (
            <button
              onClick={() => onMessage(featured)}
              style={{
                flex: 1,
                background: "#0071E3",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 700,
                padding: "13px 18px",
                cursor: "pointer",
                fontFamily: SF,
                boxShadow: "0 6px 16px -8px rgba(0,113,227,0.6)",
              }}
            >
              Send Message →
            </button>
          )}
          <button
            onClick={next}
            disabled={queue.length <= 1}
            style={{
              background: "#F5F5F7",
              color: "#1D1D1F",
              border: "1px solid #D2D2D7",
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 600,
              padding: "12px 14px",
              cursor: queue.length <= 1 ? "default" : "pointer",
              opacity: queue.length <= 1 ? 0.5 : 1,
              fontFamily: SF,
              whiteSpace: "nowrap",
            }}
          >
            Next school →
          </button>
        </div>
      </div>

      <div
        style={{
          fontSize: 12,
          color: "#86868B",
          marginTop: 8,
          textAlign: "center",
          fontFamily: SF,
        }}
      >
        {remaining} more program{remaining === 1 ? "" : "s"} match your profile
      </div>
    </div>
  );
}
