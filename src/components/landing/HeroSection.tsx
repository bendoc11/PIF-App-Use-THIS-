import { SchoolBrowser } from "./SchoolBrowser";
import zacErvinHero from "@/assets/zac-ervin-hero.jpg";

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

              <div
                className="flex items-center gap-3"
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 500,
                  fontSize: 16,
                  color: "rgba(255,255,255,0.8)",
                }}
              >
                <span>Browse real programs recruiting right now</span>
                <span
                  aria-hidden
                  className="inline-block"
                  style={{ animation: "nudgeRight 1.4s ease-in-out infinite" }}
                >
                  →
                </span>
              </div>
            </div>
          </div>

          <div className="relative order-1 lg:order-2 flex items-center justify-center">
            <div className="relative w-full rounded-2xl overflow-hidden lg:overflow-visible">
              {/* Background photo */}
              <div className="relative w-full aspect-[4/5] sm:aspect-[3/4] lg:aspect-[3/4] rounded-2xl overflow-hidden">
                <img
                  src={zacErvinHero}
                  alt="College basketball player dunking in front of a packed gym crowd"
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="eager"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(10,15,30,0.15) 0%, rgba(10,15,30,0.55) 60%, rgba(10,15,30,0.9) 100%)",
                  }}
                />

                {/* School card overlay - bottom right */}
                <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 left-3 sm:left-auto sm:w-[380px] sm:max-w-[380px]">
                  <SchoolBrowser />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes nudgeRight {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(6px); }
        }
        @keyframes ctaPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.0); }
          50% { box-shadow: 0 0 24px 4px rgba(220,38,38,0.45); }
        }
      `}</style>
    </section>
  );
}
