import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Target, Mail, TrendingUp, Check, AlertCircle, ArrowRight, Sparkles } from "lucide-react";

interface Props {
  onClose: () => void;
}

const PROFILE_FIELDS: { key: string; label: string }[] = [
  { key: "first_name", label: "Name" },
  { key: "grad_year", label: "Grad year" },
  { key: "position", label: "Position" },
  { key: "height", label: "Height" },
  { key: "gpa", label: "GPA" },
  { key: "high_school_name", label: "High school" },
  { key: "city", label: "City / state" },
  { key: "highlight_film_url", label: "Highlight film link" },
];

export function RecruitOnboarding({ onClose }: Props) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  const fieldStatus = useMemo(() => {
    const p: any = profile ?? {};
    return PROFILE_FIELDS.map((f) => ({
      ...f,
      filled: p[f.key] != null && p[f.key] !== "" && p[f.key] !== 0 ? true : !!p[f.key],
    }));
  }, [profile]);

  const completeCount = fieldStatus.filter((f) => f.filled).length;

  const finish = async (goToSettings: boolean) => {
    if (user) {
      await supabase
        .from("profiles")
        .update({ recruit_onboarding_completed: true })
        .eq("id", user.id);
    }
    onClose();
    if (goToSettings) navigate("/settings");
  };

  const next = () => {
    setDirection("forward");
    setStep((s) => Math.min(s + 1, 2));
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col animate-fade-in overflow-y-auto">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50/40 pointer-events-none" />

      <div className="relative flex-1 flex items-center justify-center p-6">
        <div
          key={step}
          className={`w-full max-w-3xl ${direction === "forward" ? "animate-fade-in" : "animate-fade-in"}`}
        >
          {step === 0 && <WelcomeStep onNext={next} />}
          {step === 1 && <HowItWorksStep onNext={next} />}
          {step === 2 && (
            <ProfileCheckStep
              fieldStatus={fieldStatus}
              completeCount={completeCount}
              total={PROFILE_FIELDS.length}
              onComplete={() => finish(true)}
              onSkip={() => finish(false)}
            />
          )}
        </div>
      </div>

      {/* Step indicator */}
      <div className="relative pb-8 flex justify-center gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === step ? "w-8 bg-gray-900" : i < step ? "w-1.5 bg-gray-400" : "w-1.5 bg-gray-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------- Step 1: Welcome ---------- */
function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-900 text-white text-xs font-medium mb-8">
        <Sparkles className="h-3 w-3" />
        Play it Forward · Recruiting
      </div>
      <h1 className="text-5xl sm:text-6xl font-semibold text-gray-900 tracking-tight leading-tight">
        Your recruiting journey
        <br />
        starts here.
      </h1>
      <p className="mt-6 text-lg text-gray-500 max-w-xl mx-auto">
        We'll help you contact every college coach in the country — directly from your own email.
      </p>
      <Button
        onClick={onNext}
        size="lg"
        className="mt-10 bg-gray-900 hover:bg-gray-800 text-white px-8 h-12 text-base rounded-full"
      >
        Let's Go
        <ArrowRight className="h-4 w-4 ml-1.5" />
      </Button>
    </div>
  );
}

/* ---------- Step 2: How it works ---------- */
function HowItWorksStep({ onNext }: { onNext: () => void }) {
  const cards = [
    {
      icon: Target,
      emoji: "🎯",
      title: "Find Your Schools",
      body: "Filter 1,800+ programs by division, state, and academics.",
      tint: "from-blue-50 to-blue-100/40",
    },
    {
      icon: Mail,
      emoji: "✉️",
      title: "Email Coaches Directly",
      body: "Send personalized emails from your own Gmail. Replies go straight to your inbox.",
      tint: "from-purple-50 to-purple-100/40",
    },
    {
      icon: TrendingUp,
      emoji: "📈",
      title: "Track Your Progress",
      body: "Monitor replies, offers, and your recruiting level all in one place.",
      tint: "from-orange-50 to-orange-100/40",
    },
  ];

  return (
    <div className="text-center">
      <h1 className="text-4xl sm:text-5xl font-semibold text-gray-900 tracking-tight">
        How it works
      </h1>
      <p className="mt-3 text-base text-gray-500">Three steps to your next opportunity.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 text-left">
        {cards.map((c) => (
          <div
            key={c.title}
            className={`bg-gradient-to-br ${c.tint} border border-gray-200/60 rounded-2xl p-6 hover:shadow-md transition-shadow`}
          >
            <div className="text-3xl mb-4">{c.emoji}</div>
            <h3 className="font-semibold text-gray-900 text-lg">{c.title}</h3>
            <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{c.body}</p>
          </div>
        ))}
      </div>

      <Button
        onClick={onNext}
        size="lg"
        className="mt-10 bg-gray-900 hover:bg-gray-800 text-white px-8 h-12 text-base rounded-full"
      >
        Got it, show me the schools
        <ArrowRight className="h-4 w-4 ml-1.5" />
      </Button>
    </div>
  );
}

/* ---------- Step 3: Profile check ---------- */
function ProfileCheckStep({
  fieldStatus,
  completeCount,
  total,
  onComplete,
  onSkip,
}: {
  fieldStatus: { key: string; label: string; filled: boolean }[];
  completeCount: number;
  total: number;
  onComplete: () => void;
  onSkip: () => void;
}) {
  const pct = Math.round((completeCount / total) * 100);
  return (
    <div className="text-center">
      <h1 className="text-4xl sm:text-5xl font-semibold text-gray-900 tracking-tight">
        Your profile powers your emails.
      </h1>
      <p className="mt-3 text-base text-gray-500">
        The more complete your profile, the better your outreach.
      </p>

      <div className="mt-8 max-w-xl mx-auto bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-900">Profile completeness</span>
          <span className="text-sm font-semibold text-gray-900 tabular-nums">{pct}%</span>
        </div>
        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden mb-5">
          <div
            className="h-full bg-gray-900 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-left">
          {fieldStatus.map((f) => (
            <li key={f.key} className="flex items-center gap-2 text-sm">
              {f.filled ? (
                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-100 text-green-700 shrink-0">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
              ) : (
                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-orange-100 text-orange-600 shrink-0">
                  <AlertCircle className="h-3 w-3" strokeWidth={3} />
                </span>
              )}
              <span className={f.filled ? "text-gray-700" : "text-gray-500"}>{f.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          onClick={onComplete}
          size="lg"
          className="bg-gray-900 hover:bg-gray-800 text-white px-6 h-12 rounded-full"
        >
          Complete my profile
          <ArrowRight className="h-4 w-4 ml-1.5" />
        </Button>
        <Button
          onClick={onSkip}
          variant="ghost"
          size="lg"
          className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 h-12 rounded-full"
        >
          Skip for now
        </Button>
      </div>
    </div>
  );
}
