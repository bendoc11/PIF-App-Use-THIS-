import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";

const SKILL_OPTIONS = ["Shooting", "Ball Handling", "Finishing", "Defense", "Rebounding", "Passing"];
const WEAKNESS_OPTIONS = [...SKILL_OPTIONS, "Athleticism"];

interface Props {
  onNext: (strengths: string[], weaknesses: string[]) => void;
}

export default function ScreenStrengths({ onNext }: Props) {
  const [strengths, setStrengths] = useState<string[]>([]);
  const [weaknesses, setWeaknesses] = useState<string[]>([]);

  const toggle = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  const showWeaknesses = strengths.length >= 1;
  const canAdvance = strengths.length >= 1 && weaknesses.length >= 1;

  return (
    <div className="min-h-[100dvh] flex flex-col px-6 pt-14 pb-28">
      <div className="max-w-md mx-auto w-full flex-1 space-y-8">
        {/* Strengths */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div>
            <h1 className="text-3xl font-heading text-foreground">WHAT DO YOU DO WELL?</h1>
            <p className="text-sm text-muted-foreground mt-1">Select all that apply.</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {SKILL_OPTIONS.map((skill) => (
              <motion.button
                key={skill}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggle(strengths, setStrengths, skill)}
                className={`px-5 py-3 rounded-xl text-sm font-heading tracking-wider transition-all border ${
                  strengths.includes(skill)
                    ? "bg-primary text-primary-foreground border-primary glow-red"
                    : "bg-card/50 text-foreground border-border"
                }`}
              >
                {skill}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Weaknesses */}
        <AnimatePresence>
          {showWeaknesses && (
            <motion.div
              initial={{ opacity: 0, y: 20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: 20, height: 0 }}
              className="space-y-4"
            >
              <div>
                <h2 className="text-2xl font-heading text-foreground">WHERE DO YOU NEED WORK?</h2>
                <p className="text-sm text-muted-foreground mt-1">Be honest — this shapes your plan.</p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {WEAKNESS_OPTIONS.map((skill) => (
                  <motion.button
                    key={`w-${skill}`}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggle(weaknesses, setWeaknesses, skill)}
                    className={`px-5 py-3 rounded-xl text-sm font-heading tracking-wider transition-all border ${
                      weaknesses.includes(skill)
                        ? "bg-primary text-primary-foreground border-primary glow-red"
                        : "bg-card/50 text-foreground border-border"
                    }`}
                  >
                    {skill}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-background/95 backdrop-blur-sm z-20" style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}>
        <div className="max-w-md mx-auto">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => canAdvance && onNext(strengths, weaknesses)}
            disabled={!canAdvance}
            className={`w-full h-14 rounded-xl btn-cta text-base flex items-center justify-center gap-2 transition-all ${
              canAdvance
                ? "bg-primary text-primary-foreground glow-red"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            NEXT <ArrowRight className="h-4 w-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
