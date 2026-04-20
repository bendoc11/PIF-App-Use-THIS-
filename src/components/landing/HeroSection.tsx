import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

/* Simple US map dots mockup for the hero */
function RecruitMapMockup() {
  // Approximate US state capital positions normalized 0-100
  const dots = [
    // Northeast
    {x:82,y:22},{x:85,y:26},{x:80,y:28},{x:78,y:30},{x:83,y:30},{x:76,y:32},{x:79,y:34},{x:75,y:25},{x:73,y:28},
    // Southeast
    {x:78,y:40},{x:72,y:42},{x:68,y:45},{x:75,y:48},{x:70,y:50},{x:65,y:52},{x:60,y:55},{x:78,y:52},{x:82,y:46},
    // Midwest
    {x:55,y:28},{x:60,y:30},{x:65,y:32},{x:58,y:34},{x:52,y:30},{x:62,y:26},{x:68,y:28},{x:50,y:26},{x:55,y:36},
    {x:60,y:38},{x:65,y:36},{x:48,y:32},{x:56,y:24},{x:62,y:22},{x:70,y:34},
    // South
    {x:55,y:50},{x:50,y:48},{x:45,y:52},{x:58,y:48},{x:62,y:46},{x:48,y:55},{x:52,y:58},{x:68,y:56},{x:72,y:55},
    // Mountain/West
    {x:30,y:32},{x:35,y:28},{x:28,y:40},{x:32,y:45},{x:38,y:38},{x:42,y:42},{x:40,y:34},{x:25,y:35},{x:35,y:50},
    // Pacific
    {x:12,y:30},{x:14,y:38},{x:10,y:45},{x:15,y:50},{x:18,y:55},{x:8,y:35},{x:20,y:42},
    // Extra spread
    {x:45,y:40},{x:50,y:38},{x:55,y:42},{x:42,y:28},{x:38,y:30},{x:22,y:48},{x:26,y:52},{x:72,y:38},{x:58,y:56},
  ];
  const colors = ["#E8391D", "#3B82F6", "#3B82F6", "#E8391D", "#3B82F6"];

  return (
    <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-secondary/30"
      style={{ background: "#0D1220", boxShadow: "0 0 60px rgba(59,130,246,0.15)" }}>
      {/* Header bar */}
      <div className="h-8 bg-white/[0.03] border-b border-white/5 flex items-center px-3 gap-1.5">
        <div className="w-2 h-2 rounded-full bg-primary/60" />
        <div className="w-2 h-2 rounded-full bg-pif-gold/60" />
        <div className="w-2 h-2 rounded-full bg-pif-green/60" />
        <span className="ml-3 text-[8px] font-heading text-muted-foreground tracking-widest">PLAY IT FORWARD — RECRUIT</span>
      </div>
      {/* Map area */}
      <div className="relative w-full h-[calc(100%-32px)] p-4">
        {/* Filter bar mockup */}
        <div className="flex gap-2 mb-3">
          {["ALL DIVISIONS", "ALL STATES", "ALL SIZES"].map(f => (
            <div key={f} className="bg-white/[0.04] border border-secondary/20 rounded px-2 py-0.5">
              <span className="text-[7px] font-heading text-muted-foreground tracking-wider">{f}</span>
            </div>
          ))}
        </div>
        {/* Dots */}
        <div className="relative w-full h-[70%]">
          {dots.map((d, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full animate-pulse"
              style={{
                left: `${d.x}%`,
                top: `${d.y}%`,
                background: colors[i % colors.length],
                opacity: 0.7 + Math.random() * 0.3,
                animationDelay: `${i * 50}ms`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
        {/* Bottom stats */}
        <div className="absolute bottom-3 left-4 right-4 flex justify-between">
          <span className="text-[8px] font-heading text-secondary tracking-widest">1,852 PROGRAMS</span>
          <span className="text-[8px] font-heading text-primary tracking-widest">7,819 COACHES</span>
        </div>
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Subtle electric blue glow */}
      <div
        className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-[0.07] blur-[120px] pointer-events-none"
        style={{ background: "hsl(var(--pif-blue))" }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      <div className="relative z-10 px-4 md:px-6 lg:px-12 max-w-[1400px] mx-auto py-16 md:py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left — copy */}
          <div className="animate-[fadeInUp_0.5s_ease-out_both]">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl xl:text-[5.5rem] leading-[0.92] mb-6 text-foreground">
              DO YOU WANT<br />YOUR KID TO GET<br />
              <span className="text-secondary">RECRUITED?</span>
            </h1>

            <p className="font-body text-muted-foreground text-lg sm:text-xl max-w-lg mb-8 leading-relaxed">
              The complete basketball platform — develop your game, track your progress, and reach every college coach in the country. Free to start.
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

          {/* Right — recruit page mockup */}
          <div className="hidden lg:block animate-[fadeInUp_0.7s_ease-out_0.15s_both]">
            <RecruitMapMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
