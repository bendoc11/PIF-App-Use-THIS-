import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { HeroSection } from "@/components/landing/HeroSection";
import { ArrowRight, Menu, X } from "lucide-react";

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

/* ━━━ NAVBAR ━━━ */
function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navLinks = [
    { label: "Platform", href: "#platform" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Sign In", href: "/login", isLink: true },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border/50">
      <nav className="flex items-center justify-between px-4 md:px-6 lg:px-12 h-16 max-w-[1200px] mx-auto">
        <div className="flex items-baseline gap-1">
          <span className="font-sans text-lg text-foreground font-medium">Play it</span>
          <span className="font-sans text-lg font-bold text-primary">Forward</span>
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
          <Link to="/login">
            <Button className="bg-primary hover:bg-primary/90 text-foreground rounded-lg px-5 py-2.5 text-sm font-semibold glow-red">
              Build My Free Profile
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
            <Link to="/login" onClick={() => setMobileOpen(false)}>
              <Button className="bg-primary hover:bg-primary/90 text-foreground rounded-lg w-full py-3 text-sm font-semibold glow-red">Build My Free Profile</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

/* ━━━ VALUE PROPS ━━━ */
function ValueProps() {
  const fade = useFadeIn();
  const props = [
    {
      title: "Reach Every College Coach",
      desc: "Contact any D1, D2, D3, or NAIA coach in the country directly from your own email — not a recruiting platform inbox.",
    },
    {
      title: "A Profile Coaches Actually Open",
      desc: "Stats, film, academics, and intro video — packaged in a profile built for the way college coaches really evaluate.",
    },
    {
      title: "Free. Forever. Everything Included.",
      desc: "No paywall, no upsell. Direct coach access, profile builder, school database, and outreach tools — all included.",
    },
  ];

  return (
    <section id="platform" className="py-20 lg:py-28" style={{ background: "#0D1220" }} ref={fade.ref}>
      <div className={`px-4 md:px-6 lg:px-12 max-w-[1200px] mx-auto ${fade.className}`}>
        <div className="text-center mb-14">
          <h2 className="font-sans text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Everything You Need to Get Recruited
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            The same tools the top recruits use — built for every athlete who's serious about playing in college.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {props.map((p) => (
            <div
              key={p.title}
              className="rounded-xl p-6 border transition-colors hover:border-secondary/30"
              style={{
                background: "rgba(255,255,255,0.03)",
                borderColor: "rgba(59,130,246,0.15)",
              }}
            >
              <div className="h-[2px] w-12 bg-secondary rounded-full mb-5" />
              <h3 className="font-sans text-lg font-semibold text-foreground mb-3">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
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
    { num: "01", title: "Build Your Profile", desc: "Stats, academics, height, weight, position, hometown, intro video, and highlight tape — everything a coach needs to evaluate you." },
    { num: "02", title: "Find Your Schools", desc: "Search every college program in the country. Filter by division, region, school size, and academics to build your target list." },
    { num: "03", title: "Email Coaches Directly", desc: "Send personalized outreach to coaches from your own email. Replies come straight back to you. No middleman, no platform inbox." },
  ];

  return (
    <section id="how-it-works" className="px-4 md:px-6 lg:px-12 py-20 lg:py-28" ref={fade.ref}>
      <div className={`max-w-[1200px] mx-auto ${fade.className}`}>
        <div className="text-center mb-14">
          <h2 className="font-sans text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
            How It Works
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-px" style={{ background: "linear-gradient(90deg, transparent, hsl(217 74% 57% / 0.25), hsl(217 74% 57% / 0.25), transparent)" }} />
          {steps.map((s) => (
            <div key={s.num} className="text-center relative">
              <p className="text-5xl font-bold text-secondary/30 mb-4">{s.num}</p>
              <h3 className="font-sans text-base font-semibold text-foreground mb-3 uppercase tracking-wide">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ━━━ RECRUITING SECTION ━━━ */
function RecruitingOverview() {
  const fade = useFadeIn();
  const features = [
    { title: "Direct Coach Outreach", desc: "Email college coaches from your own inbox. Coaches see a real athlete — not a service. Their replies come straight to you." },
    { title: "Complete School Database", desc: "Every program in the country, filterable by division, state, school size, and academics. Find your best fit before you reach out." },
    { title: "Profile & Highlights", desc: "Stats, intro video, highlight tape, academics, and game log — packaged into one profile you can share with any coach in seconds." },
  ];

  return (
    <section className="py-20 lg:py-28" style={{ background: "#0D1220" }} ref={fade.ref}>
      <div className={`px-4 md:px-6 lg:px-12 max-w-[1200px] mx-auto ${fade.className}`}>
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div>
            <h2 className="font-sans text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-6">
              Stop Waiting to Be Discovered
            </h2>
            <p className="text-muted-foreground text-lg max-w-lg mb-10 leading-relaxed">
              Most families spend thousands on showcases and recruiting services hoping a coach notices. Take control. Reach every college coach in the country yourself — for free.
            </p>
            <div className="space-y-4">
              {features.map((f) => (
                <div key={f.title} className="rounded-xl p-5 border-l-[3px]" style={{ borderLeftColor: "hsl(217 74% 57%)", background: "rgba(255,255,255,0.03)" }}>
                  <h3 className="font-sans text-sm font-semibold text-foreground uppercase tracking-wide">{f.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-secondary/10 border border-secondary/20 rounded-2xl p-6">
              <p className="text-4xl font-bold text-secondary">7,819</p>
              <p className="text-sm font-medium text-muted-foreground mt-1 uppercase tracking-wider">Coach Contacts at Your Fingertips</p>
            </div>
            <div className="bg-secondary/10 border border-secondary/20 rounded-2xl p-6">
              <p className="text-4xl font-bold text-secondary">1,852</p>
              <p className="text-sm font-medium text-muted-foreground mt-1 uppercase tracking-wider">College Programs — All Divisions</p>
            </div>
            <div className="bg-secondary/10 border border-secondary/20 rounded-2xl p-6">
              <p className="text-4xl font-bold text-secondary">50</p>
              <p className="text-sm font-medium text-muted-foreground mt-1 uppercase tracking-wider">States Covered</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ━━━ TESTIMONIAL ━━━ */
function TestimonialSection() {
  const fade = useFadeIn();
  return (
    <section className="py-20 lg:py-28" ref={fade.ref}>
      <div className={`px-4 md:px-6 lg:px-12 max-w-[900px] mx-auto ${fade.className}`}>
        <div className="relative border-l-4 border-secondary pl-8 md:pl-12">
          <p className="text-lg sm:text-xl lg:text-2xl text-foreground leading-relaxed font-medium italic">
            "I sent emails to 40 coaches in one weekend. By the next week I had three schools fly out to watch me play. Play it Forward changed everything for me — I didn't need a $3,000 recruiting service. I just needed a profile and the coaches' emails."
          </p>
          <p className="text-sm font-medium text-primary mt-6 uppercase tracking-wider">
            — D1 Commit, Class of 2025
          </p>
        </div>
      </div>
    </section>
  );
}

/* ━━━ PRICING / CTA ━━━ */
function PricingCTA() {
  const fade = useFadeIn();
  return (
    <section className="py-20 lg:py-28" style={{ background: "#0D1220" }} ref={fade.ref}>
      <div className={`px-4 md:px-6 lg:px-12 max-w-[800px] mx-auto text-center ${fade.className}`}>
        <h2 className="font-sans text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
          Your Recruiting Starts Today.
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-6 leading-relaxed">
          Build your free profile, find your schools, and start contacting coaches in the next 10 minutes.
        </p>
        <Link to="/login">
          <Button className="bg-primary hover:bg-primary/90 text-foreground rounded-lg px-10 py-7 text-base font-semibold min-h-[56px] glow-red glow-red-hover">
            Build My Free Profile <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
        <p className="text-sm text-muted-foreground mt-6">
          Free forever. Direct coach access included. No credit card required.
        </p>
      </div>
    </section>
  );
}

/* ━━━ FOOTER ━━━ */
function Footer() {
  return (
    <footer className="border-t border-border px-4 md:px-6 lg:px-12 py-12 md:py-16 max-w-[1200px] mx-auto">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <div className="flex items-baseline gap-1 mb-4">
            <span className="font-sans text-lg text-foreground font-medium">Play it</span>
            <span className="font-sans text-lg font-bold text-primary">Forward</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The free recruiting platform built for high school athletes. Build your profile, find your schools, and email college coaches directly.
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
        <p className="text-xs text-muted-foreground">© 2026 Play it Forward. All rights reserved.</p>
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
  return (
    <div className="min-h-screen bg-background text-foreground scroll-smooth">
      <Navbar />
      <HeroSection />
      <ValueProps />
      <RecruitingOverview />
      <HowItWorks />
      <TestimonialSection />
      <PricingCTA />
      <Footer />
    </div>
  );
}
