import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import heroPlayerCutout from "@/assets/hero-player-cutout.png";

export function HeroSection() {
  return (
    <>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Subtle grid bg */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />

        <div className="relative z-10 px-4 md:px-6 lg:px-12 max-w-[1400px] mx-auto py-16 md:py-20 lg:py-28">
          <div className="grid lg:grid-cols-[1fr_auto] gap-8 lg:gap-0 items-center">
            {/* Left — copy */}
            <div className="animate-[fadeInUp_0.5s_ease-out_both] max-w-2xl">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl xl:text-[5.5rem] leading-[0.92] mb-6 text-foreground">
                DO YOU WANT<br />YOUR KID TO GET<br />
                <span className="text-primary">RECRUITED?</span>
              </h1>

              <p className="font-body text-muted-foreground text-lg sm:text-xl max-w-lg mb-8 leading-relaxed">
                Message every college basketball coach in the country — directly from your phone. Free to start.
              </p>

              <div className="flex flex-col gap-3">
                <Link to="/login" className="w-full sm:w-auto">
                  <Button
                    className="btn-cta bg-primary hover:bg-primary/90 text-foreground rounded-lg w-full sm:w-auto px-10 py-7 text-base min-h-[56px] glow-red glow-red-hover"
                  >
                    BUILD MY FREE RECRUITING PROFILE →
                  </Button>
                </Link>
                <p className="font-body text-sm text-muted-foreground">
                  100% free · No credit card · Takes 2 minutes
                </p>
              </div>
            </div>

            {/* Right — player cutout */}
            <div className="hidden lg:block relative animate-[fadeInUp_0.7s_ease-out_0.15s_both]">
              {/* Red glow behind player */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] rounded-full opacity-20 blur-[80px]"
                style={{ background: "hsl(var(--pif-red))" }}
              />
              <img
                src={heroPlayerCutout}
                alt="Basketball player"
                width={400}
                height={800}
                className="relative z-10 h-[520px] w-auto object-contain drop-shadow-2xl"
                fetchPriority="high"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
