import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function Pricing() {
  const { subscription } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { email: user?.email },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Could not start checkout", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (subscription.subscribed) {
    return (
      <AppLayout>
        <div className="p-4 lg:p-6 max-w-md mx-auto text-center space-y-4 pt-16">
          <h1 className="text-3xl font-heading text-foreground">You're a Pro! 🏀</h1>
          <p className="text-muted-foreground">You have full access to the platform.</p>
          <Button variant="outline" onClick={() => navigate("/settings")}>
            Manage Subscription
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-heading text-foreground">Upgrade Your Game</h1>
          <p className="text-muted-foreground">Unlock the full training experience</p>
        </div>

        {/* Pro Plan */}
        <div className="max-w-md mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-card border-2 border-primary relative overflow-hidden">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="text-xl font-heading text-foreground">Pro</h3>
                  <p className="text-3xl font-heading text-foreground mt-2">
                    $27<span className="text-sm text-muted-foreground font-body">/month</span>
                  </p>
                  <p className="text-xs text-primary mt-1 font-heading tracking-wider">
                    Try for $7 for 7 days
                  </p>
                </div>
                <ul className="space-y-3">
                  {[
                    "Full access to all drills & courses",
                    "All content & new releases",
                    "Live Q&As",
                    "Full community access",
                    "Leaderboards & badges",
                    "Special offers & events",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="h-4 w-4 text-pif-green shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full h-12 btn-cta bg-primary hover:bg-primary/90 glow-red-hover text-base"
                >
                  {loading ? "Loading…" : "Start 7-Day Trial — $7 →"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Social Proof */}
        <div className="flex items-center justify-center gap-3">
          <div className="flex -space-x-2">
            {["ZE", "AW", "TW", "HM", "JR"].map((initials, i) => (
              <div key={i} className="w-8 h-8 rounded-full bg-muted border-2 border-card flex items-center justify-center">
                <span className="text-[9px] font-heading text-muted-foreground">{initials}</span>
              </div>
            ))}
          </div>
          <span className="text-sm text-muted-foreground">Join 2,400+ Athletes</span>
        </div>
      </div>
    </AppLayout>
  );
}
