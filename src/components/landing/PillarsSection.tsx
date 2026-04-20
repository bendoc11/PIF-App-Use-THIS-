import { useRef, useState, useEffect } from "react";

function useInViewOnce(threshold = 0.3) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function Counter({ target, visible, delay = 0, suffix = "", prefix = "" }: { target: number; visible: boolean; delay?: number; suffix?: string; prefix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const timeout = setTimeout(() => {
      let current = 0;
      const step = target / 45;
      const iv = setInterval(() => {
        current += step;
        if (current >= target) { setVal(target); clearInterval(iv); }
        else setVal(current);
      }, 22);
      return () => clearInterval(iv);
    }, delay);
    return () => clearTimeout(timeout);
  }, [visible, target, delay]);
  return <>{prefix}{Math.round(val).toLocaleString()}{suffix}</>;
}

function StaggerItem({ children, visible, delay, className = "" }: { children: React.ReactNode; visible: boolean; delay: number; className?: string }) {
  return (
    <div className={`transition-all duration-500 ease-out ${className}`}
      style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(12px)", transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function AnimBar({ visible, delay, pct, color }: { visible: boolean; delay: number; pct: number; color: string }) {
  return (
    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-1000 ease-out"
        style={{ width: visible ? `${pct}%` : "0%", background: color, transitionDelay: `${delay}ms` }} />
    </div>
  );
}

function PillarCard({ children, visible, delay, label }: { children: React.ReactNode; visible: boolean; delay: number; label: string }) {
  return (
    <div className="relative rounded-xl overflow-hidden transition-all duration-700 ease-out"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(30px)",
        transitionDelay: `${delay}ms`,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(59,130,246,0.15)",
        boxShadow: "0 0 40px rgba(59,130,246,0.06), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}>
      <div className="h-[2px] w-full" style={{ background: "linear-gradient(90deg, hsl(var(--pif-blue)), hsl(var(--pif-blue) / 0.3))" }} />
      <div className="p-5 md:p-6">
        <p className="font-heading text-xs tracking-[0.2em] text-muted-foreground mb-4">{label}</p>
        {children}
      </div>
    </div>
  );
}

function DevelopCard({ visible }: { visible: boolean }) {
  return (
    <PillarCard visible={visible} delay={200} label="DEVELOP">
      <div className="bg-white/[0.04] rounded-lg p-3 mb-4 border border-white/5">
        <div className="flex items-center justify-between mb-2">
          <span className="font-heading text-xs text-foreground">BALL SCREEN READS</span>
          <span className="text-[10px] text-pif-green font-heading">COMPLETED</span>
        </div>
        <AnimBar visible={visible} delay={800} pct={100} color="hsl(142 69% 58%)" />
      </div>
      <div className="bg-white/[0.04] rounded-lg p-3 mb-4 border border-white/5">
        <div className="flex items-center justify-between mb-2">
          <span className="font-heading text-xs text-foreground">CATCH & SHOOT</span>
          <span className="text-[10px] text-pif-gold font-heading">IN PROGRESS</span>
        </div>
        <AnimBar visible={visible} delay={1200} pct={62} color="hsl(44 90% 61%)" />
      </div>
      <div className="flex items-center justify-between mt-4">
        <div>
          <p className="text-[10px] font-heading tracking-widest text-muted-foreground">OVERALL RATING</p>
          <p className="text-3xl font-heading text-foreground leading-none mt-1">
            <Counter target={74} visible={visible} delay={600} />
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-heading tracking-widest text-muted-foreground">SHOOTING %</p>
          <p className="text-3xl font-heading text-secondary leading-none mt-1">
            <Counter target={41} visible={visible} delay={900} suffix="%" />
          </p>
        </div>
      </div>
      <div className="mt-5 pt-4 border-t border-secondary/10">
        <p className="font-heading text-2xl text-primary">500<span className="text-foreground">+</span> <span className="text-sm text-muted-foreground">DRILLS</span></p>
      </div>
    </PillarCard>
  );
}

function TrackCard({ visible }: { visible: boolean }) {
  const stats = [
    { label: "PTS", value: 22 },
    { label: "REB", value: 8 },
    { label: "AST", value: 5 },
    { label: "STL", value: 3 },
  ];
  return (
    <PillarCard visible={visible} delay={400} label="TRACK">
      <div className="grid grid-cols-4 gap-2 mb-4">
        {stats.map((s, i) => (
          <StaggerItem key={s.label} visible={visible} delay={600 + i * 200}>
            <div className="bg-white/[0.04] rounded-lg p-2 text-center border border-white/5">
              <p className="text-xl font-heading text-foreground leading-none">
                <Counter target={s.value} visible={visible} delay={700 + i * 200} />
              </p>
              <p className="text-[9px] font-heading tracking-widest text-muted-foreground mt-1">{s.label}</p>
            </div>
          </StaggerItem>
        ))}
      </div>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative w-12 h-12">
          <svg width={48} height={48} className="rotate-[-90deg]">
            <circle cx={24} cy={24} r={20} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={3} />
            <circle cx={24} cy={24} r={20} fill="none" stroke="hsl(217 74% 57%)" strokeWidth={3}
              strokeDasharray={125.6} strokeDashoffset={visible ? 125.6 * 0.15 : 125.6}
              strokeLinecap="round" className="transition-all duration-1500 ease-out" style={{ transitionDelay: "1000ms" }} />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-heading text-secondary">85%</span>
        </div>
        <div>
          <p className="text-xs font-heading text-foreground">WEEKLY CONSISTENCY</p>
          <p className="text-[10px] text-muted-foreground">5 of 6 sessions complete</p>
        </div>
      </div>
      <StaggerItem visible={visible} delay={1400}>
        <div className="bg-white/[0.04] rounded-lg p-3 flex items-center justify-between border border-white/5">
          <span className="text-xs font-heading text-primary">STREAK</span>
          <span className="text-2xl font-heading text-foreground">
            <Counter target={14} visible={visible} delay={1500} /> <span className="text-xs text-muted-foreground">DAYS</span>
          </span>
        </div>
      </StaggerItem>
      <div className="mt-5 pt-4 border-t border-secondary/10">
        <p className="font-heading text-sm text-muted-foreground">EVERY GAME. <span className="text-foreground">EVERY WORKOUT.</span></p>
      </div>
    </PillarCard>
  );
}

function RecruitCard({ visible }: { visible: boolean }) {
  const schools = ["DUKE", "KENTUCKY", "VILLANOVA", "LA SALLE", "DREXEL"];
  return (
    <PillarCard visible={visible} delay={600} label="GET RECRUITED">
      <div className="space-y-2 mb-4">
        {schools.map((school, i) => (
          <StaggerItem key={school} visible={visible} delay={800 + i * 250}>
            <div className="flex items-center justify-between bg-white/[0.04] rounded-lg px-3 py-2 border border-white/5">
              <span className="font-heading text-xs text-foreground tracking-wider">{school}</span>
              <span className="text-[10px] font-heading tracking-wider px-2 py-0.5 rounded"
                style={{
                  background: "hsl(217 74% 57% / 0.15)", color: "hsl(217 74% 57%)",
                  opacity: visible ? 1 : 0, transition: "opacity 0.3s ease", transitionDelay: `${1000 + i * 250}ms`,
                }}>SENT</span>
            </div>
          </StaggerItem>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-heading tracking-widest text-muted-foreground">COACHES CONTACTED</p>
          <p className="text-3xl font-heading text-primary leading-none mt-1">
            <Counter target={47} visible={visible} delay={1800} />
          </p>
        </div>
      </div>
      <div className="mt-5 pt-4 border-t border-secondary/10">
        <p className="font-heading text-2xl text-foreground">7,819 <span className="text-sm text-muted-foreground">COACH CONTACTS</span></p>
      </div>
    </PillarCard>
  );
}

export function PillarsSection() {
  const { ref, visible } = useInViewOnce(0.15);
  return (
    <section ref={ref} className="relative py-20 lg:py-32 overflow-hidden" style={{ background: "#060A14" }}>
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(59,130,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />
      <div className="relative z-10 px-4 md:px-6 lg:px-12 max-w-[1400px] mx-auto">
        <div className="text-center mb-14 lg:mb-20 transition-all duration-700 ease-out"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)" }}>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-heading text-foreground leading-[0.92]">
            DEVELOP. TRACK. <span className="text-secondary">GET RECRUITED.</span>
          </h2>
          <p className="font-body text-muted-foreground text-lg mt-4">Everything you need. One platform. Free to start.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5 lg:gap-6">
          <DevelopCard visible={visible} />
          <TrackCard visible={visible} />
          <RecruitCard visible={visible} />
        </div>
      </div>
    </section>
  );
}
