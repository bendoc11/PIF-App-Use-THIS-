import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Eye } from "lucide-react";
import zacErvinHero from "@/assets/zac-ervin-hero.jpg";

/**
 * SchoolMatchCard — hero overlay mock.
 * NOTE: "Duke University" and "Coach Williams" below are HARDCODED DEMO VALUES
 * for the marketing mock only. No real school logos or trademarked imagery are
 * used — schools are represented by a colored initial circle + name text only.
 */
function SchoolMatchCard() {
  // Demo school — fictional for marketing mock. Royal blue is a generic
  // placeholder color, not tied to any specific institution.
  const demo = {
    name: "Duke University",
    initial: "D",
    color: "#1E40AF", // royal blue (generic)
    division: "D1 · Southeast",
    coach: "Coach Williams",
  };

  return (
    <div
      className="absolute -bottom-4 right-4 md:-bottom-6 md:right-6 w-[320px] rounded-2xl z-20 overflow-hidden"
      style={{
        background: "rgb(10, 15, 30)",
        border: "1px solid rgba(255,255,255,0.15)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.55), 0 0 60px rgba(59,130,246,0.08)",
      }}
    >
      <div className="p-4">
        {/* Match header */}
        <p
          className="font-sans font-semibold text-primary uppercase mb-3"
          style={{ fontSize: "10px", letterSpacing: "0.12em" }}
        >
          Match for You
        </p>

        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: demo.color }}
          >
            <span className="font-sans font-bold text-white text-base">{demo.initial}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-sans font-bold text-foreground text-base leading-tight truncate">
              {demo.name}
            </p>
            <span
              className="inline-block mt-1 px-2 py-0.5 rounded-full font-sans font-medium text-foreground/80"
              style={{
                fontSize: "11px",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {demo.division}
            </span>
          </div>
        </div>

        {/* Hook bar */}
        <div
          className="w-full rounded-lg mb-3"
          style={{
            background: "#0d2e1a",
            padding: "8px",
          }}
        >
          <p
            className="font-sans font-semibold leading-snug"
            style={{ color: "#4ade80", fontSize: "13px" }}
          >
            🏀 Open spot at Point Guard — 2 seniors graduating
          </p>
        </div>

        {/* Coach viewed line */}
        <div className="flex items-center gap-1.5 mb-4">
          <Eye className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.7)" }} />
          <p
            className="font-sans"
            style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px" }}
          >
            {demo.coach} viewed your profile today
          </p>
        </div>

        {/* Actions */}
        <button
          className="w-full bg-primary hover:bg-primary/90 text-foreground rounded-lg font-sans font-semibold py-2.5 text-sm transition-colors"
          type="button"
        >
          Message Coach →
        </button>
        <p
          className="text-center font-sans mt-2"
          style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}
        >
          Next school →
        </p>
      </div>
    </div>
  );
}


function StatsBar() {
  const stats = [
    { value: "1,852+", label: "College Programs" },
    { value: "7,819+", label: "Coach Contacts" },
    { value: "All Divisions", label: "D1 · D2 · D3 · NAIA" },
    { value: "Every Sport", label: "Full Athletic Department" },
  ];

  return (
    <div className="border-t border-b border-border/50 bg-card/30">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-12 py-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-0">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`text-center ${i < stats.length - 1 ? "md:border-r md:border-border/30" : ""}`}
            >
              <p className="font-sans text-lg md:text-xl font-semibold text-foreground">{s.value}</p>
              <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <>
      <section className="relative overflow-hidden min-h-[90vh] lg:min-h-screen" style={{ background: "#0A0F1E" }}>
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(59,130,246,0.4) 1px, transparent 0)",
            backgroundSize: "48px 48px",
          }} />

        <div className="relative z-10 max-w-[1200px] mx-auto px-4 md:px-6 lg:px-12 h-full">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[90vh] lg:min-h-screen py-20 lg:py-0">
            {/* Left side — Headline and CTA */}
            <div className="flex flex-col justify-center order-2 lg:order-1">
              <div className="animate-[fadeInUp_0.5s_ease-out_both]">
                <p className="text-sm font-medium tracking-wider text-secondary uppercase mb-4">
                  Built for High School Athletes Who Want to Play in College
                </p>

                <h1 className="font-sans text-4xl sm:text-5xl lg:text-[3.25rem] font-bold leading-[1.12] mb-6 text-foreground">
                  Get Recruited. On Your Terms.
                </h1>

                <p className="text-muted-foreground text-base sm:text-lg max-w-xl mb-8 leading-relaxed">
                  Build a recruiting profile coaches actually open. Contact every college program in the country — D1, D2, D3, NAIA — directly from your own email. Stop waiting to be discovered.
                </p>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <Link to="/login?mode=signup" className="w-full sm:w-auto">
                    <Button
                      className="bg-primary hover:bg-primary/90 text-foreground rounded-lg w-full sm:w-auto px-8 py-6 text-base font-semibold min-h-[52px] glow-red glow-red-hover"
                    >
                      Build My Free Profile <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Right side — Athlete photo with floating card */}
            <div className="relative order-1 lg:order-2 flex items-center justify-center">
              <div className="relative w-full max-w-[500px] lg:max-w-[580px]">
                {/* Athlete Image */}
                <div className="relative rounded-2xl overflow-hidden">
                  <img
                    src={zacErvinHero}
                    alt="Basketball player going up for a layup"
                    className="w-full h-auto object-cover object-top"
                    style={{ aspectRatio: "3/4", maxHeight: "650px" }}
                  />
                  {/* Gradient overlay on left edge to blend into background */}
                  <div
                    className="absolute inset-y-0 left-0 w-1/3 pointer-events-none"
                    style={{
                      background: "linear-gradient(to right, rgba(10,15,30,0.9) 0%, rgba(10,15,30,0.4) 50%, transparent 100%)"
                    }}
                  />
                </div>

                {/* Floating Match Card */}
                <SchoolMatchCard />
              </div>
              {/* Caption below card */}
              <p
                className="text-center font-sans mt-10 md:mt-12"
                style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}
              >
                ↑ 847 more programs match your profile
              </p>
            </div>
          </div>
        </div>
      </section>
      <StatsBar />
    </>
  );
}
