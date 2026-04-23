import { Button } from "@/components/ui/button";
import { ArrowRight, Mail, TrendingUp, Award } from "lucide-react";
import zacErvinHero from "@/assets/zac-ervin-hero.jpg";

function RecruitingProfileCard() {
  return (
    <div
      className="absolute bottom-6 right-6 md:bottom-10 md:right-10 w-[260px] md:w-[300px] rounded-2xl border p-4 z-20"
      style={{
        background: "rgba(10, 15, 30, 0.85)",
        backdropFilter: "blur(20px)",
        borderColor: "rgba(59, 130, 246, 0.4)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 60px rgba(59,130,246,0.1)",
      }}
    >
      {/* Profile Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-full border-2 overflow-hidden"
          style={{ borderColor: "rgba(59, 130, 246, 0.5)" }}
        >
          <img
            src={zacErvinHero}
            alt="Zac Ervin"
            className="w-full h-full object-cover object-top"
          />
        </div>
        <div>
          <p className="font-sans font-bold text-foreground text-sm">ZAC ERVIN</p>
          <p className="text-xs text-muted-foreground">2025 · SG/SF · 6'5"</p>
        </div>
      </div>

      {/* Stat Badges */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div
          className="rounded-lg p-2 text-center"
          style={{ background: "rgba(59, 130, 246, 0.2)" }}
        >
          <Award className="w-4 h-4 mx-auto mb-1" style={{ color: "#3B82F6" }} />
          <p className="text-xs font-bold text-foreground">42</p>
          <p className="text-[10px] text-muted-foreground">Offers</p>
        </div>
        <div
          className="rounded-lg p-2 text-center"
          style={{ background: "rgba(239, 68, 68, 0.2)" }}
        >
          <TrendingUp className="w-4 h-4 mx-auto mb-1" style={{ color: "#EF4444" }} />
          <p className="text-xs font-bold text-foreground">#9</p>
          <p className="text-[10px] text-muted-foreground">Player in VA</p>
        </div>
        <div
          className="rounded-lg p-2 text-center border"
          style={{ borderColor: "rgba(59, 130, 246, 0.3)", background: "rgba(10, 15, 30, 0.5)" }}
        >
          <Mail className="w-4 h-4 mx-auto mb-1" style={{ color: "#3B82F6" }} />
          <p className="text-xs font-bold text-foreground">6</p>
          <p className="text-[10px] text-muted-foreground">New Messages</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-2">
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-muted-foreground">Profile Complete</span>
          <span className="font-medium" style={{ color: "#3B82F6" }}>94%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
          <div
            className="h-full rounded-full"
            style={{ width: "94%", background: "linear-gradient(90deg, #3B82F6, #60A5FA)" }}
          />
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground mt-2">
        Last viewed by 3 coaches today
      </p>
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
                  White-Label Recruiting Platform for High Schools
                </p>

                <h1 className="font-sans text-4xl sm:text-5xl lg:text-[3.25rem] font-bold leading-[1.12] mb-6 text-foreground">
                  This is where players get recruited.
                </h1>

                <p className="text-muted-foreground text-base sm:text-lg max-w-xl mb-8 leading-relaxed">
                  Build your free recruiting profile, reach every college coach in the country, and develop your game — all in one place.
                </p>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <a href="mailto:info@playitforward.app?subject=Demo%20Request" className="w-full sm:w-auto">
                    <Button
                      className="bg-primary hover:bg-primary/90 text-foreground rounded-lg w-full sm:w-auto px-8 py-6 text-base font-semibold min-h-[52px] glow-red glow-red-hover"
                    >
                      Build My Free Profile <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </a>
                  <p className="text-sm text-muted-foreground">
                    100% free · No credit card required
                  </p>
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
                    className="w-full h-auto object-cover"
                    style={{ aspectRatio: "3/4" }}
                  />
                  {/* Gradient overlay on left edge to blend into background */}
                  <div
                    className="absolute inset-y-0 left-0 w-1/3 pointer-events-none"
                    style={{
                      background: "linear-gradient(to right, rgba(10,15,30,0.9) 0%, rgba(10,15,30,0.4) 50%, transparent 100%)"
                    }}
                  />
                </div>

                {/* Floating Profile Card */}
                <RecruitingProfileCard />
              </div>
            </div>
          </div>
        </div>
      </section>
      <StatsBar />
    </>
  );
}
