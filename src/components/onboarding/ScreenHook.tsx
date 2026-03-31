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
        transition={{ delay: 0.8, duration: 0.5 }}
        className="relative z-10 mt-10"
      >
        <div className="max-w-sm mx-auto">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onNext}
            className="w-full py-6 px-10 rounded-2xl bg-primary text-primary-foreground font-heading text-2xl tracking-[0.2em] glow-red transition-shadow hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)]"
          >
            LET'S GO →
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
