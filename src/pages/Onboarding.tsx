import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const POSITIONS = ["Point Guard", "Shooting Guard", "Small Forward", "Power Forward", "Center"];
const FEET_OPTIONS = [4, 5, 6, 7];
const INCHES_OPTIONS = Array.from({ length: 12 }, (_, i) => i);

const SKILL_OPTIONS = ["Shooting", "Ball Handling", "Defense", "Rebounding", "Passing / Playmaking", "Scoring"];
const WEAKNESS_OPTIONS = [...SKILL_OPTIONS, "Athleticism"];

const GOAL_OPTIONS = [
  "Make the Team",
  "Earn a Starting Spot",
  "Play at the Next Level (D1/D2/D3/JUCO)",
  "Play Professionally",
  "Improve My Overall Game",
];

const DAYS_OPTIONS = [1, 2, 3, 4, 5, 6, 7];
const HOURS_OPTIONS = ["30 min", "1 hour", "1.5 hours", "2+ hours"];

const TOTAL_STEPS = 5;

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1
  const [position, setPosition] = useState(profile?.position || "");
  const [feet, setFeet] = useState("");
  const [inches, setInches] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");

  // Step 2
  const [strengths, setStrengths] = useState<string[]>([]);

  // Step 3
  const [weaknesses, setWeaknesses] = useState<string[]>([]);

  // Step 4
  const [primaryGoal, setPrimaryGoal] = useState("");

  // Step 5
  const [trainingDays, setTrainingDays] = useState<number | null>(null);
  const [trainingHours, setTrainingHours] = useState("");

  const canAdvance = () => {
    switch (step) {
      case 1: return position && feet && inches !== "" && age && Number(age) >= 8 && Number(age) <= 60;
      case 2: return strengths.length >= 1;
      case 3: return weaknesses.length >= 1;
      case 4: return !!primaryGoal;
      case 5: return trainingDays !== null && !!trainingHours;
      default: return false;
    }
  };

  const toggleSelection = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) setStep(step + 1);
    else handleFinish();
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const heightStr = `${feet}'${inches}`;
      const { error } = await supabase
        .from("profiles")
        .update({
          position,
          height: heightStr,
          age: Number(age),
          phone: phone || null,
          strengths,
          weaknesses,
          primary_goal: primaryGoal,
          training_days_per_week: trainingDays,
          training_hours_per_session: trainingHours,
          onboarding_completed: true,
        } as any)
        .eq("id", user.id);

      if (error) throw error;
      await refreshProfile();
      navigate("/onboarding/results", { replace: true });
    } catch (err: any) {
      console.error("Onboarding save error:", err);
      toast.error("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const focusArea = weaknesses.length > 0
    ? `Focus: ${weaknesses.slice(0, 2).join(" & ")}`
    : "Focus: Overall Development";

  const progressPercent = (step / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress Bar */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-heading tracking-wider text-muted-foreground">
            Step {step} of {TOTAL_STEPS}
          </span>
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3 w-3" /> Back
            </button>
          )}
        </div>
        <Progress value={progressPercent} className="h-1.5 bg-muted" />
      </div>

      {/* Step Content */}
      <div className="flex-1 flex flex-col justify-center px-4 pb-24 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <h1 className="text-3xl font-heading text-foreground">Tell Us About Yourself</h1>
                  <p className="text-muted-foreground text-sm">Help us build your personal training plan.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-heading tracking-wider text-muted-foreground mb-1.5 block">Position</label>
                    <Select value={position} onValueChange={setPosition}>
                      <SelectTrigger className="h-12 text-base bg-card border-border">
                        <SelectValue placeholder="Select your position" />
                      </SelectTrigger>
                      <SelectContent>
                        {POSITIONS.map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-heading tracking-wider text-muted-foreground mb-1.5 block">Height</label>
                    <div className="grid grid-cols-2 gap-3">
                      <Select value={feet} onValueChange={setFeet}>
                        <SelectTrigger className="h-12 text-base bg-card border-border">
                          <SelectValue placeholder="Feet" />
                        </SelectTrigger>
                        <SelectContent>
                          {FEET_OPTIONS.map((f) => (
                            <SelectItem key={f} value={String(f)}>{f} ft</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={inches} onValueChange={setInches}>
                        <SelectTrigger className="h-12 text-base bg-card border-border">
                          <SelectValue placeholder="Inches" />
                        </SelectTrigger>
                        <SelectContent>
                          {INCHES_OPTIONS.map((i) => (
                            <SelectItem key={i} value={String(i)}>{i} in</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-heading tracking-wider text-muted-foreground mb-1.5 block">Age</label>
                    <Input
                      type="number"
                      min={8}
                      max={60}
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="Enter your age"
                      className="h-12 text-base bg-card border-border"
                    />
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-2">
                  <h1 className="text-3xl font-heading text-foreground">What Are Your Biggest Strengths?</h1>
                  <p className="text-muted-foreground text-sm">What do you do well on the court? Select all that apply.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {SKILL_OPTIONS.map((skill) => (
                    <button
                      key={skill}
                      onClick={() => toggleSelection(strengths, setStrengths, skill)}
                      className={`px-5 py-3 rounded-xl text-sm font-heading tracking-wider transition-all border ${
                        strengths.includes(skill)
                          ? "bg-primary text-primary-foreground border-primary glow-red"
                          : "bg-card text-foreground border-border hover:border-primary/40"
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="space-y-2">
                  <h1 className="text-3xl font-heading text-foreground">Where Do You Have Room to Grow?</h1>
                  <p className="text-muted-foreground text-sm">What part of your game needs the most work?</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {WEAKNESS_OPTIONS.map((skill) => (
                    <button
                      key={skill}
                      onClick={() => toggleSelection(weaknesses, setWeaknesses, skill)}
                      className={`px-5 py-3 rounded-xl text-sm font-heading tracking-wider transition-all border ${
                        weaknesses.includes(skill)
                          ? "bg-primary text-primary-foreground border-primary glow-red"
                          : "bg-card text-foreground border-border hover:border-primary/40"
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <div className="space-y-2">
                  <h1 className="text-3xl font-heading text-foreground">What's Your Main Goal?</h1>
                  <p className="text-muted-foreground text-sm">What are you training for?</p>
                </div>
                <div className="flex flex-col gap-3">
                  {GOAL_OPTIONS.map((goal) => (
                    <button
                      key={goal}
                      onClick={() => setPrimaryGoal(goal)}
                      className={`w-full px-5 py-4 rounded-xl text-left text-sm font-heading tracking-wider transition-all border flex items-center justify-between ${
                        primaryGoal === goal
                          ? "bg-primary text-primary-foreground border-primary glow-red"
                          : "bg-card text-foreground border-border hover:border-primary/40"
                      }`}
                    >
                      {goal}
                      {primaryGoal === goal && <ChevronRight className="h-4 w-4" />}
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 5 && (
              <>
                <div className="space-y-2">
                  <h1 className="text-3xl font-heading text-foreground">Your Training Schedule</h1>
                  <p className="text-muted-foreground text-sm">How much time can you put in?</p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-heading tracking-wider text-muted-foreground mb-3 block">Days Per Week</label>
                    <div className="flex gap-2">
                      {DAYS_OPTIONS.map((d) => (
                        <button
                          key={d}
                          onClick={() => setTrainingDays(d)}
                          className={`flex-1 py-3 rounded-xl text-sm font-heading transition-all border ${
                            trainingDays === d
                              ? "bg-primary text-primary-foreground border-primary glow-red"
                              : "bg-card text-foreground border-border hover:border-primary/40"
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-heading tracking-wider text-muted-foreground mb-3 block">Hours Per Session</label>
                    <div className="flex flex-wrap gap-3">
                      {HOURS_OPTIONS.map((h) => (
                        <button
                          key={h}
                          onClick={() => setTrainingHours(h)}
                          className={`px-5 py-3 rounded-xl text-sm font-heading tracking-wider transition-all border ${
                            trainingHours === h
                              ? "bg-primary text-primary-foreground border-primary glow-red"
                              : "bg-card text-foreground border-border hover:border-primary/40"
                          }`}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
        <div className="max-w-lg mx-auto">
          <Button
            onClick={handleNext}
            disabled={!canAdvance() || saving}
            className="w-full h-14 btn-cta bg-primary hover:bg-primary/90 glow-red-hover text-base"
          >
            {saving ? "Saving…" : step === TOTAL_STEPS ? "Let's Get to Work →" : (
              <span className="flex items-center gap-2">Next <ArrowRight className="h-4 w-4" /></span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
