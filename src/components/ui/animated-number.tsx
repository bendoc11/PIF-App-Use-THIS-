import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  className?: string;
  bumpClassName?: string;
  format?: (n: number) => string;
}

/**
 * Smoothly counts from the previous value to the new value with an
 * easeOutCubic curve, and applies a brief "bump" animation on increase.
 */
export function AnimatedNumber({
  value,
  duration = 800,
  className,
  bumpClassName,
  format,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState<number>(value);
  const [bump, setBump] = useState(false);
  const prevRef = useRef<number>(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    if (from === to) return;

    if (to > from) {
      setBump(true);
      const t = window.setTimeout(() => setBump(false), 600);
      // ensure cleanup if value changes mid-animation
      const start = performance.now();
      const tick = (now: number) => {
        const elapsed = now - start;
        const p = Math.min(1, elapsed / duration);
        const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
        const current = from + (to - from) * eased;
        setDisplay(to - from > 0 && to - from < 1 ? current : Math.round(current));
        if (p < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          setDisplay(to);
        }
      };
      rafRef.current = requestAnimationFrame(tick);
      prevRef.current = to;
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        clearTimeout(t);
      };
    }

    // decrease: just snap (no celebratory animation)
    setDisplay(to);
    prevRef.current = to;
  }, [value, duration]);

  const text = format ? format(display) : String(display);

  return (
    <span
      className={cn(
        "inline-block tabular-nums transition-colors",
        bump && (bumpClassName ?? "animate-metric-bump"),
        className,
      )}
    >
      {text}
    </span>
  );
}
