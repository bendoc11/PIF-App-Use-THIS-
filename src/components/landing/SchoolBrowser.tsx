import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type School = {
  name: string;
  display: string;
  division: "D1" | "D2" | "D3" | "NAIA";
  conference: string;
  city: string;
  state: string;
};

const SCHOOLS: School[] = [
  { name: "College of William & Mary", display: "William & Mary", division: "D1", conference: "CAA", city: "Williamsburg", state: "VA" },
  { name: "Bryant University", display: "Bryant University", division: "D1", conference: "NEC", city: "Smithfield", state: "RI" },
  { name: "Hofstra University", display: "Hofstra University", division: "D1", conference: "CAA", city: "Hempstead", state: "NY" },
  { name: "University of Toledo", display: "University of Toledo", division: "D1", conference: "MAC", city: "Toledo", state: "OH" },
  { name: "Miami University", display: "Miami University (OH)", division: "D1", conference: "MAC", city: "Oxford", state: "OH" },
  { name: "Florida Gulf Coast University", display: "Florida Gulf Coast (FGCU)", division: "D1", conference: "ASUN", city: "Fort Myers", state: "FL" },
  { name: "Ursinus College", display: "Ursinus College", division: "D3", conference: "Centennial", city: "Collegeville", state: "PA" },
  { name: "Pomona-Pitzer Colleges", display: "Pomona-Pitzer", division: "D3", conference: "SCIAC", city: "Claremont", state: "CA" },
  { name: "Johns Hopkins University", display: "Johns Hopkins University", division: "D3", conference: "Centennial", city: "Baltimore", state: "MD" },
  { name: "University of California - San Diego", display: "UC San Diego", division: "D1", conference: "Big West", city: "La Jolla", state: "CA" },
  { name: "Williams College", display: "Williams College", division: "D3", conference: "NESCAC", city: "Williamstown", state: "MA" },
  { name: "Massachusetts Institute of Technology - MIT", display: "MIT", division: "D3", conference: "NEWMAC", city: "Cambridge", state: "MA" },
  { name: "Cleveland State University", display: "Cleveland State University", division: "D1", conference: "Horizon", city: "Cleveland", state: "OH" },
];

const DIV_COLORS: Record<School["division"], string> = {
  D1: "#1d4ed8",
  D2: "#15803d",
  D3: "#7c3aed",
  NAIA: "#d97706",
};

export function SchoolBrowser() {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState<"in" | "out-right">("in");
  const [showPrompt, setShowPrompt] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowPrompt(false), 4000);
    return () => clearTimeout(t);
  }, []);

  const school = SCHOOLS[index];

  function next() {
    setDir("out-right");
    setTimeout(() => {
      setIndex((i) => (i + 1) % SCHOOLS.length);
      setDir("in");
    }, 250);
  }

  return (
    <div className="relative w-full max-w-[440px] mx-auto">
      {/* Animated prompt */}
      <div
        className="text-center mb-3 transition-opacity duration-500"
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 500,
          fontSize: 12,
          color: "rgba(255,255,255,0.7)",
          opacity: showPrompt ? 1 : 0,
          animation: showPrompt ? "pulse 1.6s ease-in-out infinite" : undefined,
          height: 18,
        }}
      >
        👆 Browse real programs — tap Next school to explore
      </div>

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
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl shrink-0"
              style={{ background: DIV_COLORS[school.division] }}
            >
              {school.display.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-white leading-tight"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 20 }}
              >
                {school.display}
              </p>
              <p className="text-white/60 text-xs mt-1">
                <span className="font-semibold text-white/80">{school.division}</span> · {school.conference}
              </p>
              <p className="text-white/50 text-xs mt-0.5">
                {school.city}, {school.state}
              </p>
            </div>
          </div>

          <div
            className="rounded-lg px-3 py-2 mb-3 text-xs font-medium"
            style={{ background: "#0d2e1a", color: "#4ade80" }}
          >
            🏀 Actively recruiting guards and forwards — {school.division} program
          </div>

          <div className="text-xs text-white/55 mb-4 flex items-center gap-1.5">
            🔍 View their open spots inside the app
          </div>

          <Button
            onClick={() => setModalOpen(true)}
            className="w-full bg-primary hover:bg-primary/90 text-white text-sm font-semibold py-3 h-auto mb-2"
          >
            I would play here →
          </Button>
          <button
            onClick={next}
            className="w-full text-xs text-white/60 hover:text-white/90 py-2 transition-colors"
          >
            Next school → ({index + 1} of {SCHOOLS.length})
          </button>
        </div>
      </div>

      {/* Status line */}
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

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200"
          onClick={() => setModalOpen(false)}
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
              onClick={() => setModalOpen(false)}
              className="absolute top-3 right-3 text-white/60 hover:text-white p-1"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{ background: DIV_COLORS[school.division] }}
              >
                {school.display.charAt(0)}
              </div>
              <p className="text-white font-semibold text-base" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
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
