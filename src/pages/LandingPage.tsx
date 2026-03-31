import { Link } from "react-router-dom";
import { lazy, Suspense, useState, useEffect, useRef } from "react";
import { Play, ChevronRight, Star, Check, Dribbble, Target, Zap, TrendingUp, UserPlus, Crosshair, Dumbbell, BarChart3, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import heroDrillThumb from "@/assets/hero-drill-thumbnail.webp";
import zacErvinImg from "@/assets/coaches/zac-ervin.webp";

// Lazy-load ALL heavy below-fold imports
const GameAnalyzerSection = lazy(() => import("@/components/landing/GameAnalyzer").then(m => ({ default: m.GameAnalyzerSection })));

// Lazy-load coach images (below the fold)
const bobFisherImg = new URL("@/assets/coaches/bob-fisher.webp", import.meta.url).href;
const alexWadeImg = new URL("@/assets/coaches/alex-wade.webp", import.meta.url).href;
const torrenceWatsonImg = new URL("@/assets/coaches/torrence-watson.webp", import.meta.url).href;
const hunterMcintoshImg = new URL("@/assets/coaches/hunter-mcintosh.webp", import.meta.url).href;

const COACH_NAMES = [
  "RYAN LANGBORG", "BEN DAUGHERTY", "MAC MCCLUNG", "JARED WADE",
  "JULIAN ROPER", "ZAC ERVIN", "JAY BLUE", "ANDREW FISH",
  "ANDREW JUNKIN", "ANDREW DAKICH", "TORRENCE WATSON", "CHASE MANGINI"
];

const SCHOOLS = ["NOTRE DAME", "VILLANOVA", "NORTHWESTERN", "HARVARD", "GEORGETOWN", "TEXAS TECH", "MISSISSIPPI STATE", "ELON", "MISSOURI", "NEVADA"];

// Deferred ticker — renders after hero is visible
function CoachTicker() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const id = ('requestIdleCallback' in window)
      ? (window as any).requestIdleCallback(() => setShow(true))
      : setTimeout(() => setShow(true), 1500);
    return () => {
      if ('requestIdleCallback' in window) (window as any).cancelIdleCallback(id);
      else clearTimeout(id);
    };
  }, []);

  if (!show) return <div className="bg-primary/90 h-[37px]" />;

  const doubled = [...COACH_NAMES, ...COACH_NAMES];
  return (
    <div className="bg-primary/90 overflow-hidden py-2.5 relative">
      <div
        className="flex whitespace-nowrap gap-0 animate-[ticker_30s_linear_infinite]"
        style={{ willChange: "transform" }}
      >
        {doubled.map((name, i) => (
          <span key={i} className="font-heading text-sm tracking-widest text-foreground flex items-center gap-4 px-4">
            {name} <span className="text-primary">•</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navLinks = [
    { label: "ABOUT", href: "#about" },
    { label: "CONTENT", href: "#content" },
    { label: "COACHES", href: "#coaches" },
    { label: "PRICING", href: "#pricing" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md">
      <nav className="flex items-center justify-between px-4 md:px-6 lg:px-12 h-16">
        <div className="flex flex-col">
          <div className="flex items-baseline gap-0.5 leading-none">
            <span className="font-body italic text-xl text-foreground">Play it </span>
            <span className="font-body italic text-xl font-bold text-primary">Forward</span>
          </div>
          <span className="bg-primary text-foreground text-[8px] font-heading tracking-[0.15em] px-1.5 py-0.5 rounded-sm w-fit mt-0.5 leading-none">LEARN FROM THE BEST</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <a key={l.label} href={l.href} className="font-heading text-sm tracking-widest text-muted-foreground hover:text-foreground transition-colors">{l.label}</a>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-4">
          <Link to="/login" className="font-heading text-sm tracking-widest text-muted-foreground hover:text-foreground transition-colors">SIGN IN</Link>
          <Link to="/login">
            <Button className="btn-cta bg-primary hover:bg-primary/90 text-foreground rounded-lg px-5 py-2.5 text-sm glow-red">
              GET YOUR CUSTOM TRAINING PLAN FREE →
            </Button>
          </Link>
        </div>
        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>
      {mobileOpen && (
        <div className="md:hidden bg-background border-b border-border overflow-hidden">
          <div className="flex flex-col px-6 py-6 gap-4">
            {navLinks.map((l) => (
              <a key={l.label} href={l.href} onClick={() => setMobileOpen(false)} className="font-heading text-base tracking-widest text-muted-foreground hover:text-foreground transition-colors">{l.label}</a>
            ))}
            <Link to="/login" onClick={() => setMobileOpen(false)} className="font-heading text-base tracking-widest text-muted-foreground hover:text-foreground transition-colors">SIGN IN</Link>
            <Link to="/login" onClick={() => setMobileOpen(false)}>
              <Button className="btn-cta bg-primary hover:bg-primary/90 text-foreground rounded-lg w-full py-3 text-sm glow-red">
                GET YOUR CUSTOM TRAINING PLAN FREE →
              </Button>
            </Link>
          </div>
        </div>
      )}
      <CoachTicker />
    </header>
  );
}

/* Hero uses pure CSS animations — no framer-motion, no render blocking */
function HeroSection() {
  return (
    <section className="px-4 md:px-6 lg:px-12 py-12 md:py-16 lg:py-32 max-w-[1400px] mx-auto overflow-hidden">
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        <div className="animate-[fadeInUp_0.5s_ease-out_both]">
          {/* Stat callout card */}
          <div className="inline-block rounded-lg px-4 py-2.5 mb-6 md:mb-8" style={{ background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.3)" }}>
            <span className="font-heading text-2xl sm:text-3xl text-primary tracking-wide">29% → 56%</span>
            <p className="font-body text-xs text-muted-foreground mt-0.5">Real parent result — 3-point percentage tracked inside the app.</p>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl leading-[1] mb-6 md:mb-8 text-foreground">
            GIVE YOUR CHILD A REAL<br />DEVELOPMENT PLAN,<br />
            <span className="text-primary">BUILT BY D1 AND NBA COACHES.</span>
          </h1>
          <p className="font-body text-muted-foreground text-base sm:text-lg max-w-lg mb-6 leading-relaxed">
            D1 and NBA coaches. Real drills. Shot tracking. Your child finally knows exactly what to work on — and whether it's working.
          </p>

          <div className="flex gap-8 mb-6">
            <div>
              <span className="text-3xl sm:text-4xl font-heading text-foreground">2,400<span className="text-primary">+</span></span>
              <p className="font-heading text-[10px] sm:text-xs tracking-widest text-muted-foreground mt-1">ATHLETES ENROLLED</p>
            </div>
            <div>
              <span className="text-3xl sm:text-4xl font-heading text-foreground">50<span className="text-primary">+</span></span>
              <p className="font-heading text-[10px] sm:text-xs tracking-widest text-muted-foreground mt-1">ELITE COACHES</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Link to="/login" className="w-full sm:w-auto">
              <Button className="btn-cta bg-primary hover:bg-primary/90 text-foreground rounded-lg w-full sm:w-auto px-8 py-6 text-base min-h-[48px] glow-red glow-red-hover">
                GET YOUR CUSTOM TRAINING PLAN FREE →
              </Button>
            </Link>
            <p className="font-body text-xs text-muted-foreground">Free 7-day trial · No commitment · Cancel anytime</p>
          </div>
        </div>
        <div className="animate-[fadeInUp_0.7s_ease-out_0.15s_both]">
          <Link to="/login">
            <div className="bg-card rounded-xl border border-border overflow-hidden shadow-2xl cursor-pointer hover:shadow-primary/20 hover:border-primary/30 transition-all duration-300">
              <div className="aspect-video bg-navy-3 flex items-center justify-center relative overflow-hidden">
                <img src={heroDrillThumb} alt="Basketball drill training" width={800} height={450} className="absolute inset-0 w-full h-full object-cover" fetchPriority="high" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
                <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center z-10">
                  <Play className="h-7 w-7 text-foreground ml-1" />
                </div>
              </div>
              <div className="p-4">
                <p className="font-heading text-xs tracking-widest text-primary">BALL SCREEN READS COURSE</p>
                <p className="font-heading text-base text-foreground mt-1">SPLITTING THE SCREEN — DRILL 2 OF 6</p>
                <div className="flex items-center gap-2 mt-3">
                  <img src={zacErvinImg} alt="Zac Ervin" width={28} height={28} className="w-7 h-7 rounded-full object-cover object-top" loading="lazy" />
                  <span className="font-heading text-sm tracking-wider text-foreground">ZAC ERVIN · ELON UNIVERSITY</span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}

function SchoolsTicker() {
  return (
    <div className="border-y border-border py-6 overflow-hidden">
      <div className="flex items-center gap-4 md:gap-12 justify-center flex-wrap px-4 md:px-6">
        <span className="font-heading text-xs tracking-widest text-muted-foreground">COACHES FROM</span>
        {SCHOOLS.map((school) => (
          <span key={school} className="font-heading text-sm tracking-widest text-muted-foreground/60 hover:text-foreground transition-colors">{school}</span>
        ))}
      </div>
    </div>
  );
}

const categoryColorMap: Record<string, string> = {
  "Ball Handling": "bg-pif-blue",
  "Shooting": "bg-primary",
  "Athletics": "bg-pif-green",
  "Basketball IQ": "bg-pif-purple",
  "Mental Game": "bg-pif-purple",
  "Scoring": "bg-pif-orange",
  "Post Game": "bg-pif-orange",
  "Speed & Agility": "bg-pif-green",
};

/* ---- Below-fold sections use IntersectionObserver for fade-in instead of framer-motion ---- */

function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, className: `transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}` };
}

function PlatformSection() {
  const fade = useFadeIn();
  const features = [
    { icon: "📚", title: "DRILL LIBRARY", desc: "Hundreds of on-demand drills organized by skill, position, and level. Watch, rewatch, master." },
    { icon: "📋", title: "STRUCTURED COURSES", desc: "Multi-week programs built by elite coaches. Track progress and level up systematically." },
    { icon: "💬", title: "LIVE DISCUSSIONS", desc: "Ask coaches directly. Join live sessions, Q&As, and group film reviews with real former pros." },
    { icon: "🌍", title: "ELITE NETWORK", desc: "A growing community of coaches uploading weekly — new content every single week." },
  ];

  return (
    <section id="about" className="px-4 md:px-6 lg:px-12 py-16 lg:py-32 max-w-[1400px] mx-auto overflow-hidden" ref={fade.ref}>
      <div className={`grid lg:grid-cols-2 gap-16 items-start ${fade.className}`}>
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-0.5 bg-primary" />
            <span className="font-heading text-xs tracking-widest text-primary">THE PLATFORM</span>
          </div>
          <h2 className="text-4xl sm:text-6xl lg:text-7xl leading-[0.9] mb-8">
            THE FUTURE<br />OF <span className="text-primary">BASKETBALL</span><br />
            <span className="text-primary italic">DEVELOPMENT</span>
          </h2>
          <p className="font-body text-muted-foreground text-lg max-w-lg mb-10 leading-relaxed">
            Play it Forward connects the next generation of players with a nationwide network of former elite college and pro athletes — all sharing their knowledge, drills, and lived experience on one platform built for serious players who want to reach their full potential.
          </p>
          <div className="space-y-4">
            {features.map((f) => (
              <div key={f.title} className="bg-card border border-border rounded-xl p-5 flex items-start gap-4">
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <h3 className="font-heading text-sm tracking-widest text-foreground">{f.title}</h3>
                  <p className="font-body text-muted-foreground text-sm mt-1">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative">
          <div className="bg-primary rounded-2xl p-6 w-fit mb-6">
            <span className="text-4xl font-heading text-foreground">50+</span>
            <p className="font-heading text-xs tracking-widest text-foreground/80 mt-1">ELITE COACHES</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-heading text-sm tracking-widest text-foreground">DRILL LIBRARY</span>
              <span className="font-body text-xs text-muted-foreground">12 new this week</span>
            </div>
            {[
              { cat: "BALL HANDLING", title: "Ball Screen Reads", coach: "Zac Ervin · Elon" },
              { cat: "SHOOTING", title: "Catch & Shoot — Off Screen", coach: "Alex Wade · Notre Dame" },
            ].map((d) => (
              <div key={d.title} className="bg-muted rounded-lg p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Play className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-heading text-[10px] tracking-widest text-primary">{d.cat}</p>
                  <p className="font-heading text-sm text-foreground">{d.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">🔴 {d.coach}</p>
                </div>
              </div>
            ))}
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[8px] font-heading text-foreground">TW</div>
                <span className="font-heading text-xs text-foreground">Torrence Watson</span>
                <span className="text-xs text-muted-foreground">· Missouri · 3h ago</span>
              </div>
              <p className="font-body text-sm text-muted-foreground italic">"Work on your off-hand every single day. That's the difference between good and great at every level."</p>
            </div>
            <div className="bg-pif-gold/10 border border-pif-gold/20 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>🏆</span>
                <div>
                  <p className="font-heading text-xs tracking-widest text-pif-gold">WEEKLY LEADERBOARD</p>
                  <p className="text-xs text-muted-foreground">You're ranked #17 this week — keep going!</p>
                </div>
              </div>
              <span className="font-heading text-xs text-primary">View →</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrainSection() {
  const fade = useFadeIn();
  const [drills, setDrills] = useState<any[]>([]);

  useEffect(() => {
    const fetchWorkouts = async () => {
      const targetTitles = [
        "Ball Handling Transformation",
        "Point Guard Foundations",
        "Game Ready Mobility System",
        "Secrets of Shooting",
      ];
      const { data } = await supabase
        .from("courses")
        .select("id, title, category, level, thumbnail_url, skill_levels")
        .in("title", targetTitles);

      const sorted = targetTitles
        .map((t) => (data ?? []).find((c) => c.title === t))
        .filter(Boolean) as any[];

      setDrills(sorted);
    };
    fetchWorkouts();
  }, []);

  const fallbackCategories = [
    { label: "BALL HANDLING", sub: "FUNDAMENTALS", title: "BALL HANDLING", level: "Beginner – Pro · On Demand", color: "bg-pif-blue" },
    { label: "SHOOTING", sub: "SCORING", title: "SHOOTING MECHANICS", level: "All Levels · On Demand", color: "bg-primary" },
    { label: "SPEED & AGILITY", sub: "ATHLETICS", title: "SPEED & AGILITY", level: "Intermediate · On Demand", color: "bg-pif-green" },
    { label: "BASKETBALL IQ", sub: "IQ", title: "BASKETBALL IQ", level: "All Levels · On Demand", color: "bg-pif-purple" },
  ];

  return (
    <section id="content" className="px-4 md:px-6 lg:px-12 py-16 lg:py-32 max-w-[1400px] mx-auto overflow-hidden" ref={fade.ref}>
      <div className={fade.className}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-0.5 bg-primary" />
          <span className="font-heading text-xs tracking-widest text-primary">ON DEMAND</span>
        </div>
        <div className="flex items-end justify-between mb-12">
          <h2 className="text-5xl sm:text-6xl lg:text-7xl leading-[0.9]">
            TRAIN<br /><span className="text-primary">EVERY SKILL</span>
          </h2>
          <a href="#" className="font-heading text-sm tracking-widest text-pif-blue hover:text-foreground transition-colors hidden sm:block">BROWSE ALL →</a>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {drills.length > 0
            ? drills.map((drill) => {
                const color = categoryColorMap[drill.category] || "bg-primary";
                return (
                  <div key={drill.id} className="group cursor-pointer">
                    <div className="aspect-[4/3] rounded-xl overflow-hidden relative mb-4 border border-border group-hover:border-primary/40 transition-colors">
                      <img src={drill.thumbnail_url} alt={drill.title} width={400} height={300} className="absolute inset-0 w-full h-full object-cover object-top" loading="lazy" decoding="async" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <div className={`absolute top-3 left-3 ${color} text-foreground font-heading text-[10px] tracking-widest px-3 py-1 rounded-md z-10`}>{drill.category?.toUpperCase()}</div>
                      {drill.level && (
                        <div className="absolute top-3 right-3 bg-background/80 text-foreground font-heading text-[10px] tracking-widest px-2 py-1 rounded-md z-10">{drill.level.toUpperCase()}</div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center z-10">
                        <div className="w-12 h-12 rounded-full bg-primary/80 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Play className="h-5 w-5 text-foreground ml-0.5" />
                        </div>
                      </div>
                      <p className="absolute bottom-3 left-3 right-3 font-heading text-sm text-white z-10 line-clamp-2">{drill.title}</p>
                    </div>
                  </div>
                );
              })
            : fallbackCategories.map((c) => (
                <div key={c.title} className="group cursor-pointer">
                  <div className="aspect-[4/3] bg-navy-3 rounded-xl overflow-hidden relative mb-4 border border-border group-hover:border-primary/40 transition-colors">
                    <div className={`absolute top-3 left-3 ${c.color} text-foreground font-heading text-[10px] tracking-widest px-3 py-1 rounded-md`}>{c.label}</div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-primary/80 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play className="h-5 w-5 text-foreground ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <p className="font-heading text-[10px] tracking-widest text-muted-foreground">{c.sub}</p>
                  <p className="font-heading text-lg text-foreground">{c.title}</p>
                  <p className="font-body text-sm text-muted-foreground">{c.level}</p>
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const fade = useFadeIn();
  const steps = [
    { icon: <UserPlus className="h-6 w-6" />, title: "BUILD YOUR PLAYER PROFILE", desc: "Tell us your position, your goals, and where your game needs work. We use that to build your personalized training plan before you ever touch a drill." },
    { icon: <Crosshair className="h-6 w-6" />, title: "FOLLOW YOUR WEEKLY SCHEDULE", desc: "Every week you get a structured training schedule built around your goals — skill workouts, shooting sessions, lifting, and recovery. No more guessing what to work on. Just show up and execute." },
    { icon: <Dumbbell className="h-6 w-6" />, title: "TRAIN WITH ELITE COACHES", desc: "Access a full library of drills and courses taught by former D1 and college players. Every drill has coaching tips, progressions, and real instruction from athletes who've been where you're trying to go." },
    { icon: <BarChart3 className="h-6 w-6" />, title: "TRACK YOUR PROGRESS", desc: "Log your games, track your shooting percentage, and watch your consistency rings fill up week over week. See your game improving in real numbers — not just feel it." },
  ];

  return (
    <section className="px-4 md:px-6 lg:px-12 py-16 lg:py-32" ref={fade.ref}>
      <div className={`max-w-[1200px] mx-auto bg-card border border-border rounded-2xl p-6 md:p-10 lg:p-16 ${fade.className}`}>
        <div className="text-center mb-12 md:mb-16">
          <div className="flex items-center gap-3 justify-center mb-4">
            <div className="w-8 h-0.5 bg-primary" />
            <span className="font-heading text-xs tracking-widest text-primary">SIMPLE PROCESS</span>
          </div>
          <h2 className="text-5xl sm:text-6xl lg:text-7xl">
            HOW IT <span className="text-primary">WORKS</span>
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          <div className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-border" />
          {steps.map((s) => (
            <div key={s.title} className="text-center relative">
              <div className="w-16 h-16 rounded-full border border-border bg-background flex items-center justify-center mx-auto mb-6 text-muted-foreground">
                {s.icon}
              </div>
              <h3 className="font-heading text-base tracking-widest text-foreground mb-3">{s.title}</h3>
              <p className="font-body text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CoachesSection() {
  const fade = useFadeIn();
  const coaches = [
    {
      name: "ALEX WADE", school: "D1 PLAYER · NOTRE DAME · NBA SKILLS TRAINER", initials: "AW", img: alexWadeImg,
      bio: "All-time assists leader at Cathedral Catholic HS, D1 player at Notre Dame, and now a certified NBA skills trainer working with players at every level.",
      stats: [{ label: "D1 NOTRE DAME" }, { label: "NBA SKILLS TRAINER" }],
    },
    {
      name: "BOB FISHER", school: "SHOOTING SPECIALIST · GUINNESS WORLD RECORD HOLDER", initials: "BF", img: bobFisherImg,
      bio: "Widely regarded as one of the greatest free-throw shooters in basketball history. Set a Guinness World Record making 50 free throws in one minute. Nationally recognized shooting specialist teaching players confident, repeatable mechanics.",
      stats: [{ label: "GUINNESS RECORD" }, { label: "SHOOTING SPECIALIST" }],
    },
    {
      name: "TORRENCE WATSON", school: "D1 PLAYER · UNIVERSITY OF MISSOURI", initials: "TW", img: torrenceWatsonImg,
      bio: "Mr. Basketball in the state of Missouri and 1,000 point college scorer at Mizzou. One of the most decorated players in Missouri history.",
      stats: [{ label: "MR. BASKETBALL MO" }, { label: "1,000 PT. SCORER" }],
    },
    {
      name: "HUNTER MCINTOSH", school: "D1 PLAYER · UNIVERSITY OF NEVADA", initials: "HM", img: hunterMcintoshImg,
      bio: "Georgia HS State Player of the Year 2019 and 1,000 point college scorer at Nevada. Elite guard with championship-level IQ.",
      stats: [{ label: "GA STATE POY 2019" }, { label: "1,000 PT. SCORER" }],
    },
  ];

  return (
    <section id="coaches" className="px-4 md:px-6 lg:px-12 py-16 lg:py-32 max-w-[1400px] mx-auto overflow-hidden" ref={fade.ref}>
      <div className={fade.className}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-0.5 bg-primary" />
          <span className="font-heading text-xs tracking-widest text-primary">THE NETWORK</span>
        </div>
        <h2 className="text-5xl sm:text-6xl lg:text-7xl leading-[0.9] mb-12">
          LEARN FROM<br /><span className="text-primary">THE BEST</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {coaches.map((c) => (
            <div key={c.name} className="bg-card border border-border rounded-xl overflow-hidden group hover:border-primary/30 transition-colors">
              <div className="aspect-[3/4] bg-navy-3 overflow-hidden relative">
                <img src={c.img} alt={c.name} width={400} height={450} className="w-full h-full object-cover object-top" loading="lazy" decoding="async" />
              </div>
              <div className="p-5">
                <p className="font-heading text-[10px] tracking-widest text-muted-foreground mb-1">{c.school}</p>
                <h3 className="font-heading text-xl text-foreground mb-2">{c.name}</h3>
                <p className="font-body text-sm text-muted-foreground leading-relaxed mb-4">{c.bio}</p>
                <div className="flex gap-4">
                  {c.stats.map((s) => (
                    <span key={s.label} className="font-heading text-[10px] tracking-widest text-foreground">{s.label}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const fade = useFadeIn();
  const testimonials = [
    {
      quote: "My son went from JV to starting varsity in one season. The ball handling drills from our coaches are on another level.",
      name: "MARCUS JOHNSON", role: "Parent · Philadelphia, PA", initials: "MJ", color: "bg-primary",
    },
    {
      quote: "I've used YouTube, I've used other apps — nothing comes close to having actual former college players break down the game at this level.",
      name: "KAYLA THOMPSON", role: "Player · Age 16 · Atlanta, GA", initials: "KT", color: "bg-pif-blue",
    },
    {
      quote: "The live Q&A sessions alone are worth it. My daughter asked Coach Martinez a question and he broke it down specifically for her. That's priceless.",
      name: "SANDRA RIVERA", role: "Parent · Chicago, IL", initials: "SR", color: "bg-pif-orange",
    },
  ];

  return (
    <section className="px-4 md:px-6 lg:px-12 py-16 lg:py-32" ref={fade.ref}>
      <div className={`max-w-[1200px] mx-auto bg-card border border-border rounded-2xl p-6 md:p-10 lg:p-16 ${fade.className}`}>
        <div className="text-center mb-12">
          <div className="flex items-center gap-3 justify-center mb-4">
            <div className="w-8 h-0.5 bg-primary" />
            <span className="font-heading text-xs tracking-widest text-primary">REAL RESULTS</span>
          </div>
          <h2 className="text-4xl sm:text-6xl lg:text-7xl">
            WHAT PLAYERS <span className="text-primary">SAY</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-muted border border-border rounded-xl p-6">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-pif-gold text-pif-gold" />
                ))}
              </div>
              <p className="font-body text-muted-foreground leading-relaxed mb-6">
                <span className="text-primary text-xl">"</span>{t.quote}<span className="text-primary text-xl">"</span>
              </p>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-xs font-heading text-foreground`}>{t.initials}</div>
                <div>
                  <p className="font-heading text-sm tracking-wider text-foreground">{t.name}</p>
                  <p className="font-body text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ParentTestimonialsSection() {
  const fade = useFadeIn();
  const parentTestimonials = [
    {
      quote: "Since using Play it Forward, my child has been on a consistent, regimented schedule with drills that actually stick. He's fallen even more in love with basketball and has become the leading scorer on his team.",
      name: "COURTNEY", city: "San Diego",
    },
    {
      quote: "Before Play it Forward, I had no idea which drills to give my son. Now he's practicing the right way — and he's developed into a college-level player. This app completely transformed his game.",
      name: "BOB", city: "Nashville",
    },
  ];

  return (
    <section className="px-4 md:px-6 lg:px-12 py-16 lg:py-24 max-w-[1400px] mx-auto overflow-hidden" ref={fade.ref}>
      <div className={fade.className}>
        <p className="font-heading text-xs tracking-widest text-muted-foreground mb-8 text-center">WHAT PARENTS ARE SAYING</p>
        <div className="grid md:grid-cols-2 gap-6 max-w-[900px] mx-auto">
          {parentTestimonials.map((t) => (
            <div key={t.name} className="rounded-xl p-6 border border-border" style={{ background: "#13131a" }}>
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-pif-gold text-pif-gold" />
                ))}
              </div>
              <p className="font-body text-muted-foreground leading-relaxed mb-5">
                <span className="text-primary text-xl">"</span>{t.quote}<span className="text-primary text-xl">"</span>
              </p>
              <p className="font-heading text-sm tracking-wider text-foreground">{t.name} <span className="text-muted-foreground font-body text-xs">· {t.city}</span></p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  const fade = useFadeIn();
  const features = [
    "Full drill library — every skill and level",
    "All courses from all coaches",
    "Live Q&A sessions with elite coaches",
    "Community access & leaderboard",
    "Progress tracking & streaks",
    "New content added every week",
    "Access on any device, anytime",
  ];

  return (
    <section id="pricing" className="px-4 md:px-6 lg:px-12 py-16 lg:py-32 max-w-[1400px] mx-auto text-center overflow-hidden" ref={fade.ref}>
      <div className={fade.className}>
        <div className="flex items-center gap-3 justify-center mb-4">
          <div className="w-8 h-0.5 bg-primary" />
          <span className="font-heading text-xs tracking-widest text-primary">SIMPLE PRICING</span>
        </div>
        <h2 className="text-4xl sm:text-6xl lg:text-7xl mb-4">
          ONE PRICE.<br /><span className="text-primary">EVERYTHING INCLUDED.</span>
        </h2>
        <p className="font-body text-muted-foreground text-lg mb-12">No contracts. Cancel anytime. Full access to every drill, course, and coach from day one.</p>

        <div className="max-w-lg mx-auto bg-card border border-border rounded-2xl p-6 md:p-8 text-left relative">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <span className="bg-primary text-foreground font-heading text-[10px] md:text-xs tracking-widest px-3 md:px-5 py-2 rounded-full">START TODAY — RISK FREE</span>
          </div>
          <p className="font-heading text-xs tracking-widest text-pif-blue mt-2">FULL ACCESS</p>
          <p className="font-heading text-2xl text-foreground mb-4">PLAY IT FORWARD</p>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-6xl font-heading text-foreground">FREE</span>
            <div>
              <p className="font-heading text-sm text-foreground">7-DAY TRIAL</p>
              <p className="font-body text-xs text-muted-foreground">THEN $12.99/MONTH</p>
            </div>
          </div>
          <p className="font-body text-sm text-muted-foreground mb-6">Everything included. Cancel anytime.</p>
          <div className="border-t border-border pt-6 space-y-3 mb-8">
            {features.map((f) => (
              <div key={f} className="flex items-center gap-3">
                <Check className="h-4 w-4 text-pif-green flex-shrink-0" />
                <span className="font-body text-sm text-foreground">{f}</span>
              </div>
            ))}
          </div>
          <Link to="/login">
            <Button className="w-full btn-cta bg-primary hover:bg-primary/90 text-foreground rounded-lg py-5 md:py-6 text-sm md:text-base min-h-[48px] glow-red glow-red-hover">
              START YOUR FREE WEEK →
            </Button>
          </Link>
          <p className="font-body text-xs text-muted-foreground text-center mt-4">Then just $12.99/month · Cancel anytime · No hidden fees</p>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  const fade = useFadeIn();
  return (
    <section className="px-4 md:px-6 lg:px-12 py-16 lg:py-20 max-w-[1200px] mx-auto" ref={fade.ref}>
      <div className={`bg-primary rounded-2xl p-6 md:p-10 lg:p-16 flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden ${fade.className}`}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.05) 20px, rgba(255,255,255,0.05) 40px)" }} />
        <div className="relative z-10">
          <p className="font-heading text-xs tracking-widest text-foreground/80 mb-2">YOUR NEXT LEVEL STARTS TODAY</p>
          <h2 className="text-3xl sm:text-5xl text-foreground leading-[0.95]">
            THE GAME IS<br />WAITING FOR YOU.
          </h2>
          <p className="font-body text-foreground/80 mt-4 max-w-md">
            Join thousands of athletes already training with elite former college players. Start your 7-day trial today.
          </p>
        </div>
        <div className="relative z-10 text-center">
          <Link to="/login">
            <Button className="btn-cta bg-foreground text-background hover:bg-foreground/90 rounded-full px-10 py-6 text-base">
              START YOUR FREE WEEK →
            </Button>
          </Link>
          <p className="font-body text-xs text-foreground/60 mt-3">Free for 7 days · Then $12.99/month · Cancel anytime</p>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border px-4 md:px-6 lg:px-12 py-12 md:py-16 max-w-[1400px] mx-auto">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-1 mb-4">
            <span className="font-body italic text-lg text-foreground">Play it </span>
            <span className="font-body italic text-lg font-bold text-primary">Forward</span>
            <span className="ml-1">🏀</span>
          </div>
          <p className="font-body text-sm text-muted-foreground leading-relaxed">
            The premier platform for youth basketball development. Elite former players teaching the next generation how to win — on and off the court.
          </p>
        </div>
        {[
          { title: "PLATFORM", links: ["Drill Library", "Coaches", "Pricing", "Leaderboard", "Live Sessions"] },
          { title: "COMPANY", links: ["About Us", "Become a Coach", "Blog", "Contact"] },
          { title: "SUPPORT", links: ["Help Center", "Community", "Parent FAQ", "App Download"] },
        ].map((col) => (
          <div key={col.title}>
            <p className="font-heading text-sm tracking-widest text-foreground mb-4">{col.title}</p>
            <ul className="space-y-2">
              {col.links.map((link) => (
                <li key={link}><a href="#" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">{link}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="font-body text-xs text-muted-foreground">© 2026 Play it Forward Basketball. All rights reserved.</p>
        <div className="flex gap-6">
          <Link to="/privacy" className="font-body text-xs text-muted-foreground hover:text-foreground">Privacy</Link>
          <a href="#" className="font-body text-xs text-muted-foreground hover:text-foreground">Terms</a>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground scroll-smooth">
      <Navbar />
      <HeroSection />
      <SchoolsTicker />
      <Suspense fallback={<div className="h-96" />}>
        <GameAnalyzerSection />
      </Suspense>
      <CoachesSection />
      <PlatformSection />
      <TrainSection />
      <HowItWorks />
      <TestimonialsSection />
      <PricingSection />
      <FinalCTA />
      <Footer />
    </div>
  );
}
