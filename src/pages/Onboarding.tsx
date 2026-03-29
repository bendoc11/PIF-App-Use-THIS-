import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import OnboardingBackground from "@/components/onboarding/OnboardingBackground";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";
import ScreenHook from "@/components/onboarding/ScreenHook";
import ScreenUserType from "@/components/onboarding/ScreenUserType";
import ScreenBasicInfo from "@/components/onboarding/ScreenBasicInfo";
import ScreenGoal from "@/components/onboarding/ScreenGoal";
import ScreenStrengths from "@/components/onboarding/ScreenStrengths";
import ScreenSchedule from "@/components/onboarding/ScreenSchedule";
import BuildingPlanScreen from "@/components/onboarding/BuildingPlanScreen";

const TOTAL_STEPS = 6;

// Schedule templates based on goal
function generateSchedule(goal: string, daysPerWeek: number) {
  const sessionMap: Record<string, string[]> = {
    "Play Professionally": ["skill_workout", "shooting", "lifting", "shooting", "skill_workout", "lifting", "game"],
    "Play at the Next Level (D1/D2/D3/JUCO)": ["skill_workout", "shooting", "lifting", "shooting", "skill_workout", "game", "rest"],
    "Earn a Starting Spot": ["skill_workout", "shooting", "lifting", "skill_workout", "shooting", "rest", "rest"],
    "Make the Team": ["skill_workout", "shooting", "skill_workout", "shooting", "rest", "rest", "rest"],
    "Improve My Overall Game": ["skill_workout", "shooting", "skill_workout", "rest", "shooting", "rest", "rest"],
  };
  const sessions = sessionMap[goal] || sessionMap["Improve My Overall Game"];
  const templates: { day_of_week: number; session_type: string; order_index: number }[] = [];

  for (let i = 0; i < 7; i++) {
    if (i < daysPerWeek) {
      templates.push({ day_of_week: i, session_type: sessions[i % sessions.length], order_index: 0 });
    } else {
      templates.push({ day_of_week: i, session_type: "rest", order_index: 0 });
    }
  }
  return templates;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [showBuildingPlan, setShowBuildingPlan] = useState(false);

  // Collected data
  const [userType, setUserType] = useState<"player" | "parent">("player");
  const [firstName, setFirstName] = useState("");
  const [position, setPosition] = useState("");
  const [age, setAge] = useState("");
  const [feet, setFeet] = useState("");
  const [inches, setInches] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState("");
  const [strengths, setStrengths] = useState<string[]>([]);
  const [weaknesses, setWeaknesses] = useState<string[]>([]);
  const [trainingDays, setTrainingDays] = useState(0);
  const [trainingHours, setTrainingHours] = useState("");
  const [phone, setPhone] = useState("");

  const progress = showBuildingPlan ? 100 : (step / TOTAL_STEPS) * 100;

  const goNext = () => setStep((s) => s + 1);

  const handleUserType = (type: "player" | "parent") => {
    setUserType(type);
    setTimeout(goNext, 400);
  };

  const handleBasicInfo = (data: { firstName: string; position: string; age: string; feet: string; inches: string }) => {
    setFirstName(data.firstName);
    setPosition(data.position);
    setAge(data.age);
    setFeet(data.feet);
    setInches(data.inches);
    goNext();
  };

  const handleGoal = (goal: string) => {
    setPrimaryGoal(goal);
    goNext();
  };

  const handleStrengths = (s: string[], w: string[]) => {
    setStrengths(s);
    setWeaknesses(w);
    goNext();
  };

  const handleSchedule = async (data: { trainingDays: number; trainingHours: string; phone: string }) => {
    if (!user) return;
    setSaving(true);
    setTrainingDays(data.trainingDays);
    setTrainingHours(data.trainingHours);
    setPhone(data.phone);

    try {
      const heightStr = `${feet}'${inches}`;

      // Save profile data
      const { error } = await supabase
        .from("profiles")
        .update({
          user_type: userType,
          first_name: firstName,
          position,
          height: heightStr,
          age: Number(age),
          phone: data.phone || null,
          strengths,
          weaknesses,
          primary_goal: primaryGoal,
          training_days_per_week: data.trainingDays,
          training_hours_per_session: data.trainingHours,
          onboarding_completed: true,
        } as any)
        .eq("id", user.id);

      if (error) throw error;

      // Generate weekly schedule
      const schedule = generateSchedule(primaryGoal, data.trainingDays);
      // Delete existing schedule first
      await supabase.from("weekly_schedule_templates").delete().eq("user_id", user.id);
      // Insert new schedule
      const { error: schedError } = await supabase
        .from("weekly_schedule_templates")
        .insert(schedule.map((s) => ({ ...s, user_id: user.id })));
      if (schedError) throw schedError;

      // Show building plan animation
      setShowBuildingPlan(true);
    } catch (err: any) {
      toast.error("Failed to save. Please try again.");
      setSaving(false);
    }
  };

  const handleBuildingComplete = useCallback(async () => {
    await refreshProfile();
    navigate("/onboarding/results", { replace: true });
  }, [refreshProfile, navigate]);

  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  const [direction, setDirection] = useState(1);

  const goBack = () => {
    setDirection(-1);
    setStep((s) => Math.max(1, s - 1));
  };

  const handleStepChange = (newStep: number) => {
    setDirection(newStep > step ? 1 : -1);
    setStep(newStep);
  };

  // Override goNext to set direction
  const advanceStep = () => {
    setDirection(1);
    setStep((s) => s + 1);
  };

  // Rewire handlers to use advanceStep
  const handleUserTypeWrapped = (type: "player" | "parent") => {
    setUserType(type);
    setTimeout(() => { setDirection(1); setStep((s) => s + 1); }, 400);
  };

  const handleBasicInfoWrapped = (data: { firstName: string; position: string; age: string; feet: string; inches: string }) => {
    setFirstName(data.firstName);
    setPosition(data.position);
    setAge(data.age);
    setFeet(data.feet);
    setInches(data.inches);
    setDirection(1);
    setStep((s) => s + 1);
  };

  const handleGoalWrapped = (goal: string) => {
    setPrimaryGoal(goal);
    setDirection(1);
    setStep((s) => s + 1);
  };

  const handleStrengthsWrapped = (s: string[], w: string[]) => {
    setStrengths(s);
    setWeaknesses(w);
    setDirection(1);
    setStep((s) => s + 1);
  };

  if (showBuildingPlan) {
    return (
      <div className="relative">
        <OnboardingBackground />
        <OnboardingProgress progress={100} />
        <div className="relative z-10">
          <BuildingPlanScreen onComplete={handleBuildingComplete} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <OnboardingBackground />
      <OnboardingProgress progress={progress} />

      {/* Back button */}
      {step > 1 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={goBack}
          className="fixed top-6 left-5 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 backdrop-blur-sm border border-white/10 text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </motion.button>
      )}

      <div className="relative z-10">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          >
            {step === 1 && <ScreenHook onNext={() => { setDirection(1); setStep(2); }} />}
            {step === 2 && <ScreenUserType onSelect={handleUserTypeWrapped} />}
            {step === 3 && <ScreenBasicInfo userType={userType} onNext={handleBasicInfoWrapped} />}
            {step === 4 && <ScreenGoal onSelect={handleGoalWrapped} />}
            {step === 5 && <ScreenStrengths onNext={handleStrengthsWrapped} />}
            {step === 6 && <ScreenSchedule onSubmit={handleSchedule} saving={saving} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
