import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";
import {
  type SessionType,
  type ScheduleRow,
  SESSION_TYPE_LABELS,
  SESSION_TYPE_ICONS,
  SESSION_TYPE_COLORS,
  DAY_LABELS_FULL,
  ALL_SESSION_TYPES,
  getSessionsForDay,
} from "@/lib/schedule-utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recommended: ScheduleRow[];
  primaryGoal: string | null;
  onSave: (schedule: ScheduleRow[]) => Promise<void>;
}

export function ScheduleSetupModal({ open, onOpenChange, recommended, primaryGoal, onSave }: Props) {
  const [schedule, setSchedule] = useState<ScheduleRow[]>(recommended);
  const [saving, setSaving] = useState(false);
  const [editingDay, setEditingDay] = useState<number | null>(null);

  const handleRemoveSession = (dow: number, orderIndex: number) => {
    const next = schedule.filter(
      (r) => !(r.day_of_week === dow && r.order_index === orderIndex)
    );
    // Re-index remaining sessions for this day
    let idx = 0;
    const reindexed = next.map((r) => {
      if (r.day_of_week === dow) {
        return { ...r, order_index: idx++ };
      }
      return r;
    });
    setSchedule(reindexed);
  };

  const handleAddSession = (dow: number, type: SessionType) => {
    const daySessions = getSessionsForDay(schedule, dow);
    if (daySessions.length >= 4) return;
    // If adding a non-rest session and day only has rest, remove rest first
    if (type !== "rest") {
      const onlyRest = daySessions.length === 1 && daySessions[0].session_type === "rest";
      if (onlyRest) {
        const filtered = schedule.filter((r) => r.day_of_week !== dow);
        setSchedule([...filtered, { day_of_week: dow, session_type: type, order_index: 0 }]);
        return;
      }
    }
    setSchedule([
      ...schedule,
      { day_of_week: dow, session_type: type, order_index: daySessions.length },
    ]);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(schedule);
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading">YOUR TRAINING SCHEDULE</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Built for your goal: <span className="text-foreground font-medium">{primaryGoal || "Improve My Overall Game"}</span>. Customize anything.
          </p>
        </DialogHeader>

        <div className="space-y-2 mt-2">
          {Array.from({ length: 7 }, (_, dow) => {
            const daySessions = getSessionsForDay(schedule, dow);
            const isEditing = editingDay === dow;

            return (
              <div key={dow} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-sm font-heading font-bold text-foreground w-10 shrink-0">
                      {DAY_LABELS_FULL[dow]}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {daySessions.length === 0 ? (
                        <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground">
                          {SESSION_TYPE_ICONS.rest} Rest
                        </span>
                      ) : (
                        daySessions.map((s) => (
                          <span
                            key={`${s.day_of_week}-${s.order_index}`}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium ${SESSION_TYPE_COLORS[s.session_type]}`}
                          >
                            {SESSION_TYPE_ICONS[s.session_type]} {SESSION_TYPE_LABELS[s.session_type]}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground shrink-0"
                    onClick={() => setEditingDay(isEditing ? null : dow)}
                  >
                    {isEditing ? "Done" : "Edit"}
                  </Button>
                </div>

                {isEditing && (
                  <div className="mt-3 pt-3 border-t border-border space-y-3">
                    {/* Current sessions as removable pills */}
                    <div className="flex flex-wrap gap-1.5">
                      {daySessions.map((s) => (
                        <button
                          key={`edit-${s.day_of_week}-${s.order_index}`}
                          onClick={() => handleRemoveSession(dow, s.order_index)}
                          className={`px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 ${SESSION_TYPE_COLORS[s.session_type]}`}
                        >
                          {SESSION_TYPE_ICONS[s.session_type]} {SESSION_TYPE_LABELS[s.session_type]}
                          <X className="h-3 w-3 ml-1" />
                        </button>
                      ))}
                    </div>

                    {/* Add session picker */}
                    {daySessions.length < 4 && (
                      <div className="flex flex-wrap gap-1.5">
                        {ALL_SESSION_TYPES.filter(
                          (t) => !daySessions.some((s) => s.session_type === t)
                        ).map((type) => (
                          <button
                            key={type}
                            onClick={() => handleAddSession(dow, type)}
                            className="px-2.5 py-1.5 rounded-md text-xs font-medium bg-muted/50 text-muted-foreground hover:bg-muted transition-colors flex items-center gap-1"
                          >
                            <Plus className="h-3 w-3" />
                            {SESSION_TYPE_ICONS[type]} {SESSION_TYPE_LABELS[type]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full mt-4 btn-cta bg-primary hover:bg-primary/90 h-12"
        >
          {saving ? "Saving…" : "LOOKS GOOD — START TRAINING →"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
