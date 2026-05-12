import { useMemo, useState } from "react";
import { ArrowLeft, Loader2, Send, X } from "lucide-react";
import { MockCoach, MockSchool } from "@/data/mockSchools";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface Props {
  school: MockSchool;
  selected: MockCoach[];
  onBack: () => void;
  onRemoveCoach: (email: string) => void;
  onSent: () => void;
  /** Called when the server returns 429 daily_limit_reached (free user). */
  onDailyLimitReached?: () => void;
  initialDraft?: { subject: string; body: string } | null;
}

const SF =
  "-apple-system, 'SF Pro Text', BlinkMacSystemFont, sans-serif";

function lastNameOf(full: string) {
  const parts = full.trim().split(/\s+/);
  return parts[parts.length - 1] ?? full;
}

function buildBody(p: any, school: MockSchool, coachLastName: string) {
  return `Dear Coach ${coachLastName},

My name is ${p.first_name ?? ""} ${p.last_name ?? ""} and I am a ${p.grad_year ?? "[Grad Year]"} graduate from ${p.high_school_name ?? "[High School]"} in ${p.city ?? "[City]"}, ${p.state ?? "[State]"}. I am a ${p.height ?? "[Height]"} ${p.position ?? "[Position]"} with a ${p.gpa ?? "[GPA]"} GPA and I am very interested in ${school.name}.

I believe ${school.name} would be an excellent fit for me both academically and athletically. I would love the opportunity to continue my education and basketball career at your program.

Please find my recruiting profile and highlight film here: [Highlight Film Link]

I would greatly appreciate the opportunity to speak with you about joining your program.

Thank you for your time and consideration.

${p.first_name ?? ""} ${p.last_name ?? ""}
${p.grad_year ?? ""} | ${p.position ?? ""} | ${p.height ?? ""}
${p.high_school_name ?? ""}
${p.phone ?? ""}`;
}

function resolveText(text: string, p: any, coachLastName: string, filmUrl: string) {
  return text
    .replace(/\[Coach Last Name\]/g, coachLastName)
    .replace(/\[Highlight Film Link\]/g, filmUrl)
    .replace(/\[Grad Year\]/g, p.grad_year ?? "")
    .replace(/\[High School\]/g, p.high_school_name ?? "")
    .replace(/\[City\]/g, p.city ?? "")
    .replace(/\[State\]/g, p.state ?? "")
    .replace(/\[Height\]/g, p.height ?? "")
    .replace(/\[Position\]/g, p.position ?? "")
    .replace(/\[GPA\]/g, p.gpa ?? "");
}

export function EmailComposer({ school, selected, onBack, onRemoveCoach, onSent, onDailyLimitReached, initialDraft }: Props) {
  const { profile, user } = useAuth();
  const p: any = profile ?? {};
  const alias = p.email_alias as string | undefined;
  const fromAddress = alias ? `${alias}@mail.playitforward.app` : null;
  const profileIdentifier = p.username || p.email_alias || user?.id;
  const filmUrl = profileIdentifier
    ? `${window.location.origin}/p/${profileIdentifier}`
    : p.highlight_film_url || "https://playitforward.app";

  const previewCoachLast = selected[0] ? lastNameOf(selected[0].name) : "Coach";

  const defaultSubject = useMemo(
    () => `${p.first_name ?? ""} ${p.last_name ?? ""} | ${p.height ?? ""} ${p.position ?? ""} - ${p.city ?? ""}`.trim(),
    [p],
  );

  const [subject, setSubject] = useState(initialDraft?.subject ?? defaultSubject);
  const [body, setBody] = useState(initialDraft?.body ?? buildBody(p, school, "[Coach Last Name]"));
  const [sending, setSending] = useState(false);

  const previewSubject = resolveText(subject, p, previewCoachLast, filmUrl);
  const previewBody = resolveText(body, p, previewCoachLast, "[[FILM_LINK]]");
  const bodyParts = previewBody.split("[[FILM_LINK]]");

  const send = async () => {
    if (!user || selected.length === 0) return;
    if (!fromAddress) {
      toast({
        title: "Email alias missing",
        description: "Please complete your profile (name and graduation year) to send emails.",
        variant: "destructive",
      });
      return;
    }
    await doSend();
  };

  const doSend = async () => {
    if (!user) return;
    setSending(true);

    let success = 0;
    let failed = 0;
    let dailyHit = false;

    for (const coach of selected) {
      const personalizedBody = resolveText(body, p, lastNameOf(coach.name), filmUrl);
      const personalizedSubject = resolveText(subject, p, lastNameOf(coach.name), filmUrl);
      try {
        const { data, error } = await supabase.functions.invoke("send-outreach-email", {
          body: { to: coach.email, subject: personalizedSubject, body: personalizedBody },
        });
        const errCode = (data as any)?.error || (error as any)?.context?.error;
        if (error || (data as any)?.error) {
          failed++;
          if (errCode === "daily_limit_reached") { dailyHit = true; break; }
          console.error("send failed", coach.email, error || data);
          continue;
        }
        await supabase.from("outreach_history").insert({
          user_id: user.id,
          coach_name: coach.name,
          coach_title: coach.title,
          school_name: school.name,
          coach_email: coach.email,
          subject: personalizedSubject,
          body: personalizedBody,
          status: "sent",
        });
        success++;
      } catch (e) {
        failed++;
        console.error(e);
      }
    }

    setSending(false);

    if (dailyHit) {
      onDailyLimitReached?.();
      if (success > 0) {
        toast({
          title: `Sent ${success} email${success > 1 ? "s" : ""}`,
          description: "Saved to outreach history.",
        });
        onSent();
      }
      return;
    }

    if (success > 0) {
      toast({
        title: `Sent ${success} email${success > 1 ? "s" : ""}`,
        description: failed > 0 ? `${failed} failed.` : "Saved to outreach history.",
      });
      onSent();
    } else {
      toast({ title: "Send failed", description: "Please try again.", variant: "destructive" });
    }
  };

  const [editingBody, setEditingBody] = useState(false);
  const [editingSubject, setEditingSubject] = useState(false);

  return (
    <div style={{ background: "#F5F5F7", fontFamily: SF }}>
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #D2D2D7",
          borderRadius: 16,
          padding: "28px 32px",
          fontFamily: SF,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between"
          style={{ paddingBottom: 14, borderBottom: "1px solid #E8E8ED", marginBottom: 20 }}
        >
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1"
            style={{ fontSize: 14, fontWeight: 500, color: "#0071E3", fontFamily: SF }}
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
            Back
          </button>
          <span style={{ fontSize: 14, fontWeight: 500, color: "#6E6E73", fontFamily: SF }}>
            {school.name}
          </span>
        </div>

        {/* Sending from */}
        {fromAddress && (
          <div style={{ fontSize: 13, color: "#6E6E73", marginBottom: 16, fontFamily: SF }}>
            Sending from{" "}
            <span style={{ fontSize: 13, fontWeight: 600, color: "#1D1D1F" }}>{fromAddress}</span>
          </div>
        )}

        {/* To pills */}
        <div className="flex flex-wrap gap-2" style={{ marginBottom: 20 }}>
          {selected.map((c) => (
            <span
              key={c.email}
              className="inline-flex items-center gap-1.5"
              style={{
                background: "#E8F1FD",
                color: "#0071E3",
                fontSize: 13,
                fontWeight: 600,
                borderRadius: 980,
                padding: "5px 14px",
                fontFamily: SF,
              }}
            >
              <span>{c.name}</span>
              <button
                onClick={() => onRemoveCoach(c.email)}
                style={{ color: "#0071E3", opacity: 0.6, display: "inline-flex" }}
                aria-label="Remove"
              >
                <X className="h-3 w-3" strokeWidth={2} />
              </button>
            </span>
          ))}
        </div>

        {/* Tip */}
        <div
          style={{
            background: "#FFF8E1",
            border: "1px solid #F5E1A4",
            borderRadius: 10,
            padding: "10px 14px",
            marginBottom: 16,
            fontSize: 13,
            color: "#5C4A12",
            lineHeight: 1.5,
            fontFamily: SF,
          }}
        >
          <strong style={{ fontWeight: 600 }}>Tip:</strong> Coaches can spot a copy-paste from a mile away. Take a minute to research each program and personalize your message — mention a recent game, the coach's style, or why their school fits you. Individualized emails get far more replies.
        </div>

        {/* Subject */}
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "#86868B",
              fontFamily: SF,
              display: "block",
              marginBottom: 6,
            }}
          >
            Subject
          </label>
          {editingSubject ? (
            <input
              autoFocus
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              onBlur={() => setEditingSubject(false)}
              style={{
                width: "100%",
                background: "#F5F5F7",
                border: "1px solid #D2D2D7",
                borderRadius: 10,
                padding: "12px 16px",
                fontSize: 14,
                color: "#1D1D1F",
                fontFamily: SF,
                outline: "none",
              }}
            />
          ) : (
            <div
              role="button"
              onClick={() => setEditingSubject(true)}
              style={{
                width: "100%",
                background: "#F5F5F7",
                border: "1px solid #D2D2D7",
                borderRadius: 10,
                padding: "12px 16px",
                fontSize: 14,
                color: "#1D1D1F",
                fontFamily: SF,
                cursor: "text",
                minHeight: 44,
              }}
            >
              {previewSubject}
            </div>
          )}
        </div>

        {/* Message */}
        <div>
          <label
            style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "#86868B",
              fontFamily: SF,
              display: "block",
              marginBottom: 6,
            }}
          >
            Message
          </label>
          {editingBody ? (
            <textarea
              autoFocus
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onBlur={() => setEditingBody(false)}
              style={{
                width: "100%",
                background: "#F5F5F7",
                border: "1px solid #D2D2D7",
                borderRadius: 10,
                padding: 16,
                fontSize: 14,
                color: "#1D1D1F",
                lineHeight: 1.6,
                fontFamily: SF,
                minHeight: 280,
                outline: "none",
                resize: "vertical",
              }}
            />
          ) : (
            <div
              role="button"
              onClick={() => setEditingBody(true)}
              style={{
                width: "100%",
                background: "#F5F5F7",
                border: "1px solid #D2D2D7",
                borderRadius: 10,
                padding: 16,
                fontSize: 14,
                color: "#1D1D1F",
                lineHeight: 1.6,
                fontFamily: SF,
                minHeight: 280,
                whiteSpace: "pre-wrap",
                cursor: "text",
              }}
            >
              {bodyParts.map((part, i) => (
                <span key={i}>
                  {part}
                  {i < bodyParts.length - 1 && (
                    <a
                      href={filmUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        color: "#0071E3",
                        textDecoration: "underline",
                      }}
                    >
                      View my recruiting profile.
                    </a>
                  )}
                </span>
              ))}
            </div>
          )}
          <p
            style={{
              fontSize: 12,
              color: "#86868B",
              fontStyle: "italic",
              marginTop: 8,
              fontFamily: SF,
            }}
          >
            Coach name and details are personalized for each recipient.
          </p>
        </div>

        {/* Send */}
        <div className="flex justify-end" style={{ marginTop: 24 }}>
          <button
            onClick={send}
            disabled={sending || selected.length === 0}
            className="inline-flex items-center gap-2"
            style={{
              background: "#0071E3",
              color: "#FFFFFF",
              borderRadius: 980,
              padding: "12px 24px",
              fontSize: 14,
              fontWeight: 600,
              fontFamily: SF,
              opacity: sending || selected.length === 0 ? 0.6 : 1,
              transition: "opacity 150ms",
            }}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
            ) : (
              <Send className="h-4 w-4" strokeWidth={2} />
            )}
            Send to {selected.length} coach{selected.length !== 1 ? "es" : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
