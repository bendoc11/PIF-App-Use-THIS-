import { motion } from "framer-motion";

interface Props {
  progress: number; // 0-100
}

export default function OnboardingProgress({ progress }: Props) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-white/5">
      <motion.div
        className="h-full bg-primary"
        style={{ boxShadow: "0 0 12px hsl(5 78% 55% / 0.5)" }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
  );
}
