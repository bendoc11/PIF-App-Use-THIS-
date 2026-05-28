import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowRight, Link2, Rocket, DollarSign, Users, MapPin, GraduationCap, Send, Quote } from "lucide-react";
import alexWade from "@/assets/coaches/alex-wade.webp";
import zacErvin from "@/assets/coaches/zac-ervin.webp";
import torrenceWatson from "@/assets/coaches/torrence-watson.webp";

const CALENDLY_URL = "https://calendly.com/bdaugherty216/play-it-forward-intro-call";

function CoachAvatar({ src, name, school }: { src?: string; name: string; school: string }) {
  const initial = name.charAt(0);
  return (
    <div className="flex flex-col items-center">
      <div
        className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 flex items-center justify-center"
        style={{
          borderColor: "rgba(59,130,246,0.4)",
          background: "linear-gradient(135deg, #0F1A35, #1A2A55)",
        }}
      >
        {src ? (
          <img src={src} alt={name} className="w-full h-full object-cover object-top" />
        ) : (
          <span className="text-xl font-bold text-foreground">{initial}</span>
        )}
      </div>
      <p className="mt-2 text-xs font-semibold text-foreground">{name}</p>
      <p className="text-[11px] text-muted-foreground">{school}</p>
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/50">
      <nav className="flex items-center justify-between px-4 md:px-6 lg:px-12 h-16 max-w-[1200px] mx-auto">
        <Link to="/" className="flex items-baseline gap-1">
          <span className="font-sans text-lg text-foreground font-medium">Play it</span>
          <span className="font-sans text-lg font-bold text-primary">Forward</span>
        </Link>
        <div className="flex items-center gap-3 md:gap-5">
          <Link
            to="/"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            For Athletes
          </Link>
          <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
            <Button className="bg-primary hover:bg-primary/90 text-foreground rounded-lg px-4 py-2 text-sm font-semibold glow-red">
              Become a Partner
            </Button>
          </a>
        </div>
      </nav>
    </header>
  );
}

function Hero() {
  const scrollToHow = () => {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <section
      className="relative px-4 md:px-6 lg:px-12 py-20 md:py-28 overflow-hidden"
      style={{ background: "#0A0F1E" }}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(59,130,246,0.5) 1px, transparent 0)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="relative max-w-[1100px] mx-auto text-center">
        <h1
          className="font-sans font-bold text-foreground leading-[1.1] mb-6"
          style={{ fontSize: "clamp(2rem, 5vw, 2.5rem)" }}
        >
          Help Your Athletes Get Recruited. Earn Revenue Doing It.
        </h1>
        <p
          className="mx-auto max-w-2xl mb-10 leading-relaxed"
          style={{ color: "rgba(255,255,255,0.75)", fontSize: "clamp(1rem, 2vw, 1.125rem)" }}
        >
          Play it Forward partners with AAU programs, trainers, and youth basketball organizations to give their athletes a real recruiting edge — and share the revenue with you.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-foreground rounded-lg px-8 py-6 text-base font-semibold min-h-[52px] glow-red glow-red-hover">
              Apply For Partnership <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </a>
          <Button
            onClick={scrollToHow}
            variant="outline"
            className="w-full sm:w-auto rounded-lg px-8 py-6 text-base font-semibold min-h-[52px] bg-transparent border-border text-foreground hover:bg-card/50"
          >
            See How It Works
          </Button>
        </div>
      </div>
    </section>
  );
}

function SocialProof() {
  const stats = [
    { value: "7,800+", label: "College Coaches" },
    { value: "All Divisions", label: "D1 through JUCO" },
    { value: "Former D1", label: "Athletes On Staff" },
  ];
  return (
    <section className="px-4 md:px-6 lg:px-12 py-14 border-y border-border/40" style={{ background: "#0D1220" }}>
      <div className="max-w-[1100px] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-sans text-2xl md:text-3xl font-bold text-secondary">{s.value}</p>
              <p className="text-xs md:text-sm font-medium tracking-wider text-muted-foreground uppercase mt-1">
                {s.label}
              </p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-start justify-center gap-6 md:gap-10">
          <CoachAvatar src={alexWade} name="Alex Wade" school="Notre Dame" />
          <CoachAvatar src={zacErvin} name="Zac Ervin" school="Elon" />
          <CoachAvatar src={torrenceWatson} name="Torrence Watson" school="Missouri" />
          <CoachAvatar name="Ryan Langborg" school="Northwestern" />
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: Link2,
      title: "Your athletes sign up through your custom link",
    },
    {
      icon: Rocket,
      title: "They get full access to our recruiting platform — coach database, roster intelligence, D1 assessments",
    },
    {
      icon: DollarSign,
      title: "You earn $50 per active subscriber every month — paid monthly, forever",
    },
  ];
  return (
    <section id="how-it-works" className="px-4 md:px-6 lg:px-12 py-20 md:py-28">
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase mb-3">
            The Partnership
          </p>
          <h2 className="font-sans text-3xl md:text-4xl font-bold text-foreground">
            Simple. Powerful. Free to join.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {steps.map((s, i) => (
            <div
              key={i}
              className="rounded-xl p-6 border text-center"
              style={{
                background: "rgba(255,255,255,0.03)",
                borderColor: "rgba(59,130,246,0.15)",
              }}
            >
              <div
                className="w-12 h-12 rounded-lg mx-auto mb-4 flex items-center justify-center"
                style={{ background: "rgba(239,68,68,0.15)" }}
              >
                <s.icon className="w-6 h-6 text-primary" />
              </div>
              <p className="text-xs font-semibold tracking-wider text-secondary uppercase mb-3">
                Step {i + 1}
              </p>
              <p className="text-sm text-foreground leading-relaxed">{s.title}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhatAthletesGet() {
  const features = [
    {
      icon: Users,
      title: "7,800+ Coach Contacts",
      desc: "Every division, every region, direct email access",
    },
    {
      icon: MapPin,
      title: "Open Spots Intelligence",
      desc: "See which programs have roster openings at their position right now",
    },
    {
      icon: GraduationCap,
      title: "Free D1 Assessment",
      desc: "Personal recruiting evaluation from former D1 players",
    },
    {
      icon: Send,
      title: "One-Tap Outreach",
      desc: "Pre-written emails that actually get coach responses",
    },
  ];
  return (
    <section className="px-4 md:px-6 lg:px-12 py-20 md:py-28" style={{ background: "#0D1220" }}>
      <div className="max-w-[1100px] mx-auto">
        <h2 className="font-sans text-3xl md:text-4xl font-bold text-foreground text-center mb-12">
          What your athletes unlock
        </h2>
        <div className="grid sm:grid-cols-2 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl p-6 border-l-[3px]"
              style={{
                borderLeftColor: "hsl(217 74% 57%)",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "rgba(59,130,246,0.15)" }}
                >
                  <f.icon className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h3 className="font-sans text-base font-semibold text-foreground mb-1">
                    {f.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RevenueCalculator() {
  const [athletes, setAthletes] = useState(100);
  const subscribers = Math.round(athletes * 0.2);
  const monthly = subscribers * 50;
  const annual = monthly * 12;
  const fmt = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  return (
    <section className="px-4 md:px-6 lg:px-12 py-20 md:py-28">
      <div className="max-w-[800px] mx-auto">
        <h2 className="font-sans text-3xl md:text-4xl font-bold text-foreground text-center mb-12">
          What you could earn
        </h2>
        <div
          className="rounded-2xl p-6 md:p-10 border"
          style={{
            background: "rgba(255,255,255,0.03)",
            borderColor: "rgba(59,130,246,0.2)",
          }}
        >
          <label className="block text-sm font-medium text-foreground mb-4">
            How many athletes are in your program?
          </label>
          <div className="flex items-center gap-4 mb-2">
            <Slider
              value={[athletes]}
              min={100}
              max={500}
              step={5}
              onValueChange={(v) => setAthletes(v[0])}
              className="flex-1"
            />
            <span className="font-sans text-xl font-bold text-secondary min-w-[60px] text-right">
              {athletes}
            </span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mb-8">
            <span>100</span>
            <span>500</span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-baseline border-b border-border/30 pb-3">
              <span className="text-sm text-muted-foreground">Estimated monthly subscribers</span>
              <span className="font-sans text-lg font-bold text-foreground">{subscribers}</span>
            </div>
            <div className="flex justify-between items-baseline border-b border-border/30 pb-3">
              <span className="text-sm text-muted-foreground">Estimated monthly revenue for you</span>
              <span className="font-sans text-lg font-bold text-secondary">{fmt(monthly)}</span>
            </div>
            <div className="flex justify-between items-baseline pt-1">
              <span className="text-sm text-muted-foreground">Estimated annual revenue for you</span>
              <span className="font-sans text-2xl font-bold text-primary">{fmt(annual)}</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-6">
          Based on average conversion rates from current partner programs. Results vary based on program size and engagement.
        </p>

        {/* Example box at default 100-athlete position */}
        <div
          className="mt-6 rounded-xl p-4 border text-center"
          style={{
            background: "rgba(255,255,255,0.02)",
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          <p className="text-sm text-foreground/70">
            Example: A program with{" "}
            <span className="font-sans font-bold text-primary">100</span> athletes →{" "}
            <span className="font-sans font-bold text-primary">20</span> subscribers →{" "}
            <span className="font-sans font-bold text-primary">$1,000</span>/month →{" "}
            <span className="font-sans font-bold text-primary">$12,000</span>/year
          </p>
        </div>
      </div>
    </section>
  );
}

function Testimonial() {
  const quote = "We plugged Play it Forward into Philadelphia Basketball School and our players were immediately engaged. It took us maybe 20 minutes to set up and share the link — after that it ran itself. Our athletes were messaging college coaches the same day. For us it was a no-brainer upsell that added real recurring revenue to our program without adding any work. It changed how we think about our business model.";

  return (
    <section className="px-4 md:px-6 lg:px-12 py-20 md:py-28" style={{ background: "#0D1220" }}>
      <div className="max-w-[900px] mx-auto">
        <h2 className="font-sans text-3xl md:text-4xl font-bold text-foreground text-center mb-12">
          What partners are saying
        </h2>
        <div
          className="rounded-2xl p-8 md:p-12 border relative"
          style={{
            background: "rgba(255,255,255,0.03)",
            borderColor: "rgba(59,130,246,0.2)",
          }}
        >
          {/* Founding Partner badge */}
          <div
            className="absolute top-4 right-4 md:top-6 md:right-6 px-2.5 py-1 text-[11px] font-semibold text-white uppercase tracking-wider"
            style={{
              background: "#7f1d1d",
              borderRadius: "6px",
            }}
          >
            Founding Partner
          </div>

          {/* Large opening quote mark in brand red */}
          <span
            className="block font-serif leading-none select-none"
            style={{ color: "hsl(var(--primary))", fontSize: "4rem", marginBottom: "-0.5rem" }}
          >
            "
          </span>

          <p
            className="leading-relaxed mb-8"
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: "16px",
              fontWeight: 400,
              color: "rgba(255,255,255,0.85)",
            }}
          >
            {quote}
          </p>

          {/* Red line separator */}
          <div className="w-12 h-[2px] rounded-full mb-4" style={{ background: "hsl(var(--primary))" }} />

          {/* Attribution with avatar */}
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full overflow-hidden border-2 flex items-center justify-center"
              style={{ borderColor: "rgba(59,130,246,0.4)" }}
            >
              <img
                src={alexWade}
                alt="Alex Wade"
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div>
              <p
                className="text-[13px] font-semibold text-white"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Alex Wade — Head Coach, Philadelphia Basketball School · Philadelphia, PA · Former D1 Player, Notre Dame
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const items = [
    {
      q: "Is there any cost to join?",
      a: "No. The partnership is completely free. You earn revenue, we handle all the technology.",
    },
    {
      q: "How do I get paid?",
      a: "Via direct deposit monthly. You earn a flat $50 per active subscriber every month from athletes in your network.",
    },
    {
      q: "What do I need to do?",
      a: "Share your custom link with your athletes and families. We handle everything else.",
    },
    {
      q: "Can I see the platform before partnering?",
      a: "Yes. Book a 15-minute call and we'll walk you through everything live.",
    },
    {
      q: "Is this exclusive?",
      a: "No exclusivity required. You can partner with us alongside any other tools your program uses.",
    },
  ];
  return (
    <section className="px-4 md:px-6 lg:px-12 py-20 md:py-28">
      <div className="max-w-[800px] mx-auto">
        <h2 className="font-sans text-3xl md:text-4xl font-bold text-foreground text-center mb-12">
          Frequently asked questions
        </h2>
        <Accordion type="single" collapsible className="space-y-3">
          {items.map((it, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="rounded-xl border px-5"
              style={{
                background: "rgba(255,255,255,0.03)",
                borderColor: "rgba(59,130,246,0.15)",
              }}
            >
              <AccordionTrigger className="text-left text-foreground font-semibold hover:no-underline py-5">
                {it.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                {it.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="px-4 md:px-6 lg:px-12 py-20 md:py-28" style={{ background: "#0D1220" }}>
      <div className="max-w-[900px] mx-auto">
        <div
          className="rounded-2xl p-8 md:p-12 border-l-4 border"
          style={{
            borderLeftColor: "hsl(var(--primary))",
            borderTopColor: "rgba(59,130,246,0.15)",
            borderRightColor: "rgba(59,130,246,0.15)",
            borderBottomColor: "rgba(59,130,246,0.15)",
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <h2 className="font-sans text-2xl md:text-3xl font-bold text-foreground mb-3">
            Ready to give your athletes a recruiting edge?
          </h2>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-8">
            Join as a founding partner and lock in your rev share before we close the program.
          </p>
          <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
            <Button className="bg-primary hover:bg-primary/90 text-foreground rounded-lg px-8 py-6 text-base font-semibold min-h-[56px] glow-red glow-red-hover">
              Book a Partnership Call <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </a>
          <p className="text-xs text-muted-foreground mt-4">
            Free 15-minute call. No commitment required.
          </p>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border px-4 md:px-6 lg:px-12 py-10">
      <div className="max-w-[1100px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link to="/" className="flex items-baseline gap-1">
          <span className="font-sans text-base text-foreground font-medium">Play it</span>
          <span className="font-sans text-base font-bold text-primary">Forward</span>
        </Link>
        <p className="text-xs text-muted-foreground">© 2026 Play it Forward. All rights reserved.</p>
        <div className="flex gap-5">
          <Link to="/privacy" className="text-xs text-muted-foreground hover:text-secondary">Privacy</Link>
          <Link to="/terms" className="text-xs text-muted-foreground hover:text-secondary">Terms</Link>
        </div>
      </div>
    </footer>
  );
}

export default function Partners() {
  return (
    <div className="min-h-screen bg-background text-foreground scroll-smooth">
      <Nav />
      <main>
        <Hero />
        <SocialProof />
        <HowItWorks />
        <WhatAthletesGet />
        <RevenueCalculator />
        <Testimonial />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
