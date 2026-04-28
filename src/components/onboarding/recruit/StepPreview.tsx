import { useMemo, useState } from "react";
import StepShell, { PrimaryCTA } from "./StepShell";
import { ArrowRight, Check, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export interface PreviewData {
  firstName: string;
  lastName: string;
  position: string;
  height: string;
  city: string;
  state: string;
  gradYear: string;
  gpa: string;
  avatarUrl: string | null;
  identifier: string; // username or user id
  completion: number;
}

export default function StepPreview({
  data,
  onFinish,
}: {
  data: PreviewData;
  onFinish: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const url = useMemo(() => `https://playitforward.app/p/${data.identifier}`, [data.identifier]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Profile link copied — paste it into your next coach email.");
      setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error("Couldn't copy. Long-press the link to copy manually.");
    }
  };

  return (
    <StepShell
      eyebrow="STEP 8 OF 8 · YOU'RE LIVE"
      title="Your profile is live."
      subtitle="This is what every college coach will see. Time to start reaching out."
      footer={
        <PrimaryCTA onClick={onFinish}>
          START REACHING OUT TO COACHES <ArrowRight className="h-4 w-4" />
        </PrimaryCTA>
      }
    >
      {/* Profile preview card */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="relative h-28 bg-gradient-to-br from-primary/40 via-primary/20 to-transparent" />
        <div className="px-5 pb-5 -mt-12">
          <div className="w-24 h-24 rounded-2xl border-4 border-card bg-muted overflow-hidden">
            {data.avatarUrl ? (
              <img src={data.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-heading text-muted-foreground">
                {(data.firstName[0] || "") + (data.lastName[0] || "")}
              </div>
            )}
          </div>
          <h2 className="mt-3 text-xl font-heading text-foreground">
            {data.firstName} {data.lastName}
          </h2>
          <p className="text-xs text-muted-foreground">
            {[data.position, data.height, `Class of ${data.gradYear}`].filter(Boolean).join(" · ")}
          </p>
          <p className="text-xs text-muted-foreground">
            {[data.city, data.state].filter(Boolean).join(", ")}
            {data.gpa ? ` · ${data.gpa} GPA` : ""}
          </p>
        </div>
      </div>

      {/* Completion */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-heading tracking-wider text-muted-foreground">PROFILE COMPLETION</span>
          <span className="text-sm font-heading text-foreground tabular-nums">{data.completion}%</span>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-700"
            style={{ width: `${data.completion}%`, boxShadow: "0 0 12px hsl(5 78% 55% / 0.6)" }}
          />
        </div>
        {data.completion < 100 && (
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            You can finish the rest from your profile — every field unlocks more coach views.
          </p>
        )}
      </div>

      {/* Shareable URL */}
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
        <p className="text-xs font-heading tracking-wider text-primary mb-2">YOUR PUBLIC PROFILE URL</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 truncate text-sm text-foreground font-mono bg-background/60 border border-border rounded-lg px-3 py-2.5">
            {url}
          </div>
          <button
            onClick={copy}
            className="h-11 w-11 rounded-lg bg-primary text-primary-foreground flex items-center justify-center glow-red shrink-0"
            aria-label="Copy link"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="h-11 w-11 rounded-lg bg-card border border-border flex items-center justify-center shrink-0"
            aria-label="Open profile"
          >
            <ExternalLink className="h-4 w-4 text-foreground" />
          </a>
        </div>
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
          Paste this into every coach email. It's your digital recruiting card.
        </p>
      </div>
    </StepShell>
  );
}
