import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";

interface ShotInputScreenProps {
  shotAttempts: number;
  onSave: (shotsMade: number) => void;
  onSkip: () => void;
}

export function ShotInputScreen({ shotAttempts, onSave, onSkip }: ShotInputScreenProps) {
  const [shotsMade, setShotsMade] = useState(0);

  const percentage = shotAttempts > 0 ? Math.round((shotsMade / shotAttempts) * 100) : 0;

  const increment = () => setShotsMade((v) => Math.min(v + 1, shotAttempts));
  const decrement = () => setShotsMade((v) => Math.max(v - 1, 0));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 0;
    setShotsMade(Math.max(0, Math.min(val, shotAttempts)));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background px-6"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex flex-col items-center gap-8 max-w-sm w-full">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-heading text-foreground">How'd you shoot?</h1>
          <p className="text-muted-foreground">
            Enter how many you made out of {shotAttempts}
          </p>
        </div>

        {/* Number input with +/- */}
        <div className="flex items-center gap-6">
          <button
            onClick={decrement}
            className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-muted/80 transition-colors active:scale-95"
          >
            <Minus className="h-6 w-6" />
          </button>

          <input
            type="number"
            value={shotsMade}
            onChange={handleInputChange}
            min={0}
            max={shotAttempts}
            className="w-28 h-24 text-center text-5xl font-heading bg-transparent border-b-2 border-muted-foreground/30 text-foreground focus:outline-none focus:border-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />

          <button
            onClick={increment}
            className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-muted/80 transition-colors active:scale-95"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>

        {/* Live percentage */}
        <p className="text-lg text-muted-foreground font-heading">
          {shotsMade} / {shotAttempts} · <span className="text-foreground">{percentage}%</span>
        </p>

        {/* Buttons */}
        <div className="w-full space-y-3 pt-4">
          <Button
            onClick={() => onSave(shotsMade)}
            className="w-full h-14 text-lg btn-cta bg-primary hover:bg-primary/90 glow-red-hover"
          >
            Save & Continue
          </Button>
          <Button
            variant="ghost"
            onClick={onSkip}
            className="w-full h-12 text-muted-foreground hover:text-foreground"
          >
            Skip
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
