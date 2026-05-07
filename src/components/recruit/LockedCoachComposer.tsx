import { useMemo, useState } from "react";
import { ArrowLeft, Lock, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { MatchedCoach } from "@/lib/coachMatching";

interface Props {
  coach: MatchedCoach;
  /** When true, coach name/email are blurred and Send is intercepted by paywall. */
  locked: boolean;
  onBack: () => void;
  onSendIntercept: () => void;
}

function buildBody(p: any, schoolName: string, coachLastName: string) {
  return `Dear Coach ${coachLastName},

My name is ${p.first_name ?? ""} ${p.last_name ?? ""} and I am a ${p.grad_year ?? "[Grad Year]"} graduate from ${p.high_school_name ?? "[High School]"} in ${p.city ?? "[City]"}, ${p.state ?? "[State]"}. I am a ${p.height ?? "[Height]"} ${p.position ?? "[Position]"} with a ${p.gpa ?? "[GPA]"} GPA and I am very interested in ${schoolName}.

I believe ${schoolName} would be an excellent fit for me both academically and athletically. I would love the opportunity to continue my education and basketball career at your program.

Please find my recruiting profile and highlight film here: ${p.highlight_film_url ?? "[Highlight Film Link]"}

I would greatly appreciate the opportunity to speak with you about joining your program.

Thank you for your time and consideration.

${p.first_name ?? ""} ${p.last_name ?? ""}
${p.grad_year ?? ""} | ${p.position ?? ""} | ${p.height ?? ""}
${p.high_school_name ?? ""}
${p.phone ?? ""}`;
}

export function LockedCoachComposer({ coach, locked, onBack, onSendIntercept }: Props) {
  const { profile, user } = useAuth();
  const p: any = profile ?? {};
  const coachName = coach.full_name || `${coach.first_name ?? ""} ${coach.last_name ?? ""}`.trim() || "Coach";
  const lastName = (coach.last_name || coachName.split(/\s+/).pop() || "").trim();
  const schoolName = coach.school_name ?? "";

  const defaultSubject = useMemo(
    () => `${p.first_name ?? ""} ${p.last_name ?? ""} | ${p.height ?? ""} ${p.position ?? ""} - ${p.city ?? ""}`.trim(),
    [p],
  );
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(buildBody(p, schoolName, lastName || "[Coach Last Name]"));
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (locked) {
      onSendIntercept();
      return;
    }
    if (!user || !coach.email) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-gmail", {
        body: { to: coach.email, subject, body },
      });
      const errMsg = (data as any)?.error || (error as any)?.message;
      if (error || (data as any)?.error) {
        toast({ title: "Send failed", description: errMsg || "Connect Gmail in Settings.", variant: "destructive" });
        return;
      }
      await supabase.from("outreach_history").insert({
        user_id: user.id,
        coach_name: coachName,
        coach_title: coach.title ?? null,
        school_name: schoolName,
        coach_email: coach.email,
        subject,
        body,
        status: "sent",
      });
      toast({ title: "Email sent", description: `Sent to ${coachName}` });
      onBack();
    } catch (e: any) {
      toast({ title: "Send failed", description: e?.message || "Try again.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background px-4 py-6">
      <div className="max-w-xl mx-auto">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground -ml-2 mb-3">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to matches
        </Button>

        <Card className="p-5">
          <div className="mb-4 pb-4 border-b border-border">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">To</p>
            <div className="mt-1 flex items-center gap-2">
              {locked ? (
                <>
                  <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-base text-foreground/80" style={{ filter: "blur(5px)" }}>
                    {coachName} · {coach.email || "coach@school.edu"}
                  </span>
                </>
              ) : (
                <span className="text-base text-foreground">
                  {coachName} · {coach.email}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {schoolName} · {coach.division ?? ""}
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Subject</label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Message</label>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={16} className="mt-1 text-sm" />
            </div>
          </div>

          <div className="mt-5">
            <Button
              onClick={handleSend}
              disabled={sending}
              className="w-full h-12 text-white font-heading tracking-wider"
              style={{ backgroundColor: "#E8391D" }}
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : locked ? <Lock className="h-4 w-4 mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              {locked ? "SEND — UNLOCK FOR $29/MO" : "SEND EMAIL"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
