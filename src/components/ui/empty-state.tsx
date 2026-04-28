import { ReactNode } from "react";
import { LucideIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  /** Eyebrow text — short, energizing label */
  eyebrow?: string;
  /** Bold headline (supports the athlete's first name interpolated by caller) */
  title: string;
  /** Sub copy — keep it warm, motivating, never clinical */
  description: ReactNode;
  /** Optional stat line like "1,852 college programs are waiting to hear from you" */
  stat?: ReactNode;
  /** Primary CTA */
  actionLabel?: string;
  onAction?: () => void;
  /** Optional secondary link */
  secondaryLabel?: string;
  onSecondary?: () => void;
  /** Visual tone */
  tone?: "dark" | "light";
  className?: string;
}

/**
 * Recruiting-flavored empty state. A starting line, not a blank screen.
 * Use to invite the athlete into action with a clear next step.
 */
export function EmptyState({
  icon: Icon = Sparkles,
  eyebrow,
  title,
  description,
  stat,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  tone = "dark",
  className,
}: EmptyStateProps) {
  const isDark = tone === "dark";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border px-6 py-10 md:px-10 md:py-12 text-center",
        isDark
          ? "border-border/60 bg-card"
          : "border-gray-200 bg-white",
        className,
      )}
      style={
        isDark
          ? {
              backgroundImage:
                "radial-gradient(ellipse at top, rgba(59,130,246,0.18) 0%, transparent 55%), radial-gradient(ellipse at bottom right, rgba(239,68,68,0.10) 0%, transparent 60%)",
            }
          : undefined
      }
    >
      {/* Subtle dot grid for depth on dark tone */}
      {isDark && (
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.05]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
      )}

      <div className="relative">
        <div
          className={cn(
            "mx-auto mb-5 w-14 h-14 rounded-2xl flex items-center justify-center border",
            isDark
              ? "bg-secondary/15 border-secondary/30 text-secondary"
              : "bg-blue-50 border-blue-100 text-blue-600",
          )}
        >
          <Icon className="w-6 h-6" />
        </div>

        {eyebrow && (
          <p
            className={cn(
              "text-[11px] font-bold tracking-[0.22em] uppercase mb-2",
              isDark ? "text-secondary" : "text-blue-600",
            )}
          >
            {eyebrow}
          </p>
        )}

        <h3
          className={cn(
            "text-xl md:text-2xl font-bold leading-tight mb-3 max-w-xl mx-auto",
            isDark ? "text-foreground" : "text-gray-900",
          )}
        >
          {title}
        </h3>

        <p
          className={cn(
            "text-sm md:text-[15px] leading-relaxed max-w-md mx-auto mb-5",
            isDark ? "text-muted-foreground" : "text-gray-600",
          )}
        >
          {description}
        </p>

        {stat && (
          <p
            className={cn(
              "text-xs font-semibold tracking-wide mb-6",
              isDark ? "text-secondary/90" : "text-blue-700",
            )}
          >
            {stat}
          </p>
        )}

        {(actionLabel || secondaryLabel) && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {actionLabel && (
              <Button
                onClick={onAction}
                className={cn(
                  "rounded-lg font-semibold",
                  isDark
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                    : "bg-gray-900 hover:bg-gray-800 text-white",
                )}
              >
                {actionLabel}
              </Button>
            )}
            {secondaryLabel && (
              <Button
                variant="ghost"
                onClick={onSecondary}
                className={isDark ? "text-muted-foreground hover:text-foreground" : "text-gray-600"}
              >
                {secondaryLabel}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
