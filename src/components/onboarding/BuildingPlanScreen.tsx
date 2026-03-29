import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LINES = [
  "Analyzing your position...",
  "Building your training schedule...",
  "Personalizing your drills...",
  "Setting your goals...",
  "YOUR PLAN IS READY.",
];

interface Props {
  onComplete: () => void;
}

export default function BuildingPlanScreen({ onComplete }: Props) {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    LINES.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleLines(i + 1), 600 * (i + 1)));
    });
    // After last line + hold
    timers.push(setTimeout(onComplete, 600 * LINES.length + 800));
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6">
      {/* Pulsing icon */}
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-12"
      >
        <div className="w-8 h-8 rounded-full bg-primary glow-red" />
      </motion.div>

      <div className="space-y-4 text-center max-w-sm">
        <AnimatePresence>
          {LINES.slice(0, visibleLines).map((line, i) => {
            const isLast = line === "YOUR PLAN IS READY.";
            return (
              <motion.p
                key={line}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: isLast ? 1 : (i < visibleLines - 1 ? 0.4 : 1), y: 0 }}
                transition={{ duration: 0.4 }}
                className={`${
                  isLast
                    ? "text-xl font-heading text-primary mt-6"
                    : "text-sm text-muted-foreground"
                }`}
              >
                {line}
              </motion.p>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
