import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import OnboardingBackground from "@/components/onboarding/OnboardingBackground";

const GOAL_QUOTES: Record<string, string> = {
  "Make the Team": "Players who train 4+ days a week make their team 73% more often.",
  "Earn a Starting Spot": "Starters don't get chosen — they make it impossible to sit them.",
  "Play at the Next Level (D1/D2/D3/JUCO)": "The average D1 player trained consistently for 3+ years before their offer.",
  "Play Professionally": "Elite players don't wait for motivation. They train on a system.",
  "Improve My Overall Game": "Consistency beats intensity. Every single time.",
};

export default function OnboardingResults() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setProfileData(data));
  }, [user]);

  const handleCheckout = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const checkoutPromise = supabase.functions.invoke("create-checkout", {
        body: { email: authUser?.email },
      });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out")), 10000)
      );
      const { data, error } = await Promise.race([checkoutPromise, timeoutPromise]) as any;
      if (error) throw error;
      if (data?.url) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          localStorage.setItem("pif_pre_checkout_session", JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          }));
        }
        localStorage.setItem("pif_post_checkout", JSON.stringify({
          userId: authUser?.id,
          onboardingCompleted: true,
          returnTime: Date.now(),
        }));
        window.location.href = data.url;
        return;
      }
      throw new Error("No checkout URL returned");
    } catch (err: any) {
      toast.error(err.message || "Could not start checkout");
      setErrorMsg("Something went wrong — tap to try again");
      setLoading(false);
    }
  };

  const p = profileData;
  const firstName = p?.first_name || "Player";
  const position = p?.position || "—";
  const height = p?.height || "—";
  const primaryGoal = p?.primary_goal || "Improve My Overall Game";
  const weaknesses: string[] = p?.weaknesses || [];
  const trainingDays = p?.training_days_per_week;
  const trainingHours = p?.training_hours_per_session;
  const focusArea = weaknesses.length > 0 ? weaknesses.slice(0, 2).join(" & ") : "Overall Development";
  const scheduleText = trainingDays && trainingHours ? `${trainingDays} days/week · ${trainingHours}` : "—";
  const quote = GOAL_QUOTES[primaryGoal] || GOAL_QUOTES["Improve My Overall Game"];

  return (
    <div className="relative min-h-[100dvh]">
      <OnboardingBackground />
      <div className="relative z-10 min-h-[100dvh] flex flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md w-full space-y-8"
        >
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl md:text-4xl font-heading text-foreground leading-tight">
              YOUR PLAYER PROFILE IS READY, {firstName.toUpperCase()}.
            </h1>
            <p className="text-sm text-muted-foreground">Here's what we built for you.</p>
          </div>

          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="rounded-2xl border border-border bg-card/60 backdrop-blur-md overflow-hidden"
          >
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-heading tracking-wider text-muted-foreground">POSITION & HEIGHT</p>
                  <p className="text-foreground font-medium text-lg">{position} · {height}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-heading tracking-wider text-muted-foreground">PRIMARY GOAL</p>
                <p className="text-primary font-heading text-lg">{primaryGoal.toUpperCase()}</p>
              </div>

              <div>
                <p className="text-xs font-heading tracking-wider text-muted-foreground">FOCUS AREA</p>
                <p className="text-foreground font-medium">{focusArea}</p>
              </div>

              <div>
                <p className="text-xs font-heading tracking-wider text-muted-foreground">TRAINING COMMITMENT</p>
                <p className="text-foreground font-medium">{scheduleText}</p>
              </div>
            </div>
          </motion.div>

          {/* Dynamic quote */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-sm text-center text-muted-foreground italic leading-relaxed px-2"
          >
            "{quote}"
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="space-y-3 text-center"
          >
            <p className="text-xs font-heading tracking-[0.2em] text-muted-foreground">UNLOCK YOUR PLAN</p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleCheckout}
              disabled={loading}
              className="w-full h-14 rounded-xl bg-primary text-primary-foreground btn-cta text-base glow-red disabled:opacity-70"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </span>
              ) : errorMsg ? (
                errorMsg
              ) : (
                "START FREE TRIAL →"
              )}
            </motion.button>
            <p className="text-xs text-muted-foreground">Free for 7 days, then $12.99/month. Cancel anytime.</p>
            <p className="text-[10px] text-muted-foreground/60">Join 2,400+ athletes already training</p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
