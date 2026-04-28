import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function GmailCallback() {
  const navigate = useNavigate();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const errParam = params.get("error");

    const goError = (msg: string) =>
      navigate(`/settings?gmail=error&msg=${encodeURIComponent(msg)}`, { replace: true });

    if (errParam) return goError(errParam);
    if (!code || !state) return goError("missing_code_or_state");

    (async () => {
      try {
        const res = await supabase.functions.invoke("gmail-oauth-exchange", {
          body: { code, state },
        });
        if (res.error) {
          const msg = (res.data as any)?.error || res.error.message || "exchange_failed";
          return goError(msg);
        }
        const data = res.data as { success?: boolean; error?: string };
        if (!data?.success) return goError(data?.error || "exchange_failed");
        navigate("/settings?gmail=connected", { replace: true });
      } catch (e: any) {
        goError(e?.message || "unexpected");
      }
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="flex max-w-sm flex-col items-center text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <h1 className="mt-6 text-2xl font-heading text-foreground">Connecting Gmail</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Finishing up — you&apos;ll be back in the app in a moment.
        </p>
      </div>
    </div>
  );
}
