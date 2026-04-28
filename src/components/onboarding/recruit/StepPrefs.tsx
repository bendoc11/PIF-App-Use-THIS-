import { useState } from "react";
import StepShell, { PrimaryCTA, FieldLabel } from "./StepShell";
import { ArrowRight } from "lucide-react";

export interface PrefsData {
  targetDivision: string;
  geoPreference: string;
  recruitingTimeline: string;
}

const DIVISIONS = ["D1", "D2", "D3", "JUCO", "NAIA", "Open to all"];
const GEO_SUGGESTED = "Open to all";
const GEO = [
  "Northeast",
  "Southeast",
  "Midwest",
  "South",
  "West",
  "Stay close to home",
];
const TIMELINES = [
  { id: "senior_urgent", label: "Senior — need offers now", sub: "Urgency mode. Every day matters." },
  { id: "junior_active", label: "Junior — actively recruiting", sub: "Prime year. Coaches are watching." },
  { id: "sophomore_planning", label: "Sophomore — planning ahead", sub: "Smart move. Build the foundation." },
  { id: "freshman_early", label: "Freshman or younger", sub: "You're way ahead of the game." },
];

export default function StepPrefs({
  initial,
  onNext,
}: {
  initial: Partial<PrefsData>;
  onNext: (d: PrefsData) => void;
}) {
  const [data, setData] = useState<PrefsData>({
    targetDivision: initial.targetDivision || "",
    geoPreference: initial.geoPreference || GEO_SUGGESTED,
    recruitingTimeline: initial.recruitingTimeline || "",
  });

  const selectedGeos = data.geoPreference
    ? data.geoPreference.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const toggleGeo = (g: string) => {
    let next: string[];
    if (g === GEO_SUGGESTED) {
      next = selectedGeos.includes(GEO_SUGGESTED) ? [] : [GEO_SUGGESTED];
    } else {
      const without = selectedGeos.filter((x) => x !== GEO_SUGGESTED);
      next = without.includes(g) ? without.filter((x) => x !== g) : [...without, g];
    }
    setData({ ...data, geoPreference: next.join(", ") });
  };

  const can = data.targetDivision && selectedGeos.length > 0 && data.recruitingTimeline;

  return (
    <StepShell
      eyebrow="STEP 6 OF 8 · PREFERENCES"
      title="Where do you want to play?"
      subtitle="We'll match you to the programs that fit."
      footer={
        <PrimaryCTA onClick={() => onNext(data)} disabled={!can}>
          NEXT <ArrowRight className="h-4 w-4" />
        </PrimaryCTA>
      }
    >
      <div>
        <FieldLabel>TARGET DIVISION</FieldLabel>
        <div className="grid grid-cols-3 gap-2">
          {DIVISIONS.map((d) => (
            <button
              key={d}
              onClick={() => setData({ ...data, targetDivision: d })}
              className={`py-3 rounded-xl text-sm font-heading transition-all border ${
                data.targetDivision === d
                  ? "bg-primary text-primary-foreground border-primary glow-red"
                  : "bg-card text-foreground border-border"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div>
        <FieldLabel>GEOGRAPHIC PREFERENCE · PICK ONE OR MORE</FieldLabel>
        <button
          onClick={() => toggleGeo(GEO_SUGGESTED)}
          className={`w-full mb-2 px-4 py-3 rounded-xl text-sm font-heading transition-all border flex items-center justify-between ${
            selectedGeos.includes(GEO_SUGGESTED)
              ? "bg-primary text-primary-foreground border-primary glow-red"
              : "bg-card text-foreground border-primary/40"
          }`}
        >
          <span>{GEO_SUGGESTED}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${selectedGeos.includes(GEO_SUGGESTED) ? "bg-primary-foreground/20" : "bg-primary/15 text-primary"}`}>
            SUGGESTED
          </span>
        </button>
        <div className="flex flex-wrap gap-2">
          {GEO.map((g) => {
            const active = selectedGeos.includes(g);
            return (
              <button
                key={g}
                onClick={() => toggleGeo(g)}
                className={`px-4 py-2.5 rounded-full text-sm transition-all border ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border"
                }`}
              >
                {g}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <FieldLabel>YOUR TIMELINE</FieldLabel>
        <div className="space-y-2">
          {TIMELINES.map((t) => {
            const active = data.recruitingTimeline === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setData({ ...data, recruitingTimeline: t.id })}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  active ? "border-primary bg-primary/10 glow-red" : "border-border bg-card"
                }`}
              >
                <p className={`font-heading text-sm ${active ? "text-primary" : "text-foreground"}`}>{t.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.sub}</p>
              </button>
            );
          })}
        </div>
      </div>
    </StepShell>
  );
}
