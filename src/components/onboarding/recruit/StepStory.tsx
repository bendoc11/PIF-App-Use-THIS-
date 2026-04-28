import { useState } from "react";
import StepShell, { PrimaryCTA } from "./StepShell";
import { ArrowRight, Mail } from "lucide-react";

const PLACEHOLDER =
  "I am a 6'2 point guard from Richmond, Virginia known for my court vision and leadership. I averaged 18 points and 7 assists last season and have a 3.8 GPA. I am looking for a program where I can compete at a high level and pursue a degree in business.";

export default function StepStory({
  initial,
  onNext,
}: {
  initial: string;
  onNext: (bio: string) => void;
}) {
  const [bio, setBio] = useState(initial || "");
  const trimmed = bio.trim();
  const can = trimmed.length >= 40;

  return (
    <StepShell
      eyebrow="STEP 4 OF 8 · YOUR STORY"
      title="This is what coaches read first."
      subtitle="2–3 sentences. Who you are as a player and a person. This goes in every email."
      footer={
        <PrimaryCTA onClick={() => onNext(trimmed)} disabled={!can}>
          NEXT <ArrowRight className="h-4 w-4" />
        </PrimaryCTA>
      }
    >
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 flex items-start gap-2">
        <Mail className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <p className="text-xs text-foreground/80 leading-relaxed">
          This bio is sent directly to college coaches. Make it count.
        </p>
      </div>

      <div>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, 600))}
          placeholder={PLACEHOLDER}
          rows={9}
          className="w-full p-4 rounded-xl bg-card border border-border text-foreground text-base placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none leading-relaxed"
        />
        <div className="flex justify-between mt-2 text-xs">
          <span className={can ? "text-muted-foreground" : "text-primary"}>
            {can ? "Looking good." : `${Math.max(0, 40 - trimmed.length)} more characters`}
          </span>
          <span className="text-muted-foreground tabular-nums">{bio.length}/600</span>
        </div>
      </div>
    </StepShell>
  );
}
