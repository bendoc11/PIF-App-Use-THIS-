import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

/* ── Fade-in on scroll ── */
function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, className: `transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}` };
}

/* ── Animated counter ── */
function AnimCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setStarted(true); obs.disconnect(); } },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let current = 0;
    const step = target / 40;
    const iv = setInterval(() => {
      current += step;
      if (current >= target) { setVal(target); clearInterval(iv); }
      else setVal(current);
    }, 25);
    return () => clearInterval(iv);
  }, [started, target]);

  return (
    <span ref={ref}>
      {Math.round(val).toLocaleString()}{suffix}
    </span>
  );
}

const STATS = [
  { value: 1852, label: "COLLEGE PROGRAMS" },
  { value: 7819, label: "COACH CONTACTS" },
  { value: 5, label: "DIVISIONS COVERED" },
  { value: 50, label: "STATES" },
];

const CARDS = [
  {
    headline: "THEIR INBOX. NOT THEIR SPAM FOLDER.",
    body: "Messages send from your own Gmail account. Coaches see a real person — not a recruiting platform. Replies go straight to your inbox.",
  },
  {
    headline: "PERSONALIZED. AT SCALE.",
    body: "Every message auto-fills with your player's name, stats, GPA, grad year, and highlight film. One click sends to every coach at every school you select.",
  },
  {
    headline: "FIND THE PERFECT FIT.",
    body: "Filter every program in the country by division, state, school size, and academics. See acceptance rates, costs, and GPA averages before you reach out.",
  },
];

export function RecruitingSection() {
  const fade = useFadeIn();

  return (
    <section className="py-20 lg:py-32" style={{ background: "#060A10" }} ref={fade.ref}>
      <div className={`px-4 md:px-6 lg:px-12 max-w-[1400px] mx-auto ${fade.className}`}>
        {/* Headline */}
        <div className="text-center mb-16 lg:mb-20">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-heading text-foreground leading-[0.92] mb-4">
            EVERY COACH. EVERY SCHOOL.<br />
            <span className="text-primary">EVERY DIVISION.</span>
          </h2>
          <p className="font-body text-muted-foreground text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            Most families spend thousands on showcases hoping coaches notice. We give you their direct contact.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10 mb-12 lg:mb-16">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-5xl sm:text-6xl lg:text-7xl font-heading text-foreground leading-none">
                <AnimCounter target={s.value} />
              </p>
              <p className="font-heading text-[10px] sm:text-xs tracking-[0.2em] text-muted-foreground mt-2">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-border mb-12 lg:mb-16" />

        {/* Three feature cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-16 lg:mb-20">
          {CARDS.map((c) => (
            <div key={c.headline} className="relative pt-4">
              {/* Red top accent */}
              <div
                className="absolute top-0 left-0 w-12 h-[3px] rounded-full"
                style={{ background: "linear-gradient(90deg, hsl(var(--pif-red)), hsl(var(--pif-orange)))" }}
              />
              <h3 className="font-heading text-lg sm:text-xl tracking-wide text-foreground mb-3 leading-tight">
                {c.headline}
              </h3>
              <p className="font-body text-muted-foreground text-sm sm:text-base leading-relaxed">
                {c.body}
              </p>
            </div>
          ))}
        </div>

        {/* Pull quote */}
        <div className="max-w-4xl mx-auto text-center mb-16 lg:mb-20 px-4">
          <div className="relative">
            {/* Oversized quotation marks */}
            <span
              className="absolute -top-8 -left-2 sm:-left-6 text-7xl sm:text-9xl font-display leading-none select-none"
              style={{ color: "hsl(var(--pif-red) / 0.25)" }}
            >
              "
            </span>
            <span
              className="absolute -bottom-12 -right-2 sm:-right-6 text-7xl sm:text-9xl font-display leading-none select-none"
              style={{ color: "hsl(var(--pif-red) / 0.25)" }}
            >
              "
            </span>
            <p className="font-body italic text-xl sm:text-2xl lg:text-3xl text-foreground leading-snug font-semibold relative z-10">
              NCSA charged us $1,500 and gave us a coordinator. Play it Forward gave us every coach's direct contact.
            </p>
          </div>
          <p className="font-heading text-xs tracking-widest text-muted-foreground mt-6">
            — BASKETBALL PARENT, PHILADELPHIA PA
          </p>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link to="/login">
            <Button
              className="btn-cta bg-primary hover:bg-primary/90 text-foreground rounded-lg px-10 py-7 text-base min-h-[56px] glow-red glow-red-hover"
            >
              SEE EVERY COACH IN YOUR STATE →
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
