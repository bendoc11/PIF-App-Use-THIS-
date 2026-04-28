import { Mail, ArrowRight, Loader2 } from "lucide-react";
import { useGmailConnection } from "@/hooks/useGmailConnection";

/**
 * Persistent banner shown on the Dashboard whenever the user has not yet
 * connected their Gmail account. Cannot be dismissed — recruiting cannot
 * happen without it.
 */
export function GmailReminderBanner() {
  const { connected, loading, startConnect } = useGmailConnection();

  if (loading || connected) return null;

  return (
    <div className="rounded-xl border border-pif-red/40 bg-pif-red/10 px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <div className="h-9 w-9 rounded-full bg-pif-red/20 flex items-center justify-center shrink-0">
        <Mail className="h-4 w-4 text-pif-red" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground leading-tight">
          Connect your Gmail to start contacting coaches
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          You won't be able to send outreach until your Gmail is connected.
        </p>
      </div>
      <button
        onClick={startConnect}
        className="w-full sm:w-auto h-10 px-4 rounded-lg bg-pif-red hover:bg-pif-red/90 text-white text-sm font-semibold inline-flex items-center justify-center gap-1.5 shrink-0"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            Connect Gmail <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </div>
  );
}
