import { motion } from "framer-motion";

export default function OnboardingBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* Animated subtle gradient */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            "radial-gradient(ellipse at 20% 50%, hsl(222 47% 12%) 0%, hsl(222 47% 5%) 70%)",
            "radial-gradient(ellipse at 80% 50%, hsl(222 47% 10%) 0%, hsl(222 47% 5%) 70%)",
            "radial-gradient(ellipse at 50% 80%, hsl(222 47% 12%) 0%, hsl(222 47% 5%) 70%)",
            "radial-gradient(ellipse at 20% 50%, hsl(222 47% 12%) 0%, hsl(222 47% 5%) 70%)",
          ],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      {/* Subtle noise overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }} />
    </div>
  );
}
