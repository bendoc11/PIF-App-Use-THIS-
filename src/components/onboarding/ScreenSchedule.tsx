import { useState } from "react";
import { motion } from "framer-motion";

const DAYS = [1, 2, 3, 4, 5, 6, 7];
const HOURS = ["30 min", "1 hour", "1.5 hours", "2+ hours"];

interface Props {
  onSubmit: (data: { trainingDays: number; trainingHours: string; phone: string }) => void;
  saving: boolean;
}

export default function ScreenSchedule({ onSubmit, saving }: Props) {
  const [trainingDays, setTrainingDays] = useState<number | null>(null);
  const [trainingHours, setTrainingHours] = useState("");
  const [phone, setPhone] = useState("");

  const canSubmit = trainingDays !== null && !!trainingHours && !saving;

  return (
    <div className="min-h-[100dvh] flex flex-col px-6 pt-14 pb-28">
      <div className="max-w-md mx-auto w-full flex-1 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h1 className="text-3xl font-heading text-foreground">HOW MUCH CAN YOU COMMIT?</h1>
          <p className="text-sm text-muted-foreground">We'll build your weekly plan around your schedule.</p>
        </motion.div>

        <div className="space-y-6">
          {/* Days */}
          <div>
            <label className="text-xs font-heading tracking-wider text-muted-foreground mb-3 block">DAYS PER WEEK</label>
            <div className="flex gap-2">
              {DAYS.map((d) => (
                <motion.button
                  key={d}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setTrainingDays(d)}
                  className={`flex-1 py-3.5 rounded-xl text-sm font-heading transition-all border ${
                    trainingDays === d
                      ? "bg-primary text-primary-foreground border-primary glow-red"
                      : "bg-card/50 text-foreground border-border"
                  }`}
                >
                  {d}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Hours */}
          <div>
            <label className="text-xs font-heading tracking-wider text-muted-foreground mb-3 block">HOURS PER SESSION</label>
            <div className="grid grid-cols-2 gap-2.5">
              {HOURS.map((h) => (
                <motion.button
                  key={h}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setTrainingHours(h)}
                  className={`py-3.5 rounded-xl text-sm font-heading tracking-wider transition-all border ${
                    trainingHours === h
                      ? "bg-primary text-primary-foreground border-primary glow-red"
                      : "bg-card/50 text-foreground border-border"
                  }`}
                >
                  {h.toUpperCase()}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="text-xs font-heading tracking-wider text-muted-foreground mb-2 block">YOUR NUMBER (OPTIONAL)</label>
            <input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 555-5555"
              className="w-full h-13 px-4 rounded-xl bg-card border border-border text-foreground text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
      </div>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-background/95 backdrop-blur-sm z-20" style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}>
        <div className="max-w-md mx-auto">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => canSubmit && onSubmit({ trainingDays: trainingDays!, trainingHours, phone })}
            disabled={!canSubmit}
            className={`w-full h-14 rounded-xl btn-cta text-base transition-all ${
              canSubmit
                ? "bg-primary text-primary-foreground glow-red"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            {saving ? "SAVING…" : "BUILD MY PLAN →"}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
