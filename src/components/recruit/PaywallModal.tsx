import { Button } from "@/components/ui/button";
import { Lock, X } from "lucide-react";

const CHECKOUT_URL =
  "https://subscribe.playitforward.app/b/4gM00i4Wzc0g7w0buvcEw00";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export function PaywallModal({ open, onClose, title, subtitle }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-5"
         style={{ backgroundColor: "rgba(8, 13, 20, 0.85)" }}>
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-7 text-center shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-white/5 text-muted-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mx-auto h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center mb-4">
          <Lock className="h-5 w-5 text-primary" />
        </div>

        <h2 className="text-2xl font-heading text-foreground tracking-tight leading-tight">
          {title ?? "YOUR MESSAGE IS READY TO DELIVER"}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {subtitle ?? (
            <>
              Subscribe for <span className="text-foreground font-semibold">$29/month</span> to send it and unlock all <span className="text-foreground font-semibold">7,800+ coaches</span>.
            </>
          )}
        </p>

        <Button
          onClick={() => { window.location.href = CHECKOUT_URL; }}
          className="mt-6 w-full h-12 text-sm font-heading tracking-wider text-white border-0"
          style={{ backgroundColor: "#E8391D" }}
        >
          UNLOCK & SEND — $29/MONTH
        </Button>

        <p className="mt-3 text-[11px] text-muted-foreground">Cancel anytime.</p>
      </div>
    </div>
  );
}
