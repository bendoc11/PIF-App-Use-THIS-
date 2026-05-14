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
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "16px 18px",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.05em",
          color: "var(--text-tertiary)",
          marginBottom: 12,
          opacity: 0.8,
        }}
      >
        Next moves
      </div>
      <ul className="space-y-3">
        {items.map((q) => (
          <li key={q.id} className="flex items-start gap-2.5">
            <span
              className="mt-0.5 shrink-0 flex items-center justify-center"
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                border: `1.5px solid ${q.done ? "var(--success)" : "hsl(var(--pif-red))"}`,
                background: "transparent",
              }}
            >
              {q.done && (
                <Check
                  style={{ width: 9, height: 9, color: "var(--success)" }}
                  strokeWidth={2.5}
                />
              )}
            </span>
            <span
              style={{
                fontSize: 13,
                lineHeight: 1.5,
                color: q.done ? "rgba(255,255,255,0.45)" : "#FFFFFF",
                textDecoration: q.done ? "line-through" : "none",
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
