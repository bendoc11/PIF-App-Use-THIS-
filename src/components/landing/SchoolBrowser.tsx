import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { fbPixel } from "@/lib/fbpixel";
import wmLogo from "@/assets/schools/wm-logo.png.asset.json";
import bryantLogo from "@/assets/schools/bryant-logo.png.asset.json";
import pomonaLogo from "@/assets/schools/pomona-logo.png.asset.json";
import mitLogo from "@/assets/schools/mit-logo.png.asset.json";

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
  recruitingNeed: string;
  openSpots: string;
};

const SCHOOLS: School[] = [
  { name: "College of William & Mary", display: "William & Mary", division: "D1", conference: "CAA", city: "Williamsburg", state: "VA", logoUrl: wmLogo.url, avgGpa: "3.57", acceptanceRate: "32.7%", enrollment: 7359, recruitingNeed: "Actively recruiting guards & forwards", openSpots: "2 guards graduating after this season" },
  { name: "Bryant University", display: "Bryant University", division: "D1", conference: "NEC", city: "Smithfield", state: "RI", logoUrl: bryantLogo.url, avgGpa: "3.39", acceptanceRate: "65.7%", enrollment: 3306, recruitingNeed: "Actively recruiting wings & bigs", openSpots: "3 seniors graduating — wing spots open" },
  { name: "Hofstra University", display: "Hofstra University", division: "D1", conference: "CAA", city: "Hempstead", state: "NY", logoUrl: "https://icons.duckduckgo.com/ip3/gohofstra.com.ico", avgGpa: "3.67", acceptanceRate: "70.6%", enrollment: 6503, recruitingNeed: "Actively recruiting guards", openSpots: "2 backcourt spots opening next year" },
  { name: "University of Toledo", display: "University of Toledo", division: "D1", conference: "MAC", city: "Toledo", state: "OH", logoUrl: "https://icons.duckduckgo.com/ip3/utrockets.com.ico", avgGpa: "3.45", acceptanceRate: "94.8%", enrollment: 13499, recruitingNeed: "Actively recruiting forwards", openSpots: "2 forwards graduating after this season" },
  { name: "Miami University", display: "Miami University (OH)", division: "D1", conference: "MAC", city: "Oxford", state: "OH", logoUrl: "https://icons.duckduckgo.com/ip3/miamiredhawks.com.ico", avgGpa: "3.78", acceptanceRate: "82.1%", enrollment: 17604, recruitingNeed: "Actively recruiting guards & wings", openSpots: "3 seniors leaving — guard spots open" },
  { name: "Florida Gulf Coast University", display: "Florida Gulf Coast (FGCU)", division: "D1", conference: "ASUN", city: "Fort Myers", state: "FL", logoUrl: "https://icons.duckduckgo.com/ip3/fgcuathletics.com.ico", avgGpa: "3.93", acceptanceRate: "76.7%", enrollment: 15924, recruitingNeed: "Actively recruiting bigs", openSpots: "2 post players graduating this year" },
  { name: "Ursinus College", display: "Ursinus College", division: "D3", conference: "Centennial", city: "Collegeville", state: "PA", logoUrl: "https://icons.duckduckgo.com/ip3/ursinus.edu.ico", avgGpa: "3.21", acceptanceRate: "87.4%", enrollment: 1562, recruitingNeed: "Actively recruiting guards & forwards", openSpots: "4 seniors graduating — multiple spots open" },
  { name: "Pomona-Pitzer Colleges", display: "Pomona-Pitzer", division: "D3", conference: "SCIAC", city: "Claremont", state: "CA", logoUrl: pomonaLogo.url, avgGpa: "3.82", acceptanceRate: "6.8%", enrollment: 1814, recruitingNeed: "Actively recruiting wings", openSpots: "2 wings graduating after this season" },
  { name: "Johns Hopkins University", display: "Johns Hopkins University", division: "D3", conference: "Centennial", city: "Baltimore", state: "MD", logoUrl: "https://icons.duckduckgo.com/ip3/hopkinssports.com.ico", avgGpa: "3.92", acceptanceRate: "7.6%", enrollment: 8654, recruitingNeed: "Actively recruiting guards", openSpots: "3 backcourt seniors leaving this year" },
  { name: "University of California - San Diego", display: "UC San Diego", division: "D1", conference: "Big West", city: "La Jolla", state: "CA", logoUrl: "https://icons.duckduckgo.com/ip3/ucsdtritons.com.ico", avgGpa: "4.07", acceptanceRate: "24.5%", enrollment: 34808, recruitingNeed: "Actively recruiting forwards & bigs", openSpots: "2 frontcourt spots opening next year" },
  { name: "Williams College", display: "Williams College", division: "D3", conference: "NESCAC", city: "Williamstown", state: "MA", logoUrl: "https://icons.duckduckgo.com/ip3/williams.edu.ico", avgGpa: "4.04", acceptanceRate: "10.0%", enrollment: 2302, recruitingNeed: "Actively recruiting guards & wings", openSpots: "3 seniors graduating after this season" },
  { name: "Massachusetts Institute of Technology - MIT", display: "MIT", division: "D3", conference: "NEWMAC", city: "Cambridge", state: "MA", logoUrl: mitLogo.url, avgGpa: "4.19", acceptanceRate: "4.7%", enrollment: 4729, recruitingNeed: "Actively recruiting guards & forwards", openSpots: "2 guards graduating this year" },
  { name: "Cleveland State University", display: "Cleveland State University", division: "D1", conference: "Horizon", city: "Cleveland", state: "OH", logoUrl: "https://icons.duckduckgo.com/ip3/csuvikings.com.ico", avgGpa: "3.37", acceptanceRate: "95.5%", enrollment: 11390, recruitingNeed: "Actively recruiting wings", openSpots: "3 wing spots opening next season" },
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

function SchoolLogo({ school, size = 56, radius = 10, className }: { school: School; size?: number; radius?: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (school.logoUrl && !failed) {
    return (
      <div
        className={`shrink-0 flex items-center justify-center ${className || ""}`}
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          padding: 6,
        }}
      >
        <img
          src={school.logoUrl}
          alt={`${school.display} logo`}
          onError={() => setFailed(true)}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }
  return (
    <div
      className={`flex items-center justify-center text-white font-bold shrink-0 ${className || ""}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
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

  void academicLine;

  return (
    <div className="relative w-full max-w-[440px] mx-auto max-md:max-w-none">
      {/* Card with swipe animation */}
      <div className="relative overflow-hidden rounded-2xl">
        <div
          key={index}
          className="rounded-2xl p-7 max-md:p-7"
          style={{
            background: "linear-gradient(180deg, rgb(14, 20, 36) 0%, rgb(10, 14, 26) 100%)",
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "0 20px 50px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)",
            transform: dir === "out-right" ? "translateX(110%)" : "translateX(0)",
            opacity: dir === "out-right" ? 0 : 1,
            animation: dir === "in" ? "slideInLeft 250ms ease-out" : undefined,
            transition: dir === "out-right" ? "transform 250ms ease-out, opacity 250ms ease-out" : undefined,
          }}
        >
          {/* 1. Recruiting signal — inline live tag */}
          <div className="flex items-center gap-2 mb-5">
            <span
              className="inline-block h-2 w-2 rounded-full shrink-0"
              style={{ background: "#22c55e", boxShadow: "0 0 6px rgba(34,197,94,0.6)" }}
            />
            <span
              className="text-[12px] max-md:text-[13px] leading-none truncate"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 400, color: "rgba(134, 239, 172, 0.85)", letterSpacing: "0.005em" }}
            >
              {school.recruitingNeed}
            </span>
          </div>

          {/* 2. School identity */}
          <div className="flex items-center gap-4 mb-5">
            <SchoolLogo school={school} size={64} radius={12} className="school-logo-mobile" />
            <div className="flex-1 min-w-0">
              <p
                className="text-white leading-tight text-[22px] max-md:text-[24px]"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, letterSpacing: "-0.01em" }}
              >
                {school.display}
              </p>
              <p
                className="text-[11px] max-md:text-[12px] mt-1.5"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "rgba(255,255,255,0.42)", letterSpacing: "0.01em" }}
              >
                {school.division} · {school.conference} · {school.city}, {school.state}
              </p>
            </div>
          </div>

          {/* 3. Stats — plain text, divider separated */}
          {(school.avgGpa || school.acceptanceRate) && (
            <div className="flex items-center gap-4 mb-5">
              {school.avgGpa && (
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-[10px] uppercase tracking-wider"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em" }}
                  >
                    GPA
                  </span>
                  <span
                    className="text-white text-[14px] max-md:text-[15px]"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 }}
                  >
                    {school.avgGpa}
                  </span>
                </div>
              )}
              {school.avgGpa && school.acceptanceRate && (
                <span className="h-3.5 w-px" style={{ background: "rgba(255,255,255,0.12)" }} />
              )}
              {school.acceptanceRate && (
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-[10px] uppercase tracking-wider"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em" }}
                  >
                    Accepts
                  </span>
                  <span
                    className="text-white text-[14px] max-md:text-[15px]"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 }}
                  >
                    {school.acceptanceRate}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 4. Open spots — inline insider data point */}
          <div className="flex items-center gap-2 mb-7">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0" style={{ color: "#f59e0b" }}>
              <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M22 11h-6M9 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span
              className="text-[12px] max-md:text-[13px] leading-snug"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500, color: "#f5b754" }}
            >
              {school.openSpots}
            </span>
          </div>

          {/* 5. Main CTA */}
          <Button
            onClick={() => { try { fbPixel.lead(); } catch {} setModalOpen(true); }}
            className="w-full text-white text-[15px] max-md:text-[16px] py-4 max-md:py-[18px] h-auto border-0"
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 500,
              letterSpacing: "0.005em",
              borderRadius: 11,
              background: "linear-gradient(180deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.88) 100%)",
              boxShadow: "0 6px 18px rgba(220, 38, 38, 0.28), inset 0 1px 0 rgba(255,255,255,0.12)",
            }}
          >
            Get in front of this coach<span style={{ marginLeft: 8 }}>→</span>
          </Button>

          {/* 6. Secondary — roster link */}
          <div className="mt-4 text-center">
            <button
              onClick={() => setRosterOpen(true)}
              className="text-[11px] max-md:text-[12px] transition-colors"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "rgba(255,255,255,0.4)" }}
            >
              View their roster →
            </button>
          </div>

          {/* 7. Demoted skip */}
          <button
            onClick={next}
            className="w-full text-[11px] max-md:text-[12px] pt-2 pb-1 transition-colors text-center"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "rgba(255,255,255,0.32)" }}
          >
            Next school →
          </button>

          {/* 8. Swipe affordance */}
          <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>←</span>
            <span
              className="text-[11px] max-md:text-[12px]"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 400 }}
            >
              <span style={{ color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>{SCHOOLS.length}+</span>
              <span style={{ color: "rgba(255,255,255,0.4)" }}> programs</span>
            </span>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>→</span>
          </div>
        </div>
      </div>
      </div>

      {/* Status line */}
      <p
        className="text-center mt-3 text-[11px] max-md:text-[12px]"
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 400,
          color: "rgba(255,255,255,0.4)",
        }}
      >
        {index + 1} of {SCHOOLS.length} sample programs · 1,848 total in the database
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
        @keyframes ctaPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.45), 0 4px 14px rgba(220, 38, 38, 0.25); }
          50% { box-shadow: 0 0 28px 8px rgba(220, 38, 38, 0.18), 0 4px 14px rgba(220, 38, 38, 0.35); }
        }
        @keyframes livePing {
          75%, 100% { transform: scale(2.4); opacity: 0; }
        }
        @media (max-width: 768px) {
          .school-logo-mobile { width: 76px !important; height: 76px !important; }
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
