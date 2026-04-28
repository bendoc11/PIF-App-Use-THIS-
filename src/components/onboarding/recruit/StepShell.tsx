import { ReactNode } from "react";
import { motion } from "framer-motion";

interface Props {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer: ReactNode;
}

export default function StepShell({ eyebrow, title, subtitle, children, footer }: Props) {
  return (
    <div className="min-h-[100dvh] flex flex-col px-6 pt-16 pb-32">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="space-y-2 mb-7"
        >
          {eyebrow && (
            <p className="text-[11px] font-heading tracking-[0.18em] text-primary">{eyebrow}</p>
          )}
          <h1 className="text-3xl font-heading text-foreground leading-tight">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground leading-relaxed">{subtitle}</p>}
        </motion.div>

        <div className="space-y-5 flex-1">{children}</div>
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 p-5 bg-background/95 backdrop-blur-sm z-20"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
        <div className="max-w-md mx-auto">{footer}</div>
      </div>
    </div>
  );
}

export function PrimaryCTA({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      onClick={() => !disabled && onClick()}
      disabled={disabled}
      className={`w-full h-14 rounded-xl btn-cta text-base flex items-center justify-center gap-2 transition-all ${
        disabled
          ? "bg-muted text-muted-foreground cursor-not-allowed"
          : "bg-primary text-primary-foreground glow-red"
      }`}
    >
      {children}
    </motion.button>
  );
}

export function SkipButton({ onClick, label = "Skip for now" }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      className="w-full mt-3 h-11 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      {label}
    </button>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="text-xs font-heading tracking-wider text-muted-foreground mb-2 block">
      {children}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full h-13 px-4 rounded-xl bg-card border border-border text-foreground text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
        props.className || ""
      }`}
    />
  );
}
