import { useEffect, useLayoutEffect, useState } from "react";

export interface TourStep {
  target: string; // CSS selector
  title?: string;
  body: string;
  placement?: "top" | "bottom" | "left" | "right";
}

interface Props {
  steps: TourStep[];
  onClose: () => void;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PADDING = 8;
const TOOLTIP_WIDTH = 320;
const TOOLTIP_OFFSET = 14;

function getTargetRect(selector: string): Rect | null {
  const el = document.querySelector(selector) as HTMLElement | null;
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

export function RecruitTour({ steps, onClose }: Props) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [vw, setVw] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  const [vh, setVh] = useState(typeof window !== "undefined" ? window.innerHeight : 800);

  const step = steps[index];

  // Scroll target into view + measure
  useLayoutEffect(() => {
    if (!step) return;
    const measure = () => {
      const el = document.querySelector(step.target) as HTMLElement | null;
      if (el) {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
      }
      // Measure shortly after scroll
      const t = window.setTimeout(() => {
        setRect(getTargetRect(step.target));
        setVw(window.innerWidth);
        setVh(window.innerHeight);
      }, 250);
      return () => window.clearTimeout(t);
    };
    const cleanup = measure();
    return cleanup;
  }, [step]);

  // Reposition on resize / scroll
  useEffect(() => {
    if (!step) return;
    const update = () => {
      setRect(getTargetRect(step.target));
      setVw(window.innerWidth);
      setVh(window.innerHeight);
    };
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [step]);

  if (!step) return null;

  const isLast = index === steps.length - 1;
  const target = rect ?? { top: vh / 2 - 40, left: vw / 2 - 100, width: 200, height: 80 };

  // Spotlight box
  const spot = {
    top: target.top - PADDING,
    left: target.left - PADDING,
    width: target.width + PADDING * 2,
    height: target.height + PADDING * 2,
  };

  // Tooltip placement: prefer below, else above
  const desired = step.placement ?? "bottom";
  const spaceBelow = vh - (spot.top + spot.height);
  const spaceAbove = spot.top;
  const placement: "top" | "bottom" =
    desired === "top"
      ? "top"
      : spaceBelow < 180 && spaceAbove > spaceBelow
        ? "top"
        : "bottom";

  let tipTop = placement === "bottom" ? spot.top + spot.height + TOOLTIP_OFFSET : 0;
  if (placement === "top") tipTop = spot.top - TOOLTIP_OFFSET; // we'll translateY(-100%)

  let tipLeft = spot.left + spot.width / 2 - TOOLTIP_WIDTH / 2;
  tipLeft = Math.max(12, Math.min(vw - TOOLTIP_WIDTH - 12, tipLeft));

  // Arrow x relative to tooltip
  const arrowX = Math.max(16, Math.min(TOOLTIP_WIDTH - 16, spot.left + spot.width / 2 - tipLeft));

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Dark backdrop with cutout via SVG mask */}
      <svg width="100%" height="100%" className="absolute inset-0 pointer-events-auto" onClick={() => { /* swallow */ }}>
        <defs>
          <mask id="recruit-tour-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={spot.left}
              y={spot.top}
              width={spot.width}
              height={spot.height}
              rx={12}
              ry={12}
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.65)"
          mask="url(#recruit-tour-mask)"
        />
      </svg>

      {/* Bright ring around target */}
      <div
        className="absolute rounded-xl ring-2 ring-white/90 shadow-[0_0_0_4px_rgba(59,130,246,0.35)] pointer-events-none transition-all duration-200"
        style={{
          top: spot.top,
          left: spot.left,
          width: spot.width,
          height: spot.height,
        }}
      />

      {/* Tooltip */}
      <div
        className="absolute pointer-events-auto animate-fade-in"
        style={{
          top: tipTop,
          left: tipLeft,
          width: TOOLTIP_WIDTH,
          transform: placement === "top" ? "translateY(-100%)" : undefined,
        }}
      >
        {/* Arrow */}
        <div
          className="absolute w-3 h-3 bg-white rotate-45 border border-gray-200"
          style={{
            left: arrowX - 6,
            top: placement === "bottom" ? -6 : undefined,
            bottom: placement === "top" ? -6 : undefined,
            borderRight: placement === "bottom" ? "none" : undefined,
            borderBottom: placement === "bottom" ? "none" : undefined,
            borderLeft: placement === "top" ? "none" : undefined,
            borderTop: placement === "top" ? "none" : undefined,
          }}
        />
        <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-4">
          {step.title && (
            <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
              {step.title}
            </div>
          )}
          <p className="text-sm text-gray-800 leading-relaxed">{step.body}</p>

          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={onClose}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              Skip tour
            </button>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                {steps.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === index ? "w-4 bg-gray-900" : "w-1.5 bg-gray-300"
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={() => (isLast ? onClose() : setIndex((i) => i + 1))}
                className="px-3 py-1.5 rounded-md bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium transition-colors"
              >
                {isLast ? "Start recruiting" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
