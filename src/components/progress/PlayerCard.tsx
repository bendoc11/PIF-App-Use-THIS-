import { motion } from "framer-motion";
import { Flame, Dribbble, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePlayerRatings } from "@/hooks/usePlayerRatings";
import { format } from "date-fns";


function Counter({ target, duration, delay }: { target: number; duration: number; delay: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      let start = 0;
      const step = Math.max(1, Math.ceil(target / (duration * 30)));
      const interval = setInterval(() => {
        start += step;
        if (start >= target) {
          setDisplay(target);
          clearInterval(interval);
        } else {
          setDisplay(start);
        }
      }, 1000 / 30);
      return () => clearInterval(interval);
    }, delay * 1000);
    return () => clearTimeout(timer);
  }, [target, duration, delay]);

  return <>{display}</>;
}

import { useEffect, useState } from "react";

function SkillBar({ label, value, delay }: { label: string; value: number; delay: number }) {
  return (
    <div className="flex-1 bg-card/50 rounded-xl p-3 border border-border/50">
      <p className="text-[10px] font-heading tracking-widest text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-heading text-foreground mb-2">
        <Counter target={value} duration={0.8} delay={delay} />
      </p>
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(value, 99)}%` }}
          transition={{ duration: 0.8, delay, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function StatCell({ value, label, delay }: { value: string; label: string; delay: number }) {
  return (
    <motion.div
      className="text-center"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <p className="text-xl md:text-2xl font-heading text-foreground">{value}</p>
      <p className="text-[10px] font-heading tracking-widest text-muted-foreground">{label}</p>
    </motion.div>
  );
}

export function PlayerCard() {
  const { profile } = useAuth();
  const { ratings, gameAverages, loading } = usePlayerRatings();

  if (loading || !ratings) {
    return (
      <div className="rounded-2xl bg-card border border-border p-6 animate-pulse">
        <div className="h-48 bg-muted rounded-xl" />
      </div>
    );
  }

  const initials = [profile?.first_name?.[0], profile?.last_name?.[0]].filter(Boolean).join("").toUpperCase() || "?";
  const playerName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Player";
  const memberSince = profile?.created_at ? format(new Date(profile.created_at), "MMM yyyy") : "";

  const goalMap: Record<string, string> = {
    "make the team": "Make the Team",
    "earn a starting spot": "Starting Spot",
    "play at the next level": "Next Level",
    "play professionally": "Go Pro",
  };
  const goalDisplay = profile?.primary_goal
    ? goalMap[profile.primary_goal.toLowerCase()] || profile.primary_goal
    : null;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-card via-card to-muted/30 border border-border overflow-hidden">
      {/* Top section: Overall + Avatar + Name */}
      <div className="p-5 pb-4 text-center space-y-3">
        {/* Overall Rating */}
        <div>
          <motion.p
            className="text-5xl md:text-6xl font-heading text-primary leading-none"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Counter target={ratings.overall} duration={1} delay={0} />
          </motion.p>
          <p className="text-[10px] font-heading tracking-[0.2em] text-muted-foreground mt-1">OVERALL</p>
        </div>

        {/* Avatar */}
        <div className="flex justify-center">
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-2 border-primary/30 bg-muted flex items-center justify-center overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={playerName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-heading text-primary">{initials}</span>
            )}
          </div>
        </div>

        {/* Name + Position */}
        <div>
          <h2 className="text-xl font-heading text-foreground">{playerName}</h2>
          <p className="text-xs text-muted-foreground">
            {[profile?.position, (profile as any)?.age ? `Age ${(profile as any).age}` : null].filter(Boolean).join(" · ")}
          </p>
          {goalDisplay && (
            <span className="inline-block mt-1.5 px-3 py-0.5 rounded-full text-[10px] font-heading tracking-wider bg-primary/10 text-primary border border-primary/20">
              {goalDisplay}
            </span>
          )}
        </div>
      </div>

      {/* Game Stats Row */}
      <div className="px-5 pb-4">
        <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
          <p className="text-[10px] font-heading tracking-[0.2em] text-muted-foreground text-center mb-3">SEASON AVERAGES</p>
          <div className="grid grid-cols-4 gap-2">
            <StatCell
              value={gameAverages.ppg !== null ? String(gameAverages.ppg) : "—"}
              label="PPG"
              delay={1.1}
            />
            <StatCell
              value={gameAverages.rpg !== null ? String(gameAverages.rpg) : "—"}
              label="RPG"
              delay={1.2}
            />
            <StatCell
              value={gameAverages.apg !== null ? String(gameAverages.apg) : "—"}
              label="APG"
              delay={1.3}
            />
            <StatCell
              value={gameAverages.fgPct !== null ? `${gameAverages.fgPct}%` : "—"}
              label="FG%"
              delay={1.4}
            />
          </div>
        </div>
      </div>

      {/* Skill Ratings */}
      <div className="px-5 pb-4">
        <div className="flex gap-2">
          <SkillBar label="BALL HANDLING" value={ratings.ball_handling} delay={0.3} />
          <SkillBar label="SHOOTING" value={ratings.shooting} delay={0.4} />
          <SkillBar label="FINISHING" value={ratings.finishing} delay={0.5} />
        </div>
      </div>

      {/* Bottom Strip */}
      <div className="px-5 pb-4">
        <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Flame className="h-3.5 w-3.5 text-primary" />
            <span className="font-heading">{profile?.streak_days || 0}</span> Day Streak
          </span>
          <span className="text-border">·</span>
          <span className="flex items-center gap-1">
            🏀
            <span className="font-heading">{profile?.total_drills_completed || 0}</span> Drills
          </span>
          <span className="text-border">·</span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            Player Since {memberSince}
          </span>
        </div>
      </div>
    </div>
  );
}
