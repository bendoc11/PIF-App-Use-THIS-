import { MockSchool } from "@/data/mockSchools";
import { statesInSameRegion, regionForState } from "@/lib/regions";

export type PositionBucket = "PG" | "SG" | "SF" | "PF" | "C";

export interface RosterIntel {
  hasData: boolean;
  seniors: number;
  juniors: number;
}

export interface ScoringContext {
  userState?: string;
  targetDivision?: string;
  bucket?: PositionBucket | null;
  /** Preferred undergrad size bucket from profile: "Small" | "Medium" | "Large" or undefined. */
  preferredSize?: "Small" | "Medium" | "Large";
  contactedNames: Set<string>;
  notInterestedNames: Set<string>;
  rosterMap: Map<string, RosterIntel>;
}

export interface ScoreBreakdown {
  total: number;
  divisionMatch: boolean;
  regionMatch: boolean;
  rosterOpening: boolean;
  sizeMatch: boolean;
  contacted: boolean;
  notInterested: boolean;
  intel?: RosterIntel;
}

export function athleteBucket(pos: string | null | undefined): PositionBucket | null {
  const p = (pos || "").toUpperCase().trim();
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

export function rosterPositionGroups(pos: string | null | undefined): PositionBucket[] {
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

export function scoreSchool(school: MockSchool, ctx: ScoringContext): ScoreBreakdown {
  const intel = ctx.rosterMap.get(school.name.toLowerCase().trim());
  const opening = !!intel && (intel.seniors + intel.juniors) > 0;
  const region = ctx.userState ? statesInSameRegion(ctx.userState) : [];
  const regionMatch = !!ctx.userState && (school.state === ctx.userState || region.includes(school.state));
  const divisionMatch = !!ctx.targetDivision && ctx.targetDivision !== "Any" && school.division === ctx.targetDivision;
  const sizeMatch = !!ctx.preferredSize && school.size === ctx.preferredSize;
  const contacted = ctx.contactedNames.has(school.name);
  const notInterested = ctx.notInterestedNames.has(school.name);

  let total = 0;
  if (divisionMatch) total += 40;
  if (regionMatch) total += 30;
  if (opening) total += 20;
  if (sizeMatch) total += 10;
  if (contacted) total -= 50;
  if (notInterested) total -= 100;

  return {
    total,
    divisionMatch,
    regionMatch,
    rosterOpening: opening,
    sizeMatch,
    contacted,
    notInterested,
    intel,
  };
}

export function sortSchoolsByRelevance(schools: MockSchool[], ctx: ScoringContext): MockSchool[] {
  const scored = schools.map((s) => ({ s, b: scoreSchool(s, ctx) }));
  const hasDivPref =
    !!ctx.targetDivision &&
    ctx.targetDivision !== "Any" &&
    ctx.targetDivision !== "Open to all";
  scored.sort((a, b) => {
    // PRIMARY: division match. When the athlete has selected a target division,
    // matching programs always outrank non-matching, regardless of other signals.
    // Guarantees a D1-preferring athlete never sees a NAIA/JUCO as #1.
    if (hasDivPref && a.b.divisionMatch !== b.b.divisionMatch) {
      return a.b.divisionMatch ? -1 : 1;
    }
    if (b.b.total !== a.b.total) return b.b.total - a.b.total;
    const ai = a.b.intel; const bi = b.b.intel;
    const aSr = ai?.seniors ?? 0; const bSr = bi?.seniors ?? 0;
    if (bSr !== aSr) return bSr - aSr;
    const aJr = ai?.juniors ?? 0; const bJr = bi?.juniors ?? 0;
    if (bJr !== aJr) return bJr - aJr;
    return a.s.name.localeCompare(b.s.name);
  });
  return scored.map((x) => x.s);
}

export function describeSchool(
  school: MockSchool,
  breakdown: ScoreBreakdown,
  ctx: ScoringContext,
  positionLabel: string,
): string {
  const { intel, divisionMatch, regionMatch, rosterOpening } = breakdown;
  if (rosterOpening && intel) {
    const grads = intel.seniors + intel.juniors;
    const posPlural = positionLabel ? `${positionLabel}s` : "players at your position";
    return `${school.name} has ${grads} graduating ${posPlural} — your class fits their timeline.`;
  }
  const region = ctx.userState ? regionForState(ctx.userState) ?? ctx.userState : "your area";
  if (divisionMatch && regionMatch) {
    return `Active ${school.division} program recruiting your position in ${region}.`;
  }
  if (divisionMatch) {
    return `${school.division} program that fits your level.`;
  }
  if (regionMatch) {
    return `${school.division} program in ${region} — close to home.`;
  }
  return `${school.division} program worth a look.`;
}
