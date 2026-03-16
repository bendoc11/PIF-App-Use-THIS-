import { useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { SESSION_TYPE_LABELS, SESSION_TYPE_ICONS, type SessionType } from "@/lib/schedule-utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionType: SessionType;
  logDate?: string;
  onSaved: () => void;
}

const DURATION_OPTIONS = ["30 min", "45 min", "1 hour", "1.5 hours", "2+ hours"];
const DURATION_MAP: Record<string, number> = { "30 min": 30, "45 min": 45, "1 hour": 60, "1.5 hours": 90, "2+ hours": 120 };
const INTENSITY_OPTIONS = ["Light", "Moderate", "Hard"];
const WORKOUT_TYPE_OPTIONS = ["Skill Workout", "Got Shots Up", "Pickup", "1-on-1"];
const WORKOUT_TYPE_MAP: Record<string, string> = { "Skill Workout": "skill_workout", "Got Shots Up": "got_shots_up", "Pickup": "pickup", "1-on-1": "one_on_one" };

function PillSelect({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            value === opt
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function ShotRow({ label, makes, attempts, onMakes, onAttempts }: {
  label: string; makes: string; attempts: string;
  onMakes: (v: string) => void; onAttempts: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-24 shrink-0">{label}</span>
      <Input inputMode="numeric" placeholder="0" value={makes} onChange={(e) => onMakes(e.target.value)} className="h-9 text-center" />
      <span className="text-muted-foreground text-xs">/</span>
      <Input inputMode="numeric" placeholder="0" value={attempts} onChange={(e) => onAttempts(e.target.value)} className="h-9 text-center" />
    </div>
  );
}

export function ManualLogModal({ open, onOpenChange, sessionType, logDate, onSaved }: Props) {
  const { user } = useAuth();
  const [workoutType, setWorkoutType] = useState("Skill Workout");
  const [duration, setDuration] = useState("45 min");
  const [intensity, setIntensity] = useState("Moderate");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Shot tracking
  const [totalMakes, setTotalMakes] = useState("");
  const [totalAttempts, setTotalAttempts] = useState("");
  const [threeMakes, setThreeMakes] = useState("");
  const [threeAttempts, setThreeAttempts] = useState("");
  const [midMakes, setMidMakes] = useState("");
  const [midAttempts, setMidAttempts] = useState("");
  const [offDribbleMakes, setOffDribbleMakes] = useState("");
  const [offDribbleAttempts, setOffDribbleAttempts] = useState("");
  const [ftMakes, setFtMakes] = useState("");
  const [ftAttempts, setFtAttempts] = useState("");
  const [spotsOpen, setSpotsOpen] = useState(false);

  const isShootingForm = sessionType === "shooting" || workoutType === "Got Shots Up";
  const showWorkoutType = sessionType === "skill_workout" || sessionType === "pickup";
  const showIntensity = sessionType !== "mobility";
  const isMobility = sessionType === "mobility";

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const dateToLog = logDate || new Date().toISOString().split("T")[0];

    try {
      // Insert training log
      const { data: logData } = await supabase.from("training_logs").insert({
        user_id: user.id,
        log_date: dateToLog,
        session_type: sessionType,
        status: "completed",
        duration_minutes: DURATION_MAP[duration] || 45,
        intensity: showIntensity ? intensity.toLowerCase() : null,
        notes: notes || null,
        workout_type: showWorkoutType ? WORKOUT_TYPE_MAP[workoutType] || null : null,
      } as any).select().single();

      // Insert shot log if applicable
      if (isShootingForm && (parseInt(totalMakes) > 0 || parseInt(totalAttempts) > 0)) {
        await supabase.from("practice_shot_logs").insert({
          user_id: user.id,
          training_log_id: logData?.id || null,
          log_date: dateToLog,
          total_makes: parseInt(totalMakes) || null,
          total_attempts: parseInt(totalAttempts) || null,
          three_makes: parseInt(threeMakes) || null,
          three_attempts: parseInt(threeAttempts) || null,
          midrange_makes: parseInt(midMakes) || null,
          midrange_attempts: parseInt(midAttempts) || null,
          off_dribble_makes: parseInt(offDribbleMakes) || null,
          off_dribble_attempts: parseInt(offDribbleAttempts) || null,
          ft_makes: parseInt(ftMakes) || null,
          ft_attempts: parseInt(ftAttempts) || null,
        } as any);
      }

      toast({ title: "Session logged! 💪" });
      onSaved();
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setWorkoutType("Skill Workout");
    setDuration("45 min");
    setIntensity("Moderate");
    setNotes("");
    setTotalMakes(""); setTotalAttempts("");
    setThreeMakes(""); setThreeAttempts("");
    setMidMakes(""); setMidAttempts("");
    setOffDribbleMakes(""); setOffDribbleAttempts("");
    setFtMakes(""); setFtAttempts("");
    setSpotsOpen(false);
  };

  const title = `Log ${SESSION_TYPE_ICONS[sessionType]} ${SESSION_TYPE_LABELS[sessionType]} Session`;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle className="font-heading text-lg">{title}</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6 space-y-5 overflow-y-auto">
          {/* Workout Type */}
          {showWorkoutType && (
            <div className="space-y-2">
              <label className="text-xs font-heading tracking-wider text-muted-foreground">WORKOUT TYPE</label>
              <PillSelect options={WORKOUT_TYPE_OPTIONS} value={workoutType} onChange={setWorkoutType} />
            </div>
          )}

          {/* Duration */}
          <div className="space-y-2">
            <label className="text-xs font-heading tracking-wider text-muted-foreground">DURATION</label>
            <PillSelect options={DURATION_OPTIONS} value={duration} onChange={setDuration} />
          </div>

          {/* Intensity */}
          {showIntensity && (
            <div className="space-y-2">
              <label className="text-xs font-heading tracking-wider text-muted-foreground">INTENSITY</label>
              <PillSelect options={INTENSITY_OPTIONS} value={intensity} onChange={setIntensity} />
            </div>
          )}

          {/* Shooting section for Got Shots Up or Shooting session */}
          {isShootingForm && (
            <div className="space-y-3">
              <label className="text-xs font-heading tracking-wider text-muted-foreground">TRACK YOUR SHOTS (OPTIONAL)</label>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground mb-1 block">Makes</label>
                  <Input inputMode="numeric" placeholder="0" value={totalMakes} onChange={(e) => setTotalMakes(e.target.value)} className="h-10 text-center" />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground mb-1 block">Attempts</label>
                  <Input inputMode="numeric" placeholder="0" value={totalAttempts} onChange={(e) => setTotalAttempts(e.target.value)} className="h-10 text-center" />
                </div>
                {parseInt(totalAttempts) > 0 && (
                  <div className="text-center">
                    <label className="text-[10px] text-muted-foreground mb-1 block">%</label>
                    <span className="text-sm font-heading text-primary">
                      {Math.round((parseInt(totalMakes || "0") / parseInt(totalAttempts)) * 100)}%
                    </span>
                  </div>
                )}
              </div>

              <Collapsible open={spotsOpen} onOpenChange={setSpotsOpen}>
                <CollapsibleTrigger className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <ChevronDown className={`h-3 w-3 transition-transform ${spotsOpen ? "rotate-180" : ""}`} />
                  Break Down By Spot (Optional)
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 mt-3">
                  <ShotRow label="3-Pointers" makes={threeMakes} attempts={threeAttempts} onMakes={setThreeMakes} onAttempts={setThreeAttempts} />
                  <ShotRow label="Mid-Range" makes={midMakes} attempts={midAttempts} onMakes={setMidMakes} onAttempts={setMidAttempts} />
                  <ShotRow label="Off the Dribble" makes={offDribbleMakes} attempts={offDribbleAttempts} onMakes={setOffDribbleMakes} onAttempts={setOffDribbleAttempts} />
                  <ShotRow label="Free Throws" makes={ftMakes} attempts={ftAttempts} onMakes={setFtMakes} onAttempts={setFtAttempts} />
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-xs font-heading tracking-wider text-muted-foreground">NOTES</label>
            <textarea
              placeholder="What did you work on?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px] resize-none"
            />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full h-12 btn-cta bg-primary hover:bg-primary/90">
            {saving ? "Saving…" : "Save Session"}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
