import { useEffect } from "react";
import { Sparkles, X } from "lucide-react";

interface Props {
  open: boolean;
  title: string;
  message: string;
  ctaLabel?: string;
  onClose: () => void;
}

/**
 * Lightweight celebration overlay with pure CSS confetti — no new deps.
 * Auto-dismisses after 6s if the user doesn't tap anything.
 */
export function MilestoneCelebration({ open, title, message, ctaLabel = "Keep going", onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [open, onClose]);

  if (!open) return null;

  const pieces = Array.from({ length: 50 });
  const colors = ["#E8391D", "#0071E3", "#10b981", "#f59e0b", "#8b5cf6"];

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-5 animate-fade-in"
      style={{ background: "rgba(8,13,20,0.85)", backdropFilter: "blur(6px)" }}
      role="dialog"
      aria-modal="true"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {pieces.map((_, i) => {
          const left = Math.random() * 100;
          const delay = Math.random() * 0.6;
          const duration = 2 + Math.random() * 2;
          const size = 6 + Math.random() * 8;
          const color = colors[i % colors.length];
          return (
            <span
              key={i}
              style={{
                position: "absolute",
                top: "-20px",
                left: `${left}%`,
                width: `${size}px`,
                height: `${size * 1.6}px`,
                background: color,
                animation: `confetti-fall ${duration}s linear ${delay}s forwards`,
                transform: `rotate(${Math.random() * 360}deg)`,
                borderRadius: 2,
                opacity: 0.9,
              }}
            />
          );
        })}
      </div>

      <div
        className="relative w-full max-w-sm rounded-3xl p-7 text-center shadow-2xl animate-scale-in"
        style={{ background: "#0F1620", border: "1px solid #1E2733", color: "#F3F5F7" }}
      >
        <button
          onClick={onClose}
          aria-label="Dismiss"
          className="absolute top-3 right-3"
          style={{ color: "#6B7785" }}
        >
          <X className="h-5 w-5" />
        </button>
        <div
          className="mx-auto h-14 w-14 rounded-full flex items-center justify-center mb-4"
          style={{ background: "linear-gradient(135deg, #E8391D, #f59e0b)" }}
        >
          <Sparkles className="h-7 w-7 text-white" />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.01em", lineHeight: 1.15 }}>
          {title}
        </h2>
        <p style={{ fontSize: 14, marginTop: 10, color: "#A0ADB8", lineHeight: 1.5 }}>{message}</p>
        <button
          onClick={onClose}
          className="mt-6 w-full rounded-xl font-semibold"
          style={{
            background: "#E8391D",
            color: "#fff",
            minHeight: 48,
            fontSize: 14,
            letterSpacing: 0.3,
          }}
        >
          {ctaLabel}
        </button>
      </div>

      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
