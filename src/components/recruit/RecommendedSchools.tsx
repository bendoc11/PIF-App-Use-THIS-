import { useEffect, useMemo, useRef, useState } from "react";
import { MockSchool } from "@/data/mockSchools";
import { useAuth } from "@/contexts/AuthContext";

const SF = "'Plus Jakarta Sans', system-ui, sans-serif";

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

const DIVISION_STYLE: Record<string, { bg: string; fg: string }> = {
  D1: { bg: "rgba(255,255,255,0.10)", fg: "rgba(255,255,255,0.80)" },
  D2: { bg: "#0d2e1a", fg: "#4ade80" },
  D3: { bg: "rgba(255,255,255,0.08)", fg: "rgba(255,255,255,0.60)" },
  JUCO: { bg: "#1a1040", fg: "#a78bfa" },
  NAIA: { bg: "#1a1a2e", fg: "#818cf8" },
};

type Phase = "idle" | "exit-left" | "exit-right" | "enter";

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
  const gradYear = ((profile as any)?.grad_year as number | undefined) ?? null;

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

  const queue = useMemo(
    () => ordered.filter((s) => !contactedNames.has(s.name)),
    [ordered, contactedNames],
  );

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [overlay, setOverlay] = useState<string | null>(null);
  const animatingRef = useRef(false);

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
  const locality = featured.conference || regionLabel(featured.state || userState);
  const classBit = gradYear ? ` — ${gradYear} class` : "";
  const contextLine = hasReply
    ? `${featured.name} replied to your last message. Open the thread to continue.`
    : `Actively recruiting ${positionLabel}s in ${locality}${classBit}.`;

  const coachCount = featured.coaches?.length ?? 0;
  const noStaff = coachCount === 0;

  const advance = () => setIndex((i) => (i + 1) % queue.length);

  const trigger = (
    direction: "left" | "right",
    tint: string,
    action: () => void,
  ) => {
    if (animatingRef.current) return;
    animatingRef.current = true;
    setOverlay(tint);
    setPhase(direction === "left" ? "exit-left" : "exit-right");
    window.setTimeout(() => setOverlay(null), 150);
    window.setTimeout(() => {
      action();
      // snap card off-screen right (no transition), then animate to idle
      setPhase("enter");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setPhase("idle");
          animatingRef.current = false;
        });
      });
    }, 250);
  };

  const handlePlayHere = () => {
    trigger("left", "rgba(74,222,128,0.20)", () => {
      onMessage(featured);
      advance();
    });
  };
  const handleNext = () => {
    if (queue.length <= 1) return;
    trigger("right", "rgba(255,255,255,0.10)", advance);
  };

  let transform = "translateX(0)";
  if (phase === "exit-left") transform = "translateX(-110%)";
  else if (phase === "exit-right") transform = "translateX(110%)";
  else if (phase === "enter") transform = "translateX(110%)";

  const transition = phase === "enter" ? "none" : "transform 250ms ease-out";

  return (
    <div style={{ marginBottom: 20, fontFamily: SF }}>
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 16,
        }}
      >
        <div
          style={{
            background: "#0F1620",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 16,
            padding: "20px 22px 18px",
            boxShadow:
              "0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px -16px rgba(0,0,0,0.5)",
            minHeight: 260,
            display: "flex",
            flexDirection: "column",
            transform,
            transition,
            willChange: "transform",
          }}
        >
          <div
            style={{
              fontFamily: SF,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "hsl(var(--pif-red))",
              marginBottom: 10,
            }}
          >
            {userState ? "Recruiting in your region" : "Recommended for you"}
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "#FFFFFF",
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
                  fontFamily: SF,
                  fontSize: 11,
                  fontWeight: 600,
                  borderRadius: 6,
                  padding: "4px 8px",
                  lineHeight: 1,
                }}
              >
                {featured.division}
              </span>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.60)" }}>
                {[featured.city, featured.state].filter(Boolean).join(", ")}
              </span>
            </div>

            {(featured.conference || coachCount > 0) && (
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  flexWrap: "wrap",
                  fontFamily: SF,
                  fontSize: 11,
                  fontWeight: 400,
                  color: "rgba(255,255,255,0.50)",
                }}
              >
                {featured.conference && <span>{featured.conference}</span>}
                {featured.conference && coachCount > 0 && <span>·</span>}
                {coachCount > 0 && (
                  <span>
                    {coachCount} coach{coachCount === 1 ? "" : "es"}
                  </span>
                )}
              </div>
            )}

            <p
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.80)",
                marginTop: 10,
                lineHeight: 1.45,
              }}
            >
              {noStaff ? "Coaching staff pending update." : contextLine}
            </p>
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
                  background: "hsl(var(--pif-red))",
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
                onClick={handlePlayHere}
                disabled={noStaff}
                style={{
                  flex: 1,
                  background: noStaff ? "rgba(255,255,255,0.06)" : "hsl(var(--pif-red))",
                  color: noStaff ? "rgba(255,255,255,0.40)" : "#FFFFFF",
                  border: "none",
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 700,
                  padding: "13px 18px",
                  cursor: noStaff ? "not-allowed" : "pointer",
                  fontFamily: SF,
                  boxShadow: noStaff ? "none" : "0 6px 16px -8px hsl(var(--pif-red) / 0.6)",
                }}
              >
                {noStaff ? "Staff unavailable" : "I would play here →"}
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={queue.length <= 1}
              className="rs-next-school-btn"
              style={{
                background: "transparent",
                color: "rgba(255,255,255,0.70)",
                border: "none",
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 600,
                padding: "12px 14px",
                cursor: queue.length <= 1 ? "default" : "pointer",
                opacity: queue.length <= 1 ? 0.4 : 1,
                fontFamily: SF,
                whiteSpace: "nowrap",
                transition: "color 150ms",
              }}
            >
              Next school →
            </button>
          </div>
        </div>

        {overlay && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: overlay,
              borderRadius: 16,
              pointerEvents: "none",
              transition: "opacity 150ms ease-out",
            }}
          />
        )}
      </div>

      <div
        style={{
          fontSize: 12,
          color: "rgba(255,255,255,0.50)",
          marginTop: 8,
          textAlign: "center",
          fontFamily: SF,
        }}
      >
        ↑ {remaining} more program{remaining === 1 ? "" : "s"} match your profile
      </div>
    </div>
  );
}
