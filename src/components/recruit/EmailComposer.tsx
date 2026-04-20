import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
  /** Optional pre-filled draft (used for follow-ups). */
  initialDraft?: { subject: string; body: string } | null;
}

function lastNameOf(full: string) {
  const parts = full.trim().split(/\s+/);
  return parts[parts.length - 1] ?? full;
}

function buildBody(p: any, school: MockSchool, coachLastName: string) {
  return `Dear Coach ${coachLastName},

My name is ${p.first_name ?? ""} ${p.last_name ?? ""} and I am a ${p.grad_year ?? "[Grad Year]"} graduate from ${p.high_school_name ?? "[High School]"} in ${p.city ?? "[City]"}, ${p.state ?? "[State]"}. I am a ${p.height ?? "[Height]"} ${p.position ?? "[Position]"} with a ${p.gpa ?? "[GPA]"} GPA and I am very interested in ${school.name}.

I believe ${school.name} would be an excellent fit for me both academically and athletically. I would love the opportunity to continue my education and basketball career at your program.

Please find my recruiting profile and highlight film here: ${p.highlight_film_url ?? "[Highlight Film Link]"}

I would greatly appreciate the opportunity to speak with you about joining your program.

Thank you for your time and consideration.

${p.first_name ?? ""} ${p.last_name ?? ""}
${p.grad_year ?? ""} | ${p.position ?? ""} | ${p.height ?? ""}
${p.high_school_name ?? ""}
${p.phone ?? ""}`;
}

export function EmailComposer({ school, selected, onBack, onRemoveCoach, onSent, initialDraft }: Props) {
  const { profile, user } = useAuth();
  const p: any = profile ?? {};

  const defaultSubject = useMemo(
    () => `${p.first_name ?? ""} ${p.last_name ?? ""} | ${p.height ?? ""} ${p.position ?? ""} - ${p.city ?? ""}`.trim(),
    [p],
  );

  const [subject, setSubject] = useState(initialDraft?.subject ?? defaultSubject);
  const [body, setBody] = useState(initialDraft?.body ?? buildBody(p, school, "[Coach Last Name]"));
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!user || selected.length === 0) return;
    setSending(true);

    let success = 0;
    let failed = 0;

    for (const coach of selected) {
      const personalizedBody = body.replace(/\[Coach Last Name\]/g, lastNameOf(coach.name));
      try {
        const { data, error } = await supabase.functions.invoke("send-gmail", {
          body: { to: coach.email, subject, body: personalizedBody },
        });
        if (error || (data as any)?.error) {
          failed++;
          console.error("send failed", coach.email, error || data);
          continue;
        }
        await supabase.from("outreach_history").insert({
          user_id: user.id,
          coach_name: coach.name,
          coach_title: coach.title,
          school_name: school.name,
          coach_email: coach.email,
          subject,
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
    if (success > 0) {
      toast({
        title: `Sent ${success} email${success > 1 ? "s" : ""}`,
        description: failed > 0 ? `${failed} failed — check your Gmail connection.` : "Saved to outreach history.",
      });
      onSent();
    } else {
      toast({ title: "Send failed", description: "Connect Gmail in Settings first.", variant: "destructive" });
    }
  };

  return (
    <Card className="p-6 bg-white border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-gray-600">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <span className="text-sm text-gray-500">{school.name}</span>
      </div>

      {/* Recipient chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {selected.map((c) => (
          <Badge key={c.email} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 gap-1.5 pl-3 pr-2 py-1.5">
            <span>{c.name}</span>
            <button onClick={() => onRemoveCoach(c.email)} className="hover:bg-blue-100 rounded-full p-0.5">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Subject</label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="bg-white border-gray-300 text-gray-900 mt-1"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Message</label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={16}
            className="bg-white border-gray-300 text-gray-900 mt-1 font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-1.5">
            <span className="font-medium">[Coach Last Name]</span> is replaced per recipient.
          </p>
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <Button
          onClick={send}
          disabled={sending || selected.length === 0}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
          Send to {selected.length} coach{selected.length !== 1 ? "es" : ""}
        </Button>
      </div>
    </Card>
  );
}
