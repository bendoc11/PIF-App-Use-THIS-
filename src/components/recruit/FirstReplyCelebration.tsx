import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  repliesCount: number;
  contactedCount: number;
}

/**
 * Shows a one-time confetti celebration the first time a user has any
 * coach replies. Marks the moment on the profile so it never replays.
 */
export function FirstReplyCelebration({ repliesCount, contactedCount }: Props) {
  const { user, profile, refreshProfile } = useAuth();
  const [show, setShow] = useState(false);
  const [schoolName, setSchoolName] = useState<string>("");

  useEffect(() => {
    const p: any = profile;
    if (!p || !user) return;
    if (repliesCount > 0 && !p.first_reply_celebrated_at) {
      setShow(true);
      (async () => {
        const { data } = await supabase
          .from("outreach_history")
          .select("school_name, replied_at, sent_at")
          .eq("user_id", user.id)
          .eq("status", "replied")
          .order("replied_at", { ascending: false })
          .limit(1);
        if (data && data[0]?.school_name) setSchoolName(data[0].school_name as string);
      })();
    }
  }, [profile, user, repliesCount]);

  const dismiss = async () => {
    setShow(false);
    if (!user) return;
    await supabase
      .from("profiles")
      .update({ first_reply_celebrated_at: new Date().toISOString() } as any)
      .eq("id", user.id);
    refreshProfile?.();
  };

  if (!show) return null;
  const rate = contactedCount > 0 ? Math.round((repliesCount / contactedCount) * 100) : 0;

  // generate confetti pieces
  const pieces = Array.from({ length: 60 });
  const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-5 animate-fade-in">
      {/* Confetti */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {pieces.map((_, i) => {
          const left = Math.random() * 100;
          const delay = Math.random() * 0.6;
          const duration = 2 + Math.random() * 2;
          const size = 6 + Math.random() * 8;
          const color = colors[i % colors.length];
          return (
            <span
              key={i}
              style={{
                position: "absolute",
                top: "-20px",
                left: `${left}%`,
                width: `${size}px`,
                height: `${size * 1.6}px`,
                background: color,
                animation: `confetti-fall ${duration}s linear ${delay}s forwards`,
                transform: `rotate(${Math.random() * 360}deg)`,
                borderRadius: "2px",
                opacity: 0.9,
              }}
            />
          );
        })}
      </div>

      <div className="relative bg-white rounded-3xl max-w-md w-full p-8 text-center shadow-2xl animate-scale-in">
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="mx-auto h-14 w-14 rounded-full bg-gradient-to-br from-pif-red to-amber-500 flex items-center justify-center mb-4">
          <Sparkles className="h-7 w-7 text-white" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 leading-tight">
          A college coach wants to talk to you.
        </h2>
        <p className="mt-3 text-sm text-gray-600">
          You did the hard part — you put your name on a coach's desk and they answered.
          This is exactly how recruiting starts.
        </p>
        <div className="mt-5 bg-blue-50 rounded-xl p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-700">Your reply rate</p>
          <p className="text-5xl font-extrabold text-blue-700 mt-1 leading-none">{rate}%</p>
        </div>
        <button
          onClick={dismiss}
          className="mt-6 w-full h-12 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-semibold"
        >
          Read their reply
        </button>
      </div>

      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
