import { motion } from "framer-motion";

interface Props {
  progress: number; // 0-100
  currentStep?: number;
  totalSteps?: number;
}

export default function OnboardingProgress({ progress, currentStep, totalSteps }: Props) {
  const showLabel = typeof currentStep === "number" && typeof totalSteps === "number";
  const remaining = showLabel ? Math.max(0, (totalSteps as number) - (currentStep as number)) : 0;

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-white/5">
        <motion.div
          className="h-full bg-primary"
          style={{ boxShadow: "0 0 12px hsl(5 78% 55% / 0.5)" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      {showLabel && (
        <div
          className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 rounded-full bg-card/80 backdrop-blur-sm border border-border text-[11px] font-heading tracking-wider text-foreground whitespace-nowrap"
          aria-live="polite"
        >
          STEP {currentStep} OF {totalSteps}
          {remaining > 0 && (
            <span className="text-muted-foreground ml-1.5">· {remaining} LEFT</span>
          )}
        </div>
      )}
    </>
  );
}
