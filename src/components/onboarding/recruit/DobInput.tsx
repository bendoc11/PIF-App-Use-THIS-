import { useEffect, useRef, useState } from "react";

interface Props {
  /** ISO date string YYYY-MM-DD (or "") */
  value: string;
  onChange: (iso: string) => void;
}

/**
 * Typeable date-of-birth input. Accepts MM/DD/YYYY typed by hand
 * (auto-inserts the slashes) and emits an ISO YYYY-MM-DD string.
 * Falls back to a hidden native date input on tap-the-icon for users
 * who prefer the OS picker.
 */
export default function DobInput({ value, onChange }: Props) {
  const [text, setText] = useState(() => isoToText(value));
  const [error, setError] = useState<string | null>(null);
  const nativeRef = useRef<HTMLInputElement>(null);

  // Keep local text in sync if parent value changes externally.
  useEffect(() => {
    setText(isoToText(value));
  }, [value]);

  const handleChange = (raw: string) => {
    // Keep only digits, then re-insert slashes after MM and DD.
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    let formatted = digits;
    if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    } else if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    setText(formatted);

    // Validate + emit ISO when fully filled.
    if (digits.length === 8) {
      const mm = Number(digits.slice(0, 2));
      const dd = Number(digits.slice(2, 4));
      const yyyy = Number(digits.slice(4, 8));
      const iso = `${yyyy.toString().padStart(4, "0")}-${digits.slice(0, 2)}-${digits.slice(2, 4)}`;
      // Construct in local time to avoid UTC off-by-one near timezone boundaries.
      const d = new Date(yyyy, mm - 1, dd);
      const today = new Date();
      const valid =
        mm >= 1 &&
        mm <= 12 &&
        dd >= 1 &&
        dd <= 31 &&
        yyyy >= 1900 &&
        d.getFullYear() === yyyy &&
        d.getMonth() + 1 === mm &&
        d.getDate() === dd &&
        d <= today;
      if (valid) {
        setError(null);
        onChange(iso);
      } else {
        setError("Enter a valid date (MM/DD/YYYY)");
        onChange("");
      }
    } else {
      setError(null);
      onChange("");
    }
  };

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          autoComplete="bday"
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="MM/DD/YYYY"
          maxLength={10}
          className="flex-1 h-13 px-4 rounded-xl bg-card border border-border text-foreground text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 tabular-nums"
        />
        <button
          type="button"
          onClick={() => {
            const el = nativeRef.current;
            if (!el) return;
            if (typeof (el as any).showPicker === "function") (el as any).showPicker();
            else el.click();
          }}
          className="shrink-0 h-13 px-4 rounded-xl bg-card border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
          aria-label="Open calendar"
        >
          📅
        </button>
        <input
          ref={nativeRef}
          type="date"
          value={value}
          max={new Date().toISOString().split("T")[0]}
          onChange={(e) => {
            onChange(e.target.value);
            setText(isoToText(e.target.value));
            setError(null);
          }}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>
      {error && <p className="text-xs text-primary mt-1">{error}</p>}
    </div>
  );
}

function isoToText(iso: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const [y, m, d] = iso.split("-");
  return `${m}/${d}/${y}`;
}
