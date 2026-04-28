import { useState } from "react";
import StepShell, { PrimaryCTA, SkipButton, FieldLabel, TextInput } from "./StepShell";
import { ArrowRight, Film, Zap } from "lucide-react";

export default function StepFilm({
  initial,
  onNext,
  onSkip,
}: {
  initial: string;
  onNext: (url: string) => void;
  onSkip: () => void;
}) {
  const [url, setUrl] = useState(initial || "");
  const ok = /^https?:\/\/.+\..+/i.test(url.trim());

  return (
    <StepShell
      eyebrow="STEP 7 OF 8 · FILM"
      title="Your film gets you recruited."
      subtitle="Add it now. The best moment in your onboarding."
      footer={
        <>
          <PrimaryCTA onClick={() => ok && onNext(url.trim())} disabled={!ok}>
            ADD MY FILM <ArrowRight className="h-4 w-4" />
          </PrimaryCTA>
          <SkipButton onClick={onSkip} label="Skip — Athletes with film get 3× more coach responses" />
        </>
      }
    >
      <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-heading text-foreground">3× MORE REPLIES</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Coaches scan film in the first 30 seconds of opening your email. No film = no response.
            </p>
          </div>
        </div>
      </div>

      <div>
        <FieldLabel>HIGHLIGHT FILM URL</FieldLabel>
        <div className="relative">
          <Film className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <TextInput
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="YouTube, Hudl, or Vimeo link"
            className="pl-11"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
          Paste a public YouTube, Hudl, or Vimeo URL. You can add or replace this anytime from your profile.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { brand: "YouTube" },
          { brand: "Hudl" },
          { brand: "Vimeo" },
        ].map((p) => (
          <div key={p.brand} className="py-3 rounded-xl bg-card border border-border text-xs font-heading text-muted-foreground">
            {p.brand}
          </div>
        ))}
      </div>
    </StepShell>
  );
}
