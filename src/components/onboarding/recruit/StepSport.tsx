import { useState } from "react";
import { motion } from "framer-motion";

type Sport = "mens_basketball" | "womens_basketball";

interface Props {
  initial?: Sport | null;
  onNext: (sport: Sport) => void;
}

function BasketballIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3v18" />
      <path d="M5.5 5.5c3 3 10 10 13 13" />
      <path d="M18.5 5.5c-3 3-10 10-13 13" />
    </svg>
  );
}

export default function StepSport({ initial, onNext }: Props) {
  const [selected, setSelected] = useState<Sport | null>(initial ?? null);

  const cardBase: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "20px 24px",
    borderRadius: 14,
    border: "1.5px solid #D2D2D7",
    background: "#FFFFFF",
    cursor: "pointer",
    transition: "background-color .15s, border-color .15s",
    width: "100%",
    textAlign: "left",
  };

  const cardSelected: React.CSSProperties = {
    borderColor: "#0071E3",
    background: "#E8F1FD",
  };

  const radioBase: React.CSSProperties = {
    width: 18,
    height: 18,
    borderRadius: "50%",
    border: "1.5px solid #D2D2D7",
    flexShrink: 0,
    position: "relative",
  };

  const radioSelected: React.CSSProperties = {
    borderColor: "#0071E3",
  };

  const renderCard = (value: Sport, label: string) => {
    const isSel = selected === value;
    return (
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => setSelected(value)}
        style={{ ...cardBase, ...(isSel ? cardSelected : {}) }}
        type="button"
      >
        <BasketballIcon />
        <span style={{ flex: 1, fontSize: 16, fontWeight: 600, color: "#1D1D1F" }}>{label}</span>
        <span style={{ ...radioBase, ...(isSel ? radioSelected : {}) }}>
          {isSel && (
            <span
              style={{
                position: "absolute",
                inset: 3,
                borderRadius: "50%",
                background: "#0071E3",
              }}
            />
          )}
        </span>
      </motion.button>
    );
  };

  const disabled = !selected;

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#F5F5F7",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "-apple-system, 'SF Pro Text', BlinkMacSystemFont, sans-serif",
      }}
    >
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 20,
          maxWidth: 420,
          width: "100%",
          padding: 36,
          boxShadow: "0 10px 40px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              fontFamily: "inherit",
              fontWeight: 800,
              fontSize: 18,
              letterSpacing: "0.06em",
              color: "#0071E3",
              textTransform: "uppercase",
            }}
          >
            Play it Forward
          </div>
        </div>

        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "#1D1D1F",
            letterSpacing: "-0.02em",
            textAlign: "center",
            margin: "0 0 24px",
          }}
        >
          I play —
        </h1>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {renderCard("mens_basketball", "Men's Basketball")}
          {renderCard("womens_basketball", "Women's Basketball")}
        </div>

        <button
          onClick={() => selected && onNext(selected)}
          disabled={disabled}
          style={{
            marginTop: 24,
            width: "100%",
            background: "#0071E3",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 980,
            fontSize: 15,
            fontWeight: 600,
            padding: 14,
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.4 : 1,
            transition: "opacity .15s",
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
