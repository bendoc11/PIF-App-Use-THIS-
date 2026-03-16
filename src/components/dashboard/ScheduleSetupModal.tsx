import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  type SessionType,
  SESSION_TYPE_LABELS,
  SESSION_TYPE_ICONS,
  DAY_LABELS,
  ALL_SESSION_TYPES,
} from "@/lib/schedule-utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recommended: SessionType[];
  onSave: (schedule: SessionType[]) => Promise<void>;
}

export function ScheduleSetupModal({ open, onOpenChange, recommended, onSave }: Props) {
  const [schedule, setSchedule] = useState<SessionType[]>(recommended);
  const [saving, setSaving] = useState(false);

  const handleChange = (dayIndex: number, value: SessionType) => {
    const next = [...schedule];
    next[dayIndex] = value;
    setSchedule(next);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(schedule);
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading">Your Weekly Schedule</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            We built this based on your goals. Adjust anything, then lock it in.
          </p>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {DAY_LABELS.map((day, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-10 text-sm font-heading text-muted-foreground">{day}</span>
              <div className="flex-1 flex gap-1.5 flex-wrap">
                {ALL_SESSION_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => handleChange(i, type)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      schedule[i] === type
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {SESSION_TYPE_ICONS[type]} {SESSION_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full mt-4 btn-cta bg-primary hover:bg-primary/90 h-12"
        >
          {saving ? "Saving…" : "Looks Good — Start Training →"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
