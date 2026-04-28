import { useState } from "react";
import { Mail, Lock, Loader2, ArrowRight, AlertTriangle } from "lucide-react";
import StepShell, { PrimaryCTA, SkipButton } from "./StepShell";
import { useGmailConnection } from "@/hooks/useGmailConnection";

interface Props {
  onConnected: () => void;
  onSkip: () => void;
}

export default function StepGmail({ onConnected, onSkip }: Props) {
  const { connected, loading, startConnect } = useGmailConnection();
  const [confirming, setConfirming] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // If we land on this step already connected (e.g. coming back), advance.
  if (connected && !loading) {
    setTimeout(onConnected, 0);
  }

  const handleConnect = async () => {
    setConnecting(true);
    await startConnect();
    // Browser redirects to Google — onConnected fires on return when status refresh sees it.
  };

  return (
    <StepShell
      eyebrow="STEP 8 OF 9 · GMAIL"
      title="One last thing — connect your Gmail."
      subtitle="Coaches open emails from real people. Your outreach goes out from your own Gmail address, which means higher open rates and more responses. We never store your password or send emails without your approval."
      footer={
        <>
          <PrimaryCTA onClick={handleConnect} disabled={connecting || loading}>
            {connecting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Opening Google…
              </>
            ) : (
              <>
                <Mail className="h-5 w-5" /> CONNECT GMAIL <ArrowRight className="h-4 w-4" />
              </>
            )}
          </PrimaryCTA>
          <SkipButton onClick={() => setConfirming(true)} label="Skip for now" />
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <Row icon={<Mail className="h-4 w-4" />} text="Emails sent from YOUR Gmail address" />
          <Row icon={<Lock className="h-4 w-4" />} text="We never see or store your password" />
          <Row icon={<ArrowRight className="h-4 w-4" />} text="Nothing sends without your approval" />
        </div>
        <p className="text-xs text-muted-foreground text-center px-2">
          Powered by Google Sign-In. Revoke access anytime from your Google account.
        </p>
      </div>

      {confirming && (
        <div
          className="fixed inset-0 z-50 bg-background/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-5"
          onClick={() => setConfirming(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-card border border-border rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-heading text-foreground leading-tight">
                  Skip Gmail for now?
                </h3>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  You won't be able to contact coaches until Gmail is connected. You can do
                  this anytime in Settings.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={() => {
                  setConfirming(false);
                  handleConnect();
                }}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-heading"
              >
                Connect Gmail instead
              </button>
              <button
                onClick={() => {
                  setConfirming(false);
                  onSkip();
                }}
                className="w-full h-12 rounded-xl border border-border text-muted-foreground font-heading"
              >
                Skip and remind me later
              </button>
            </div>
          </div>
        </div>
      )}
    </StepShell>
  );
}

function Row({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-foreground">
      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
        {icon}
      </div>
      <span>{text}</span>
    </div>
  );
}
