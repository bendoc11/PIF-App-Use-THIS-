import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const CHECKOUT_URL =
  "https://subscribe.playitforward.app/b/4gM00i4Wzc0g7w0buvcEw00";

interface Props {
  open: boolean;
  onClose?: () => void;
  onSubscribed?: () => void;
}

export function PaywallModal({ open, onSubscribed }: Props) {
  const { refreshSubscription, hasActiveSubscription } = useAuth();
  const [checking, setChecking] = useState(false);

  if (!open) return null;

  const handleStart = () => {
    window.location.href = CHECKOUT_URL;
  };

  const handleRestore = async () => {
    setChecking(true);
    try {
      await refreshSubscription();
      // small delay to let state update
      await new Promise((r) => setTimeout(r, 200));
      if (hasActiveSubscription) {
        toast.success("Subscription found — sending your email…");
        onSubscribed?.();
      } else {
        toast.error("No active subscription found on this account.");
      }
    } catch (e: any) {
      toast.error(e?.message || "Could not verify subscription");
    } finally {
      setChecking(false);
    }
  };

  const bullets = [
    "Send to every college coach in the country — D1 through NAIA",
    "Emails sent from your own personal alias address",
    "See when coaches reply — directly in your dashboard",
    "Full recruiting pipeline — track every conversation",
    "Reply to coaches without leaving the platform",
  ];

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

        <h1 className="font-display text-4xl sm:text-5xl text-white tracking-tight leading-tight mb-4">
          You are one send away.
        </h1>
        <p className="text-base leading-relaxed mb-8" style={{ color: "#A0ADB8" }}>
          Your email is written. The coach is waiting. Start your free trial to send it now and reach every college program in the country.
        </p>

        <ul className="space-y-3 mb-8 text-left">
          {bullets.map((line, i) => (
            <li key={i} className="flex items-start gap-3">
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
          <div className="font-display text-5xl tracking-tight" style={{ color: "#E8391D" }}>
            $50 <span className="text-2xl" style={{ color: "#A0ADB8" }}>/ month</span>
          </div>
          <p className="text-xs mt-2" style={{ color: "#A0ADB8" }}>
            7-day free trial included. Then $50/month. Cancel anytime.
          </p>
        </div>

        <button
          onClick={handleStart}
          className="w-full h-14 text-base font-heading tracking-wider text-white border-0 rounded-md mb-3"
          style={{ backgroundColor: "#E8391D" }}
        >
          START MY FREE WEEK — SEND MY EMAIL
        </button>

        <p className="text-[11px] leading-relaxed mb-4" style={{ color: "#A0ADB8" }}>
          You will not be charged until day 8. Cancel anytime before then. Your email will be sent automatically once your trial is activated.
        </p>

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
