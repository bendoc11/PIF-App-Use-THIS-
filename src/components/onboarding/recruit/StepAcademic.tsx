import { useState } from "react";
import StepShell, { PrimaryCTA, FieldLabel, TextInput } from "./StepShell";
import { ArrowRight } from "lucide-react";

export interface AcademicData {
  highSchool: string;
  gpa: string;
  satScore: string;
  actScore: string;
  intendedMajor: string;
}

export default function StepAcademic({
  initial,
  onNext,
}: {
  initial: Partial<AcademicData>;
  onNext: (d: AcademicData) => void;
}) {
  const [data, setData] = useState<AcademicData>({
    highSchool: initial.highSchool || "",
    gpa: initial.gpa || "",
    satScore: initial.satScore || "",
    actScore: initial.actScore || "",
    intendedMajor: initial.intendedMajor || "",
  });
  const [showTests, setShowTests] = useState(!!(initial.satScore || initial.actScore));

  const gpaNum = Number(data.gpa);
  const gpaOk = !data.gpa || (gpaNum >= 0 && gpaNum <= 5);
  const can = data.highSchool.trim() && data.gpa && gpaOk && data.intendedMajor.trim();

  return (
    <StepShell
      eyebrow="STEP 3 OF 8 · ACADEMICS"
      title="Coaches recruit students first."
      subtitle="Strong grades open doors at every level. Let's lock yours in."
      footer={
        <PrimaryCTA onClick={() => onNext(data)} disabled={!can}>
          NEXT <ArrowRight className="h-4 w-4" />
        </PrimaryCTA>
      }
    >
      <div>
        <FieldLabel>HIGH SCHOOL NAME</FieldLabel>
        <TextInput
          value={data.highSchool}
          onChange={(e) => setData({ ...data, highSchool: e.target.value })}
          placeholder="e.g. Lincoln High School"
          maxLength={120}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>GPA</FieldLabel>
          <TextInput
            inputMode="decimal"
            value={data.gpa}
            onChange={(e) => setData({ ...data, gpa: e.target.value.replace(/[^0-9.]/g, "").slice(0, 4) })}
            placeholder="3.8"
          />
          {!gpaOk && <p className="text-xs text-primary mt-1">GPA must be between 0 and 5.0</p>}
        </div>
        <div>
          <FieldLabel>INTENDED MAJOR</FieldLabel>
          <TextInput
            value={data.intendedMajor}
            onChange={(e) => setData({ ...data, intendedMajor: e.target.value })}
            placeholder="Business, Undecided…"
            maxLength={80}
          />
        </div>
      </div>

      {showTests ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>SAT (OPTIONAL)</FieldLabel>
              <TextInput
                inputMode="numeric"
                value={data.satScore}
                onChange={(e) => setData({ ...data, satScore: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                placeholder="1200"
              />
            </div>
            <div>
              <FieldLabel>ACT (OPTIONAL)</FieldLabel>
              <TextInput
                inputMode="numeric"
                value={data.actScore}
                onChange={(e) => setData({ ...data, actScore: e.target.value.replace(/\D/g, "").slice(0, 2) })}
                placeholder="26"
              />
            </div>
          </div>
          <button
            onClick={() => {
              setShowTests(false);
              setData({ ...data, satScore: "", actScore: "" });
            }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Skip test scores for now
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowTests(true)}
          className="w-full py-3 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
        >
          + Add SAT or ACT score (optional)
        </button>
      )}
    </StepShell>
  );
}
