import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const SF = "-apple-system, 'SF Pro Text', BlinkMacSystemFont, sans-serif";

function lastNameOf(full: string) {
  const parts = full.trim().split(/\s+/);
  return parts[parts.length - 1] ?? full;
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

export default function SignupSuccess() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, profile, loading, refreshSubscription } = useAuth();
  const [status, setStatus] = useState("Activating your trial…");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        // Ensure an active subscription row exists.
        const { data: existing } = await supabase
          .from("subscriptions")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "active")
          .limit(1)
          .maybeSingle();
        if (!existing) {
          await supabase
            .from("subscriptions")
            .insert({ user_id: user.id, status: "active" });
        }
        await refreshSubscription();

        // Try to send any pending email.
        let bannerCoach: string | null = null;
        let bannerSchool: string | null = null;
        try {
          const raw = localStorage.getItem(`pif_pending_email_${user.id}`);
          if (raw && profile) {
            const p: any = profile;
            const profileIdentifier = p.username || p.email_alias || user.id;
            const filmUrl = `${window.location.origin}/p/${profileIdentifier}`;
            const draft = JSON.parse(raw);
            setStatus("Sending your email…");
            for (const coach of draft.coaches || []) {
              const lname = lastNameOf(coach.name);
              const subj = resolveText(draft.subject, p, lname, filmUrl);
              const body = resolveText(draft.body, p, lname, filmUrl);
              const { data, error } = await supabase.functions.invoke("send-outreach-email", {
                body: { to: coach.email, subject: subj, body },
              });
              if (!error && !(data as any)?.error) {
                await supabase.from("outreach_history").insert({
                  user_id: user.id,
                  coach_name: coach.name,
                  coach_title: coach.title,
                  school_name: draft.school?.name,
                  coach_email: coach.email,
                  subject: subj,
                  body,
                  status: "sent",
                });
                if (!bannerCoach) {
                  bannerCoach = coach.name;
                  bannerSchool = draft.school?.name;
                }
              }
            }
            localStorage.removeItem(`pif_pending_email_${user.id}`);
          }
        } catch (e) {
          console.error("[signup-success] pending email send failed", e);
        }

        if (cancelled) return;
        const banner =
          bannerCoach && bannerSchool
            ? `Your trial has started and your email to ${bannerCoach} at ${bannerSchool} has been sent. Welcome to Play it Forward.`
            : "Your trial has started. Welcome to Play it Forward.";
        navigate(`/dashboard?welcome=${encodeURIComponent(banner)}`, { replace: true });
      } catch (e) {
        console.error(e);
        navigate("/dashboard", { replace: true });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, user, profile, navigate, refreshSubscription]);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ backgroundColor: "#080D14", fontFamily: SF }}
    >
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "#E8391D" }}
          >
            <span className="font-heading text-xl text-white">PIF</span>
          </div>
        </div>
        <div
          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto"
          style={{ borderColor: "#3B82F6", borderTopColor: "transparent" }}
        />
        <p style={{ color: "#A0ADB8" }}>{status}</p>
      </div>
    </div>
  );
}
