import { useState } from "react";
import { Loader2, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  coachEmail: string;
  coachName?: string | null;
  schoolName?: string | null;
  originalSubject?: string | null;
  originalBody?: string | null;
  onSent?: () => void;
}

export function ReplyComposer({
  open,
  onClose,
  coachEmail,
  coachName,
  schoolName,
  originalSubject,
  originalBody,
  onSent,
}: Props) {
  const { user, profile } = useAuth();
  const p: any = profile ?? {};
  const alias = p.email_alias as string | undefined;
  const fromAddress = alias ? `${alias}@mail.playitforward.app` : null;

  const initialSubject = originalSubject
    ? originalSubject.toLowerCase().startsWith("re:")
      ? originalSubject
      : `Re: ${originalSubject}`
    : "Re: Recruiting";
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(
    `Hi Coach,\n\nThank you for getting back to me.`,
  );
  const [sending, setSending] = useState(false);

  if (!open) return null;

  const send = async () => {
    if (!user) return;
    if (!fromAddress) {
      toast({ title: "Email alias missing", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-outreach-email", {
        body: { to: coachEmail, subject, body },
      });
      if (error || (data as any)?.error) {
        const msg = (data as any)?.message || (error as any)?.message || "Send failed";
        toast({ title: "Send failed", description: msg, variant: "destructive" });
        return;
      }
      await supabase.from("outreach_history").insert({
        user_id: user.id,
        coach_name: coachName || coachEmail,
        coach_title: null,
        school_name: schoolName || "",
        coach_email: coachEmail,
        subject,
        body,
        status: "replied",
        pipeline_stage: "in_conversation",
      } as any);
      toast({ title: "Reply sent" });
      onSent?.();
      onClose();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-3">
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div>
            <h3 className="font-semibold text-gray-900">Reply to {coachName || coachEmail}</h3>
            {fromAddress && (
              <p className="text-[11px] text-gray-500">From {fromAddress}</p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5 space-y-3 overflow-y-auto">
          <div>
            <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
              Coach's message
            </label>
            <div className="mt-1 rounded-md border border-gray-200 bg-gray-50 p-3 max-h-48 overflow-y-auto">
              {originalSubject && (
                <div className="text-xs font-semibold text-gray-700 mb-1">
                  {originalSubject}
                </div>
              )}
              {originalBody ? (
                <div className="text-sm text-gray-800 whitespace-pre-wrap">
                  {originalBody}
                </div>
              ) : (
                <div className="text-sm italic text-gray-500">
                  The coach's message body wasn't captured. Reply below to keep the conversation going.
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">To</label>
            <Input
              value={coachEmail}
              disabled
              className="mt-1 bg-gray-50 text-gray-700 border-gray-200"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Subject</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 bg-white text-gray-900 border-gray-300 placeholder:text-gray-400"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Message</label>
            <Textarea
              rows={10}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="mt-1 text-sm bg-white text-gray-900 border-gray-300 placeholder:text-gray-400"
            />
          </div>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={send} disabled={sending} className="bg-blue-600 hover:bg-blue-700 text-white">
            {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Send reply
          </Button>
        </div>
      </div>
    </div>
  );
}
