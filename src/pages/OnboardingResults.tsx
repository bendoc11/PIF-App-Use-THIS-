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

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { email: authUser?.email },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast.error(err.message || "Could not start checkout");
    } finally {
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
