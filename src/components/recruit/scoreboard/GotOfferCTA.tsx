interface Props {
  onLog: () => void;
}

function MedalIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M7 3 L9 9" />
      <path d="M17 3 L15 9" />
      <circle cx="12" cy="15" r="6" />
      <path d="M12 12 v6" />
    </svg>
  );
}

export function GotOfferCTA({ onLog }: Props) {
  return (
    <div
      style={{
        background: "var(--bg-page)",
        border: "1px solid var(--border)",
        borderLeft: "3px solid #4ade80",
        borderRadius: 12,
        padding: "16px 18px",
      }}
    >
      <div style={{ color: "#4ade80", marginBottom: 8 }}>
        <MedalIcon />
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--text-primary)",
          letterSpacing: "-0.01em",
        }}
      >
        Got an offer?
      </div>
      <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2, marginBottom: 12 }}>
        Log it to move up your level
      </p>
      <button
        onClick={onLog}
        className="w-full"
        style={{
          padding: "8px 16px",
          fontSize: 13,
          fontWeight: 600,
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          background: "#0d2e1a",
          color: "#4ade80",
          border: "1px solid rgba(74,222,128,0.25)",
          borderRadius: 8,
          cursor: "pointer",
        }}
      >
        Log an offer
      </button>
    </div>
  );
}
