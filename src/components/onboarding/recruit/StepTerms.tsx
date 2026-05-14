import { useState } from "react";
import StepShell, { PrimaryCTA } from "./StepShell";
import { Check } from "lucide-react";

interface Props {
  onAgree: () => void | Promise<void>;
}

export default function StepTerms({ onAgree }: Props) {
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleAgree = async () => {
    if (!checked || submitting) return;
    setSubmitting(true);
    try {
      await onAgree();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StepShell
      eyebrow="ONE LAST THING"
      title="Terms of Service"
      subtitle="Please read and acknowledge before continuing."
      footer={
        <>
          <label
            htmlFor="terms-ack"
            className={`flex items-start gap-3 mb-4 cursor-pointer select-none rounded-xl border p-3 transition-colors ${
              checked ? "border-primary bg-primary/5" : "border-border bg-card"
            }`}
          >
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors ${
                checked ? "bg-primary border-primary text-primary-foreground" : "border-border bg-background"
              }`}
              aria-hidden
            >
              {checked && <Check className="h-4 w-4" strokeWidth={3} />}
            </span>
            <input
              id="terms-ack"
              type="checkbox"
              className="sr-only"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
            />
            <span className="text-sm leading-snug text-foreground">
              I understand that Play it Forward does not guarantee coach responses or
              recruiting outcomes, and I agree to the Terms of Service above.
            </span>
          </label>
          <PrimaryCTA onClick={handleAgree} disabled={!checked || submitting}>
            {submitting ? "Saving..." : "I Agree & Continue"}
          </PrimaryCTA>
        </>
      }
    >
      <div className="rounded-2xl border border-border bg-card p-5 max-h-[55vh] overflow-y-auto text-sm text-foreground/90 leading-relaxed space-y-4">
        <h2 className="font-heading text-base text-foreground">
          Play it Forward — Terms of Service &amp; Disclaimer
        </h2>
        <p>By using Play it Forward, you agree to the following:</p>

        <div>
          <p className="font-semibold text-foreground">1. No Guarantee of Results.</p>
          <p>
            Play it Forward provides tools to help student-athletes contact college coaches.
            We do not guarantee that any coach will respond to your outreach, that you will
            receive an offer of admission, an athletic scholarship, or any form of recruitment
            interest. Results vary significantly based on athletic ability, academic profile,
            timing, roster needs, and factors entirely outside our control.
          </p>
        </div>

        <div>
          <p className="font-semibold text-foreground">2. Nature of Coach Outreach.</p>
          <p>
            Contacting college coaches via email is a form of cold outreach. The majority of
            coaches receive a high volume of athlete emails and are unable to respond to every
            message. A lack of response does not indicate a failure of the platform.
          </p>
        </div>

        <div>
          <p className="font-semibold text-foreground">3. Subscription &amp; Billing.</p>
          <p>
            Your subscription grants access to platform features including the coach replies
            inbox. You may cancel at any time. Cancellation takes effect at the end of your
            current billing period. No refunds are issued for partial months.
          </p>
        </div>

        <div>
          <p className="font-semibold text-foreground">4. Accuracy of Information.</p>
          <p>
            Play it Forward maintains a database of college coaching staff. Coaching personnel
            changes frequently. We do not guarantee that every contact in our database is
            current or accurate.
          </p>
        </div>

        <div>
          <p className="font-semibold text-foreground">5. Your Responsibility.</p>
          <p>
            You are responsible for the content of any messages sent to coaches through this
            platform. Play it Forward is not liable for any communications sent on your behalf.
          </p>
        </div>

        <p className="pt-1">
          By checking the box below and continuing, you confirm you have read and agree to
          these terms.
        </p>
      </div>
    </StepShell>
  );
}
