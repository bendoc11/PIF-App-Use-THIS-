import { motion } from "framer-motion";
import { Target, Star, GraduationCap, Flame, TrendingUp } from "lucide-react";
import { useState } from "react";

const GOALS = [
  { title: "MAKE THE TEAM", sub: "Earn your spot this season", icon: Target },
  { title: "EARN A STARTING SPOT", sub: "Take what's yours", icon: Star },
  { title: "PLAY AT THE NEXT LEVEL", sub: "D1, D2, D3, or JUCO", icon: GraduationCap },
  { title: "PLAY PROFESSIONALLY", sub: "The highest level", icon: Flame },
  { title: "IMPROVE MY OVERALL GAME", sub: "Get better every day", icon: TrendingUp },
];

// Map display title to DB value
const GOAL_VALUES: Record<string, string> = {
  "MAKE THE TEAM": "Make the Team",
  "EARN A STARTING SPOT": "Earn a Starting Spot",
  "PLAY AT THE NEXT LEVEL": "Play at the Next Level (D1/D2/D3/JUCO)",
  "PLAY PROFESSIONALLY": "Play Professionally",
  "IMPROVE MY OVERALL GAME": "Improve My Overall Game",
};

interface Props {
  onSelect: (goal: string) => void;
}

export default function ScreenGoal({ onSelect }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (title: string) => {
    setSelected(title);
    setTimeout(() => onSelect(GOAL_VALUES[title]), 400);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center px-6">
      <div className="max-w-md mx-auto w-full space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h1 className="text-3xl font-heading text-foreground">WHAT ARE YOU TRAINING FOR?</h1>
          <p className="text-sm text-muted-foreground">Be honest. This is how we build your plan.</p>
        </motion.div>

        <div className="flex flex-col gap-3">
          {GOALS.map((goal, i) => {
            const Icon = goal.icon;
            const isSelected = selected === goal.title;
            return (
              <motion.button
                key={goal.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * (i + 1) }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleSelect(goal.title)}
                className={`w-full flex items-center gap-4 px-5 py-5 rounded-xl text-left transition-all border ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary glow-red scale-[1.02]"
                    : "bg-card/50 text-foreground border-border hover:border-primary/40"
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  isSelected ? "bg-primary-foreground/20" : "bg-muted"
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-heading text-base">{goal.title}</p>
                  <p className={`text-xs mt-0.5 ${isSelected ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {goal.sub}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
