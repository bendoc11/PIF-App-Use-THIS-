import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { RepliesPanel } from "@/components/recruit/RepliesPanel";
import { isPaidSubscriber, STRIPE_CHECKOUT_URL } from "@/lib/subscription";
import { useSearchParams } from "react-router-dom";

interface LockedReply {
  id: string;
  coach_name: string | null;
  school_name: string | null;
  received_at: string;
}

function LockedRepliesView({ replies }: { replies: LockedReply[] }) {
  const hasReplies = replies.length > 0;
  const headline = !hasReplies
    ? "YOUR OUTREACH IS IN FRONT OF COLLEGE COACHES."
    : replies.length === 1
      ? "A COACH HAS RESPONDED TO YOUR OUTREACH."
      : "COACHES HAVE RESPONDED TO YOUR OUTREACH.";
  const subtext = !hasReplies
    ? "The moment a coach writes back, their reply lands here. Subscribe so you never miss it."
    : "Subscribe to read and respond before they move on.";

  // Always show 3 blurred ghost cards. If we have real replies, surface coach/school
  // on the first N cards so the user sees real proof — but message bodies stay blurred.
  const cards = Array.from({ length: Math.max(3, replies.length) }).map((_, i) => replies[i] ?? null);

  return (
    <div className="min-h-screen px-4 py-10" style={{ backgroundColor: "#080D14" }}>
      <div className="max-w-2xl mx-auto text-center">
        <div className="flex justify-center mb-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: "rgba(232,57,29,0.15)" }}
          >
            <Lock className="w-8 h-8" style={{ color: "#E8391D" }} />
          </div>
        </div>

        <h1 className="font-display text-3xl sm:text-4xl text-white tracking-tight leading-tight mb-3">
          {headline}
        </h1>
        <p className="text-base mb-8" style={{ color: "#A0ADB8" }}>
          {subtext}
        </p>

        <div className="space-y-3 mb-10 text-left">
          {cards.map((r, i) => (
            <div
              key={r?.id ?? i}
              className="rounded-xl border p-4"
              style={{
                background: "rgba(255,255,255,0.04)",
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              <div className="flex items-center justify-between mb-1.5">
                {r ? (
                  <p className="text-white font-semibold text-base leading-tight">
                    {r.coach_name || "College coach"}
                  </p>
                ) : (
                  <div className="h-4 w-32 rounded" style={{ background: "rgba(255,255,255,0.08)" }} />
                )}
                <Lock className="w-4 h-4 shrink-0" style={{ color: "#E8391D" }} />
              </div>
              {r ? (
                <p className="text-sm mb-3" style={{ color: "#A0ADB8" }}>
                  {r.school_name || "—"}
                </p>
              ) : (
                <div className="h-3 w-48 rounded mb-3" style={{ background: "rgba(255,255,255,0.06)" }} />
              )}
              <div
                className="h-14 rounded"
                style={{ background: "rgba(255,255,255,0.06)", filter: "blur(6px)" }}
                aria-hidden
              >
                <p className="text-sm text-white/40 px-3 py-2">
                  Hi, thanks for reaching out — I really appreciate you sharing your film and stats…
                </p>
              </div>
            </div>
          ))}
        </div>

        <a
          href={STRIPE_CHECKOUT_URL}
          className="block w-full max-w-sm mx-auto h-14 rounded-md flex items-center justify-center text-base font-heading tracking-wider text-white"
          style={{ backgroundColor: "#E8391D" }}
        >
          UNLOCK MY REPLIES — $19.99/MONTH
        </a>
        <p className="text-xs mt-3" style={{ color: "#A0ADB8" }}>
          7-day free trial. Then $19.99/month. Cancel anytime.
        </p>
      </div>
    </div>
  );
}

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
          <span className="font-heading text-3xl text-white">PIF</span>
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
  const { user, profile, hasActiveSubscription } = useAuth();
  const paid = isPaidSubscriber(profile, hasActiveSubscription);
  const [lockedList, setLockedList] = useState<LockedReply[]>([]);
  const [params, setParams] = useSearchParams();
  const [showCelebration, setShowCelebration] = useState(params.get("celebrate") === "1");

  useEffect(() => {
    if (paid || !user) return;
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("coach_replies")
        .select("id, coach_name, school_name, received_at")
        .eq("athlete_id", user.id)
        .order("received_at", { ascending: false });
      if (!cancelled) setLockedList((data as LockedReply[]) ?? []);
    };
    load();
    const channel = supabase
      .channel(`coach_replies_locked_${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "coach_replies", filter: `athlete_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user?.id, paid]);

  if (!paid) {
    return (
      <AppLayout>
        <LockedRepliesView replies={lockedList} />
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
          Every reply lands here in real time. Click any reply to read and respond.
        </p>
        <RepliesPanel />
      </div>
    </AppLayout>
  );
}
