import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { isPaidSubscriber } from "@/lib/subscription";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { normalizeDivision } from "@/data/mockSchools";

const SF = "'Plus Jakarta Sans', -apple-system, system-ui, sans-serif";

const REGIONS: Record<string, string[]> = {
  Northeast: ["ME", "NH", "VT", "MA", "RI", "CT", "NY", "NJ", "PA"],
  Southeast: ["DE", "MD", "DC", "VA", "WV", "NC", "SC", "GA", "FL", "AL", "MS", "TN", "KY", "AR", "LA"],
  Midwest: ["OH", "IN", "IL", "MI", "WI", "MN", "IA", "MO", "ND", "SD", "NE", "KS"],
  Southwest: ["TX", "OK", "NM", "AZ"],
  West: ["CO", "WY", "MT", "ID", "WA", "OR", "NV", "UT", "CA", "AK", "HI"],
};

type Urgency = "now" | "soon" | "future";

interface SpotCard {
  school_name: string;
  conference: string | null;
  division: string | null;
  city: string | null;
  state: string | null;
  logo_url: string | null;
  undergrad_enrollment: string | null;
  roster_url: string | null;
  graduating_count: number;
  earliest_graduation: number | null;
  urgency: Urgency;
}

interface RosterRow {
  player_name: string | null;
  position: string | null;
  class_year: string | null;
  graduation_year: number | null;
  jersey_number: string | null;
  height: string | null;
}

function parseEnrollment(v: string | null): number | null {
  if (!v) return null;
  const n = Number(String(v).replace(/[,\s]/g, "").match(/\d+/)?.[0]);
  return Number.isFinite(n) ? n : null;
}

function sizeBucket(n: number | null): "small" | "medium" | "large" | null {
  if (n == null) return null;
  if (n < 5000) return "small";
  if (n <= 15000) return "medium";
  return "large";
}

function regionForState(state: string | null | undefined): string | null {
  if (!state) return null;
  const code = state.length === 2 ? state.toUpperCase() : "";
  for (const [region, codes] of Object.entries(REGIONS)) {
    if (codes.includes(code)) return region;
  }
  return null;
}

function rankClassYear(y: string | null): number {
  const v = (y || "").toUpperCase();
  if (v === "SR") return 0;
  if (v === "JR") return 1;
  if (v === "SO") return 2;
  return 3;
}

function urgencyFor(rank: number): Urgency {
  if (rank === 0) return "now";
  if (rank === 1) return "soon";
  return "future";
}

function urgencyLabel(u: Urgency) {
  if (u === "now") return { text: "RECRUITING NOW", bg: "#dc2626" };
  if (u === "soon") return { text: "RECRUITING SOON", bg: "#d97706" };
  return { text: "FUTURE OPENING", bg: "#15803d" };
}

function urgencyClassYearLabel(u: Urgency) {
  if (u === "now") return "Senior";
  if (u === "soon") return "Junior";
  return "Sophomore";
}

function gradYearForUrgency(u: Urgency): number {
  // Recruiting class graduation year (today is May 2026)
  if (u === "now") return 2026;
  if (u === "soon") return 2027;
  return 2028;
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 animate-pulse">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-lg bg-white/10" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 bg-white/10 rounded" />
          <div className="h-3 w-1/2 bg-white/10 rounded" />
        </div>
      </div>
      <div className="h-px bg-white/10 my-3" />
      <div className="space-y-2">
        <div className="h-5 w-32 bg-white/10 rounded" />
        <div className="h-3 w-full bg-white/10 rounded" />
        <div className="h-3 w-2/3 bg-white/10 rounded" />
      </div>
      <div className="h-10 w-full bg-white/10 rounded mt-4" />
    </div>
  );
}

// Best-effort guess of a university's primary .edu domain from its name.
// Used as a fallback when the athletics-domain Clearbit logo is missing.
function guessEduDomain(name: string): string | null {
  if (!name) return null;
  const overrides: Record<string, string> = {
    "abilene christian university": "acu.edu",
    "alabama a&m university": "aamu.edu",
    "alabama state university": "alasu.edu",
    "duke": "duke.edu",
    "duke university": "duke.edu",
  };
  const key = name.toLowerCase().trim();
  if (overrides[key]) return overrides[key];
  const stop = new Set([
    "the","of","at","and","university","college","institute","state",
    "a&m","am","tech","technical","community","junior","city",
  ]);
  const tokens = key
    .replace(/[^a-z0-9& ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const meaningful = tokens.filter((t) => !stop.has(t));
  const slug = (meaningful.length ? meaningful : tokens).join("");
  if (!slug) return null;
  return `${slug}.edu`;
}

function domainFromUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    const m = url.replace(/^https?:\/\//, "").split("/")[0];
    return m || null;
  }
}

function LogoBlock({
  url,
  name,
  rosterUrl,
}: {
  url: string | null;
  name: string;
  rosterUrl?: string | null;
}) {
  const candidates = useMemo(() => {
    const list: string[] = [];
    if (url) list.push(url);
    const edu = guessEduDomain(name);
    if (edu) list.push(`https://logo.clearbit.com/${edu}`);
    const athDomain = domainFromUrl(rosterUrl || null);
    if (athDomain) {
      list.push(`https://www.google.com/s2/favicons?domain=${athDomain}&sz=128`);
    } else if (edu) {
      list.push(`https://www.google.com/s2/favicons?domain=${edu}&sz=128`);
    }
    // De-dupe while preserving order
    return Array.from(new Set(list));
  }, [url, name, rosterUrl]);

  const [idx, setIdx] = useState(0);
  // Reset when candidates change (different card)
  useEffect(() => setIdx(0), [candidates.join("|")]);

  const src = candidates[idx];
  if (!src) {
    return (
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-semibold shrink-0"
        style={{ fontFamily: SF, background: "#0F1A2E" }}
      >
        {(name || "?").charAt(0).toUpperCase()}
      </div>
    );
  }
  return (
    <div className="w-12 h-12 rounded-lg bg-white/5 overflow-hidden shrink-0 flex items-center justify-center">
      <img
        src={src}
        alt={`${name} logo`}
        className="w-full h-full object-contain"
        loading="lazy"
        onError={() => setIdx((i) => i + 1)}
      />
    </div>
  );
}

export default function OpenSpots() {
  const navigate = useNavigate();
  const { user, profile, hasActiveSubscription } = useAuth();
  const isPaid = isPaidSubscriber(profile, hasActiveSubscription);

  const athletePosition = (profile?.position || "").trim();
  const profileDivision = ((profile as any)?.target_division || "").toString().toUpperCase();

  const [division, setDivision] = useState<string>(profileDivision || "all");
  const [region, setRegion] = useState<string>("all");
  const [size, setSize] = useState<string>("all");
  const [urgency, setUrgency] = useState<string>("all");
  const [sport, setSport] = useState<"M" | "W">("M");
  const [showWomensModal, setShowWomensModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<SpotCard[]>([]);
  const [rosterModal, setRosterModal] = useState<SpotCard | null>(null);
  const [rosterRows, setRosterRows] = useState<RosterRow[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        // Pull all SR/JR/SO rosters; filter by position bucket client-side so
        // that "Point Guard" on profile matches "PG", "G", "Guard" on rosters.
        const { data: rosterData } = await supabase
          .from("school_rosters")
          .select("school_name, position, class_year, graduation_year")
          .in("class_year", ["SR", "JR", "SO"]);

        const athleteBucket = bucketPosition(athletePosition);

        const bySchool = new Map<
          string,
          { count: number; earliest: number | null; bestRank: number }
        >();
        for (const r of rosterData || []) {
          if (!r.school_name) continue;
          if (athleteBucket) {
            const groups = positionGroups(r.position);
            if (!groups.includes(athleteBucket)) continue;
          }
          const rank = rankClassYear(r.class_year);
          const cur = bySchool.get(r.school_name);
          if (cur) {
            cur.count += 1;
            cur.bestRank = Math.min(cur.bestRank, rank);
            if (r.graduation_year != null) {
              cur.earliest =
                cur.earliest == null
                  ? r.graduation_year
                  : Math.min(cur.earliest, r.graduation_year);
            }
          } else {
            bySchool.set(r.school_name, {
              count: 1,
              earliest: r.graduation_year ?? null,
              bestRank: rank,
            });
          }
        }

        const schoolNames = Array.from(bySchool.keys());
        if (schoolNames.length === 0) {
          if (!cancelled) setResults([]);
          return;
        }

        // Fetch college_coaches metadata (one row per school is enough; dedupe client-side).
        // Note: college_coaches is the men's table (women's coaches live in
        // coaches_womens_basketball) and gender is mostly NULL, so don't filter on it.
        const { data: ccData } = await supabase
          .from("college_coaches")
          .select(
            "school_name, conference, division, city, state, logo_url, undergrad_enrollment, roster_url, gender",
          )
          .in("school_name", schoolNames);

        const ccBySchool = new Map<string, any>();
        for (const c of ccData || []) {
          if (!c.school_name) continue;
          if (!ccBySchool.has(c.school_name)) ccBySchool.set(c.school_name, c);
        }

        const cards: SpotCard[] = [];
        for (const [name, agg] of bySchool.entries()) {
          const cc = ccBySchool.get(name);
          if (!cc) continue;
          cards.push({
            school_name: name,
            conference: cc.conference,
            division: cc.division,
            city: cc.city,
            state: cc.state,
            logo_url: cc.logo_url,
            undergrad_enrollment: cc.undergrad_enrollment,
            roster_url: cc.roster_url,
            graduating_count: agg.count,
            earliest_graduation: agg.earliest,
            urgency: urgencyFor(agg.bestRank),
          });
        }

        cards.sort((a, b) => {
          const ru = (u: Urgency) => (u === "now" ? 0 : u === "soon" ? 1 : 2);
          const d = ru(a.urgency) - ru(b.urgency);
          if (d !== 0) return d;
          return b.graduating_count - a.graduating_count;
        });

        if (!cancelled) setResults(cards);
      } catch (e) {
        console.error("OpenSpots query failed", e);
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, athletePosition, sport]);

  // Apply filters client-side
  const filtered = useMemo(() => {
    return results.filter((r) => {
      if (division !== "all") {
        const d = normalizeDivision(r.division);
        if ((d || "").toUpperCase() !== division.toUpperCase()) return false;
      }
      if (region !== "all") {
        const reg = regionForState(r.state);
        if (reg !== region) return false;
      }
      if (size !== "all") {
        const b = sizeBucket(parseEnrollment(r.undergrad_enrollment));
        if (b !== size) return false;
      }
      if (urgency !== "all") {
        if (r.urgency !== urgency) return false;
      }
      return true;
    });
  }, [results, division, region, size, urgency]);

  const resetFilters = () => {
    setDivision("all");
    setRegion("all");
    setSize("all");
    setUrgency("all");
  };

  const openRoster = async (card: SpotCard) => {
    setRosterModal(card);
    setRosterLoading(true);
    setRosterRows([]);
    const { data } = await supabase
      .from("school_rosters")
      .select("player_name, position, class_year, graduation_year, jersey_number, height")
      .eq("school_name", card.school_name);
    setRosterRows((data || []) as RosterRow[]);
    setRosterLoading(false);
  };

  const messageCoach = (card: SpotCard) => {
    navigate(`/recruit?school=${encodeURIComponent(card.school_name)}`);
  };

  return (
    <AppLayout>
      <div
        className="p-4 lg:p-8 max-w-7xl mx-auto"
        style={{ fontFamily: SF }}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1
              className="text-white"
              style={{ fontFamily: SF, fontWeight: 700, fontSize: 32, lineHeight: 1.1 }}
            >
              Open Spots
            </h1>
            <p
              className="mt-2"
              style={{
                fontFamily: SF,
                fontWeight: 400,
                fontSize: 14,
                color: "rgba(255,255,255,0.6)",
              }}
            >
              Programs likely recruiting your position — based on real roster data
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
            <button
              onClick={() => setSport("M")}
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              style={{
                background: sport === "M" ? "rgba(220,38,38,0.9)" : "transparent",
                color: "white",
              }}
            >
              Men's Basketball
            </button>
            <button
              onClick={() => setShowWomensModal(true)}
              className="px-3 py-1.5 rounded-md text-sm font-medium opacity-60 cursor-not-allowed flex items-center gap-2"
              style={{ color: "white" }}
            >
              Women's Basketball
              <span
                className="text-[10px] px-1.5 py-0.5 rounded"
                style={{ background: "rgba(255,255,255,0.15)" }}
              >
                Coming Soon
              </span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Select value={division} onValueChange={setDivision}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Division" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Divisions</SelectItem>
              <SelectItem value="D1">D1</SelectItem>
              <SelectItem value="D2">D2</SelectItem>
              <SelectItem value="D3">D3</SelectItem>
              <SelectItem value="NAIA">NAIA</SelectItem>
              <SelectItem value="JUCO">JUCO</SelectItem>
            </SelectContent>
          </Select>
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {Object.keys(REGIONS).map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={size} onValueChange={setSize}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="School Size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sizes</SelectItem>
              <SelectItem value="small">Small (under 5,000)</SelectItem>
              <SelectItem value="medium">Medium (5,000–15,000)</SelectItem>
              <SelectItem value="large">Large (over 15,000)</SelectItem>
            </SelectContent>
          </Select>
          <Select value={urgency} onValueChange={setUrgency}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Urgency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Urgency</SelectItem>
              <SelectItem value="now">Recruiting Now (Senior)</SelectItem>
              <SelectItem value="soon">Recruiting Soon (Junior)</SelectItem>
              <SelectItem value="future">Future Opening (Sophomore)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results body — paywalled for non-subscribers */}
        <div className="relative">
          <div className={!isPaid ? "pointer-events-none select-none filter blur-md" : ""}>
            <p
              className="mb-4"
              style={{
                fontFamily: SF,
                fontWeight: 500,
                fontSize: 14,
                color: "rgba(255,255,255,0.7)",
              }}
            >
              {loading
                ? "Loading programs…"
                : `${filtered.length} program${filtered.length === 1 ? "" : "s"} likely recruiting your position`}
            </p>

            {loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 border border-white/10 rounded-xl bg-white/[0.02]">
                <p className="text-white/80 mb-4" style={{ fontFamily: SF }}>
                  No open spots found for your filters — try expanding your division or region.
                </p>
                <Button onClick={resetFilters} variant="secondary">
                  Reset Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {filtered.map((card) => {
                  const u = urgencyLabel(card.urgency);
                  const cls = urgencyClassYearLabel(card.urgency);
                  const grad = gradYearForUrgency(card.urgency);
                  return (
                    <div
                      key={card.school_name}
                      className="rounded-xl border bg-white/[0.03] p-4 flex flex-col"
                      style={{ borderColor: "rgba(255,255,255,0.10)" }}
                    >
                      <div className="flex items-start gap-3">
                        <LogoBlock url={card.logo_url} name={card.school_name} rosterUrl={card.roster_url} />
                        <div className="min-w-0">
                          <h3
                            className="text-white truncate"
                            style={{ fontFamily: SF, fontWeight: 600, fontSize: 16 }}
                          >
                            {card.school_name}
                          </h3>
                          <p
                            style={{
                              fontFamily: SF,
                              fontSize: 12,
                              color: "rgba(255,255,255,0.6)",
                            }}
                          >
                            {[card.conference, normalizeDivision(card.division)]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                          <p
                            style={{
                              fontFamily: SF,
                              fontSize: 12,
                              color: "rgba(255,255,255,0.5)",
                            }}
                          >
                            {[card.city, card.state].filter(Boolean).join(", ")}
                          </p>
                        </div>
                      </div>

                      <div className="h-px bg-white/10 my-4" />

                      <div className="flex-1">
                        <span
                          className="inline-block px-2 py-1 rounded-md text-white text-[11px] font-semibold tracking-wider"
                          style={{ background: u.bg, fontFamily: SF }}
                        >
                          {u.text}
                        </span>
                        <p
                          className="mt-3 text-white"
                          style={{ fontFamily: SF, fontWeight: 500, fontSize: 13 }}
                        >
                          {card.graduating_count} open spot
                          {card.graduating_count === 1 ? "" : "s"} projected at{" "}
                          {athletePosition || "your position"}
                        </p>
                        <p
                          className="mt-1"
                          style={{
                            fontFamily: SF,
                            fontSize: 12,
                            color: "rgba(255,255,255,0.55)",
                          }}
                        >
                          Based on {card.graduating_count} graduating{" "}
                          {athletePosition || "player"}
                          {card.graduating_count === 1 ? "" : "s"} ({cls},{" "}
                          {card.earliest_graduation || grad})
                        </p>
                      </div>

                      <div className="mt-4 space-y-2">
                        <Button
                          onClick={() => messageCoach(card)}
                          className="w-full text-white border-0"
                          style={{ background: "#dc2626" }}
                        >
                          Message Coach
                        </Button>
                        <Button
                          onClick={() => openRoster(card)}
                          variant="ghost"
                          className="w-full text-white hover:bg-white/10"
                        >
                          View Roster
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {!isPaid && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="max-w-md w-full mx-auto text-center p-6 rounded-xl border border-white/10"
                style={{ background: "rgba(8,13,20,0.92)", backdropFilter: "blur(8px)" }}
              >
                <h2
                  className="text-white mb-2"
                  style={{ fontFamily: SF, fontWeight: 700, fontSize: 22 }}
                >
                  Unlock Open Spots
                </h2>
                <p
                  className="mb-5"
                  style={{ fontFamily: SF, fontSize: 14, color: "rgba(255,255,255,0.7)" }}
                >
                  Subscribe to unlock Open Spots and see which programs are recruiting your
                  position — $19.99/month.
                </p>
                <Button
                  onClick={() =>
                    (window.location.href =
                      "https://subscribe.playitforward.app/b/dRmfZgdt55BSg2wgOPcEw06")
                  }
                  className="w-full text-white border-0"
                  style={{ background: "#E8391D" }}
                >
                  Subscribe Now
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Women's modal */}
      <Dialog open={showWomensModal} onOpenChange={setShowWomensModal}>
        <DialogContent className="bg-card border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white" style={{ fontFamily: SF }}>
              Coming Soon
            </DialogTitle>
          </DialogHeader>
          <p
            className="mb-4"
            style={{ fontFamily: SF, fontSize: 14, color: "rgba(255,255,255,0.7)" }}
          >
            Women's recruiting intelligence — coming soon. We're building roster data for
            women's programs now.
          </p>
          <Button onClick={() => setShowWomensModal(false)}>Got it</Button>
        </DialogContent>
      </Dialog>

      {/* Roster modal */}
      <Dialog open={!!rosterModal} onOpenChange={(o) => !o && setRosterModal(null)}>
        <DialogContent
          className="bg-card border-white/10 max-w-3xl max-h-[85vh] overflow-y-auto"
          style={{ fontFamily: SF }}
        >
          {rosterModal && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <LogoBlock url={rosterModal.logo_url} name={rosterModal.school_name} rosterUrl={rosterModal.roster_url} />
                  <DialogTitle className="text-white">{rosterModal.school_name}</DialogTitle>
                </div>
              </DialogHeader>
              {rosterLoading ? (
                <p className="text-white/60 py-8 text-center">Loading roster…</p>
              ) : rosterRows.length === 0 ? (
                <p className="text-white/60 py-8 text-center">No roster data yet for this school.</p>
              ) : (
                <RosterGrid rows={rosterRows} />
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

const POSITIONS = ["PG", "SG", "SF", "PF", "C"] as const;
const CLASS_YEARS = ["SR", "JR", "SO", "FR"] as const;

function bucketPosition(pos: string | null): typeof POSITIONS[number] | null {
  const p = (pos || "").toUpperCase().trim();
  if (!p) return null;
  if (p.includes("POINT GUARD") || p.includes("PG")) return "PG";
  if (p.includes("SHOOTING GUARD") || p.includes("SG")) return "SG";
  if (p.includes("SMALL FORWARD") || p.includes("SF") || p.includes("WING")) return "SF";
  if (p.includes("POWER FORWARD") || p.includes("PF")) return "PF";
  if (p === "C" || p.includes("CENTER") || p === "C/F" || p.includes("F/C")) return "C";
  if (p === "G" || p === "GUARD") return "PG";
  if (p === "F" || p.includes("FORWARD")) return "SF";
  return null;
}

// Maps a roster position string to the set of athlete buckets it could fill.
// Specific labels ("PG") map to one bucket; ambiguous labels ("G", "Guard")
// map to multiple ("G" → PG + SG) so a Point Guard athlete still matches a
// roster row only labeled "G".
function positionGroups(pos: string | null): Array<typeof POSITIONS[number]> {
  const p = (pos || "").toUpperCase().trim();
  if (!p) return [];
  if (p.includes("POINT GUARD") || p === "PG") return ["PG"];
  if (p.includes("SHOOTING GUARD") || p === "SG") return ["SG"];
  if (p.includes("SMALL FORWARD") || p === "SF" || p.includes("WING")) return ["SF"];
  if (p.includes("POWER FORWARD") || p === "PF") return ["PF"];
  if (p === "C" || p.includes("CENTER")) return ["C"];
  // Combo / ambiguous labels
  if (p === "G/F" || p === "F/G" || p.includes("GUARD/FORWARD") || p.includes("FORWARD/GUARD"))
    return ["SG", "SF"];
  if (p === "F/C" || p === "C/F" || p.includes("FORWARD/CENTER") || p.includes("CENTER/FORWARD"))
    return ["PF", "C"];
  if (p === "G/PG" || p === "PG/SG") return ["PG", "SG"];
  if (p === "SF/PF" || p === "PF/SF") return ["SF", "PF"];
  // Single-letter / generic words → both sub-positions in that group
  if (p === "G" || p === "GUARD") return ["PG", "SG"];
  if (p === "F" || p === "FORWARD") return ["SF", "PF"];
  return [];
}

function RosterGrid({ rows }: { rows: RosterRow[] }) {
  const grid: Record<string, Record<string, RosterRow[]>> = {};
  for (const p of POSITIONS) {
    grid[p] = {};
    for (const y of CLASS_YEARS) grid[p][y] = [];
  }
  for (const r of rows) {
    const pos = bucketPosition(r.position);
    const yr = (r.class_year || "").toUpperCase();
    if (pos && (CLASS_YEARS as readonly string[]).includes(yr)) {
      grid[pos][yr].push(r);
    }
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="text-left p-2 text-white/60 font-medium">Position</th>
            {CLASS_YEARS.map((y) => (
              <th
                key={y}
                className="text-left p-2 text-white/80 font-semibold"
                style={{
                  background: y === "SR" ? "rgba(220,38,38,0.12)" : undefined,
                }}
              >
                {y}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {POSITIONS.map((p) => (
            <tr key={p} className="border-t border-white/5">
              <td className="p-2 text-white/70 font-medium">{p}</td>
              {CLASS_YEARS.map((y) => (
                <td
                  key={y}
                  className="p-2 align-top text-white/90"
                  style={{
                    background: y === "SR" ? "rgba(220,38,38,0.06)" : undefined,
                  }}
                >
                  {grid[p][y].length === 0 ? (
                    <span className="text-white/30">—</span>
                  ) : (
                    <ul className="space-y-1">
                      {grid[p][y].map((r, i) => (
                        <li key={i} className="text-[13px]">
                          {r.player_name}
                          {r.jersey_number ? (
                            <span className="text-white/40"> #{r.jersey_number}</span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
