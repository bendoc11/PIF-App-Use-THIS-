import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { RepliesPanel } from "@/components/recruit/RepliesPanel";
import { isPaidSubscriber } from "@/lib/subscription";
import { useSearchParams } from "react-router-dom";

function CelebrationOverlay({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div
      className="fixed inset-0 z-[9000] flex items-center justify-center pointer-events-none animate-fade-in"
      style={{ background: "rgba(8,13,20,0.96)" }}
    >
      <div className="text-center px-6">
        <div
          className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
          style={{ backgroundColor: "#E8391D" }}
        >
          <span className="font-heading text-3xl text-white">OFF</span>
        </div>
        <h1 className="font-display text-3xl sm:text-5xl text-white tracking-tight mb-3">
          You are now subscribed.
        </h1>
        <p className="text-base sm:text-lg" style={{ color: "#A0ADB8" }}>
          Here are your coach replies.
        </p>
      </div>
    </div>
  );
}

export default function Replies() {
  const { profile, hasActiveSubscription } = useAuth();
  const paid = isPaidSubscriber(profile, hasActiveSubscription);
  const [params, setParams] = useSearchParams();
  const [showCelebration, setShowCelebration] = useState(params.get("celebrate") === "1");

  if (!paid) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto px-4 py-6">
          <h1 className="font-display text-3xl text-foreground tracking-tight mb-1">Coach Replies</h1>
          <p className="text-sm text-muted-foreground mb-5">
            Your recruiting inbox. Every coach response in one place.
          </p>
          <RepliesPanel locked />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {showCelebration && (
        <CelebrationOverlay
          onDone={() => {
            setShowCelebration(false);
            params.delete("celebrate");
            setParams(params, { replace: true });
          }}
        />
      )}
      <div className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="font-display text-3xl text-foreground tracking-tight mb-1">Coach Replies</h1>
        <p className="text-sm text-muted-foreground mb-5">
          Your recruiting inbox. Every coach response in one place.
        </p>
        <RepliesPanel />
      </div>
    </AppLayout>
  );
}
