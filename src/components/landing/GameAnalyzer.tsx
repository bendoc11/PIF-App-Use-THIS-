import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Hexagon, BarChart3, CalendarDays } from "lucide-react";

/* ── Animated counter ── */
function Counter({ target, duration = 1, delay = 0, suffix = "", decimals = 0 }: { target: number; duration?: number; delay?: number; suffix?: string; decimals?: number }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });

  useEffect(() => {
    if (!inView) return;
    const timeout = setTimeout(() => {
      let start = 0;
      const step = target / (duration * 30);
      const iv = setInterval(() => {
        start += step;
        if (start >= target) { setVal(target); clearInterval(iv); }
        else setVal(start);
      }, 1000 / 30);
      return () => clearInterval(iv);
    }, delay * 1000);
    return () => clearTimeout(timeout);
  }, [inView, target, duration, delay]);

  return <span ref={ref}>{decimals > 0 ? val.toFixed(decimals) : Math.round(val)}{suffix}</span>;
}

/* ── Skill bar ── */
function MockSkillBar({ label, value, delay }: { label: string; value: number; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });

  return (
    <div ref={ref} className="flex items-center gap-3">
      <span className="text-[10px] font-heading tracking-widest text-white/50 w-20 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, hsl(5 78% 55%), hsl(25 95% 53%))" }}
          initial={{ width: 0 }}
          animate={inView ? { width: `${value}%` } : {}}
          transition={{ duration: 0.8, delay, ease: "easeOut" }}
        />
      </div>
      <span className="text-sm font-heading text-white w-8 text-right">{value}</span>
    </div>
  );
}

/* ── Sparkline SVG ── */
function Sparkline() {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  // 8 game points trending up
  const points = [12, 14, 11, 18, 16, 21, 19, 24];
  const w = 200, h = 50, pad = 4;
  const maxV = Math.max(...points), minV = Math.min(...points);
  const coords = points.map((p, i) => {
    const x = pad + (i / (points.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (p - minV) / (maxV - minV)) * (h - pad * 2);
    return `${x},${y}`;
  });
  const pathD = `M ${coords.join(" L ")}`;

  return (
    <svg ref={ref} viewBox={`0 0 ${w} ${h}`} className="w-full h-12" preserveAspectRatio="none">
      <defs>
        <filter id="glow-line">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <motion.path
        d={pathD}
        fill="none"
        stroke="hsl(5 78% 55%)"
        strokeWidth="2"
        strokeLinecap="round"
        filter="url(#glow-line)"
        initial={{ pathLength: 0 }}
        animate={inView ? { pathLength: 1 } : {}}
        transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
      />
    </svg>
  );
}

/* ── Progress rings mockup ── */
function MockRings() {
  const ringData = [100, 100, 80, 100, 60, 0, 0, 0]; // fill percentages
  return (
    <div className="flex items-center gap-2 justify-center">
      {ringData.map((pct, i) => {
        const isCurrent = i === 4;
        const size = isCurrent ? 32 : 24;
        const r = (size - 4) / 2;
        const circ = 2 * Math.PI * r;
        const filled = pct > 0;
        return (
          <div key={i} className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="rotate-[-90deg]">
              <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={2} />
              {filled && (
                <circle
                  cx={size / 2} cy={size / 2} r={r}
                  fill="none" stroke="hsl(5 78% 55%)" strokeWidth={2}
                  strokeDasharray={circ}
                  strokeDashoffset={circ * (1 - pct / 100)}
                  strokeLinecap="round"
                />
              )}
            </svg>
            {isCurrent && (
              <div className="absolute inset-0 rounded-full" style={{ boxShadow: "0 0 8px 2px rgba(255,255,255,0.2)" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Scan line animation ── */
function ScanLine() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
      <motion.div
        className="absolute left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, hsl(5 78% 55% / 0.3), transparent)" }}
        animate={{ top: ["0%", "100%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

/* ── Connecting dots ── */
function ConnectingLine({ className }: { className?: string }) {
  return (
    <div className={`hidden lg:flex items-center justify-center ${className}`}>
      <div className="relative w-16 h-px bg-white/10">
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary"
          style={{ boxShadow: "0 0 6px hsl(5 78% 55%)" }}
          animate={{ left: ["-4px", "calc(100% + 4px)"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
      </div>
    </div>
  );
}

/* ── Stat card ── */
function StatCard({ value, label, delay, decimals = 0, suffix = "" }: { value: number; label: string; delay: number; decimals?: number; suffix?: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center" style={{ boxShadow: "0 0 12px hsl(5 78% 55% / 0.08)" }}>
      <p className="text-xl md:text-2xl font-heading text-white">
        <Counter target={value} delay={delay} decimals={decimals} suffix={suffix} />
      </p>
      <p className="text-[9px] font-heading tracking-widest text-white/40 mt-0.5">{label}</p>
    </div>
  );
}

/* ── Main section ── */
export function GameAnalyzerSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.1 });

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden py-16 lg:py-32"
      style={{ background: "#080D14" }}
    >
      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Subtle floating particles via CSS */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/30"
            style={{
              left: `${8 + (i * 7.5) % 90}%`,
              top: `${10 + (i * 13) % 80}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 3 + (i % 3),
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 px-4 md:px-6 lg:px-12 max-w-[1400px] mx-auto">
        {/* Headline */}
        <motion.div
          className="text-center mb-12 lg:mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-heading text-white leading-[0.95]">
            THE ONLY APP THAT TRACKS<br />
            <span style={{ color: "hsl(5 78% 55%)" }}>YOUR WHOLE GAME.</span>
          </h2>
          <p className="font-body text-white/50 text-base md:text-lg mt-4 max-w-2xl mx-auto">
            Log your workouts, track your shots, analyze your games, and watch your overall rating climb — all in one place.
          </p>
        </motion.div>

        {/* Three-panel mockup */}
        <motion.div
          className="grid lg:grid-cols-[1fr_auto_1.2fr_auto_1fr] gap-4 lg:gap-0 items-stretch mb-16"
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          {/* LEFT — Player Card */}
          <div className="relative bg-white/[0.04] border border-white/10 rounded-xl p-5 overflow-hidden" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05), 0 0 30px hsl(5 78% 55% / 0.06)" }}>
            <ScanLine />
            <div className="text-center space-y-3">
              <div>
                <motion.p
                  className="text-5xl font-heading leading-none"
                  style={{ color: "hsl(5 78% 55%)", textShadow: "0 0 30px hsl(5 78% 55% / 0.4)" }}
                  animate={{ opacity: [0.85, 1, 0.85] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Counter target={74} delay={0.3} />
                </motion.p>
                <p className="text-[9px] font-heading tracking-[0.2em] text-white/40 mt-1">OVERALL</p>
              </div>
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full border border-white/20 bg-white/5 flex items-center justify-center">
                  <span className="text-lg font-heading" style={{ color: "hsl(5 78% 55%)" }}>JD</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-heading text-white">JORDAN DAVIS</p>
                <p className="text-[10px] text-white/40">Point Guard · Age 16</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <MockSkillBar label="BALL HNDL" value={81} delay={0.4} />
              <MockSkillBar label="SHOOTING" value={74} delay={0.5} />
              <MockSkillBar label="FINISHING" value={68} delay={0.6} />
            </div>
          </div>

          <ConnectingLine />

          {/* CENTER — Game Stats */}
          <div className="relative bg-white/[0.04] border border-white/10 rounded-xl p-5 overflow-hidden" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05), 0 0 30px hsl(5 78% 55% / 0.06)" }}>
            <ScanLine />
            <div className="grid grid-cols-4 gap-2 mb-4">
              <StatCard value={18.4} label="PPG" delay={0.8} decimals={1} />
              <StatCard value={7.2} label="RPG" delay={0.9} decimals={1} />
              <StatCard value={5.1} label="APG" delay={1.0} decimals={1} />
              <StatCard value={54} label="FG%" delay={1.1} suffix="%" />
            </div>
            <div>
              <p className="text-[9px] font-heading tracking-widest text-white/40 mb-2">SEASON PERFORMANCE</p>
              <Sparkline />
            </div>
          </div>

          <ConnectingLine />

          {/* RIGHT — Training Consistency */}
          <div className="relative bg-white/[0.04] border border-white/10 rounded-xl p-5 overflow-hidden flex flex-col justify-center" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05), 0 0 30px hsl(5 78% 55% / 0.06)" }}>
            <ScanLine />
            <p className="text-[9px] font-heading tracking-widest text-white/40 text-center mb-4">WEEKLY CONSISTENCY</p>
            <MockRings />
            <div className="flex items-center justify-center gap-3 mt-4 text-[10px] text-white/40">
              <span>🔥 <span className="font-heading text-white">14</span> Day Streak</span>
              <span className="text-white/10">·</span>
              <span>📅 <span className="font-heading text-white">42</span> Training Days</span>
            </div>
          </div>
        </motion.div>

        {/* Feature callouts */}
        <motion.div
          className="grid md:grid-cols-3 gap-6 mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          {[
            {
              icon: <Hexagon className="h-6 w-6" style={{ color: "hsl(5 78% 55%)" }} />,
              title: "YOUR OVERALL RATING",
              body: "Earn your rating through real training. Ball handling, shooting, and finishing scores that grow every time you put in work.",
            },
            {
              icon: <BarChart3 className="h-6 w-6" style={{ color: "hsl(5 78% 55%)" }} />,
              title: "REAL GAME STATS",
              body: "Log your points, rebounds, assists, and shooting splits after every game. Watch your averages build over a full season.",
            },
            {
              icon: <CalendarDays className="h-6 w-6" style={{ color: "hsl(5 78% 55%)" }} />,
              title: "CONSISTENCY TRACKING",
              body: "Weekly progress rings show exactly how consistent you are. Miss a week and you feel it. Stack weeks and watch your rating climb.",
            },
          ].map((c) => (
            <div key={c.title} className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-3">
                {c.icon}
              </div>
              <h3 className="font-heading text-sm tracking-widest text-white mb-2">{c.title}</h3>
              <p className="font-body text-sm text-white/45 leading-relaxed">{c.body}</p>
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.7 }}
        >
          <Link to="/login">
            <Button
              className="font-heading tracking-wider text-white rounded-lg px-8 py-6 text-base"
              style={{ background: "hsl(5 78% 55%)", boxShadow: "0 0 20px hsl(5 78% 55% / 0.4)" }}
            >
              SEE YOUR STATS →
            </Button>
          </Link>
          <p className="font-body text-xs text-white/30 mt-3"><p className="font-body text-xs text-white/30 mt-3">Start tracking for $1 — then $27/month</p></p>
        </motion.div>
      </div>
    </section>
  );
}
