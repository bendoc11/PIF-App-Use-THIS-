import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { motion } from "framer-motion";

export default function Pricing() {
  const [annual, setAnnual] = useState(false);
  const price = annual ? 19 : 27;

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-heading text-foreground">Upgrade Your Game</h1>
          <p className="text-muted-foreground">Unlock the full training experience</p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3">
          <span className={`text-sm font-heading tracking-wider ${!annual ? "text-foreground" : "text-muted-foreground"}`}>Monthly</span>
          <button onClick={() => setAnnual(!annual)} className={`relative w-14 h-7 rounded-full transition-colors ${annual ? "bg-primary" : "bg-muted"}`}>
            <motion.div
              className="absolute top-1 left-1 w-5 h-5 rounded-full bg-foreground"
              animate={{ x: annual ? 26 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>
          <span className={`text-sm font-heading tracking-wider ${annual ? "text-foreground" : "text-muted-foreground"}`}>
            Annual <span className="text-pif-green text-xs">Save 30%</span>
          </span>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Free Plan */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-card border-border h-full">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="text-xl font-heading text-foreground">Free</h3>
                  <p className="text-3xl font-heading text-foreground mt-2">$0<span className="text-sm text-muted-foreground font-body">/4 weeks</span></p>
                </div>
                <ul className="space-y-3">
                  {["5 free drills", "Progress tracking", "Community read-only", "1 free course"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-pif-green shrink-0" /> {f}
                    </li>
                  ))}
                  {["Full drill library", "Live Q&A", "Community posting", "Leaderboard"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground/50">
                      <X className="h-4 w-4 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full h-12 btn-cta" disabled>Current Plan</Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pro Plan */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-card border-2 border-primary h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-heading tracking-wider rounded-bl-lg">
                Most Popular
              </div>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="text-xl font-heading text-foreground">Pro</h3>
                  <p className="text-3xl font-heading text-foreground mt-2">
                    ${price}<span className="text-sm text-muted-foreground font-body">/4 weeks</span>
                  </p>
                  <p className="text-xs text-primary mt-1 font-heading tracking-wider">
                    Try for $7 for 7 days
                  </p>
                </div>
                <ul className="space-y-3">
                  {[
                    "Everything in Free +",
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
                <Button className="w-full h-12 btn-cta bg-primary hover:bg-primary/90 glow-red-hover text-base">
                  Start 7-Day Trial — $7 →
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
