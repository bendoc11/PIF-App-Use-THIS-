import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CHECKOUT_URL =
  "https://pay.philadelphiabasketballschool.com/b/cNi28q0NS5hBa3Z7Ud9R60S";

/**
 * Full-screen, non-dismissable subscription overlay.
 * Rendered by AuthGuard whenever a signed-in user lacks an active subscription.
 */
export default function PaywallOverlay() {
  const { refreshProfile } = useAuth();
  const [checking, setChecking] = useState(false);

  const handleStartTrial = () => {
    window.location.href = CHECKOUT_URL;
  };

  const handleRestore = async () => {
    setChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      await refreshProfile();
      if (data?.subscribed) {
        toast.success("Subscription found — welcome in!");
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
    >
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full opacity-[0.07] pointer-events-none"
        style={{ background: "radial-gradient(circle, #3B82F6 0%, transparent 70%)" }}
      />

      <div className="relative z-10 w-full max-w-md mx-auto text-center">
        <div className="flex justify-center mb-8">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "#E8391D" }}
          >
            <span className="font-heading text-xl text-white">PIF</span>
          </div>
        </div>

        <h1 className="font-display text-5xl sm:text-6xl text-white tracking-tight leading-none mb-4">
          GET RECRUITED.
        </h1>
        <p className="text-base sm:text-lg leading-relaxed mb-8" style={{ color: "#A0ADB8" }}>
          Contact every college coach in the country. Build your profile. Track every response and offer.
        </p>

        <ul className="space-y-3 mb-10 text-left">
          {[
            "1,852+ college programs — every D1, D2, D3, JUCO and NAIA coach",
            "Send recruiting emails directly from your own Gmail",
            "Track responses, offers, visits, and your full recruiting pipeline",
          ].map((line, i) => (
            <li key={i} className="flex items-start gap-3">
              <div
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5"
                style={{ backgroundColor: "rgba(59,130,246,0.15)" }}
              >
                <Check className="w-3.5 h-3.5" style={{ color: "#3B82F6" }} strokeWidth={3} />
              </div>
              <span className="text-sm sm:text-base text-white/90 leading-relaxed">{line}</span>
            </li>
          ))}
        </ul>

        <div className="mb-8">
          <div className="font-display text-5xl text-white tracking-tight">
            $50 <span className="text-2xl" style={{ color: "#A0ADB8" }}>/ month</span>
          </div>
          <p className="text-sm mt-2" style={{ color: "#A0ADB8" }}>
            Cancel anytime.
          </p>
        </div>

        <Button
          onClick={handleStartTrial}
          className="w-full h-14 text-base font-heading tracking-wider text-white border-0 mb-4"
          style={{ backgroundColor: "#E8391D" }}
        >
          SUBSCRIBE NOW
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
