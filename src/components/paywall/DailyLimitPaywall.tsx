import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { STRIPE_CHECKOUT_URL } from "@/lib/subscription";

interface Props {
  /** Title shown above the headline. Defaults to the daily-limit copy. */
  topLabel?: string;
  headline?: string;
  subheadline?: string;
  ctaLabel?: string;
}

/**
 * Full-screen, non-dismissable subscription paywall used when a free user hits
 * the daily 30-coach limit. The only ways past it are subscribing or restoring
 * an existing subscription.
 */
export function DailyLimitPaywall({
  topLabel = "You have reached your daily limit of 30 coach contacts.",
  headline = "Coaches are receiving your messages. Are any of them responding?",
  subheadline = "Subscribe to unlock unlimited daily sends and see every coach reply in real time.",
  ctaLabel = "Unlock Unlimited Sends — Start Free Trial",
}: Props) {
  const { refreshSubscription } = useAuth();
  const [checking, setChecking] = useState(false);

  const handleStartTrial = () => {
    window.location.href = STRIPE_CHECKOUT_URL;
  };

  const handleRestore = async () => {
    setChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      await refreshSubscription();
      if (data?.subscribed) {
        toast.success("Subscription found — welcome in!");
        window.location.reload();
      } else {
        toast.error("No active subscription found on this account.");
      }
    } catch (e: any) {
      toast.error(e?.message || "Could not verify subscription");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto flex items-center justify-center px-6 py-10"
      style={{ backgroundColor: "#080D14" }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full opacity-[0.07] pointer-events-none"
        style={{ background: "radial-gradient(circle, #E8391D 0%, transparent 70%)" }}
      />

      <div className="relative z-10 w-full max-w-md mx-auto text-center">
        <div className="flex justify-center mb-6">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "#E8391D" }}
          >
            <span className="font-heading text-xl text-white">PIF</span>
          </div>
        </div>

        <p
          className="text-xs uppercase tracking-wider mb-4"
          style={{ color: "#E8391D", fontWeight: 600 }}
        >
          {topLabel}
        </p>

        <h1 className="font-display text-3xl sm:text-4xl text-white tracking-tight leading-tight mb-4">
          {headline}
        </h1>
        <p className="text-base leading-relaxed mb-8" style={{ color: "#A0ADB8" }}>
          {subheadline}
        </p>

        <ul className="space-y-3 mb-8 text-left">
          {[
            "Unlimited outreach to every college coach in the country",
            "See every coach reply the moment it arrives",
            "Reply to coaches without leaving the platform",
          ].map((line) => (
            <li key={line} className="flex items-start gap-3">
              <div
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5"
                style={{ backgroundColor: "rgba(232,57,29,0.15)" }}
              >
                <Check className="w-3.5 h-3.5" style={{ color: "#E8391D" }} strokeWidth={3} />
              </div>
              <span className="text-sm sm:text-base text-white/90 leading-relaxed">{line}</span>
            </li>
          ))}
        </ul>

        <div className="mb-6">
          <div
            className="font-display text-5xl tracking-tight"
            style={{ color: "#E8391D" }}
          >
            $29<span className="text-2xl text-white">/month</span>
          </div>
          <p className="text-xs mt-2" style={{ color: "#A0ADB8" }}>
            7-day free trial. Then $29/month. Cancel anytime.
          </p>
        </div>

        <Button
          onClick={handleStartTrial}
          className="w-full h-14 text-base font-heading tracking-wider text-white border-0 mb-4"
          style={{ backgroundColor: "#E8391D" }}
        >
          {ctaLabel}
        </Button>

        <button
          onClick={handleRestore}
          disabled={checking}
          className="text-xs hover:underline inline-flex items-center gap-1.5 disabled:opacity-50"
          style={{ color: "#A0ADB8" }}
        >
          {checking && <Loader2 className="w-3 h-3 animate-spin" />}
          Already subscribed? Click here to restore access.
        </button>
      </div>
    </div>
  );
}
