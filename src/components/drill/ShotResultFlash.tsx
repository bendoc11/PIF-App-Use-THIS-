import { motion } from "framer-motion";

interface ShotResultFlashProps {
  percentage: number;
}

export function ShotResultFlash({ percentage }: ShotResultFlashProps) {
  const color =
    percentage >= 60
      ? "text-pif-green"
      : percentage >= 40
      ? "text-pif-gold"
      : "text-primary";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <motion.p
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.15, 1], opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={`text-7xl font-heading ${color}`}
      >
        {percentage}%
      </motion.p>
    </div>
  );
}
