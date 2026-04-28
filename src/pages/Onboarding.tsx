import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

import OnboardingBackground from "@/components/onboarding/OnboardingBackground";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";

import StepBasic, { BasicData } from "@/components/onboarding/recruit/StepBasic";
import StepAthletic, { AthleticData } from "@/components/onboarding/recruit/StepAthletic";
import StepAcademic, { AcademicData } from "@/components/onboarding/recruit/StepAcademic";
import StepStory from "@/components/onboarding/recruit/StepStory";
import StepPhoto from "@/components/onboarding/recruit/StepPhoto";
import StepPrefs, { PrefsData } from "@/components/onboarding/recruit/StepPrefs";
import StepFilm from "@/components/onboarding/recruit/StepFilm";
import StepPreview from "@/components/onboarding/recruit/StepPreview";
import StepGmail from "@/components/onboarding/recruit/StepGmail";

const TOTAL_STEPS = 9;

// Field weights drive the live profile completion percentage.
const FIELD_WEIGHTS: Record<string, number> = {
  basic: 18,
  athletic: 16,
  academic: 14,
  story: 14,
  photo: 12,
  prefs: 10,
  film: 16,
};

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [saving, setSaving] = useState(false);

  // Hydrate initial values from existing profile so re-entry works.
  // CRITICAL: only hydrate from a profile that belongs to the currently
  // authenticated user. Otherwise a stale profile left over from a
  // previous session could leak someone else's answers into a brand
  // new account that just signed up in the same browser.
  const p: any = profile && user && (profile as any).id === user.id ? profile : {};
  const [basic, setBasic] = useState<BasicData>({
    firstName: p.first_name || "",
    lastName: p.last_name || "",
    gradYear: p.grad_year ? String(p.grad_year) : "",
    dob: p.date_of_birth || "",
    city: p.city || "",
    state: p.state || "",
  });

  const initialFeet = (p.height || "").split("'")[0] || "";
  const initialInches = ((p.height || "").split("'")[1] || "").replace(/[^0-9]/g, "") || "";
  const [athletic, setAthletic] = useState<AthleticData>({
    positions: Array.isArray(p.positions) && p.positions.length ? p.positions : p.position ? [p.position] : [],
    jerseyNumber: p.jersey_number || "",
    feet: initialFeet,
    inches: initialInches,
    weight: (p.weight || "").replace(/[^0-9]/g, ""),
    dominantHand: p.dominant_hand || "",
  });

  const [academic, setAcademic] = useState<AcademicData>({
    highSchool: p.high_school_name || "",
    gpa: p.gpa ? String(p.gpa) : "",
    satScore: p.sat_score ? String(p.sat_score) : "",
    actScore: p.act_score ? String(p.act_score) : "",
    intendedMajor: p.intended_major || "",
  });

  const [story, setStory] = useState<string>(p.bio || "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(p.avatar_url || null);

  const [prefs, setPrefs] = useState<PrefsData>({
    targetDivision: p.target_division || "",
    geoPreference: p.geo_preference || "",
    recruitingTimeline: p.recruiting_timeline || "",
  });

  const [film, setFilm] = useState<string>(p.highlight_film_url || "");

  // If the authenticated user id changes while Onboarding is mounted
  // (sign out then sign up in the same tab), reset every field so the
  // new account starts from a clean slate.
  const lastHydratedUserId = useRef<string | null>(user?.id ?? null);
  useEffect(() => {
    const uid = user?.id ?? null;
    if (!uid) return;
    if (lastHydratedUserId.current && lastHydratedUserId.current !== uid) {
      setStep(1);
      setBasic({ firstName: "", lastName: "", gradYear: "", dob: "", city: "", state: "" });
      setAthletic({ positions: [], jerseyNumber: "", feet: "", inches: "", weight: "", dominantHand: "" });
      setAcademic({ highSchool: "", gpa: "", satScore: "", actScore: "", intendedMajor: "" });
      setStory("");
      setAvatarUrl(null);
      setPrefs({ targetDivision: "", geoPreference: "", recruitingTimeline: "" });
      setFilm("");
    }
    lastHydratedUserId.current = uid;
  }, [user?.id]);

  // Live profile completion %
  const completion = useMemo(() => {
    let pct = 0;
    if (basic.firstName && basic.lastName && basic.gradYear && basic.dob && basic.city && basic.state) {
      pct += FIELD_WEIGHTS.basic;
    }
    if (athletic.positions.length && athletic.feet && athletic.inches !== "" && athletic.weight && athletic.dominantHand) {
      pct += FIELD_WEIGHTS.athletic;
    }
    if (academic.highSchool && academic.gpa && academic.intendedMajor) pct += FIELD_WEIGHTS.academic;
    if (story.trim().length >= 40) pct += FIELD_WEIGHTS.story;
    if (avatarUrl) pct += FIELD_WEIGHTS.photo;
    if (prefs.targetDivision && prefs.geoPreference && prefs.recruitingTimeline) pct += FIELD_WEIGHTS.prefs;
    if (film) pct += FIELD_WEIGHTS.film;
    return Math.min(100, pct);
  }, [basic, athletic, academic, story, avatarUrl, prefs, film]);

  const progressBar = step === TOTAL_STEPS ? 100 : ((step - 1) / TOTAL_STEPS) * 100 + completion / TOTAL_STEPS;

  const advance = () => {
    setDirection(1);
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  };
  const back = () => {
    setDirection(-1);
    setStep((s) => Math.max(1, s - 1));
  };

  // Save partial profile after each step so progress is never lost.
  const persist = useCallback(
    async (patch: Record<string, any>) => {
      if (!user) return;
      const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
      if (error) {
        console.error("[onboarding] save failed", error);
        toast.error("Couldn't save that step. Check your connection and try again.");
        throw error;
      }
    },
    [user]
  );

  const handleBasic = async (d: BasicData) => {
    setBasic(d);
    try {
      await persist({
        first_name: d.firstName,
        last_name: d.lastName,
        grad_year: Number(d.gradYear),
        date_of_birth: d.dob,
        city: d.city,
        state: d.state,
      });
      advance();
    } catch {}
  };

  const handleAthletic = async (d: AthleticData) => {
    setAthletic(d);
    try {
      await persist({
        positions: d.positions,
        position: d.positions[0] || null,
        jersey_number: d.jerseyNumber || null,
        height: `${d.feet}'${d.inches}`,
        weight: d.weight ? `${d.weight} lbs` : null,
        dominant_hand: d.dominantHand,
      });
      advance();
    } catch {}
  };

  const handleAcademic = async (d: AcademicData) => {
    setAcademic(d);
    try {
      await persist({
        high_school_name: d.highSchool,
        gpa: Number(d.gpa),
        sat_score: d.satScore ? Number(d.satScore) : null,
        act_score: d.actScore ? Number(d.actScore) : null,
        intended_major: d.intendedMajor,
      });
      advance();
    } catch {}
  };

  const handleStory = async (bio: string) => {
    setStory(bio);
    try {
      await persist({ bio });
      advance();
    } catch {}
  };

  const handlePhoto = async (url: string) => {
    setAvatarUrl(url);
    try {
      await persist({ avatar_url: url });
      advance();
    } catch {}
  };

  const handlePrefs = async (d: PrefsData) => {
    setPrefs(d);
    try {
      await persist({
        target_division: d.targetDivision,
        geo_preference: d.geoPreference,
        recruiting_timeline: d.recruitingTimeline,
      });
      advance();
    } catch {}
  };

  const handleFilm = async (url: string) => {
    setFilm(url);
    try {
      await persist({ highlight_film_url: url });
      advance();
    } catch {}
  };

  const handleFinish = async () => {
    if (!user || saving) return;
    setSaving(true);
    try {
      await persist({ onboarding_completed: true, recruit_onboarding_completed: true });
      await refreshProfile();
      navigate("/dashboard", { replace: true });
    } catch {
      setSaving(false);
    }
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  const identifier = (p.username && String(p.username).trim()) || user?.id || "your-profile";

  return (
    <div className="relative overflow-hidden">
      <OnboardingBackground />
      <OnboardingProgress progress={Math.round(progressBar)} />

      {step > 1 && step < TOTAL_STEPS && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={back}
          className="fixed top-6 left-5 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 backdrop-blur-sm border border-white/10 text-foreground"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </motion.button>
      )}

      {/* Live completion pill */}
      <div className="fixed top-5 right-5 z-50 px-3 py-1.5 rounded-full bg-card/80 backdrop-blur-sm border border-border text-[11px] font-heading tracking-wider text-foreground">
        {completion}% PROFILE
      </div>

      <div className="relative z-10">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            {step === 1 && <StepBasic initial={basic} onNext={handleBasic} />}
            {step === 2 && <StepAthletic initial={athletic} onNext={handleAthletic} />}
            {step === 3 && <StepAcademic initial={academic} onNext={handleAcademic} />}
            {step === 4 && <StepStory initial={story} onNext={handleStory} />}
            {step === 5 && (
              <StepPhoto
                initialUrl={avatarUrl}
                onNext={handlePhoto}
                onSkip={advance}
              />
            )}
            {step === 6 && <StepPrefs initial={prefs} onNext={handlePrefs} />}
            {step === 7 && (
              <StepFilm initial={film} onNext={handleFilm} onSkip={advance} />
            )}
            {step === 8 && (
              <StepGmail onConnected={advance} onSkip={advance} />
            )}
            {step === 9 && (
              <StepPreview
                data={{
                  firstName: basic.firstName,
                  lastName: basic.lastName,
                  position: athletic.positions[0] || "",
                  height: athletic.feet && athletic.inches !== "" ? `${athletic.feet}'${athletic.inches}"` : "",
                  city: basic.city,
                  state: basic.state,
                  gradYear: basic.gradYear,
                  gpa: academic.gpa,
                  avatarUrl,
                  identifier,
                  completion,
                }}
                onFinish={handleFinish}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
