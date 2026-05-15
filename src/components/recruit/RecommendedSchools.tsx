import { useEffect, useMemo, useRef, useState } from "react";
import { MockSchool } from "@/data/mockSchools";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const SF = "'Plus Jakarta Sans', system-ui, sans-serif";

const CONFERENCE_ABBR: Record<string, string> = {
  "California Community College Athletic Association": "CCCAA",
  "Northwest Athletic Conference": "NWAC",
  "National Junior College Athletic Association": "NJCAA",
  "Atlantic Coast Conference": "ACC",
  "Southeastern Conference": "SEC",
  "Big Ten Conference": "Big Ten",
  "Big 12 Conference": "Big 12",
  "Pac-12 Conference": "Pac-12",
  "American Athletic Conference": "AAC",
  "Mountain West Conference": "MWC",
  "Conference USA": "C-USA",
  "Mid-American Conference": "MAC",
  "Sun Belt Conference": "Sun Belt",
  "Ivy League": "Ivy",
};

function abbreviateConference(name: string): string {
  if (!name) return "";
  if (CONFERENCE_ABBR[name]) return CONFERENCE_ABBR[name];
  if (name.length <= 12) return name;
  const acronym = name
    .split(/\s+/)
    .filter((w) => /^[A-Z]/.test(w) && !["of", "the", "and", "for"].includes(w.toLowerCase()))
    .map((w) => w[0])
    .join("");
  if (acronym.length >= 3 && acronym.length <= 6) return acronym;
  return `${name.slice(0, 12)}...`;
}

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

// Position bucketing — mirrors OpenSpots logic
type Bucket = "PG" | "SG" | "SF" | "PF" | "C";

function athleteBucket(pos: string): Bucket | null {
  const p = pos.toUpperCase().trim();
  if (!p) return null;
  if (p.includes("POINT GUARD") || p === "PG") return "PG";
  if (p.includes("SHOOTING GUARD") || p === "SG") return "SG";
  if (p.includes("SMALL FORWARD") || p === "SF" || p.includes("WING")) return "SF";
  if (p.includes("POWER FORWARD") || p === "PF") return "PF";
  if (p === "C" || p.includes("CENTER")) return "C";
  if (p === "G" || p === "GUARD") return "PG";
  if (p === "F" || p === "FORWARD") return "SF";
  return null;
}

function rosterPositionGroups(pos: string | null): Bucket[] {
  const p = (pos || "").toUpperCase().trim();
  if (!p) return [];
  if (p.includes("POINT GUARD") || p === "PG") return ["PG"];
  if (p.includes("SHOOTING GUARD") || p === "SG") return ["SG"];
  if (p.includes("SMALL FORWARD") || p === "SF" || p.includes("WING")) return ["SF"];
  if (p.includes("POWER FORWARD") || p === "PF") return ["PF"];
  if (p === "C" || p.includes("CENTER")) return ["C"];
  if (p === "G/F" || p === "F/G") return ["SG", "SF"];
  if (p === "F/C" || p === "C/F") return ["PF", "C"];
  if (p === "G" || p === "GUARD") return ["PG", "SG"];
  if (p === "F" || p === "FORWARD") return ["SF", "PF"];
  return [];
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

interface RosterIntel {
  hasData: boolean;
  seniors: number;
  juniors: number;
}

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
  const bucket = useMemo(() => athleteBucket(userPosition), [userPosition]);

  // Load roster intelligence keyed by school_name (lowercased)
  const [rosterMap, setRosterMap] = useState<Map<string, RosterIntel>>(new Map());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!bucket) {
        setRosterMap(new Map());
        return;
      }
      const { data } = await supabase
        .from("school_rosters")
        .select("school_name, position, class_year")
        .in("class_year", ["SR", "JR", "Senior", "Junior", "Sr", "Jr"]);
      if (cancelled || !data) return;
      const map = new Map<string, RosterIntel>();
      const schoolsWithAnyData = new Set<string>();
      for (const r of data as Array<{ school_name: string | null; position: string | null; class_year: string | null }>) {
        if (!r.school_name) continue;
        const key = r.school_name.toLowerCase().trim();
        schoolsWithAnyData.add(key);
        const groups = rosterPositionGroups(r.position);
        if (!groups.includes(bucket)) continue;
        const yr = (r.class_year || "").toUpperCase();
        const isSr = yr === "SR" || yr === "SENIOR";
        const isJr = yr === "JR" || yr === "JUNIOR";
        if (!isSr && !isJr) continue;
        const cur = map.get(key) ?? { hasData: true, seniors: 0, juniors: 0 };
        cur.hasData = true;
        if (isSr) cur.seniors += 1;
        else cur.juniors += 1;
        map.set(key, cur);
      }
      // Mark schools that have roster data but no opening at position (so we don't show stale tier-3 fallback as "no data")
      for (const k of schoolsWithAnyData) {
        if (!map.has(k)) map.set(k, { hasData: true, seniors: 0, juniors: 0 });
      }
      setRosterMap(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [bucket]);

  const ordered = useMemo(() => {
    const seen = new Set<string>();
    const pool = schools.filter((s) => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });

    const matchesDivision = (s: MockSchool) =>
      !targetDivision || targetDivision === "Any" || s.division === targetDivision;
    const region = neighborStates(userState);
    const inRegion = (s: MockSchool) =>
      !userState || s.state === userState || region.includes(s.state);

    const tier1: MockSchool[] = []; // opening (SR/JR at position) + division + region
    const tier2: MockSchool[] = []; // division + region (with roster data, no opening) — proxy for "any graduating"
    const tier3: MockSchool[] = []; // division + region (no roster data)
    const tier4: MockSchool[] = []; // anything else

    for (const s of pool) {
      const intel = rosterMap.get(s.name.toLowerCase().trim());
      const opening = !!intel && (intel.seniors + intel.juniors) > 0;
      const div = matchesDivision(s);
      const reg = inRegion(s);
      if (opening && div && reg) tier1.push(s);
      else if (div && reg && intel) tier2.push(s);
      else if (div && reg) tier3.push(s);
      else tier4.push(s);
    }

    // Within tier1, sort by senior count desc then junior count desc
    tier1.sort((a, b) => {
      const ai = rosterMap.get(a.name.toLowerCase().trim())!;
      const bi = rosterMap.get(b.name.toLowerCase().trim())!;
      return (bi.seniors - ai.seniors) || (bi.juniors - ai.juniors);
    });

    return [...tier1, ...tier2, ...tier3, ...tier4];
  }, [schools, userState, targetDivision, rosterMap]);

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

  const intel = rosterMap.get(featured.name.toLowerCase().trim());
  const opening = !!intel && (intel.seniors + intel.juniors) > 0;
  const positionLabelRaw = userPosition || "your position";
  const positionPlural = userPosition ? `${userPosition}s` : "players at your position";

  let badgeText: string | null = null;
  if (opening && intel) {
    if (intel.seniors > 0) {
      badgeText = `🏀 Opening at ${positionLabelRaw} — ${intel.seniors} senior${intel.seniors === 1 ? "" : "s"} graduating`;
    } else if (intel.juniors > 0) {
      badgeText = `🏀 Opening at ${positionLabelRaw} — ${intel.juniors} junior${intel.juniors === 1 ? "" : "s"} graduating next year`;
    }
  }

  const contextLine = hasReply
    ? `${featured.name} replied to your last message. Open the thread to continue.`
    : opening && intel
    ? `${featured.name} has ${intel.seniors + intel.juniors} graduating ${positionPlural} — your class fits their recruiting timeline.`
    : `Actively recruiting ${positionPlural} in ${regionLabel(featured.state || userState)} — ${featured.division} program.`;

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

          {badgeText && (
            <div
              style={{
                background: "hsl(var(--pif-red) / 0.15)",
                borderLeft: "3px solid hsl(var(--pif-red))",
                color: "hsl(var(--pif-red))",
                fontFamily: SF,
                fontWeight: 600,
                fontSize: 13,
                padding: "8px 12px",
                borderRadius: 4,
                marginBottom: 10,
                width: "100%",
              }}
            >
              {badgeText}
            </div>
          )}

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
                {featured.conference && <span>{abbreviateConference(featured.conference)}</span>}
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
