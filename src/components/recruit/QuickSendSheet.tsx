import { useEffect, useMemo, useState } from "react";
import { Loader2, Send, Pencil, Check } from "lucide-react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { MockCoach, MockSchool, DIVISION_COLORS } from "@/data/mockSchools";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const SF = "-apple-system, 'SF Pro Text', BlinkMacSystemFont, sans-serif";

function lastNameOf(full: string) {
  const parts = (full || "").trim().split(/\s+/);
  return parts[parts.length - 1] ?? full;
}

export function buildQuickSubject(p: any): string {
  const name = `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim();
  const grad = p.grad_year ?? "";
  const pos = p.position ?? "";
  return `quick film — ${name}, ${grad} ${pos}`.toLowerCase().trim();
}

export function buildQuickBody(p: any, school: MockSchool, coachLastName: string, filmUrl: string): string {
  const fullName = `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim();
  const grad = p.grad_year ?? "";
  const pos = p.position ?? "";
  const cityState = [p.city, p.state].filter(Boolean).join(", ");
  const phoneLine = p.phone ? `\n${p.phone}` : "";
  return `Coach ${coachLastName},

I've been following ${school.name} and think your program could be the right fit for my game.

I'm a ${grad} ${pos} from ${cityState} — ${p.height ?? ""}, ${p.gpa ?? ""} GPA, and I play with a chip on my shoulder. My film is here: ${filmUrl}

Would love to know if I fit what you're looking for in your ${grad} class.

— ${fullName}${phoneLine}`;
}

interface Props {
  open: boolean;
  school: MockSchool | null;
  onClose: () => void;
  onSent: () => Promise<void> | void;
  onAdvance: (current: MockSchool) => MockSchool | null;
  onEditFirst: (school: MockSchool, coach: MockCoach, draft: { subject: string; body: string }) => void;
  onDailyLimitReached?: () => void;
}

export function QuickSendSheet({
  open,
  school: initialSchool,
  onClose,
  onSent,
  onAdvance,
  onEditFirst,
  onDailyLimitReached,
}: Props) {
  const { profile, user } = useAuth();
  const p: any = profile ?? {};
  const [school, setSchool] = useState<MockSchool | null>(initialSchool);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setSchool(initialSchool);
    setSuccess(false);
    setSending(false);
  }, [initialSchool, open]);

  const coach: MockCoach | null = useMemo(() => school?.coaches?.[0] ?? null, [school]);

  const profileIdentifier = p.username || p.email_alias || user?.id;
  const filmUrl = profileIdentifier
    ? `${window.location.origin}/p/${profileIdentifier}`
    : (p.highlight_film_url || "https://playitforward.app");

  const subject = useMemo(() => buildQuickSubject(p), [p]);
  const body = useMemo(
    () => (school && coach ? buildQuickBody(p, school, lastNameOf(coach.name), filmUrl) : ""),
    [p, school, coach, filmUrl],
  );

  const alias = p.email_alias as string | undefined;
  const fromAddress = alias ? `${alias}@mail.playitforward.app` : null;

  const handleSend = async () => {
    if (!user || !school || !coach) return;
    if (!fromAddress) {
      toast({
        title: "Email alias missing",
        description: "Complete your profile (name and grad year) to send.",
        variant: "destructive",
      });
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-outreach-email", {
        body: { to: coach.email, subject, body },
      });
      const errCode = (data as any)?.error || (error as any)?.context?.error;
      if (error || (data as any)?.error) {
        if (errCode === "daily_limit_reached") {
          setSending(false);
          onDailyLimitReached?.();
          return;
        }
        setSending(false);
        toast({ title: "Send failed", description: "Please try again.", variant: "destructive" });
        return;
      }
      await supabase.from("outreach_history").insert({
        user_id: user.id,
        coach_name: coach.name,
        coach_title: coach.title,
        school_name: school.name,
        coach_email: coach.email,
        subject,
        body,
        status: "sent",
      });
      setSending(false);
      setSuccess(true);
      await onSent();
      // Brief success animation, then advance to next school
      setTimeout(() => {
        const next = onAdvance(school);
        if (next) {
          setSchool(next);
          setSuccess(false);
        } else {
          onClose();
        }
      }, 1100);
    } catch (e) {
      console.error(e);
      setSending(false);
      toast({ title: "Send failed", description: "Please try again.", variant: "destructive" });
    }
  };

  if (!school || !coach) return null;

  const divColor = DIVISION_COLORS[school.division];

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-h-[92vh]" style={{ fontFamily: SF }}>
        <div className="px-5 pb-5 pt-2 overflow-y-auto">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="min-w-0 flex-1">
              <div style={{ fontSize: 17, fontWeight: 700, color: "#1D1D1F" }} className="truncate">
                {coach.name}
              </div>
              <div style={{ fontSize: 13, color: "#6E6E73", marginTop: 2 }} className="truncate">
                {school.name}
              </div>
            </div>
            <span
              style={{
                background: divColor,
                color: "#FFFFFF",
                fontSize: 11,
                fontWeight: 700,
                borderRadius: 6,
                padding: "4px 10px",
                flexShrink: 0,
              }}
            >
              {school.division}
            </span>
          </div>

          {/* Subject */}
          <div
            style={{
              background: "#F5F5F7",
              border: "1px solid #E8E8ED",
              borderRadius: 10,
              padding: "10px 14px",
              fontSize: 13,
              color: "#1D1D1F",
              marginBottom: 10,
              wordBreak: "break-word",
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 600, color: "#86868B", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
              Subject
            </div>
            {subject}
          </div>

          {/* Body */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E8E8ED",
              borderRadius: 10,
              padding: 14,
              fontSize: 14,
              color: "#1D1D1F",
              lineHeight: 1.55,
              whiteSpace: "pre-wrap",
              maxHeight: 320,
              overflowY: "auto",
              marginBottom: 16,
            }}
          >
            {body}
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-2 gap-3" style={{ marginBottom: 8 }}>
            <button
              onClick={() => onEditFirst(school, coach, { subject, body })}
              disabled={sending || success}
              style={{
                background: "#FFFFFF",
                border: "1px solid #D2D2D7",
                color: "#1D1D1F",
                borderRadius: 980,
                padding: "14px 18px",
                fontSize: 15,
                fontWeight: 600,
                fontFamily: SF,
                opacity: sending || success ? 0.5 : 1,
                minHeight: 48,
              }}
              className="inline-flex items-center justify-center gap-2"
            >
              <Pencil className="h-4 w-4" strokeWidth={2} />
              Edit First
            </button>
            <button
              onClick={handleSend}
              disabled={sending || success}
              style={{
                background: success ? "#22C55E" : "#0071E3",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 980,
                padding: "14px 18px",
                fontSize: 15,
                fontWeight: 600,
                fontFamily: SF,
                opacity: sending && !success ? 0.7 : 1,
                minHeight: 48,
                transition: "background 250ms",
              }}
              className="inline-flex items-center justify-center gap-2"
            >
              {success ? (
                <>
                  <Check className="h-5 w-5 animate-scale-in" strokeWidth={2.5} />
                  Sent!
                </>
              ) : sending ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
              ) : (
                <>
                  <Send className="h-4 w-4" strokeWidth={2} />
                  Send Now
                </>
              )}
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
