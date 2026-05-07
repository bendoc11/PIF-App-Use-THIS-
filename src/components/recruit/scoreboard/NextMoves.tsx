import { Check } from "lucide-react";

export interface QuestItem {
  id: string;
  label: string;
  done: boolean;
}

interface Props {
  items: QuestItem[];
}

export function NextMoves({ items }: Props) {
  return (
    <div className="rs-card p-4">
      <div className="rs-label mb-3">Next Moves</div>
      <ul className="space-y-2.5">
        {items.map((q) => (
          <li key={q.id} className="flex items-start gap-2.5">
            <span
              className="mt-0.5 h-4 w-4 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: q.done ? "#E8F5E2" : "var(--brand-orange-light)",
                border: `1.5px solid ${q.done ? "#5BB239" : "var(--brand-orange)"}`,
              }}
            >
              {q.done && <Check className="h-2.5 w-2.5" style={{ color: "#2E6B10" }} strokeWidth={3} />}
            </span>
            <span
              className="text-[12.5px] leading-snug"
              style={{
                color: q.done ? "var(--brand-muted)" : "var(--brand-ink)",
                textDecoration: q.done ? "line-through" : "none",
                opacity: q.done ? 0.55 : 1,
              }}
            >
              {q.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
