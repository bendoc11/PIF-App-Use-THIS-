import { Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGmailConnection } from "@/hooks/useGmailConnection";

interface Props {
  variant?: "panel" | "inline";
  title?: string;
}

export function ConnectGmailPrompt({ variant = "panel", title }: Props) {
  const { startConnect, loading } = useGmailConnection();

  return (
    <div
      className={
        variant === "panel"
          ? "bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
          : "bg-pif-red/5 border border-pif-red/20 rounded-xl p-4"
      }
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-pif-red/10 flex items-center justify-center shrink-0">
          <Mail className="h-5 w-5 text-pif-red" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900">
            {title ?? "Connect your Gmail to start reaching out to coaches"}
          </h3>
          <p className="text-sm text-gray-600 mt-1 leading-relaxed">
            Your emails will come from your own address — coaches are more likely to
            open and respond to a real person's email than a platform message.
          </p>
          <Button
            onClick={startConnect}
            disabled={loading}
            className="mt-4 bg-pif-red hover:bg-pif-red/90 text-white font-semibold h-11 px-5 w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Checking…
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" /> Connect Gmail
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
