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
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: "0.02em",
          color: "#FFFFFF",
          marginBottom: 14,
        }}
      >
        Next moves
      </div>
      <ul style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
                fontWeight: q.done ? 400 : 600,
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
