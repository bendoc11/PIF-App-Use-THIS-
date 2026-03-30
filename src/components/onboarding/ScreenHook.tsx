import { motion } from "framer-motion";
import courtImg from "@/assets/onboarding-court.jpg";

interface Props {
  onNext: () => void;
}

export default function ScreenHook({ onNext }: Props) {
  return (
    <div className="relative min-h-[100dvh] flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* Slow-zoom court image */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1 }}
        animate={{ scale: 1.08 }}
        transition={{ duration: 15, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
      >
        <img
          src={courtImg}
          alt=""
          className="w-full h-full object-cover opacity-20"
        />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40 z-[1]" />

      <div className="relative z-10 text-center max-w-md mx-auto space-y-6">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl md:text-6xl font-heading text-foreground leading-[0.95] tracking-tight"
        >
          LET'S BUILD YOUR
          <br />
          <span className="text-primary">TRAINING PLAN.</span>
        </motion.h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.2, duration: 0.5 }}
        className="relative z-10 fixed bottom-0 left-0 right-0 p-5"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
        <div className="max-w-md mx-auto">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onNext}
            className="w-full h-16 rounded-xl bg-primary text-primary-foreground btn-cta text-lg font-heading tracking-wider glow-red"
          >
            LET'S GO →
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
