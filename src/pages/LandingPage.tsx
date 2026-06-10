import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { HeroSection } from "@/components/landing/HeroSection";
import { LiveOpeningsTicker } from "@/components/landing/LiveOpeningsTicker";
import { ArrowRight, Menu, X, Check, Star } from "lucide-react";
import { usePartner } from "@/contexts/PartnerContext";
import offeredLogo from "@/assets/offered-logo.png.asset.json";

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

/* ━━━ TRUST BAR ━━━ */
function TrustBar() {
  return (
    <div className="w-full border-b border-white/10" style={{ background: "#0A0F1E" }}>
      <p className="text-center py-2.5 text-white/70" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 400 }}>
        🏀 Used by athletes in 38 states · 7,800+ college coaches · Former D1 players on staff
      </p>
    </div>
  );
}

/* ━━━ NAVBAR ━━━ */
function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { partner } = usePartner();
  const navLinks = [
    { label: "Platform", href: "#platform" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Sign In", href: "/login?mode=signin", isLink: true },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border/50">
      <nav className="flex items-center justify-between px-4 md:px-6 lg:px-12 h-16 max-w-[1200px] mx-auto">
        <div className="flex items-center gap-2.5">
          {partner ? (
            partner.logo_url ? (
              <img src={partner.logo_url} alt={partner.partner_name} className="h-9 w-auto max-w-[180px] object-contain" />
            ) : (
              <span className="font-sans font-bold text-[20px] text-foreground tracking-tight">{partner.partner_name}</span>
            )
          ) : (
            <>
              <img src={offeredLogo.url} alt="Offered" className="h-7 w-auto" />
              <span className="text-[11px] text-white/40 font-normal hidden sm:inline-block ml-1">Basketball Recruiting</span>
            </>
          )}
        </div>
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            l.isLink ? (
              <Link key={l.label} to={l.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">{l.label}</Link>
            ) : (
              <a key={l.label} href={l.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">{l.label}</a>
            )
          ))}
        </div>
        <div className="hidden md:flex items-center gap-4">
          <Link to="/login?mode=signup">
            <Button className="bg-primary hover:bg-primary/90 text-foreground rounded-lg px-5 py-2.5 text-sm font-semibold glow-red">
              I'm Ready to Get Offered →

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
                <Link key={l.label} to={l.href} onClick={() => setMobileOpen(false)} className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors">{l.label}</Link>
              ) : (
                <a key={l.label} href={l.href} onClick={() => setMobileOpen(false)} className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors">{l.label}</a>
              )
            ))}
            <Link to="/login?mode=signup" onClick={() => setMobileOpen(false)}>
              <Button className="bg-primary hover:bg-primary/90 text-foreground rounded-lg w-full py-3 text-sm font-semibold glow-red">I'm Ready to Get Offered →</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

/* ━━━ SOCIAL PROOF STATS ━━━ */
function SocialProofStats() {
  const fade = useFadeIn();
  const stats = [
    { value: "7,800+", label: "College Coach Contacts" },
    { value: "1,848", label: "Programs in Database" },
    { value: "All Divisions", label: "D1 · D2 · D3 · NAIA · JUCO" },
  ];
  return (
    <section className="px-4 md:px-6 lg:px-12 py-12 md:py-16" style={{ background: "#0D1220" }} ref={fade.ref}>
      <div className={`max-w-[1200px] mx-auto rounded-2xl border border-white/10 ${fade.className}`} style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10">
          {stats.map((s) => (
            <div key={s.label} className="text-center py-10 px-6">
              <p className="font-bold text-primary leading-none mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(36px, 6vw, 48px)" }}>{s.value}</p>
              <p className="text-white/60" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ━━━ HOW IT WORKS ━━━ */
function HowItWorks() {
  const fade = useFadeIn();
  const steps = [
    { num: "01", title: "Build Your Profile", desc: "Tell us your position, division, and where you want to play. Takes 2 minutes." },
    { num: "02", title: "See Your Matches", desc: "We show you which programs have open spots at your position right now — based on real roster data." },
    { num: "03", title: "Message Coaches Directly", desc: "Send personalized emails to coaches from your own profile. No middleman. No waiting." },
  ];
  return (
    <section id="how-it-works" className="px-4 md:px-6 lg:px-12 py-20 lg:py-28" ref={fade.ref}>
      <div className={`max-w-[1200px] mx-auto ${fade.className}`}>
        <div className="text-center mb-14">
          <p className="text-primary uppercase tracking-[0.15em] font-semibold mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12 }}>HOW IT WORKS</p>
          <h2 className="font-sans text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
            From profile to coach reply in minutes.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-10">
          {steps.map((s) => (
            <div key={s.num} className="text-center md:text-left">
              <p className="font-bold text-primary leading-none mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 56 }}>{s.num}</p>
              <h3 className="font-sans text-xl font-bold text-foreground mb-3">{s.title}</h3>
              <p className="text-white/65 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ━━━ OPEN SPOTS PREVIEW ━━━ */
function OpenSpotsPreview() {
  const fade = useFadeIn();
  const cards = [
    {
      initial: "V", bg: "#1e40af",
      name: "Villanova University", meta: "Big East · D1", loc: "Philadelphia, PA",
      badge: "RECRUITING NOW", badgeBg: "hsl(var(--primary))",
      spots: "2 open spots projected at Point Guard",
      basis: "Based on 2 graduating Point Guards (Senior, 2026)",
    },
    {
      initial: "G", bg: "#15803d",
      name: "George Mason University", meta: "Atlantic 10 · D1", loc: "Fairfax, VA",
      badge: "RECRUITING SOON", badgeBg: "#b45309",
      spots: "1 open spot projected at Point Guard",
      basis: "Based on 1 graduating Point Guard (Junior, 2027)",
    },
    {
      initial: "H", bg: "#1e293b",
      name: "Hofstra University", meta: "CAA · D1", loc: "Hempstead, NY",
      badge: "RECRUITING NOW", badgeBg: "hsl(var(--primary))",
      spots: "3 open spots projected at Point Guard",
      basis: "Based on 3 graduating Point Guards (Senior, 2026)",
    },
  ];
  return (
    <section className="px-4 md:px-6 lg:px-12 py-20 lg:py-28" style={{ background: "#0A0F1E" }} ref={fade.ref}>
      <div className={`max-w-[1200px] mx-auto ${fade.className}`}>
        <div className="text-center mb-12">
          <p className="text-primary uppercase tracking-[0.15em] font-semibold mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12 }}>YOUR COMPETITIVE EDGE</p>
          <h2 className="font-sans text-3xl sm:text-4xl lg:text-[36px] font-bold text-foreground mb-4">
            See exactly which programs need your position.
          </h2>
          <p className="text-white/65 max-w-2xl mx-auto" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16 }}>
            Offered is the only recruiting platform with real-time roster intelligence. We track graduation data and transfers across every program in the country — so you always know where the open spots are.
          </p>
        </div>

        <div className="max-w-[900px] mx-auto rounded-xl border border-white/10 p-5 md:p-6" style={{ background: "rgba(255,255,255,0.02)" }}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <p className="font-sans font-bold text-foreground">Open Spots</p>
            <div className="flex flex-wrap gap-2">
              {["D1", "Northeast", "Point Guard", "All Urgency"].map((p) => (
                <span key={p} className="px-3 py-1 rounded-full text-xs text-white/85 border border-white/15" style={{ background: "rgba(255,255,255,0.04)" }}>{p}</span>
              ))}
            </div>
          </div>
          <p className="text-sm text-white/55 mb-5">47 programs likely recruiting your position</p>

          <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
            {cards.map((c, i) => (
              <div
                key={c.name}
                className="shrink-0 w-[260px] md:w-[270px] rounded-xl border border-white/10 p-4 snap-start"
                style={{ background: "#0D1220", opacity: i === 2 ? 0.7 : 1 }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: c.bg }}>{c.initial}</div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold text-white uppercase tracking-wider" style={{ background: c.badgeBg }}>{c.badge}</span>
                </div>
                <p className="font-bold text-foreground text-sm leading-tight">{c.name}</p>
                <p className="text-[11px] text-white/55 mt-0.5">{c.meta}</p>
                <p className="text-[11px] text-white/55">{c.loc}</p>
                <p className="text-sm text-white/90 mt-3 font-medium">{c.spots}</p>
                <p className="text-[11px] text-white/50 mt-1">{c.basis}</p>
                <Button className="w-full mt-3 bg-primary hover:bg-primary/90 text-white text-xs h-9">Message Coach →</Button>
                <button className="w-full text-xs text-white/55 hover:text-white/85 mt-2">View Roster</button>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-white/30 mt-3">← scroll to see more programs →</p>
        </div>

        <div className="text-center mt-8 space-y-1">
          <p className="text-sm text-white/50 flex items-center justify-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Updated weekly from official athletic department rosters
          </p>
          <p className="text-sm text-white/50">Covering 1,848 programs across D1, D2, D3, NAIA, and JUCO</p>
        </div>

        <div className="text-center mt-8">
          <Link to="/login?mode=signup">
            <Button className="bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-6 text-base h-auto glow-red">
              See My Open Spots <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ━━━ NCSA COMPARISON ━━━ */
function NcsaComparison() {
  const fade = useFadeIn();
  const rows = [
    { label: "Price", us: "$19.99/month", them: "$1,500+" },
    { label: "Coach contacts", us: "7,800+ direct emails", them: "Coaches contact you (maybe)" },
    { label: "Roster intelligence", us: "✓ Open Spots feature", them: "✗" },
    { label: "D1 staff assessments", us: "✓ Free", them: "✗" },
    { label: "Sends from your profile", us: "✓", them: "✗" },
    { label: "Response guarantee", us: "✓ 35 coaches or refund", them: "✗" },
  ];
  return (
    <section className="px-4 md:px-6 lg:px-12 py-20 lg:py-28" ref={fade.ref}>
      <div className={`max-w-[1000px] mx-auto ${fade.className}`}>
        <div className="text-center mb-10">
          <h2 className="font-sans text-2xl sm:text-3xl lg:text-[28px] font-bold text-foreground mb-3">
            NCSA charges $1,500. We charge $19.99/month.
          </h2>
          <p className="text-primary font-semibold text-lg">And we get coaches to actually respond.</p>
        </div>
        <div className="rounded-2xl border border-white/10 overflow-x-auto" style={{ background: "rgba(255,255,255,0.02)" }}>
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-sm text-white/50 font-medium"></th>
                <th className="text-left p-4 text-base font-bold text-primary">Offered</th>
                <th className="text-left p-4 text-base font-bold text-white/50">NCSA</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.label} className={i < rows.length - 1 ? "border-b border-white/5" : ""}>
                  <td className="p-4 text-sm font-medium text-white/80">{r.label}</td>
                  <td className="p-4 text-sm text-foreground">
                    {r.us.startsWith("✓") ? <span className="text-green-400">{r.us}</span> : r.us}
                  </td>
                  <td className="p-4 text-sm text-white/40">{r.them}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* ━━━ TESTIMONIALS ━━━ */
function Testimonials() {
  const fade = useFadeIn();
  const alexAvatar = "https://feblgdfxkuegmjqsdycp.supabase.co/storage/v1/object/public/course-thumbnails/coaches/2cdd9e3c-94c6-4636-bdbb-5824405fbd37.png";
  return (
    <section className="px-4 md:px-6 lg:px-12 py-20 lg:py-28" style={{ background: "#0D1220" }} ref={fade.ref}>
      <div className={`max-w-[1100px] mx-auto ${fade.className}`}>
        <h2 className="text-center font-sans text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-12">
          What families are saying
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-white/10 p-7" style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
            </div>
            <p className="text-white/90 leading-relaxed mb-4">
              "We had NCSA for a year and heard nothing back from coaches. Signed up for Offered and our son had three coaches respond in the first week."
            </p>
            <p className="text-sm text-white/55">— Basketball Parent · Philadelphia, PA</p>
          </div>

          <div className="relative rounded-2xl border border-primary/30 p-7" style={{ background: "linear-gradient(180deg, rgba(220,38,38,0.05), rgba(255,255,255,0.02))" }}>
            <span className="absolute top-4 right-4 px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider text-white" style={{ background: "#7f1d1d" }}>FOUNDING PARTNER</span>
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
            </div>
            <p className="text-white/90 leading-relaxed mb-4">
              "We plugged Offered into Philadelphia Basketball School and our players were immediately engaged. It took us maybe 20 minutes to set up. Our athletes were messaging college coaches the same day."
            </p>
            <div className="flex items-center gap-3 mt-4">
              <img src={alexAvatar} alt="Alex Wade" className="w-12 h-12 rounded-full object-cover" loading="lazy" />
              <div>
                <p className="text-sm font-semibold text-foreground">Alex Wade</p>
                <p className="text-xs text-white/55">Head Coach, Philadelphia Basketball School · Former D1, Notre Dame</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ━━━ MEET STAFF ━━━ */
function MeetStaff() {
  const fade = useFadeIn();
  const staff = [
    { name: "Alex Wade", school: "Notre Dame", url: "https://feblgdfxkuegmjqsdycp.supabase.co/storage/v1/object/public/course-thumbnails/coaches/2cdd9e3c-94c6-4636-bdbb-5824405fbd37.png" },
    { name: "Zac Ervin", school: "Elon University", url: "https://feblgdfxkuegmjqsdycp.supabase.co/storage/v1/object/public/course-thumbnails/coaches/5c232b53-0334-49cf-81dd-5d94841a3bc4.png" },
    { name: "Ryan Langborg", school: "Northwestern", url: "https://feblgdfxkuegmjqsdycp.supabase.co/storage/v1/object/public/course-thumbnails/coaches/4954e19b-f525-4169-a759-500bbebee965.png" },
    { name: "Torrence Watson", school: "Missouri", url: "https://feblgdfxkuegmjqsdycp.supabase.co/storage/v1/object/public/course-thumbnails/coaches/1519c8b9-8e74-4de7-8af9-35d65d27c4dc.png" },
  ];
  return (
    <section id="platform" className="px-4 md:px-6 lg:px-12 py-20 lg:py-28" ref={fade.ref}>
      <div className={`max-w-[1100px] mx-auto text-center ${fade.className}`}>
        <h2 className="font-sans text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
          Built by players who've been through it
        </h2>
        <p className="text-white/65 max-w-2xl mx-auto mb-12 leading-relaxed">
          Our team includes former D1 players from Notre Dame, Northwestern, Missouri, and Elon — who personally assess every athlete's recruiting profile.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {staff.map((s) => (
            <div key={s.name} className="flex flex-col items-center">
              <img src={s.url} alt={s.name} className="w-28 h-28 md:w-32 md:h-32 rounded-full object-cover mb-4 border-2 border-white/10" loading="lazy" />
              <p className="font-semibold text-foreground">{s.name}</p>
              <p className="text-xs text-white/55 mt-1">{s.school}</p>
            </div>
          ))}
        </div>
        <a href="https://calendly.com/bdaugherty216/play-it-forward-intro-call" target="_blank" rel="noopener noreferrer">
          <Button className="bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-6 text-base h-auto glow-red">
            Book a Free Assessment
          </Button>
        </a>
      </div>
    </section>
  );
}

/* ━━━ FINAL CTA ━━━ */
function FinalCTA({ innerRef }: { innerRef?: React.RefObject<HTMLElement> }) {
  const fade = useFadeIn();
  return (
    <section ref={innerRef} className="px-4 md:px-6 lg:px-12 py-20 lg:py-28">
      <div ref={fade.ref} className={`max-w-[1100px] mx-auto ${fade.className}`}>
        <div className="relative rounded-3xl border border-white/10 p-10 md:p-16 text-center overflow-hidden" style={{ background: "#0D1220" }}>
          <div className="absolute inset-y-0 left-0 w-1" style={{ background: "linear-gradient(180deg, hsl(var(--primary)), transparent)" }} />
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 0% 50%, rgba(220,38,38,0.08), transparent 60%)" }} />
          <div className="relative">
            <h2 className="font-sans text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 leading-tight">
              Your athlete's recruiting window is open right now.
            </h2>
            <p className="text-white/65 max-w-2xl mx-auto mb-8 text-base md:text-lg leading-relaxed">
              Coaches are building their 2026 and 2027 rosters today. Every week you wait is a week another athlete takes your spot.
            </p>
            <Link to="/login?mode=signup">
              <Button className="bg-primary hover:bg-primary/90 text-white font-semibold px-10 py-7 text-base h-auto glow-red glow-red-hover">
                I'm Ready to Get Offered → <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <p className="text-sm text-white/45 mt-5">Free to start · No credit card required · Cancel anytime</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ━━━ MOBILE STICKY CTA ━━━ */
function MobileStickyCta({ hideWhenVisibleRef }: { hideWhenVisibleRef: React.RefObject<HTMLElement> }) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const el = hideWhenVisibleRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => setHidden(e.isIntersecting),
      { threshold: 0.05 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hideWhenVisibleRef]);

  return (
    <div
      className={`md:hidden fixed inset-x-0 bottom-0 z-50 pointer-events-none transition-opacity duration-300 ${hidden ? "opacity-0" : "opacity-100"}`}
      aria-hidden={hidden}
    >
      <div
        className="h-8 w-full"
        style={{ background: "linear-gradient(180deg, rgba(10,15,30,0), rgba(10,15,30,0.95))" }}
      />
      <div
        className="px-3 pt-2"
        style={{
          background: "rgba(10,15,30,0.95)",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
        }}
      >
        <Link
          to="/login?mode=signup"
          className="pointer-events-auto flex items-center justify-center w-full rounded-xl glow-red"
          style={{
            height: 52,
            background: "hsl(var(--primary))",
            color: "#ffffff",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 600,
            fontSize: 16,
            letterSpacing: "0.01em",
          }}
        >
          See All Open Spots →
        </Link>
      </div>
    </div>
  );
}

/* ━━━ FOOTER ━━━ */
function Footer() {
  return (
    <footer className="border-t border-border px-4 md:px-6 lg:px-12 py-12 md:py-16 max-w-[1200px] mx-auto">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center mb-4">
            <img src={offeredLogo.url} alt="Offered" className="h-6 w-auto" />
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The recruiting platform built for high school athletes. Build your profile, find your schools, and email college coaches directly.
          </p>
        </div>
        {[
          { title: "Platform", links: ["My Profile", "Coach Database", "Highlight Tape"] },
          { title: "Company", links: ["About Us", "Contact", "Partnerships"] },
          { title: "Legal", links: ["Privacy", "Terms"] },
        ].map((col) => (
          <div key={col.title}>
            <p className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">{col.title}</p>
            <ul className="space-y-2">
              {col.links.map((link) => {
                if (link === "Privacy") return <li key={link}><Link to="/privacy" className="text-sm text-muted-foreground hover:text-secondary transition-colors">{link}</Link></li>;
                if (link === "Terms") return <li key={link}><Link to="/terms" className="text-sm text-muted-foreground hover:text-secondary transition-colors">{link}</Link></li>;
                return <li key={link}><a href="#" className="text-sm text-muted-foreground hover:text-secondary transition-colors">{link}</a></li>;
              })}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">© 2026 Offered. All rights reserved.</p>
        <div className="flex gap-6">
          <Link to="/privacy" className="text-xs text-muted-foreground hover:text-secondary">Privacy</Link>
          <Link to="/terms" className="text-xs text-muted-foreground hover:text-secondary">Terms</Link>
        </div>
      </div>
    </footer>
  );
}

/* ━━━ MAIN ━━━ */
export default function LandingPage() {
  const finalCtaRef = useRef<HTMLElement>(null);

  useEffect(() => {
    document.getElementById("leadconnector-chat-widget")?.remove();
    document.querySelectorAll("chat-widget").forEach((el) => el.remove());
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground scroll-smooth">
      <TrustBar />
      <div className="hidden md:block">
        <Navbar />
      </div>
      <LiveOpeningsTicker />
      <main>
        <HeroSection />
        <SocialProofStats />
        <HowItWorks />
        <OpenSpotsPreview />
        <NcsaComparison />
        <Testimonials />
        <MeetStaff />
        <FinalCTA innerRef={finalCtaRef} />
      </main>
      <Footer />
      <MobileStickyCta hideWhenVisibleRef={finalCtaRef} />
    </div>
  );
}
