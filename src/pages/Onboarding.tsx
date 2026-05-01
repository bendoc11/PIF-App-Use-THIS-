import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const { user, profile, refreshProfile, refreshSubscription } = useAuth();

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [saving, setSaving] = useState(false);

  // Stripe success redirects here. Insert an active subscription row for
  // this user (idempotent: ignore the unique-violation if one already
  // exists), then refresh the in-memory subscription flag so the paywall
  // never re-appears.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data: existing } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      if (!existing) {
        await supabase
          .from("subscriptions")
          .insert({ user_id: user.id, status: "active" });
      }
      await refreshSubscription();
    })();
    return () => {
      cancelled = true;
    };
  }, [user, refreshSubscription]);

  // Hydrate initial values from existing profile so re-entry works.
  // CRITICAL RULES:
  // 1. The profile must belong to the currently authenticated user.
  // 2. We only pre-fill if the user has ALREADY completed onboarding once
  //    (i.e. they're editing). For a brand-new subscriber landing here from
  //    Stripe for the first time, every field must start empty so leftover
  //    values from a previous tester in the same browser never leak in.
  const profileBelongsToUser = !!(profile && user && (profile as any).id === user.id);
  const hasCompletedOnboarding = profileBelongsToUser && (profile as any).onboarding_completed === true;
  const p: any = hasCompletedOnboarding ? profile : {};
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

  // Reset every field whenever the authenticated user changes. For brand
  // new subscribers we also wipe any stale state — but unlike before we DO
  // hydrate from the saved profile if partial onboarding data exists, so
  // the user resumes where they left off.
  const lastHydratedUserId = useRef<string | null>(user?.id ?? null);
  const didResume = useRef(false);
  useEffect(() => {
    const uid = user?.id ?? null;
    if (!uid) return;
    const userChanged = lastHydratedUserId.current && lastHydratedUserId.current !== uid;
    const profileLoaded = !!profile && (profile as any).id === uid;
    if (!profileLoaded) return;

    if (userChanged) {
      didResume.current = false;
    }
    if (didResume.current) {
      lastHydratedUserId.current = uid;
      return;
    }

    const pp: any = profile;
    // Hydrate from any saved fields (works whether onboarding was completed before or just partially).
    const hydratedBasic: BasicData = {
      firstName: pp.first_name || "",
      lastName: pp.last_name || "",
      gradYear: pp.grad_year ? String(pp.grad_year) : "",
      dob: pp.date_of_birth || "",
      city: pp.city || "",
      state: pp.state || "",
    };
    const feet = (pp.height || "").split("'")[0] || "";
    const inches = ((pp.height || "").split("'")[1] || "").replace(/[^0-9]/g, "") || "";
    const hydratedAthletic: AthleticData = {
      positions: Array.isArray(pp.positions) && pp.positions.length ? pp.positions : pp.position ? [pp.position] : [],
      jerseyNumber: pp.jersey_number || "",
      feet,
      inches,
      weight: (pp.weight || "").replace(/[^0-9]/g, ""),
      dominantHand: pp.dominant_hand || "",
    };
    const hydratedAcademic: AcademicData = {
      highSchool: pp.high_school_name || "",
      gpa: pp.gpa ? String(pp.gpa) : "",
      satScore: pp.sat_score ? String(pp.sat_score) : "",
      actScore: pp.act_score ? String(pp.act_score) : "",
      intendedMajor: pp.intended_major || "",
    };
    const hydratedStory = pp.bio || "";
    const hydratedAvatar = pp.avatar_url || null;
    const hydratedPrefs: PrefsData = {
      targetDivision: pp.target_division || "",
      geoPreference: pp.geo_preference || "",
      recruitingTimeline: pp.recruiting_timeline || "",
    };
    const hydratedFilm = pp.highlight_film_url || "";

    setBasic(hydratedBasic);
    setAthletic(hydratedAthletic);
    setAcademic(hydratedAcademic);
    setStory(hydratedStory);
    setAvatarUrl(hydratedAvatar);
    setPrefs(hydratedPrefs);
    setFilm(hydratedFilm);

    // Determine resume step: find the first step whose data isn't fully filled.
    const stepComplete: boolean[] = [
      // Step 1: basic
      !!(hydratedBasic.firstName && hydratedBasic.lastName && hydratedBasic.gradYear && hydratedBasic.dob && hydratedBasic.city && hydratedBasic.state),
      // Step 2: athletic
      !!(hydratedAthletic.positions.length && hydratedAthletic.feet && hydratedAthletic.inches !== "" && hydratedAthletic.weight && hydratedAthletic.dominantHand),
      // Step 3: academic
      !!(hydratedAcademic.highSchool && hydratedAcademic.gpa && hydratedAcademic.intendedMajor),
      // Step 4: story
      hydratedStory.trim().length >= 40,
      // Step 5: photo (optional — count as complete if either skipped previously or present)
      !!hydratedAvatar,
      // Step 6: prefs
      !!(hydratedPrefs.targetDivision && hydratedPrefs.geoPreference && hydratedPrefs.recruitingTimeline),
      // Step 7: film (optional)
      !!hydratedFilm,
      // Step 8: gmail (no profile field — never auto-complete)
      false,
    ];

    let resumeStep = 1;
    for (let i = 0; i < stepComplete.length; i++) {
      if (stepComplete[i]) {
        resumeStep = i + 2; // jump past the last completed step
      } else {
        break;
      }
    }
    // Cap at last step
    resumeStep = Math.min(TOTAL_STEPS, Math.max(1, resumeStep));
    setStep(resumeStep);

    didResume.current = true;
    lastHydratedUserId.current = uid;
  }, [user?.id, profile]);

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
    } catch {
      setSaving(false);
      return;
    }
    // Navigate immediately so the user never sees a blank screen, even if
    // the background profile refresh is slow or fails.
    navigate("/dashboard", { replace: true });
    // Fire-and-forget so other pages see the updated profile.
    refreshProfile().catch(() => {});
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  const identifier = (p.username && String(p.username).trim()) || user?.id || "your-profile";

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden" style={{ backgroundColor: "#080D14" }}>
      <OnboardingBackground />
      <OnboardingProgress
        progress={Math.round(progressBar)}
        currentStep={step}
        totalSteps={TOTAL_STEPS}
      />

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
