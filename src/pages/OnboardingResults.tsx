import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { MapPin, Target, Dumbbell, Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function OnboardingResults() {
  const navigate = useNavigate();
  const { user, profile, subscription } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfileData(data);
    };
    fetchProfile();
  }, [user]);

  // No auto-redirect — let user see their results and click checkout

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
        // Save session & state before external redirect to Stripe
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

  const p = profileData as any;
  const firstName = p?.first_name || "Player";
  const position = p?.position || "—";
  const height = p?.height || "—";
  const primaryGoal = p?.primary_goal || "Improve My Overall Game";
  const weaknesses: string[] = p?.weaknesses || [];
  const trainingDays = p?.training_days_per_week;
  const trainingHours = p?.training_hours_per_session;

  const focusArea = weaknesses.length > 0
    ? weaknesses.slice(0, 2).join(" & ")
    : "Overall Development";

  const scheduleText = trainingDays && trainingHours
    ? `${trainingDays} days/week · ${trainingHours} per session`
    : "—";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-6"
      >
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-heading text-foreground">
            Your Player Profile Is Ready 🏀
          </h1>
          <p className="text-muted-foreground text-sm">
            Here's what we know about your game, {firstName}.
          </p>
        </div>

        <Card className="bg-card border-border overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-primary/10 px-5 py-4 border-b border-border">
              <h2 className="text-lg font-heading text-foreground">Player Profile</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-heading tracking-wider">Position & Height</p>
                  <p className="text-foreground font-medium">{position} · {height}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Target className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-heading tracking-wider">Primary Goal</p>
                  <p className="text-foreground font-medium">{primaryGoal}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Dumbbell className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-heading tracking-wider">Focus Area</p>
                  <p className="text-foreground font-medium">{focusArea}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-heading tracking-wider">Training Commitment</p>
                  <p className="text-foreground font-medium">{scheduleText}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3 text-center">
          <p className="text-lg font-heading text-foreground">Unlock your plan for just $7</p>
          <Button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full h-14 btn-cta bg-primary hover:bg-primary/90 glow-red-hover text-base"
          >
            {loading ? (
              <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</span>
            ) : errorMsg ? (
              errorMsg
            ) : (
              "Start My 7-Day Trial →"
            )}
          </Button>
          <p className="text-xs text-muted-foreground">Then $27/month. Cancel anytime.</p>
        </div>
      </motion.div>
    </div>
  );
}
