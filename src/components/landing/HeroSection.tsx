import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

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
      <section className="relative overflow-hidden" style={{ background: "#0A0F1E" }}>
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(59,130,246,0.4) 1px, transparent 0)",
            backgroundSize: "48px 48px",
          }} />
        <div className="relative z-10 max-w-[1200px] mx-auto px-4 md:px-6 lg:px-12">
          <div className="flex flex-col items-center text-center py-24 lg:py-36">
            <div className="animate-[fadeInUp_0.5s_ease-out_both] max-w-3xl">
              <p className="text-sm font-medium tracking-wider text-secondary uppercase mb-6">
                White-Label Recruiting Platform for High Schools
              </p>

              <h1 className="font-sans text-4xl sm:text-5xl lg:text-[3.5rem] font-bold leading-[1.12] mb-6 text-foreground">
                Give Every Athlete at Your School a Real Shot at Playing in College
              </h1>

              <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
                Play it Forward gives every student athlete at your school the tools to build a recruiting profile and contact every college coach in the country — white labeled with your school's branding.
              </p>

              <div className="flex flex-col items-center gap-3">
                <a href="mailto:info@playitforward.app?subject=Demo%20Request" className="w-full sm:w-auto">
                  <Button
                    className="bg-primary hover:bg-primary/90 text-foreground rounded-lg w-full sm:w-auto px-10 py-7 text-base font-semibold min-h-[56px] glow-red glow-red-hover"
                  >
                    Request a Demo <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </a>
                <p className="text-sm text-muted-foreground">
                  No commitment · Personalized walkthrough for your school
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <StatsBar />
    </>
  );
}
