import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { SchoolBrowser } from "./SchoolBrowser";



function MatchForYouCard() {
  return (
    <div
      className="absolute -bottom-4 left-4 md:-bottom-6 md:left-6 w-[280px] md:w-[320px] rounded-2xl p-5 z-20 border"
      style={{
        background: "rgb(10, 15, 30)",
        borderColor: "rgba(255,255,255,0.15)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.6), 0 0 60px rgba(220,38,38,0.08)",
      }}
    >
      <p className="font-sans font-semibold uppercase tracking-[0.15em] mb-3" style={{ fontSize: 10, color: "hsl(var(--primary))" }}>
        MATCH FOR YOU
      </p>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: "#1e40af" }}>D</div>
        <div className="flex-1 min-w-0">
          <p className="font-sans font-bold text-foreground text-sm leading-tight">Duke University</p>
          <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-medium" style={{ background: "rgba(59,130,246,0.15)", color: "#60a5fa" }}>
            D1 · Southeast
          </span>
        </div>
      </div>
      <div className="rounded-lg px-3 py-2 mb-3 text-xs font-medium" style={{ background: "#0d2e1a", color: "#4ade80" }}>
        🏀 Open spot at Point Guard — 2 seniors graduating
      </div>
      <div className="flex items-center gap-2 mb-3 text-xs text-white/70">
        <Eye className="w-3.5 h-3.5" />
        Coach Williams viewed your profile today
      </div>
      <Link to="/login?mode=signup">
        <Button className="w-full bg-primary hover:bg-primary/90 text-white text-xs font-semibold py-2 h-auto">Message Coach →</Button>
      </Link>
      <button className="w-full text-xs text-white/60 hover:text-white/90 mt-2 py-1">Next school →</button>
      <p className="text-[11px] text-white/50 text-center mt-2">↑ 847 more programs match your profile</p>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden min-h-[90vh] lg:min-h-screen" style={{ background: "#0A0F1E" }}>
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(59,130,246,0.4) 1px, transparent 0)",
          backgroundSize: "48px 48px",
        }} />

      <div className="relative z-10 max-w-[1200px] mx-auto px-4 md:px-6 lg:px-12 h-full">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[90vh] lg:min-h-screen py-16 lg:py-0">
          <div className="flex flex-col justify-center order-2 lg:order-1">
            <div className="animate-[fadeInUp_0.5s_ease-out_both]">
              <p className="font-semibold tracking-[0.12em] text-primary uppercase mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11 }}>
                THE RECRUITING PLATFORM NCSA DOESN'T WANT YOU TO KNOW ABOUT
              </p>

              <h1 className="font-sans text-5xl sm:text-6xl lg:text-[4rem] font-bold leading-[1.05] mb-6 text-foreground">
                Get Offered.
              </h1>

              <p className="text-white/75 text-base sm:text-lg max-w-xl mb-8 leading-relaxed">
                Coaches recruited 4,200 athletes last year who reached out first. We give every high school basketball player direct access to every college coach in the country — and show you exactly which programs need your position right now.
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-5">
                <Link to="/login?mode=signup" className="w-full sm:w-auto">
                  <Button className="bg-primary hover:bg-primary/90 text-foreground rounded-lg w-full sm:w-auto px-8 py-6 text-base font-semibold min-h-[52px] glow-red glow-red-hover">
                    Build My Free Profile <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-white/60" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12 }}>
                <span>✓ Free to start</span>
                <span className="text-white/30">·</span>
                <span>✓ No credit card required</span>
                <span className="text-white/30">·</span>
                <span>✓ 2-minute setup</span>
              </div>
            </div>
          </div>

          <div className="relative order-1 lg:order-2 flex items-center justify-center">
            <div className="relative w-full max-w-[500px] lg:max-w-[580px]">
              <div className="relative rounded-2xl overflow-hidden">
                <img
                  src={zacErvinHero}
                  alt="High school basketball player going up for a layup"
                  className="w-full h-auto object-cover object-top"
                  style={{ aspectRatio: "3/4", maxHeight: "650px" }}
                  loading="eager"
                />
                <div className="absolute inset-y-0 left-0 w-1/3 pointer-events-none"
                  style={{ background: "linear-gradient(to right, rgba(10,15,30,0.9) 0%, rgba(10,15,30,0.4) 50%, transparent 100%)" }} />
              </div>
              <MatchForYouCard />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
