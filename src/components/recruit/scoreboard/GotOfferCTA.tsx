interface Props {
  onLog: () => void;
}

export function GotOfferCTA({ onLog }: Props) {
  return (
    <div
      className="rounded-[14px] p-4"
      style={{ background: "#FFF8F5", border: "1.5px solid #FDDECE" }}
    >
      <div className="text-2xl mb-1">🏅</div>
      <div className="rs-display text-[18px]" style={{ color: "var(--brand-orange)" }}>
        Got an offer?
      </div>
      <p className="text-[12px] mb-3" style={{ color: "var(--brand-muted)" }}>
        Log it to move up your level
      </p>
      <button onClick={onLog} className="rs-btn-primary w-full py-2 text-[13px]">
        + Log an offer
      </button>
    </div>
  );
}
