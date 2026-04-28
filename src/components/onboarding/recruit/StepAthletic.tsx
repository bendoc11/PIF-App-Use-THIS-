import { useState } from "react";
import StepShell, { PrimaryCTA, FieldLabel, TextInput } from "./StepShell";
import { ArrowRight } from "lucide-react";

export interface AthleticData {
  positions: string[];
  jerseyNumber: string;
  feet: string;
  inches: string;
  weight: string;
  dominantHand: string;
}

const POSITIONS = [
  { label: "PG", full: "Point Guard" },
  { label: "SG", full: "Shooting Guard" },
  { label: "SF", full: "Small Forward" },
  { label: "PF", full: "Power Forward" },
  { label: "C", full: "Center" },
];
const FEET = [4, 5, 6, 7];
const INCHES = Array.from({ length: 12 }, (_, i) => i);
const HANDS = ["Right", "Left", "Both"];

export default function StepAthletic({
  initial,
  onNext,
}: {
  initial: Partial<AthleticData>;
  onNext: (d: AthleticData) => void;
}) {
  const [data, setData] = useState<AthleticData>({
    positions: initial.positions || [],
    jerseyNumber: initial.jerseyNumber || "",
    feet: initial.feet || "",
    inches: initial.inches || "",
    weight: initial.weight || "",
    dominantHand: initial.dominantHand || "",
  });

  const togglePos = (p: string) => {
    setData((d) => ({
      ...d,
      positions: d.positions.includes(p) ? d.positions.filter((x) => x !== p) : [...d.positions, p].slice(0, 3),
    }));
  };

  const can = data.positions.length > 0 && data.feet && data.inches !== "" && data.weight && data.dominantHand;

  return (
    <StepShell
      eyebrow="STEP 2 OF 8 · ATHLETIC"
      title="Tell coaches your game."
      subtitle="Sport: Basketball. Pick everything that applies — coaches filter on this."
      footer={
        <PrimaryCTA onClick={() => onNext(data)} disabled={!can}>
          NEXT <ArrowRight className="h-4 w-4" />
        </PrimaryCTA>
      }
    >
      <div>
        <FieldLabel>POSITION(S) — TAP ALL THAT APPLY</FieldLabel>
        <div className="flex gap-2">
          {POSITIONS.map((p) => (
            <button
              key={p.label}
              onClick={() => togglePos(p.full)}
              className={`flex-1 py-3.5 rounded-xl text-sm font-heading transition-all border ${
                data.positions.includes(p.full)
                  ? "bg-primary text-primary-foreground border-primary glow-red"
                  : "bg-card text-foreground border-border"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>JERSEY #</FieldLabel>
          <TextInput
            inputMode="numeric"
            value={data.jerseyNumber}
            onChange={(e) => setData({ ...data, jerseyNumber: e.target.value.replace(/\D/g, "").slice(0, 3) })}
            placeholder="e.g. 23"
          />
        </div>
        <div>
          <FieldLabel>WEIGHT (LBS)</FieldLabel>
          <TextInput
            inputMode="numeric"
            value={data.weight}
            onChange={(e) => setData({ ...data, weight: e.target.value.replace(/\D/g, "").slice(0, 3) })}
            placeholder="e.g. 180"
          />
        </div>
      </div>

      <div>
        <FieldLabel>HEIGHT</FieldLabel>
        <div className="space-y-2">
          <div className="flex gap-2">
            {FEET.map((f) => (
              <button
                key={f}
                onClick={() => setData({ ...data, feet: String(f) })}
                className={`flex-1 py-3 rounded-xl text-sm font-heading transition-all border ${
                  data.feet === String(f)
                    ? "bg-primary text-primary-foreground border-primary glow-red"
                    : "bg-card text-foreground border-border"
                }`}
              >
                {f} ft
              </button>
            ))}
          </div>
          <div className="grid grid-cols-6 gap-2">
            {INCHES.map((i) => (
              <button
                key={i}
                onClick={() => setData({ ...data, inches: String(i) })}
                className={`py-3 rounded-xl text-sm font-heading transition-all border ${
                  data.inches === String(i)
                    ? "bg-primary text-primary-foreground border-primary glow-red"
                    : "bg-card text-foreground border-border"
                }`}
              >
                {i}"
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <FieldLabel>DOMINANT HAND</FieldLabel>
        <div className="grid grid-cols-3 gap-2">
          {HANDS.map((h) => (
            <button
              key={h}
              onClick={() => setData({ ...data, dominantHand: h })}
              className={`py-3.5 rounded-xl text-sm font-heading transition-all border ${
                data.dominantHand === h
                  ? "bg-primary text-primary-foreground border-primary glow-red"
                  : "bg-card text-foreground border-border"
              }`}
            >
              {h}
            </button>
          ))}
        </div>
      </div>
    </StepShell>
  );
}
