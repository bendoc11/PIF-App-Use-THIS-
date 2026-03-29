import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const POSITIONS = [
  { label: "PG", full: "Point Guard" },
  { label: "SG", full: "Shooting Guard" },
  { label: "SF", full: "Small Forward" },
  { label: "PF", full: "Power Forward" },
  { label: "C", full: "Center" },
];

const FEET = [4, 5, 6, 7];
const INCHES = Array.from({ length: 12 }, (_, i) => i);

const POSITION_COPY: Record<string, string> = {
  "Point Guard": "Point guards who train consistently are the most recruited players in the country.",
  "Shooting Guard": "Shooting guards who can create their own shot are impossible to guard.",
  "Small Forward": "Wings who can score at all three levels get looks from every level.",
  "Power Forward": "Power forwards who can stretch the floor change the entire game.",
  "Center": "Bigs who develop footwork and touch dominate at every level.",
};

interface Props {
  userType: "player" | "parent";
  onNext: (data: { firstName: string; position: string; age: string; feet: string; inches: string }) => void;
}

export default function ScreenBasicInfo({ userType, onNext }: Props) {
  const [firstName, setFirstName] = useState("");
  const [position, setPosition] = useState("");
  const [age, setAge] = useState("");
  const [feet, setFeet] = useState("");
  const [inches, setInches] = useState("");

  const canAdvance = firstName.trim() && position && age && Number(age) >= 8 && Number(age) <= 60 && feet && inches !== "";

  const headline = userType === "parent"
    ? "TELL US ABOUT YOUR PLAYER."
    : "TELL US ABOUT YOUR GAME.";

  return (
    <div className="min-h-[100dvh] flex flex-col px-6 pt-14 pb-28">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2 mb-8"
        >
          <h1 className="text-3xl font-heading text-foreground">{headline}</h1>
        </motion.div>

        <div className="space-y-6 flex-1">
          {/* First Name */}
          <div>
            <label className="text-xs font-heading tracking-wider text-muted-foreground mb-2 block">
              FIRST NAME
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter first name"
              className="w-full h-13 px-4 rounded-xl bg-card border border-border text-foreground text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Position */}
          <div>
            <label className="text-xs font-heading tracking-wider text-muted-foreground mb-2 block">
              POSITION
            </label>
            <div className="flex gap-2">
              {POSITIONS.map((p) => (
                <motion.button
                  key={p.label}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setPosition(p.full)}
                  className={`flex-1 py-3.5 rounded-xl text-sm font-heading transition-all border ${
                    position === p.full
                      ? "bg-primary text-primary-foreground border-primary glow-red"
                      : "bg-card text-foreground border-border"
                  }`}
                >
                  {p.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Age */}
          <div>
            <label className="text-xs font-heading tracking-wider text-muted-foreground mb-2 block">AGE</label>
            <input
              type="number"
              inputMode="numeric"
              min={8}
              max={60}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Enter age"
              className="w-full h-13 px-4 rounded-xl bg-card border border-border text-foreground text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Height */}
          <div>
            <label className="text-xs font-heading tracking-wider text-muted-foreground mb-2 block">HEIGHT</label>
            <div className="space-y-3">
              <div className="flex gap-2">
                {FEET.map((f) => (
                  <motion.button
                    key={f}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setFeet(String(f))}
                    className={`flex-1 py-3 rounded-xl text-sm font-heading transition-all border ${
                      feet === String(f)
                        ? "bg-primary text-primary-foreground border-primary glow-red"
                        : "bg-card text-foreground border-border"
                    }`}
                  >
                    {f} ft
                  </motion.button>
                ))}
              </div>
              <div className="grid grid-cols-6 gap-2">
                {INCHES.map((i) => (
                  <motion.button
                    key={i}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setInches(String(i))}
                    className={`py-3 rounded-xl text-sm font-heading transition-all border ${
                      inches === String(i)
                        ? "bg-primary text-primary-foreground border-primary glow-red"
                        : "bg-card text-foreground border-border"
                    }`}
                  >
                    {i}"
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Position copy */}
          {position && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-primary/80 italic leading-relaxed"
            >
              {POSITION_COPY[position]}
            </motion.p>
          )}
        </div>
      </div>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-background/95 backdrop-blur-sm z-20" style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}>
        <div className="max-w-md mx-auto">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => canAdvance && onNext({ firstName, position, age, feet, inches })}
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
