import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useColleges } from "@/hooks/useColleges";
import { useSchoolScoringData } from "@/hooks/useSchoolScoringData";
import {
  athleteBucket,
  sortSchoolsByRelevance,
} from "@/lib/schoolScoring";
import { MockSchool, MockCoach } from "@/data/mockSchools";
import { SchoolLogo } from "@/components/recruit/SchoolLogo";
import {
  buildQuickBody,
  buildQuickSubject,
} from "@/components/recruit/QuickSendSheet";

interface Props {
  onSent: () => void;
  onSkip: () => void;
}

function lastNameOf(full: string) {
  const parts = (full || "").trim().split(/\s+/);
  return parts[parts.length - 1] ?? full;
}
function defaultCoach(coaches: MockCoach[]): MockCoach | null {
  if (!coaches?.length) return null;
  const head = coaches.find((c) => (c.title || "").toLowerCase().includes("head"));
  return head ?? coaches[0];
}

export default function StepFirstMessage({ onSent, onSkip }: Props) {
  const { user, profile } = useAuth();
  const p: any = profile ?? {};
  const { schools, loading } = useColleges();
  const { rosterMap, notInterestedNames } = useSchoolScoringData();
  const [sending, setSending] = useState(false);
  const [flying, setFlying] = useState(false);

  const bucket = useMemo(() => athleteBucket(p.position), [p.position]);
  const ctx = useMemo(
    () => ({
      userState: p.state || "",
      targetDivision: p.target_division || "",
      bucket,
      contactedNames: new Set<string>(),
      notInterestedNames,
      rosterMap,
    }),
    [p.state, p.target_division, bucket, notInterestedNames, rosterMap],
  );

  const top = useMemo(() => {
    const pool = schools.filter((s) => s.coaches && s.coaches.length > 0);
    const sorted = sortSchoolsByRelevance(pool, ctx);
    return sorted[0] ?? null;
  }, [schools, ctx]);

  const coach: MockCoach | null = top ? defaultCoach(top.coaches) : null;
  const subject = useMemo(() => buildQuickSubject(p), [p]);
  const filmLink = (p.highlight_film_url || "").trim() || "[Add your highlight film]";
  const body = useMemo(
    () => (top && coach ? buildQuickBody(p, top, lastNameOf(coach.name), filmLink) : ""),
    [p, top, coach, filmLink],
  );

  const handleSend = async () => {
    if (!user || !top || !coach || sending) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-outreach-email", {
        body: { to: coach.email, subject, body },
      });
      if (error || (data as any)?.error) {
        setSending(false);
        toast.error("Couldn't send your first message. You can try again from the dashboard.");
        return;
      }
      await supabase.from("outreach_history").insert({
        user_id: user.id,
        coach_name: coach.name,
        coach_title: coach.title,
        school_name: top.name,
        coach_email: coach.email,
        subject,
        body,
        status: "sent",
      });
      // Paper-airplane fly + confetti
      setFlying(true);
      setTimeout(() => {
        onSent();
      }, 1200);
    } catch (e) {
      console.error(e);
      setSending(false);
      toast.error("Send failed. Please try again.");
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col px-6 pt-16 pb-40 relative">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <p className="text-[11px] font-heading tracking-[0.18em] text-primary uppercase">
            Step 10 · Send your first
          </p>
          <h1 className="text-3xl font-heading text-foreground leading-tight mt-2">
            Your first message is ready to send.
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed mt-2">
            We matched you with a program actively recruiting your position. One tap sends your introduction.
          </p>
        </motion.div>

        {/* School card */}
        {loading || !top || !coach ? (
          <div className="rounded-2xl border border-border bg-card p-6 flex items-center justify-center min-h-[120px]">
            <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="rounded-2xl border border-border bg-card overflow-hidden"
          >
            <div className="p-4 flex items-start gap-3 border-b border-border">
              <SchoolLogo
                logoUrl={top.logoUrl ?? null}
                rosterUrl={top.rosterUrl ?? null}
                name={top.name}
                size={48}
                radius={8}
              />
              <div className="min-w-0 flex-1">
                <p className="text-base font-heading text-foreground truncate">{top.name}</p>
                <div className="mt-1 flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-heading uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary/15 text-primary">
                    {top.division}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {[top.city, top.state].filter(Boolean).join(", ")}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 truncate">
                  To: {coach.name} · {coach.title}
                </p>
              </div>
            </div>
            <div className="p-4 max-h-56 overflow-y-auto">
              <p className="text-[11px] font-heading uppercase tracking-wider text-muted-foreground mb-2">
                Subject
              </p>
              <p className="text-sm text-foreground mb-3">{subject}</p>
              <p className="text-[11px] font-heading uppercase tracking-wider text-muted-foreground mb-2">
                Message
              </p>
              <pre className="text-xs text-foreground whitespace-pre-wrap font-sans leading-relaxed">
                {body}
              </pre>
            </div>
          </motion.div>
        )}
      </div>

      {/* Flying airplane + confetti overlay */}
      {flying && (
        <div className="fixed inset-0 z-40 pointer-events-none overflow-hidden">
          <motion.div
            initial={{ x: 0, y: 0, opacity: 1, rotate: -10 }}
            animate={{
              x: typeof window !== "undefined" ? window.innerWidth * 0.6 : 400,
              y: -300,
              opacity: 0,
              rotate: 25,
            }}
            transition={{ duration: 1.1, ease: "easeOut" }}
            className="absolute"
            style={{ left: "50%", top: "60%" }}
          >
            <Send className="h-12 w-12 text-primary drop-shadow-lg" fill="currentColor" />
          </motion.div>
          {Array.from({ length: 36 }).map((_, i) => {
            const colors = ["#E8391D", "#3B82F6", "#fbbf24", "#22c55e", "#a78bfa"];
            const color = colors[i % colors.length];
            const delay = Math.random() * 0.2;
            const dur = 1.2 + Math.random() * 0.8;
            const left = 50 + (Math.random() - 0.5) * 40;
            return (
              <span
                key={i}
                style={{
                  position: "absolute",
                  top: "55%",
                  left: `${left}%`,
                  width: 8,
                  height: 8,
                  background: color,
                  borderRadius: 2,
                  transform: `rotate(${Math.random() * 360}deg)`,
                  animation: `confetti-fall ${dur}s ease-out ${delay}s forwards`,
                }}
              />
            );
          })}
          <style>{`
            @keyframes confetti-fall {
              0% { transform: translate(0,0) rotate(0deg); opacity: 1; }
              100% { transform: translate(${Math.random() > 0.5 ? "" : "-"}120px, 60vh) rotate(720deg); opacity: 0; }
            }
          `}</style>
        </div>
      )}

      {/* Footer CTAs */}
      <div
        className="fixed bottom-0 left-0 right-0 p-5 bg-background/95 backdrop-blur-sm z-20"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
        <div className="max-w-md mx-auto">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSend}
            disabled={sending || flying || loading || !top || !coach}
            className={`w-full h-14 rounded-xl text-base font-heading flex items-center justify-center gap-2 transition-all ${
              sending || flying || loading || !top || !coach
                ? "bg-muted text-muted-foreground"
                : "bg-primary text-primary-foreground glow-red"
            }`}
          >
            {sending || flying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Sending…
              </>
            ) : (
              <>
                Send My First Message <ArrowRight className="h-4 w-4" />
              </>
            )}
          </motion.button>
          <button
            onClick={onSkip}
            disabled={sending || flying}
            className="w-full mt-3 h-11 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
