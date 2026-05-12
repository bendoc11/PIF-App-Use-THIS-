import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Loader2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import OnboardingBackground from "@/components/onboarding/OnboardingBackground";
import { ensureMatchedCoaches, MatchedCoach } from "@/lib/coachMatching";
import { LockedCoachComposer } from "@/components/recruit/LockedCoachComposer";
import { DailyLimitPaywall } from "@/components/paywall/DailyLimitPaywall";

export default function OnboardingResults() {
  const navigate = useNavigate();
  const { user, profile, hasActiveSubscription } = useAuth();
  const [coaches, setCoaches] = useState<MatchedCoach[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MatchedCoach | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    if (!user || !profile) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const existing = (profile as any).matched_coaches;
      if (Array.isArray(existing) && existing.length >= 5) {
        if (!cancelled) {
          setCoaches(existing.slice(0, 5));
          setLoading(false);
        }
        return;
      }
      const fresh = await ensureMatchedCoaches(user.id, profile);
      if (!cancelled) {
        setCoaches(fresh);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, profile]);

  const subtitle = useMemo(() => {
    const p: any = profile ?? {};
    const div = p.target_division || "your division";
    const region = p.geo_preference || "your region";
    return `${div} · ${region}`;
  }, [profile]);

  if (selected) {
    return (
      <LockedCoachComposer
        coach={selected}
        locked={!hasActiveSubscription}
        onBack={() => setSelected(null)}
        onSendIntercept={() => setShowPaywall(true)}
      />
    );
  }

  return (
    <div className="relative min-h-[100dvh]">
      <OnboardingBackground />
      <div className="relative z-10 min-h-[100dvh] flex flex-col items-center px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full space-y-6"
        >
          <div className="text-center space-y-2">
            <h1 className="text-3xl md:text-4xl font-heading text-foreground leading-tight">
              YOUR TOP 5 COACH MATCHES
            </h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : coaches.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              We couldn't match coaches yet. Continue to your dashboard.
            </p>
          ) : (
            <div className="space-y-3">
              {coaches.map((c, i) => (
                <motion.button
                  key={c.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.06 }}
                  onClick={() => setSelected(c)}
                  className="w-full text-left rounded-xl border border-border bg-card/70 backdrop-blur-md p-4 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-foreground font-semibold text-base leading-tight pr-3">
                      {c.school_name || "—"}
                    </p>
                    <span className="text-[10px] font-heading tracking-wider text-primary bg-primary/10 px-2 py-1 rounded">
                      {c.division || "—"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    {[c.city, c.state].filter(Boolean).join(", ") || "—"}
                  </p>

                  {/* Locked coach contact */}
                  {!hasActiveSubscription ? (
                    <div className="flex items-center gap-2 rounded-md bg-background/40 border border-border px-3 py-2">
                      <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span
                        className="text-sm text-foreground/80 select-none"
                        style={{ filter: "blur(5px)" }}
                      >
                        Coach Name · coach@school.edu
                      </span>
                      <span className="ml-auto text-[10px] font-heading tracking-wider text-primary">
                        UNLOCK
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-md bg-background/40 border border-border px-3 py-2">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm text-foreground truncate">
                        {c.full_name || `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim()} · {c.email}
                      </span>
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          )}

          <button
            onClick={() => navigate("/dashboard", { replace: true })}
            className="w-full h-12 rounded-xl bg-card/60 border border-border text-foreground text-sm font-heading tracking-wider hover:bg-card/80"
          >
            CONTINUE TO DASHBOARD →
          </button>
        </motion.div>
      </div>

      {showPaywall && <DailyLimitPaywall />}
    </div>
  );
}
