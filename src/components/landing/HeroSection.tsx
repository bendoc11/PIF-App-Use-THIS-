import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import zacHeroImg from "@/assets/zac-ervin-hero.jpg";

function RecruitingProfileCard() {
  return (
    <div
      className="absolute top-6 left-6 md:top-10 md:left-10 w-[280px] md:w-[320px] rounded-2xl border p-4 md:p-5 z-20"
      style={{
        background: "rgba(10, 15, 30, 0.75)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderColor: "rgba(59, 130, 246, 0.35)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 40px rgba(59,130,246,0.1)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-full overflow-hidden border-2 flex-shrink-0" style={{ borderColor: "rgba(59,130,246,0.5)" }}>
          <img src={zacHeroImg} alt="Zac Ervin" className="w-full h-full object-cover object-top" />
        </div>
        <div>
          <p className="font-heading text-sm text-foreground tracking-wide">ZAC ERVIN</p>
          <p className="text-xs text-muted-foreground">2025 · SG/SF · 6'5"</p>
        </div>
      </div>

      {/* Stat badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span
          className="text-[10px] font-heading tracking-wider px-2.5 py-1 rounded-md text-foreground"
          style={{ backgroundColor: "rgba(59,130,246,0.85)" }}
        >
          42 OFFERS
        </span>
        <span
          className="text-[10px] font-heading tracking-wider px-2.5 py-1 rounded-md text-foreground bg-primary"
        >
          #9 PLAYER IN VA
        </span>
        <span
          className="text-[10px] font-heading tracking-wider px-2.5 py-1 rounded-md text-foreground border"
          style={{ backgroundColor: "rgba(10,15,30,0.8)", borderColor: "rgba(59,130,246,0.4)" }}
        >
          6 NEW MESSAGES
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[10px] font-heading tracking-wider text-muted-foreground">PROFILE COMPLETE</span>
          <span className="text-[10px] font-heading text-secondary">94%</span>
        </div>
        <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
          <div className="h-full rounded-full bg-secondary" style={{ width: "94%" }} />
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground">Last viewed by 3 coaches today</p>
    </div>
  );
}

function StatsBar() {
  const stats = [
    { value: "1,852+", label: "College Programs" },
    { value: "7,819+", label: "Coach Emails" },
    { value: "500+", label: "Elite Drills" },
    { value: "100%", label: "Free to Start" },
  ];

  return (
    <div className="border-t border-b border-border/50 bg-card/30">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-12 py-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-0">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`text-center ${i < stats.length - 1 ? "md:border-r md:border-border/30" : ""}`}
            >
              <p className="font-heading text-lg md:text-xl text-foreground">{s.value}</p>
              <p className="text-[11px] font-heading tracking-widest text-muted-foreground">{s.label}</p>
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
      <section className="relative overflow-hidden" style={{ background: "#0A0F1E" }}>
        <div className="relative z-10 max-w-[1400px] mx-auto px-4 md:px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-0 items-center min-h-[85vh] py-16 lg:py-0">
            {/* Left — copy */}
            <div className="animate-[fadeInUp_0.5s_ease-out_both] lg:pr-12">
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl xl:text-[4.2rem] leading-[1.08] mb-6 text-foreground">
                This is where players<br />get recruited.
              </h1>

              <p className="font-body text-muted-foreground text-base sm:text-lg max-w-lg mb-8 leading-relaxed">
                Build your free recruiting profile, reach every college coach in the country, and develop your game — all in one place.
              </p>

              <div className="flex flex-col gap-3">
                <Link to="/login" className="w-full sm:w-auto">
                  <Button
                    className="btn-cta bg-primary hover:bg-primary/90 text-foreground rounded-lg w-full sm:w-auto px-10 py-7 text-base min-h-[56px] glow-red glow-red-hover"
                  >
                    Build My Free Profile →
                  </Button>
                </Link>
                <p className="font-body text-sm text-muted-foreground">
                  100% free · No credit card required
                </p>
              </div>
            </div>

            {/* Right — athlete photo with floating card */}
            <div className="relative hidden lg:block animate-[fadeInUp_0.7s_ease-out_0.15s_both]">
              <div className="relative rounded-2xl overflow-hidden" style={{ boxShadow: "0 25px 60px rgba(0,0,0,0.5)" }}>
                {/* Photo */}
                <img
                  src={zacHeroImg}
                  alt="Zac Ervin going up for a layup in a packed gym"
                  className="w-full h-[600px] xl:h-[650px] object-cover object-top"
                />
                {/* Left gradient fade into navy */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "linear-gradient(to right, #0A0F1E 0%, rgba(10,15,30,0.6) 25%, transparent 50%)",
                  }}
                />
                {/* Bottom gradient */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "linear-gradient(to top, #0A0F1E 0%, transparent 40%)",
                  }}
                />
                {/* Floating profile card */}
                <RecruitingProfileCard />
              </div>
            </div>

            {/* Mobile — show card only, no photo */}
            <div className="lg:hidden">
              <div className="relative">
                <div className="rounded-2xl overflow-hidden" style={{ maxHeight: "400px" }}>
                  <img
                    src={zacHeroImg}
                    alt="Zac Ervin going up for a layup"
                    className="w-full h-[400px] object-cover object-top"
                  />
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: "linear-gradient(to top, #0A0F1E 0%, transparent 50%)",
                    }}
                  />
                </div>
                <div className="relative -mt-16 mx-auto w-[90%] max-w-[320px]">
                  <div
                    className="rounded-2xl border p-4 z-20"
                    style={{
                      background: "rgba(10, 15, 30, 0.85)",
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                      borderColor: "rgba(59, 130, 246, 0.35)",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                    }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 flex-shrink-0" style={{ borderColor: "rgba(59,130,246,0.5)" }}>
                        <img src={zacHeroImg} alt="Zac Ervin" className="w-full h-full object-cover object-top" />
                      </div>
                      <div>
                        <p className="font-heading text-sm text-foreground tracking-wide">ZAC ERVIN</p>
                        <p className="text-xs text-muted-foreground">2025 · SG/SF · 6'5"</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className="text-[9px] font-heading tracking-wider px-2 py-0.5 rounded text-foreground" style={{ backgroundColor: "rgba(59,130,246,0.85)" }}>42 OFFERS</span>
                      <span className="text-[9px] font-heading tracking-wider px-2 py-0.5 rounded text-foreground bg-primary">#9 IN VA</span>
                      <span className="text-[9px] font-heading tracking-wider px-2 py-0.5 rounded text-foreground border" style={{ backgroundColor: "rgba(10,15,30,0.8)", borderColor: "rgba(59,130,246,0.4)" }}>6 MESSAGES</span>
                    </div>
                    <div className="mb-1.5">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] font-heading tracking-wider text-muted-foreground">PROFILE COMPLETE</span>
                        <span className="text-[9px] font-heading text-secondary">94%</span>
                      </div>
                      <div className="w-full h-1 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                        <div className="h-full rounded-full bg-secondary" style={{ width: "94%" }} />
                      </div>
                    </div>
                    <p className="text-[9px] text-muted-foreground">Last viewed by 3 coaches today</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <StatsBar />
    </>
  );
}
