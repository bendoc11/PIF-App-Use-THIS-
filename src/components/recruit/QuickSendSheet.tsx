import { useEffect, useMemo, useState } from "react";
import { Loader2, Send, Pencil, Check } from "lucide-react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { MockCoach, MockSchool, DIVISION_COLORS } from "@/data/mockSchools";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const SF = "'Plus Jakarta Sans', -apple-system, system-ui, sans-serif";

function lastNameOf(full: string) {
  const parts = (full || "").trim().split(/\s+/);
  return parts[parts.length - 1] ?? full;
}

/** Compact coach title like "Head Coach", "Asst. Coach", "Recruiting Coord." */
function shortTitle(title: string): string {
  const t = (title || "").toLowerCase();
  if (t.includes("head")) return "Head Coach";
  if (t.includes("recruit")) return "Recruiting Coord.";
  if (t.includes("assistant") || t.includes("asst")) return "Asst. Coach";
  if (t.includes("associate")) return "Assoc. Coach";
  if (t.includes("director")) return "Director";
  return title || "Coach";
}

/** Pick the head coach if present, otherwise first coach. */
function defaultCoach(coaches: MockCoach[]): MockCoach | null {
  if (!coaches?.length) return null;
  const head = coaches.find((c) => (c.title || "").toLowerCase().includes("head"));
  return head ?? coaches[0];
}

/** Resolve the athlete's outbound highlight film link.
 *  Never returns a lovable preview/app URL. */
function resolveFilmLink(p: any): string {
  const stored = (p?.highlight_film_url ?? "").toString().trim();
  if (stored && !/lovable\.(app|dev)|lovableproject\.com/i.test(stored)) {
    return stored;
  }
  return "[Add your highlight film in My Profile]";
}

export function buildQuickSubject(p: any): string {
  const name = `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim();
  const grad = p.grad_year ?? "";
  const pos = p.position ?? "";
  return `quick film — ${name}, ${grad} ${pos}`.toLowerCase().trim();
}

export function buildQuickBody(
  p: any,
  school: MockSchool,
  coachLastName: string,
  filmUrl: string,
): string {
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
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);

  useEffect(() => {
    setSchool(initialSchool);
    setSuccess(false);
    setSending(false);
    const def = defaultCoach(initialSchool?.coaches ?? []);
    setSelectedEmail(def?.email ?? null);
  }, [initialSchool, open]);

  const coaches = useMemo(() => school?.coaches ?? [], [school]);
  const coach: MockCoach | null = useMemo(() => {
    if (!coaches.length) return null;
    return coaches.find((c) => c.email === selectedEmail) ?? defaultCoach(coaches);
  }, [coaches, selectedEmail]);

  const filmUrl = useMemo(() => resolveFilmLink(p), [p]);

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
      setTimeout(() => {
        const next = onAdvance(school);
        if (next) {
          setSchool(next);
          const def = defaultCoach(next.coaches);
          setSelectedEmail(def?.email ?? null);
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
  const showSelector = coaches.length > 1;

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent
        className="max-h-[92vh]"
        style={{ fontFamily: SF, background: "#0F1620", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="px-5 pb-5 pt-2 overflow-y-auto">
          {/* Header */}
          <div
            className="flex items-start justify-between gap-3"
            style={{
              paddingBottom: 14,
              marginBottom: 14,
              borderBottom: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <div className="min-w-0 flex-1">
              <div
                style={{
                  fontFamily: SF,
                  fontSize: 17,
                  fontWeight: 600,
                  color: "#FFFFFF",
                }}
                className="truncate"
              >
                {coach.name}
              </div>
              <div
                style={{
                  fontFamily: SF,
                  fontSize: 13,
                  fontWeight: 400,
                  color: "rgba(255,255,255,0.65)",
                  marginTop: 2,
                }}
                className="truncate"
              >
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

          {/* Coach selector */}
          {showSelector && (
            <div
              className="flex gap-2 overflow-x-auto"
              style={{
                marginBottom: 14,
                paddingBottom: 4,
                scrollbarWidth: "none",
              }}
            >
              {coaches.map((c) => {
                const selected = c.email === coach.email;
                return (
                  <button
                    key={c.email}
                    onClick={() => setSelectedEmail(c.email)}
                    disabled={sending || success}
                    style={{
                      flexShrink: 0,
                      background: selected ? "#FFFFFF" : "rgba(255,255,255,0.04)",
                      color: selected ? "#0F1620" : "#FFFFFF",
                      border: selected
                        ? "1px solid #FFFFFF"
                        : "1px solid rgba(255,255,255,0.20)",
                      borderRadius: 999,
                      padding: "8px 14px",
                      fontFamily: SF,
                      fontSize: 12,
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      cursor: "pointer",
                      transition: "background 150ms, color 150ms, border 150ms",
                    }}
                  >
                    {c.name.split(/\s+/).slice(-1)[0]} · {shortTitle(c.title)}
                  </button>
                );
              })}
            </div>
          )}

          {/* Subject */}
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              padding: "10px 14px",
              fontSize: 13,
              color: "rgba(255,255,255,0.92)",
              marginBottom: 10,
              wordBreak: "break-word",
              fontFamily: SF,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "rgba(255,255,255,0.50)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 4,
              }}
            >
              Subject
            </div>
            {subject}
          </div>

          {/* Body */}
          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              padding: 14,
              fontSize: 14,
              color: "rgba(255,255,255,0.92)",
              lineHeight: 1.55,
              whiteSpace: "pre-wrap",
              maxHeight: 320,
              overflowY: "auto",
              marginBottom: 16,
              fontFamily: SF,
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
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.20)",
                color: "#FFFFFF",
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
                background: success ? "#22C55E" : "hsl(var(--pif-red))",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 980,
                padding: "14px 18px",
                fontSize: 15,
                fontWeight: 700,
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
