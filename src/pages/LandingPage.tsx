import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { HeroSection } from "@/components/landing/HeroSection";
import { RecruitingSection } from "@/components/landing/RecruitingSection";
import { PillarsSection } from "@/components/landing/PillarsSection";
import { Play, Check, Menu, X } from "lucide-react";
import { Input } from "@/components/ui/input";

const COACH_NAMES = [
  "RYAN LANGBORG", "BEN DAUGHERTY", "MAC MCCLUNG", "JARED WADE",
  "JULIAN ROPER", "ZAC ERVIN", "JAY BLUE", "ANDREW FISH",
  "ANDREW JUNKIN", "ANDREW DAKICH", "TORRENCE WATSON", "CHASE MANGINI"
];

// Lazy-load coach images
const bobFisherImg = new URL("@/assets/coaches/bob-fisher.webp", import.meta.url).href;
const alexWadeImg = new URL("@/assets/coaches/alex-wade.webp", import.meta.url).href;
const torrenceWatsonImg = new URL("@/assets/coaches/torrence-watson.webp", import.meta.url).href;
const hunterMcintoshImg = new URL("@/assets/coaches/hunter-mcintosh.webp", import.meta.url).href;

/* ---- Fade-in hook ---- */
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

/* ━━━ ANNOUNCEMENT BAR ━━━ */
function AnnouncementBar() {
  return (
    <div className="bg-secondary text-foreground text-center py-2.5 px-4">
      <Link to="/login" className="font-heading text-xs sm:text-sm tracking-widest hover:opacity-80 transition-opacity">
        NOW LIVE: EMAIL 7,819 COLLEGE COACHES DIRECTLY FROM YOUR PHONE →
      </Link>
    </div>
  );
}

/* ━━━ COACH TICKER ━━━ */
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
      <div className="flex whitespace-nowrap gap-0 animate-[ticker_30s_linear_infinite]" style={{ willChange: "transform" }}>
        {doubled.map((name, i) => (
          <span key={i} className="font-heading text-sm tracking-widest text-foreground flex items-center gap-4 px-4">
            {name} <span className="text-background/30">|</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ━━━ NAVBAR ━━━ */
function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navLinks = [
    { label: "ABOUT", href: "#about" },
    { label: "COACHES", href: "#coaches" },
    { label: "GET RECRUITED", href: "#recruiting" },
    { label: "SIGN IN", href: "/login", isLink: true },
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
            l.isLink ? (
              <Link key={l.label} to={l.href} className="font-heading text-sm tracking-widest text-muted-foreground hover:text-foreground transition-colors">{l.label}</Link>
            ) : (
              <a key={l.label} href={l.href} className="font-heading text-sm tracking-widest text-muted-foreground hover:text-foreground transition-colors">{l.label}</a>
            )
          ))}
        </div>
        <div className="hidden md:flex items-center gap-4">
          <Link to="/login">
            <Button className="btn-cta bg-primary hover:bg-primary/90 text-foreground rounded-lg px-5 py-2.5 text-sm glow-red">
              START FREE →
            </Button>
          </Link>
        </div>
        <button className="md:hidden p-2 text-foreground" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>
      {mobileOpen && (
        <div className="md:hidden bg-background border-b border-border overflow-hidden">
          <div className="flex flex-col px-6 py-6 gap-4">
            {navLinks.map((l) => (
              l.isLink ? (
                <Link key={l.label} to={l.href} onClick={() => setMobileOpen(false)} className="font-heading text-base tracking-widest text-muted-foreground hover:text-foreground transition-colors">{l.label}</Link>
              ) : (
                <a key={l.label} href={l.href} onClick={() => setMobileOpen(false)} className="font-heading text-base tracking-widest text-muted-foreground hover:text-foreground transition-colors">{l.label}</a>
              )
            ))}
            <Link to="/login" onClick={() => setMobileOpen(false)}>
              <Button className="btn-cta bg-primary hover:bg-primary/90 text-foreground rounded-lg w-full py-3 text-sm glow-red">START FREE →</Button>
            </Link>
          </div>
        </div>
      )}
      <CoachTicker />
    </header>
  );
}

/* ━━━ COACHES SECTION ━━━ */
function CoachesSection() {
  const fade = useFadeIn();
  const coaches = [
    {
      name: "ALEX WADE", school: "D1 PLAYER · NOTRE DAME · NBA SKILLS TRAINER", img: alexWadeImg,
      bio: "All-time assists leader at Cathedral Catholic HS, D1 player at Notre Dame, and now a certified NBA skills trainer.",
      stats: ["D1 NOTRE DAME", "NBA SKILLS TRAINER"],
    },
    {
      name: "BOB FISHER", school: "SHOOTING SPECIALIST · GUINNESS WORLD RECORD HOLDER", img: bobFisherImg,
      bio: "Widely regarded as one of the greatest free-throw shooters in basketball history. Guinness World Record holder.",
      stats: ["GUINNESS RECORD", "SHOOTING SPECIALIST"],
    },
    {
      name: "TORRENCE WATSON", school: "D1 PLAYER · UNIVERSITY OF MISSOURI", img: torrenceWatsonImg,
      bio: "Mr. Basketball in the state of Missouri and 1,000 point college scorer at Mizzou.",
      stats: ["MR. BASKETBALL MO", "1,000 PT. SCORER"],
    },
    {
      name: "HUNTER MCINTOSH", school: "D1 PLAYER · UNIVERSITY OF NEVADA", img: hunterMcintoshImg,
      bio: "Georgia HS State Player of the Year 2019 and 1,000 point college scorer at Nevada.",
      stats: ["GA STATE POY 2019", "1,000 PT. SCORER"],
    },
  ];

  return (
    <section id="coaches" className="px-4 md:px-6 lg:px-12 py-16 lg:py-32 max-w-[1400px] mx-auto overflow-hidden" ref={fade.ref}>
      <div className={fade.className}>
        <h2 className="text-5xl sm:text-6xl lg:text-7xl leading-[0.9] mb-12">
          LEARN FROM<br /><span className="text-primary">THE BEST</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {coaches.map((c) => (
            <div key={c.name} className="bg-card border border-border rounded-xl overflow-hidden group hover:border-secondary/30 transition-colors">
              <div className="aspect-[3/4] bg-navy-3 overflow-hidden relative">
                <img src={c.img} alt={c.name} width={400} height={450} className="w-full h-full object-cover object-top" loading="lazy" decoding="async" />
              </div>
              <div className="p-5">
                <p className="font-heading text-[10px] tracking-widest text-muted-foreground mb-1">{c.school}</p>
                <h3 className="font-heading text-xl text-foreground mb-2">{c.name}</h3>
                <p className="font-body text-sm text-muted-foreground leading-relaxed mb-4">{c.bio}</p>
                <div className="flex gap-3 flex-wrap">
                  {c.stats.map((s) => (
                    <span key={s} className="font-heading text-[10px] tracking-widest text-secondary bg-secondary/10 px-2 py-1 rounded">{s}</span>
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

/* ━━━ PLATFORM OVERVIEW ━━━ */
function PlatformSection() {
  const fade = useFadeIn();
  const features = [
    { title: "DRILL LIBRARY", desc: "Hundreds of on-demand drills organized by skill, position, and level. Watch, rewatch, master." },
    { title: "STRUCTURED COURSES", desc: "Multi-week programs built by elite coaches. Track progress and level up systematically." },
    { title: "LIVE DISCUSSIONS", desc: "Ask coaches directly. Join live sessions, Q&As, and group film reviews with real former pros." },
  ];

  return (
    <section id="about" className="py-16 lg:py-32 overflow-hidden" style={{ background: "#0D1220" }} ref={fade.ref}>
      <div className={`px-4 md:px-6 lg:px-12 max-w-[1400px] mx-auto grid lg:grid-cols-2 gap-16 items-start ${fade.className}`}>
        <div>
          <h2 className="text-4xl sm:text-6xl lg:text-7xl leading-[0.9] mb-8">
            THE FUTURE OF<br /><span className="text-secondary">BASKETBALL<br />DEVELOPMENT</span>
          </h2>
          <p className="font-body text-muted-foreground text-lg max-w-lg mb-10 leading-relaxed">
            Play it Forward connects the next generation of players with a nationwide network of former elite college and pro athletes — all sharing their knowledge on one platform built for serious players.
          </p>
          <div className="space-y-4">
            {features.map((f) => (
              <div key={f.title} className="bg-card border border-border rounded-xl p-5 border-l-[3px]" style={{ borderLeftColor: "hsl(217 74% 57%)" }}>
                <h3 className="font-heading text-sm tracking-widest text-foreground">{f.title}</h3>
                <p className="font-body text-muted-foreground text-sm mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative">
          <div className="bg-secondary rounded-2xl p-6 w-fit mb-6">
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
                  <p className="font-heading text-[10px] tracking-widest text-secondary">{d.cat}</p>
                  <p className="font-heading text-sm text-foreground">{d.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{d.coach}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ━━━ DRILL SHOWCASE ━━━ */
const categoryColorMap: Record<string, string> = {
  "Ball Handling": "bg-secondary",
  "Shooting": "bg-secondary",
  "Athletics": "bg-secondary",
  "Basketball IQ": "bg-secondary",
  "Mental Game": "bg-secondary",
  "Scoring": "bg-secondary",
  "Post Game": "bg-secondary",
  "Speed & Agility": "bg-secondary",
};

function TrainSection() {
  const fade = useFadeIn();
  const [drills, setDrills] = useState<any[]>([]);

  useEffect(() => {
    const fetchWorkouts = async () => {
      const targetTitles = ["Ball Handling Transformation", "Point Guard Foundations", "Game Ready Mobility System", "Secrets of Shooting"];
      const { data } = await supabase.from("courses").select("id, title, category, level, thumbnail_url, skill_levels").in("title", targetTitles);
      const sorted = targetTitles.map((t) => (data ?? []).find((c) => c.title === t)).filter(Boolean) as any[];
      setDrills(sorted);
    };
    fetchWorkouts();
  }, []);

  return (
    <section id="content" className="px-4 md:px-6 lg:px-12 py-16 lg:py-32 max-w-[1400px] mx-auto overflow-hidden" ref={fade.ref}>
      <div className={fade.className}>
        <div className="flex items-end justify-between mb-12">
          <h2 className="text-5xl sm:text-6xl lg:text-7xl leading-[0.9]">
            TRAIN<br /><span className="text-primary">EVERY SKILL</span>
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {drills.length > 0
            ? drills.map((drill) => (
                <div key={drill.id} className="group cursor-pointer">
                  <div className="aspect-[4/3] rounded-xl overflow-hidden relative mb-4 border border-border group-hover:border-secondary/40 transition-colors">
                    <img src={drill.thumbnail_url} alt={drill.title} width={400} height={300} className="absolute inset-0 w-full h-full object-cover object-top" loading="lazy" decoding="async" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute top-3 left-3 bg-secondary text-foreground font-heading text-[10px] tracking-widest px-3 py-1 rounded-md z-10">{drill.category?.toUpperCase()}</div>
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <div className="w-12 h-12 rounded-full bg-primary/80 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play className="h-5 w-5 text-foreground ml-0.5" />
                      </div>
                    </div>
                    <p className="absolute bottom-3 left-3 right-3 font-heading text-sm text-white z-10 line-clamp-2">{drill.title}</p>
                  </div>
                </div>
              ))
            : [1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-[4/3] bg-card rounded-xl border border-border" />
              ))}
        </div>
      </div>
    </section>
  );
}

/* ━━━ TESTIMONIAL ━━━ */
function TestimonialSection() {
  const fade = useFadeIn();
  return (
    <section className="py-16 lg:py-32" style={{ background: "#0D1220" }} ref={fade.ref}>
      <div className={`px-4 md:px-6 lg:px-12 max-w-[1000px] mx-auto ${fade.className}`}>
        <div className="relative border-l-4 border-secondary pl-8 md:pl-12">
          <span className="absolute -top-6 -left-2 text-8xl sm:text-9xl font-display leading-none select-none text-secondary/20">"</span>
          <p className="font-body italic text-lg sm:text-xl lg:text-2xl text-foreground leading-relaxed font-semibold relative z-10">
            Play it Forward completely changed the trajectory of my child's basketball journey — what used to feel confusing and overwhelming is now clear, structured, and real. The training plan gave him purpose every single day, and through the app we found the right AAU team that actually put him in a position to grow and get seen. But the biggest shift was recruiting — we built his profile, created his highlight tape, and reached out to hundreds of college coaches with confidence instead of just hoping someone would find him. This isn't just an app — it gave my child a real shot and gave our family belief that his dream is actually possible.
          </p>
          <span className="absolute -bottom-10 right-0 text-8xl sm:text-9xl font-display leading-none select-none text-secondary/20">"</span>
          <p className="font-heading text-xs tracking-widest text-primary mt-8">
            — BASKETBALL PARENT, PHILADELPHIA PA
          </p>
        </div>
      </div>
    </section>
  );
}

/* ━━━ HOW IT WORKS ━━━ */
function HowItWorks() {
  const fade = useFadeIn();
  const steps = [
    { num: "01", title: "BUILD YOUR PROFILE", desc: "Tell us your position, goals, stats, and where your game needs work." },
    { num: "02", title: "TRAIN WITH ELITE COACHES", desc: "Access hundreds of drills and courses built by former D1 and pro players." },
    { num: "03", title: "TRACK YOUR PROGRESS", desc: "Log games, track shots, watch your rating climb week over week." },
    { num: "04", title: "GET RECRUITED", desc: "Email every college coach in the country directly from your phone." },
  ];

  return (
    <section className="px-4 md:px-6 lg:px-12 py-16 lg:py-32" ref={fade.ref}>
      <div className={`max-w-[1200px] mx-auto ${fade.className}`}>
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-5xl sm:text-6xl lg:text-7xl">
            HOW IT <span className="text-secondary">WORKS</span>
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-px" style={{ background: "linear-gradient(90deg, transparent, hsl(217 74% 57% / 0.3), hsl(217 74% 57% / 0.3), transparent)" }} />
          {steps.map((s) => (
            <div key={s.title} className="text-center relative">
              <p className="text-5xl font-heading text-primary mb-4">{s.num}</p>
              <h3 className="font-heading text-base tracking-widest text-foreground mb-3">{s.title}</h3>
              <p className="font-body text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ━━━ PRICING ━━━ */
function PricingSection() {
  const fade = useFadeIn();
  const platformFeatures = [
    "Full drill library — every skill and level",
    "All coach courses and programs",
    "Progress tracking and streaks",
    "Game logs and shot tracking",
    "Community leaderboard",
    "Recruiting profile",
    "Browse all 1,852 schools and coach emails",
    "Direct coach access — message any coach",
  ];

  return (
    <section id="pricing" className="py-16 lg:py-32" style={{ background: "#0D1220" }} ref={fade.ref}>
      <div className={`px-4 md:px-6 lg:px-12 max-w-[1400px] mx-auto ${fade.className}`}>
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-6xl lg:text-7xl mb-4">
            START FREE. <span className="text-secondary">NO LIMITS.</span>
          </h2>
          <p className="font-body text-muted-foreground text-lg max-w-2xl mx-auto">
            Everything a serious player needs to develop their game and get recruited — on one platform, completely free to start.
          </p>
        </div>

        <div className="max-w-xl mx-auto">
          <div className="bg-card border border-secondary/20 rounded-2xl p-6 md:p-8 relative">
            <div className="absolute -top-3 left-6">
              <span className="bg-pif-green text-background font-heading text-[10px] tracking-widest px-4 py-1.5 rounded-full">FREE FOREVER</span>
            </div>
            <p className="font-heading text-xs tracking-widest text-secondary mt-2 mb-1">THE PLATFORM</p>
            <p className="font-heading text-xl text-foreground mb-5">EVERYTHING INCLUDED</p>
            <div className="space-y-3">
              {platformFeatures.map((f) => (
                <div key={f} className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-secondary flex-shrink-0" />
                  <span className="font-body text-sm text-foreground">{f}</span>
                </div>
              ))}
            </div>
            <Link to="/login" className="block mt-6">
              <Button className="w-full btn-cta bg-primary hover:bg-primary/90 text-foreground rounded-lg py-5 text-sm min-h-[48px] glow-red glow-red-hover">
                START FREE →
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ━━━ FINAL CTA ━━━ */
function FinalCTA() {
  const fade = useFadeIn();
  return (
    <section className="px-4 md:px-6 lg:px-12 py-16 lg:py-20 max-w-[1200px] mx-auto" ref={fade.ref}>
      <div className={`rounded-2xl p-6 md:p-10 lg:p-16 text-center relative overflow-hidden ${fade.className}`}
        style={{ background: "linear-gradient(135deg, hsl(217 74% 57% / 0.15), hsl(222 47% 8%))" }}>
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(59,130,246,0.1) 20px, rgba(59,130,246,0.1) 40px)" }} />
        <div className="relative z-10">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl text-foreground leading-[0.95] mb-4">
            YOUR COLLEGE CAREER<br /><span className="text-primary">STARTS HERE.</span>
          </h2>
          <p className="font-body text-muted-foreground text-lg max-w-xl mx-auto mb-8">
            Join thousands of players taking their development and recruiting into their own hands.
          </p>
          <Link to="/login">
            <Button className="btn-cta bg-primary hover:bg-primary/90 text-foreground rounded-lg px-10 py-7 text-base min-h-[56px] glow-red glow-red-hover">
              BUILD MY FREE RECRUITING PROFILE →
            </Button>
          </Link>
          <p className="font-body text-xs text-muted-foreground mt-4">100% free · No credit card · Takes 2 minutes</p>
        </div>
      </div>
    </section>
  );
}

/* ━━━ FOOTER ━━━ */
function Footer() {
  return (
    <footer className="border-t border-border px-4 md:px-6 lg:px-12 py-12 md:py-16 max-w-[1400px] mx-auto">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-1 mb-4">
            <span className="font-body italic text-lg text-foreground">Play it </span>
            <span className="font-body italic text-lg font-bold text-primary">Forward</span>
          </div>
          <p className="font-body text-sm text-muted-foreground leading-relaxed">
            The premier platform for youth basketball development. Elite former players teaching the next generation how to win — on and off the court.
          </p>
        </div>
        {[
          { title: "PLATFORM", links: ["Drill Library", "Coaches", "Pricing", "Leaderboard"] },
          { title: "COMPANY", links: ["About Us", "Become a Coach", "Contact"] },
          { title: "SUPPORT", links: ["Help Center", "Community", "Parent FAQ"] },
        ].map((col) => (
          <div key={col.title}>
            <p className="font-heading text-sm tracking-widest text-foreground mb-4">{col.title}</p>
            <ul className="space-y-2">
              {col.links.map((link) => (
                <li key={link}><a href="#" className="font-body text-sm text-muted-foreground hover:text-secondary transition-colors">{link}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="font-body text-xs text-muted-foreground">© 2026 Play it Forward Basketball. All rights reserved.</p>
        <div className="flex gap-6">
          <Link to="/privacy" className="font-body text-xs text-muted-foreground hover:text-secondary">Privacy</Link>
          <Link to="/terms" className="font-body text-xs text-muted-foreground hover:text-secondary">Terms</Link>
        </div>
      </div>
    </footer>
  );
}

/* ━━━ MAIN ━━━ */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground scroll-smooth">
      <AnnouncementBar />
      <Navbar />
      <HeroSection />
      <PillarsSection />
      <RecruitingSection />
      <CoachesSection />
      <PlatformSection />
      <TrainSection />
      <TestimonialSection />
      <HowItWorks />
      <PricingSection />
      <FinalCTA />
      <Footer />
    </div>
  );
}
