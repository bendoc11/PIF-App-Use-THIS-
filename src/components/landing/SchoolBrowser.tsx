import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type School = {
  name: string;
  display: string;
  division: "D1" | "D2" | "D3" | "NAIA";
  conference: string;
  city: string;
  state: string;
  logoUrl: string | null;
  avgGpa: string | null;
  acceptanceRate: string | null;
  enrollment: number | null;
};

const SCHOOLS: School[] = [
  { name: "College of William & Mary", display: "William & Mary", division: "D1", conference: "CAA", city: "Williamsburg", state: "VA", logoUrl: "https://icons.duckduckgo.com/ip3/tribeathletics.com.ico", avgGpa: "3.57", acceptanceRate: "32.7%", enrollment: 7359 },
  { name: "Bryant University", display: "Bryant University", division: "D1", conference: "NEC", city: "Smithfield", state: "RI", logoUrl: "https://icons.duckduckgo.com/ip3/bryantbulldogs.com.ico", avgGpa: "3.39", acceptanceRate: "65.7%", enrollment: 3306 },
  { name: "Hofstra University", display: "Hofstra University", division: "D1", conference: "CAA", city: "Hempstead", state: "NY", logoUrl: "https://icons.duckduckgo.com/ip3/gohofstra.com.ico", avgGpa: "3.67", acceptanceRate: "70.6%", enrollment: 6503 },
  { name: "University of Toledo", display: "University of Toledo", division: "D1", conference: "MAC", city: "Toledo", state: "OH", logoUrl: "https://icons.duckduckgo.com/ip3/utrockets.com.ico", avgGpa: "3.45", acceptanceRate: "94.8%", enrollment: 13499 },
  { name: "Miami University", display: "Miami University (OH)", division: "D1", conference: "MAC", city: "Oxford", state: "OH", logoUrl: "https://icons.duckduckgo.com/ip3/miamiredhawks.com.ico", avgGpa: "3.78", acceptanceRate: "82.1%", enrollment: 17604 },
  { name: "Florida Gulf Coast University", display: "Florida Gulf Coast (FGCU)", division: "D1", conference: "ASUN", city: "Fort Myers", state: "FL", logoUrl: "https://icons.duckduckgo.com/ip3/fgcuathletics.com.ico", avgGpa: "3.93", acceptanceRate: "76.7%", enrollment: 15924 },
  { name: "Ursinus College", display: "Ursinus College", division: "D3", conference: "Centennial", city: "Collegeville", state: "PA", logoUrl: "https://icons.duckduckgo.com/ip3/ursinus.edu.ico", avgGpa: "3.21", acceptanceRate: "87.4%", enrollment: 1562 },
  { name: "Pomona-Pitzer Colleges", display: "Pomona-Pitzer", division: "D3", conference: "SCIAC", city: "Claremont", state: "CA", logoUrl: "https://icons.duckduckgo.com/ip3/sagehens.com.ico", avgGpa: "3.82", acceptanceRate: "6.8%", enrollment: 1814 },
  { name: "Johns Hopkins University", display: "Johns Hopkins University", division: "D3", conference: "Centennial", city: "Baltimore", state: "MD", logoUrl: "https://icons.duckduckgo.com/ip3/hopkinssports.com.ico", avgGpa: "3.92", acceptanceRate: "7.6%", enrollment: 8654 },
  { name: "University of California - San Diego", display: "UC San Diego", division: "D1", conference: "Big West", city: "La Jolla", state: "CA", logoUrl: "https://icons.duckduckgo.com/ip3/ucsdtritons.com.ico", avgGpa: "4.07", acceptanceRate: "24.5%", enrollment: 34808 },
  { name: "Williams College", display: "Williams College", division: "D3", conference: "NESCAC", city: "Williamstown", state: "MA", logoUrl: "https://icons.duckduckgo.com/ip3/williams.edu.ico", avgGpa: "4.04", acceptanceRate: "10.0%", enrollment: 2302 },
  { name: "Massachusetts Institute of Technology - MIT", display: "MIT", division: "D3", conference: "NEWMAC", city: "Cambridge", state: "MA", logoUrl: "https://icons.duckduckgo.com/ip3/mitathletics.com.ico", avgGpa: "4.19", acceptanceRate: "4.7%", enrollment: 4729 },
  { name: "Cleveland State University", display: "Cleveland State University", division: "D1", conference: "Horizon", city: "Cleveland", state: "OH", logoUrl: "https://icons.duckduckgo.com/ip3/csuvikings.com.ico", avgGpa: "3.37", acceptanceRate: "95.5%", enrollment: 11390 },
];

const DIV_COLORS: Record<School["division"], string> = {
  D1: "#1d4ed8",
  D2: "#15803d",
  D3: "#7c3aed",
  NAIA: "#d97706",
};

function enrollmentLabel(n: number | null): string | null {
  if (n == null) return null;
  if (n < 3000) return "Small School";
  if (n <= 15000) return "Mid-Size";
  return "Large University";
}

function academicLine(s: School): string | null {
  const parts: string[] = [];
  if (s.avgGpa) parts.push(`Avg GPA ${s.avgGpa}`);
  if (s.acceptanceRate) parts.push(`Acceptance ${s.acceptanceRate}`);
  const e = enrollmentLabel(s.enrollment);
  if (e) parts.push(e);
  return parts.length ? parts.join(" · ") : null;
}

function SchoolLogo({ school, size = 56, radius = 10 }: { school: School; size?: number; radius?: number }) {
  const [failed, setFailed] = useState(false);
  if (school.logoUrl && !failed) {
    return (
      <img
        src={school.logoUrl}
        alt={`${school.display} logo`}
        onError={() => setFailed(true)}
        className="shrink-0 object-contain bg-white/5"
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          border: "1px solid rgba(255,255,255,0.15)",
          padding: 4,
        }}
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center text-white font-bold shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: 9999,
        background: DIV_COLORS[school.division],
        fontSize: size * 0.42,
      }}
    >
      {school.display.charAt(0)}
    </div>
  );
}

export function SchoolBrowser() {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState<"in" | "out-right">("in");
  const [modalOpen, setModalOpen] = useState(false);
  const [rosterOpen, setRosterOpen] = useState(false);

  const school = SCHOOLS[index];

  function next() {
    setDir("out-right");
    setTimeout(() => {
      setIndex((i) => (i + 1) % SCHOOLS.length);
      setDir("in");
    }, 250);
  }

  const acad = academicLine(school);

  return (
    <div className="relative w-full max-w-[440px] mx-auto">
      {/* Card with swipe animation */}
      <div className="relative overflow-hidden rounded-2xl">
        <div
          key={index}
          className="rounded-2xl p-6 border"
          style={{
            background: "rgb(10, 15, 30)",
            borderColor: "rgba(255,255,255,0.15)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.6), 0 0 60px rgba(220,38,38,0.08)",
            transform: dir === "out-right" ? "translateX(110%)" : "translateX(0)",
            opacity: dir === "out-right" ? 0 : 1,
            animation: dir === "in" ? "slideInLeft 250ms ease-out" : undefined,
            transition: dir === "out-right" ? "transform 250ms ease-out, opacity 250ms ease-out" : undefined,
          }}
        >
          <div className="flex items-center gap-4 mb-3">
            <SchoolLogo school={school} size={56} radius={10} />
            <div className="flex-1 min-w-0">
              <p
                className="text-white leading-tight"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 19 }}
              >
                {school.display}
              </p>
              <p className="text-white/60 text-xs mt-1">
                <span className="font-semibold text-white/80">{school.division}</span> · {school.conference}
              </p>
              <p className="text-white/50 text-xs mt-0.5">
                {school.city}, {school.state}
              </p>
              {acad && (
                <p
                  className="mt-1"
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontWeight: 400,
                    fontSize: 11,
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  {acad}
                </p>
              )}
            </div>
          </div>

          <div
            className="rounded-lg px-3 py-2 mb-3 text-xs font-medium"
            style={{ background: "#0d2e1a", color: "#4ade80" }}
          >
            🏀 Actively recruiting guards and forwards — {school.division} program
          </div>

          <button
            onClick={() => setRosterOpen(true)}
            className="text-xs text-white/60 hover:text-white hover:underline mb-4 flex items-center gap-1.5 transition-colors"
          >
            View their roster →
          </button>

          <Button
            onClick={() => setModalOpen(true)}
            className="w-full bg-primary hover:bg-primary/90 text-white text-sm font-semibold py-3 h-auto mb-2"
            style={{ animation: "ctaPulse 3s ease-in-out infinite" }}
          >
            I would play here →
          </Button>
          <button
            onClick={next}
            className="w-full text-xs text-white/60 hover:text-white/90 py-2 transition-colors"
          >
            Next school →
          </button>
        </div>
      </div>

      {/* Status lines */}
      <p
        className="text-center mt-3"
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 400,
          fontSize: 11,
          color: "rgba(255,255,255,0.4)",
        }}
      >
        Browsing {school.display} · {index + 1} of {SCHOOLS.length} programs · 1,848 total programs in the database
      </p>
      <p
        className="text-center mt-1"
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 400,
          fontSize: 11,
          color: "rgba(255,255,255,0.4)",
        }}
      >
        Find your fit — then message their coaches in one tap.
      </p>

      {modalOpen && (
        <SignupModal school={school} onClose={() => setModalOpen(false)} />
      )}
      {rosterOpen && (
        <RosterModal school={school} onClose={() => setRosterOpen(false)} />
      )}

      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-110%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function SignupModal({ school, onClose }: { school: School; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl p-6 border bg-[rgb(10,15,30)]"
        style={{
          borderColor: "rgba(255,255,255,0.15)",
          borderLeft: "3px solid hsl(var(--primary))",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white/60 hover:text-white p-1"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <SchoolLogo school={school} size={48} radius={8} />
          <p
            className="text-white font-semibold text-base"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {school.display}
          </p>
        </div>

        <h3
          className="text-white mb-3 leading-tight"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 22 }}
        >
          Ready to message the coaches at {school.display}?
        </h3>
        <p className="text-white/70 text-sm mb-6 leading-relaxed">
          Create your free profile in 2 minutes. We'll match you with the right coaches and help you send your first message today.
        </p>

        <Link to="/login?mode=signup" className="block">
          <Button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-4 h-auto text-base glow-red">
            I'm Ready to Get Offered →
          </Button>
        </Link>
        <p className="text-center text-white/50 text-xs mt-3">
          Free to start · No credit card required · 2-minute setup
        </p>
      </div>
    </div>
  );
}

type RosterPlayer = {
  player_name: string | null;
  position: string | null;
  class_year: string | null;
};

const POSITIONS = ["PG", "SG", "SF", "PF", "C", "G", "F"] as const;
const CLASS_YEARS = ["SR", "JR", "SO", "FR"] as const;

function normalizeClass(raw: string | null): string | null {
  if (!raw) return null;
  const v = raw.trim().toLowerCase();
  if (v.startsWith("sr") || v.startsWith("sen")) return "SR";
  if (v.startsWith("jr") || v.startsWith("jun")) return "JR";
  if (v.startsWith("so") || v.startsWith("sop")) return "SO";
  if (v.startsWith("fr") || v.startsWith("fre")) return "FR";
  if (v.startsWith("gr") || v.startsWith("rs")) return "SR";
  return null;
}

function normalizePosition(raw: string | null): string | null {
  if (!raw) return null;
  const v = raw.trim().toUpperCase().replace(/[^A-Z/]/g, "");
  if (!v) return null;
  if (v.includes("PG") || v === "POINT") return "PG";
  if (v.includes("SG") || v === "SHOOTING") return "SG";
  if (v.includes("SF") || v === "SMALL") return "SF";
  if (v.includes("PF") || v === "POWER") return "PF";
  if (v === "C" || v.includes("CENTER")) return "C";
  if (v === "G" || v.includes("GUARD")) return "G";
  if (v === "F" || v.includes("FORWARD")) return "F";
  return null;
}

function RosterModal({ school, onClose }: { school: School; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<RosterPlayer[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("school_rosters")
        .select("player_name, position, class_year")
        .eq("school_name", school.name)
        .limit(200);
      if (!cancelled) {
        setPlayers((data as RosterPlayer[]) || []);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [school.name]);

  const grid: Record<string, Record<string, string[]>> = {};
  POSITIONS.forEach((p) => {
    grid[p] = {};
    CLASS_YEARS.forEach((c) => (grid[p][c] = []));
  });

  for (const p of players) {
    const pos = normalizePosition(p.position);
    const cls = normalizeClass(p.class_year);
    if (!pos || !cls || !p.player_name) continue;
    grid[pos][cls].push(p.player_name);
  }

  const seniors = players.filter((p) => normalizeClass(p.class_year) === "SR").length;
  const openingPositions = Array.from(
    new Set(
      players
        .filter((p) => normalizeClass(p.class_year) === "SR")
        .map((p) => normalizePosition(p.position))
        .filter(Boolean)
    )
  ).join(", ");
  const nextYear = new Date().getFullYear() + 1;

  const hasData = players.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[600px] max-h-[90vh] overflow-y-auto rounded-2xl border bg-[rgb(10,15,30)]"
        style={{ borderColor: "rgba(255,255,255,0.15)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 text-white/60 hover:text-white p-1 bg-black/40 rounded-full"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-5 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <div className="flex items-center gap-3">
            <SchoolLogo school={school} size={52} radius={8} />
            <div className="flex-1 min-w-0">
              <p
                className="text-white leading-tight"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 17 }}
              >
                {school.display}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="inline-block px-1.5 py-0.5 rounded text-white text-[10px] font-semibold"
                  style={{ background: DIV_COLORS[school.division] }}
                >
                  {school.division}
                </span>
                <span
                  className="text-primary uppercase tracking-wider"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 10 }}
                >
                  Current Roster
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="py-12 text-center text-white/50 text-sm">Loading roster…</div>
          ) : !hasData ? (
            <div
              className="py-8 px-4 text-center rounded-xl border"
              style={{
                borderColor: "rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.02)",
              }}
            >
              <p className="text-white/70 text-sm mb-4">
                Roster data updating — check back soon. Sign up to see all available rosters.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-xs" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
                  <thead>
                    <tr>
                      <th className="text-left p-2 text-white/40 font-medium text-[10px] uppercase tracking-wider">
                        Pos
                      </th>
                      {CLASS_YEARS.map((c) => (
                        <th
                          key={c}
                          className="text-left p-2 text-[10px] uppercase tracking-wider font-medium"
                          style={{
                            color: c === "SR" ? "#fca5a5" : "rgba(255,255,255,0.4)",
                          }}
                        >
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {POSITIONS.filter((p) =>
                      CLASS_YEARS.some((c) => grid[p][c].length > 0)
                    ).map((pos) => (
                      <tr key={pos} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                        <td className="p-2 align-top">
                          <span className="text-white font-semibold">{pos}</span>
                        </td>
                        {CLASS_YEARS.map((c) => (
                          <td
                            key={c}
                            className="p-2 align-top"
                            style={
                              c === "SR"
                                ? {
                                    background: "rgba(220,38,38,0.07)",
                                    borderLeft: "2px solid rgba(220,38,38,0.5)",
                                  }
                                : undefined
                            }
                          >
                            {grid[pos][c].length === 0 ? (
                              <span className="text-white/20">—</span>
                            ) : (
                              grid[pos][c].map((name, i) => (
                                <div
                                  key={i}
                                  className="text-white/85 leading-snug"
                                  style={{ fontSize: 11 }}
                                >
                                  {name}
                                </div>
                              ))
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {seniors > 0 && (
                <div
                  className="mt-4 rounded-lg px-4 py-3 text-sm font-medium"
                  style={{ background: "#0d2e1a", color: "#4ade80" }}
                >
                  🏀 {seniors} {seniors === 1 ? "spot" : "spots"} opening in {nextYear}
                  {openingPositions ? ` at ${openingPositions}` : ""}
                </div>
              )}
            </>
          )}

          <Link to="/login?mode=signup" className="block mt-5">
            <Button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-4 h-auto text-base">
              Message Their Coaches →
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
