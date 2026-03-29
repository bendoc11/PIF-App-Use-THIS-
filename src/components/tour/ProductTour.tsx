import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, ArrowRight, X } from "lucide-react";

const TOTAL_STEPS = 6;

const GOAL_QUOTES: Record<string, string> = {
  "Make the Team": "Players who follow a structured training plan make their team 73% more often. Your plan is set. Now execute it.",
  "Earn a Starting Spot": "Starting spots aren't given. They're taken. Your training plan gives you the edge.",
  "Play at the Next Level (D1/D2/D3/JUCO)": "The average D1 offer comes after years of consistent, structured training. Yours starts today.",
  "Play Professionally": "The pros you watch didn't get there by accident. They had a system. Now you do too.",
  "Improve My Overall Game": "Consistency beats intensity every time. Show up to your plan and the results will follow.",
};

interface TourStep {
  type: "center" | "highlight";
  targetSelector?: string;
  headline: string;
  body: string;
  nextLabel: string;
}

function getSteps(firstName: string, goalQuote: string): TourStep[] {
  return [
    {
      type: "center",
      headline: `WELCOME TO PLAY IT FORWARD, ${firstName.toUpperCase()}. 🏀`,
      body: "You made a great decision. In the next 60 seconds we'll show you exactly how to use your new training system.",
      nextLabel: "SHOW ME AROUND →",
    },
    {
      type: "highlight",
      targetSelector: "[data-tour='todays-training']",
      headline: "YOUR DAILY TRAINING",
      body: "This is your command center. Every day you'll see exactly what to work on based on your goals and schedule. No guessing. Just show up and execute.",
      nextLabel: "GOT IT →",
    },
    {
      type: "highlight",
      targetSelector: "[data-tour='first-drill']",
      headline: "START HERE TODAY",
      body: "This is your first drill. It was selected based on your goal and position. Tap it when you're ready to train.",
      nextLabel: "WHAT ELSE? →",
    },
    {
      type: "highlight",
      targetSelector: "[data-tour='nav-progress']",
      headline: "TRACK EVERYTHING",
      body: "Your player card, shooting percentage, game stats, and training consistency all live here. Every drill you complete and every game you log makes your rating climb.",
      nextLabel: "KEEP GOING →",
    },
    {
      type: "highlight",
      targetSelector: "[data-tour='nav-community']",
      headline: "YOU'RE NOT ALONE",
      body: "Ask questions, share wins, and get answers from coaches and players who've been where you're trying to go. The best players use every resource available.",
      nextLabel: "ONE MORE →",
    },
    {
      type: "center",
      headline: "YOU'RE READY TO WORK.",
      body: goalQuote,
      nextLabel: "START MY FIRST DRILL →",
    },
  ];
}

// Typewriter effect component
function TypewriterText({ text, className }: { text: string; className?: string }) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, 800 / text.length); // total ~800ms
    return () => clearInterval(interval);
  }, [text]);
  return <span className={className}>{displayed}<span className="opacity-0">|</span></span>;
}

export default function ProductTour() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const firstName = profile?.first_name || "Player";
  const primaryGoal = (profile as any)?.primary_goal || "Improve My Overall Game";
  const goalQuote = GOAL_QUOTES[primaryGoal] || GOAL_QUOTES["Improve My Overall Game"];
  const steps = getSteps(firstName, goalQuote);
  const currentStep = steps[step];

  const completeTour = useCallback(async () => {
    if (!user) return;
    await supabase
      .from("profiles")
      .update({ product_tour_completed: true } as any)
      .eq("id", user.id);
    await refreshProfile();
  }, [user, refreshProfile]);

  const handleSkip = async () => {
    await completeTour();
  };

  const handleNext = async () => {
    if (step === TOTAL_STEPS - 1) {
      await completeTour();
      // Navigate to first drill
      const { data: drills } = await supabase
        .from("drills")
        .select("id")
        .eq("is_featured", true)
        .order("sort_order")
        .limit(1);
      if (drills?.[0]) {
        navigate(`/drills/${drills[0].id}`);
      }
      return;
    }
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  // Measure target element
  useEffect(() => {
    if (currentStep.type !== "highlight" || !currentStep.targetSelector) {
      setTargetRect(null);
      return;
    }

    const measure = () => {
      const el = document.querySelector(currentStep.targetSelector!);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        // Small delay after scroll
        setTimeout(() => {
          setTargetRect(el.getBoundingClientRect());
        }, 350);
      } else {
        setTargetRect(null);
      }
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [currentStep]);

  const padding = 8;
  const cutout = targetRect
    ? {
        x: targetRect.x - padding,
        y: targetRect.y - padding,
        w: targetRect.width + padding * 2,
        h: targetRect.height + padding * 2,
        r: 16,
      }
    : null;

  // Calculate tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    if (!cutout || !targetRect) return {};
    const isMobile = window.innerWidth < 768;
    const tooltipWidth = Math.min(360, window.innerWidth - 32);

    if (isMobile) {
      // Stack below on mobile
      return {
        position: "fixed",
        top: cutout.y + cutout.h + 16,
        left: 16,
        right: 16,
        maxWidth: tooltipWidth,
      };
    }

    // Desktop: position to the right or left
    const spaceRight = window.innerWidth - (cutout.x + cutout.w);
    if (spaceRight > tooltipWidth + 32) {
      return {
        position: "fixed",
        top: cutout.y,
        left: cutout.x + cutout.w + 16,
        width: tooltipWidth,
      };
    }
    // Below
    return {
      position: "fixed",
      top: cutout.y + cutout.h + 16,
      left: Math.max(16, cutout.x),
      width: tooltipWidth,
    };
  };

  return (
    <div ref={overlayRef} className="fixed inset-0 z-[9999]" style={{ pointerEvents: "auto" }}>
      {/* SVG overlay with cutout */}
      {currentStep.type === "highlight" && cutout && (
        <svg className="fixed inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
          <defs>
            <mask id="tour-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={cutout.x}
                y={cutout.y}
                width={cutout.w}
                height={cutout.h}
                rx={cutout.r}
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.6)"
            mask="url(#tour-mask)"
          />
          {/* Pulsing glow ring */}
          <rect
            x={cutout.x - 2}
            y={cutout.y - 2}
            width={cutout.w + 4}
            height={cutout.h + 4}
            rx={cutout.r + 2}
            fill="none"
            stroke="hsl(5 78% 55%)"
            strokeWidth="2"
            className="animate-pulse"
            opacity="0.6"
          />
        </svg>
      )}

      {/* Dark overlay for center modals */}
      {currentStep.type === "center" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      )}

      {/* Skip button */}
      <button
        onClick={handleSkip}
        className="fixed top-4 right-4 z-[10000] flex items-center gap-1.5 px-3 py-1.5 text-xs font-heading tracking-wider text-muted-foreground hover:text-foreground transition-colors bg-black/40 rounded-full backdrop-blur-sm"
      >
        <X className="h-3 w-3" />
        SKIP TOUR
      </button>

      {/* Tooltip / Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.97 }}
          transition={{ duration: 0.3 }}
          style={currentStep.type === "highlight" ? getTooltipStyle() : undefined}
          className={
            currentStep.type === "center"
              ? "fixed inset-0 flex items-center justify-center p-6 z-[10000]"
              : "z-[10000]"
          }
        >
          <div
            className={`bg-card border border-primary/30 rounded-2xl p-6 shadow-2xl ${
              currentStep.type === "center" ? "max-w-md w-full" : ""
            }`}
            style={{ boxShadow: "0 0 40px hsl(5 78% 55% / 0.15)" }}
          >
            {/* PIF logo on welcome */}
            {step === 0 && (
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                  <span className="font-heading text-lg text-primary-foreground">PIF</span>
                </div>
              </div>
            )}

            {/* Step counter */}
            <p className="text-[10px] font-heading tracking-wider text-muted-foreground/60 mb-3">
              Step {step + 1} of {TOTAL_STEPS}
            </p>

            {/* Headline */}
            <h2 className="text-xl font-heading text-foreground mb-3 leading-tight">
              {step === TOTAL_STEPS - 1 ? (
                <TypewriterText text={currentStep.headline} />
              ) : (
                currentStep.headline
              )}
            </h2>

            {/* Body */}
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              {currentStep.body}
            </p>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <div>
                {step > 0 && (
                  <button
                    onClick={handleBack}
                    className="flex items-center gap-1 text-xs font-heading tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="h-3 w-3" /> BACK
                  </button>
                )}
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleNext}
                className="h-11 px-6 rounded-xl bg-primary text-primary-foreground btn-cta text-sm glow-red flex items-center gap-2"
              >
                {currentStep.nextLabel}
              </motion.button>
            </div>

            {/* Progress dots */}
            <div className="flex justify-center gap-1.5 mt-4">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i === step ? "bg-primary" : "bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>

            {/* Final step extras */}
            {step === TOTAL_STEPS - 1 && (
              <p className="text-[10px] text-muted-foreground/50 text-center mt-3">
                You can always find your schedule on the dashboard
              </p>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
