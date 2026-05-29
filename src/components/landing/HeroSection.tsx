import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { SchoolBrowser } from "./SchoolBrowser";




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
                    I'm Ready to Get Offered → <ArrowRight className="h-4 w-4 ml-2" />
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
            <div className="w-full">
              <SchoolBrowser />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
