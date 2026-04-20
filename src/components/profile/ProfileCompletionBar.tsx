import { AlertTriangle, Check } from "lucide-react";

interface Props {
  completion: number;
  missingRequired: string[];
}

export function ProfileCompletionBar({ completion, missingRequired }: Props) {
  const color = completion >= 80 ? "bg-pif-green" : completion >= 50 ? "bg-pif-gold" : "bg-primary";

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-heading text-xs tracking-widest text-muted-foreground">PROFILE COMPLETION</span>
        <span className="font-heading text-lg text-foreground">{completion}%</span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${completion}%` }}
        />
      </div>
      {missingRequired.length > 0 && (
        <div className="mt-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-pif-gold shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            <span className="text-pif-gold font-medium">Required for outreach:</span>{" "}
            {missingRequired.join(", ")}
          </p>
        </div>
      )}
      {missingRequired.length === 0 && (
        <div className="mt-3 flex items-center gap-2">
          <Check className="h-4 w-4 text-pif-green" />
          <p className="text-xs text-pif-green font-medium">Ready to send outreach emails</p>
        </div>
      )}
    </div>
  );
}
