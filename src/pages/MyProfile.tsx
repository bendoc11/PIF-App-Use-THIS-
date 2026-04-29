import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ShareProfileButton } from "@/components/profile/ShareProfileButton";
import { EditProfileSheet } from "@/components/profile/EditProfileSheet";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { useProgramCount, formatProgramCount } from "@/hooks/useProgramCount";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Camera,
  Eye,
  Play,
  Plus,
  Upload,
  Trophy,
  Calendar,
  TrendingUp,
  Pencil,
  Film,
  Video,
  Star,
  CheckCircle2,
  Clock,
  Award,
  User as UserIcon,
} from "lucide-react";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/*  Types pulled from the live profile           */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

type GameRow = {
  id: string;
  game_date: string;
  opponent: string | null;
  result: string;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  notes?: string | null;
};

type OfferRow = {
  id: string;
  school_name: string;
  coach_name: string;
  offer_date: string;
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/*  Profile completion calculation               */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function calcCompletion(p: any): number {
  if (!p) return 0;
  let pct = 0;
  if (p.first_name && p.last_name && p.grad_year && p.city && p.state) pct += 18;
  if ((p.positions?.length || p.position) && p.height && p.weight) pct += 16;
  if (p.high_school_name && p.gpa) pct += 14;
  if (p.bio && String(p.bio).trim().length >= 40) pct += 14;
  if (p.avatar_url) pct += 12;
  if (p.target_division && p.geo_preference && p.recruiting_timeline) pct += 10;
  if (p.highlight_film_url) pct += 16;
  return Math.min(100, pct);
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/*  Shared primitives                            */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function SectionHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-5">
      <div>
        {eyebrow && (
          <p className="text-[11px] font-semibold tracking-[0.2em] text-secondary uppercase mb-1.5">
            {eyebrow}
          </p>
        )}
        <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

function StatChip({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 transition-colors ${
        accent
          ? "bg-secondary/10 border-secondary/30"
          : "bg-card/60 border-border/60 hover:border-border"
      }`}
    >
      <p className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className={`text-lg font-bold tracking-tight mt-0.5 ${accent ? "text-secondary" : "text-foreground"}`}>
        {value || "—"}
      </p>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/*  SECTION 1 — PROFILE HEADER                   */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function ProfileHeader() {
  const { profile, user } = useAuth();
  const p: any = profile || {};
  const targetCompletion = useMemo(() => calcCompletion(p), [profile]);
  const [editOpen, setEditOpen] = useState(false);

  const [completion, setCompletion] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setCompletion(targetCompletion), 250);
    return () => clearTimeout(t);
  }, [targetCompletion]);

  const firstName = p.first_name || "Player";
  const lastName = p.last_name || "";
  const positionLabel = (p.positions?.length ? p.positions.join(" / ") : p.position) || "—";
  const gradYear = p.grad_year || "—";
  const height = p.height || "—";
  const weight = p.weight || "—";
  const gpa = p.gpa ? String(p.gpa) : "—";
  const hometown = [p.city, p.state].filter(Boolean).join(", ") || "—";
  const school = p.high_school_name || "Add your school";
  const jersey = p.jersey_number ? `#${p.jersey_number}` : null;
  const avatar = p.avatar_url;
  const initials = `${(firstName?.[0] || "").toUpperCase()}${(lastName?.[0] || "").toUpperCase()}` || "P";

  const identifier = (p.username && String(p.username).trim()) || user?.id || null;

  return (
    <section className="relative rounded-3xl overflow-hidden border border-border/60 bg-card">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at top right, rgba(59,130,246,0.18) 0%, transparent 55%), radial-gradient(ellipse at bottom left, rgba(239,68,68,0.12) 0%, transparent 60%), linear-gradient(180deg, #0B1120 0%, #080D14 100%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10 grid lg:grid-cols-[280px_1fr] gap-6 lg:gap-8 p-5 md:p-8">
        {/* Photo */}
        <div className="relative flex justify-center lg:justify-start">
          <div className="relative">
            <div
              className="w-44 h-44 md:w-56 md:h-56 lg:w-[260px] lg:h-[260px] rounded-2xl overflow-hidden border-2 bg-muted flex items-center justify-center"
              style={{
                borderColor: "rgba(59,130,246,0.4)",
                boxShadow: "0 10px 40px rgba(0,0,0,0.5), 0 0 80px rgba(59,130,246,0.15)",
              }}
            >
              {avatar ? (
                <img src={avatar} alt={`${firstName} ${lastName}`} className="w-full h-full object-cover object-top" />
              ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <UserIcon className="w-16 h-16 mb-2 opacity-40" />
                  <span className="text-3xl font-bold">{initials}</span>
                </div>
              )}
            </div>
            <button
              className="absolute -bottom-3 -right-3 w-11 h-11 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center border-2 border-background transition-transform hover:scale-105"
              aria-label="Update photo"
              onClick={() => (window.location.href = "/settings")}
            >
              <Camera className="w-5 h-5 text-primary-foreground" />
            </button>
            {targetCompletion >= 90 && (
              <div className="absolute -top-2 -left-2 px-2.5 py-1 rounded-full bg-secondary/20 border border-secondary/40 backdrop-blur-md flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-secondary" />
                <span className="text-[10px] font-bold tracking-wider text-secondary uppercase">Verified</span>
              </div>
            )}
          </div>
        </div>

        {/* Identity + stats */}
        <div className="flex flex-col">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-bold tracking-[0.22em] text-primary uppercase">
                  Class of {gradYear}
                </span>
              </div>
              <h1 className="font-sans text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tight leading-none">
                {firstName} <span className="text-primary">{lastName}</span>
              </h1>
              <p className="text-sm md:text-base text-muted-foreground mt-2 font-medium">
                {positionLabel}
                {jersey ? ` · ${jersey}` : ""} · {school}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg border-border/70 text-foreground hover:bg-muted"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="w-4 h-4 mr-1.5" />
                Edit
              </Button>
              <ShareProfileButton identifier={identifier} size="sm" />
            </div>
          </div>

          {/* Quick facts row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
            <StatChip label="Height" value={height} />
            <StatChip label="Weight" value={weight} />
            <StatChip label="GPA" value={gpa} />
            <StatChip label="From" value={hometown.split(",")[0] || "—"} />
          </div>

          {/* Bottom: completion */}
          <div className="grid sm:grid-cols-1 gap-4 mt-auto">
            <div className="rounded-xl border border-border/60 bg-background/40 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-secondary" />
                  <span className="text-xs font-semibold tracking-wider text-foreground uppercase">
                    Profile Completion
                  </span>
                </div>
                <span className="text-sm font-bold text-secondary">
                  <AnimatedNumber value={completion} duration={1200} />%
                </span>
              </div>
              <Progress value={completion} className="h-2 bg-muted" />
              <p className="text-[11px] text-muted-foreground mt-2">
                {targetCompletion >= 100
                  ? "Your profile is fully built — coaches see the complete picture."
                  : "Finish your profile so coaches see the full picture."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/*  SECTION 2 — INTRO / HIGHLIGHT VIDEO          */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function IntroVideoSection() {
  const { profile } = useAuth();
  const film = (profile as any)?.highlight_film_url || "";
  const programCount = useProgramCount();
  const firstName = (profile as any)?.first_name || "Player";

  return (
    <section>
      <SectionHeader
        eyebrow="First Impression"
        title="Your Highlight Film"
        subtitle="This is the first thing college coaches see. Make it count."
      />

      {film ? (
        <div className="rounded-2xl overflow-hidden border border-border/60 bg-card">
          <a
            href={film}
            target="_blank"
            rel="noreferrer"
            className="block p-5 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <Play className="w-5 h-5 text-primary fill-current ml-0.5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground">Watch your highlight film</p>
                <p className="text-[11px] text-muted-foreground truncate font-mono mt-0.5">{film}</p>
              </div>
            </div>
          </a>
        </div>
      ) : (
        <div
          className="relative rounded-2xl border border-dashed border-border/70 overflow-hidden group cursor-pointer transition-colors hover:border-secondary/50"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(59,130,246,0.08) 0%, rgba(11,17,32,0.4) 70%)",
          }}
          onClick={() => (window.location.href = "/profile/edit")}
        >
          <div className="aspect-video flex flex-col items-center justify-center px-6 py-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-secondary/15 border border-secondary/30 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <Video className="w-8 h-8 text-secondary" />
            </div>
            <p className="text-[11px] font-bold tracking-[0.22em] uppercase text-secondary mb-2">
              Step One
            </p>
            <h3 className="text-lg md:text-xl font-bold text-foreground mb-2">
              {firstName}, add your highlight film for college coaches.
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mb-3">
              Drop in a YouTube or Hudl link. Coaches want to see you play before they reply.
            </p>
            <p className="text-xs font-semibold tracking-wide text-secondary/90 mb-6">
              {formatProgramCount(programCount)} college programs are waiting to hear from you.
            </p>
            <Button className="rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground">
              <Upload className="w-4 h-4 mr-2" />
              Add Highlight Film
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/*  SECTION 3 — GAME LOG                         */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function GameLogSection({ games }: { games: GameRow[] }) {
  return (
    <section>
      <SectionHeader
        eyebrow="Recent Games"
        title="Game Log"
        subtitle="Show coaches you're playing — and producing — right now."
        action={
          <Button
            size="sm"
            className="rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => (window.location.href = "/progress")}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Game
          </Button>
        }
      />

      {games.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-10 text-center">
          <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-60" />
          <p className="text-sm font-semibold text-foreground">No games logged yet</p>
          <p className="text-[12px] text-muted-foreground mt-1">
            Add your first game from the Progress page so coaches can see your production.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {games.map((g) => {
            const win = (g.result || "").toUpperCase().startsWith("W");
            const dateLabel = new Date(g.game_date).toLocaleDateString("en-US", {
              month: "short",
              day: "2-digit",
              year: "numeric",
            });
            return (
              <article
                key={g.id}
                className="rounded-xl border border-border/60 bg-card hover:border-border transition-colors p-4 md:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                        win ? "bg-secondary/15 text-secondary" : "bg-primary/15 text-primary"
                      }`}
                    >
                      {win ? "W" : "L"}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        vs. {g.opponent || "Opponent"}
                      </p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {dateLabel}
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                        <span>{g.result}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "PTS", value: g.points, hot: g.points >= 25 },
                    { label: "REB", value: g.rebounds, hot: g.rebounds >= 10 },
                    { label: "AST", value: g.assists },
                    { label: "STL", value: g.steals },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className={`rounded-lg border px-3 py-2 text-center ${
                        s.hot
                          ? "bg-secondary/10 border-secondary/30"
                          : "bg-background/40 border-border/50"
                      }`}
                    >
                      <p
                        className={`text-xl font-bold tracking-tight ${
                          s.hot ? "text-secondary" : "text-foreground"
                        }`}
                      >
                        {s.value}
                      </p>
                      <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mt-0.5">
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/*  SECTION 4 — OFFERS & INTEREST                */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function OffersSection({ offers }: { offers: OfferRow[] }) {
  return (
    <section>
      <SectionHeader
        eyebrow="The Trophy Case"
        title="Offers & Interest"
        subtitle="Every program that's reached out to you."
        action={
          <Button
            size="sm"
            className="rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => (window.location.href = "/recruit")}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Offer
          </Button>
        }
      />

      {offers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-10 text-center">
          <Trophy className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-60" />
          <p className="text-sm font-semibold text-foreground">No offers logged yet</p>
          <p className="text-[12px] text-muted-foreground mt-1">
            Track every coach response, visit, and offer in one place.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
          {offers.map((o, i) => {
            const initials = o.school_name
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("");
            const dateLabel = new Date(o.offer_date).toLocaleDateString("en-US", {
              month: "short",
              day: "2-digit",
              year: "numeric",
            });
            return (
              <div
                key={o.id}
                className={`flex items-center gap-4 p-4 md:px-5 hover:bg-muted/30 transition-colors ${
                  i !== offers.length - 1 ? "border-b border-border/50" : ""
                }`}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold bg-primary/15 text-primary shrink-0">
                  {initials}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{o.school_name}</p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <Trophy className="w-3 h-3" />
                    {o.coach_name || "Coach"}
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                    <Clock className="w-3 h-3" />
                    {dateLabel}
                  </p>
                </div>

                <span className="px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase border bg-primary/15 text-primary border-primary/30">
                  Offer
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/*  TOP SHARE BAR                                */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function TopShareBar() {
  const { profile, user } = useAuth();
  const identifier = (profile as any)?.username || user?.id || null;
  const url = identifier ? `${window.location.origin}/p/${identifier}` : "";
  return (
    <div
      className="rounded-2xl border border-primary/30 bg-card p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
      style={{
        backgroundImage:
          "linear-gradient(135deg, hsl(var(--pif-red) / 0.10), hsl(var(--pif-blue) / 0.06))",
      }}
    >
      <div className="min-w-0">
        <p className="text-[11px] font-bold tracking-[0.22em] text-primary uppercase mb-1">
          Your shareable profile
        </p>
        <p className="text-sm text-foreground font-semibold">
          A digital recruiting card that travels with every coach email.
        </p>
        {url && (
          <p className="text-[11px] text-muted-foreground mt-1 truncate font-mono">{url}</p>
        )}
      </div>
      <ShareProfileButton identifier={identifier} size="lg" />
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/*  PAGE                                         */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export default function MyProfile() {
  const { user } = useAuth();
  const [games, setGames] = useState<GameRow[]>([]);
  const [offers, setOffers] = useState<OfferRow[]>([]);

  useEffect(() => {
    if (!user) {
      setGames([]);
      setOffers([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const [gamesRes, offersRes] = await Promise.all([
        supabase
          .from("game_logs")
          .select("id, game_date, opponent, result, points, rebounds, assists, steals")
          .eq("user_id", user.id)
          .order("game_date", { ascending: false })
          .limit(5),
        supabase
          .from("recruiting_offers")
          .select("id, school_name, coach_name, offer_date")
          .eq("user_id", user.id)
          .order("offer_date", { ascending: false })
          .limit(10),
      ]);
      if (cancelled) return;
      setGames((gamesRes.data || []) as GameRow[]);
      setOffers((offersRes.data || []) as OfferRow[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return (
    <AppLayout>
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 space-y-10 md:space-y-12">
        <TopShareBar />
        <ProfileHeader />
        <IntroVideoSection />
        <GameLogSection games={games} />
        <OffersSection offers={offers} />

        {/* Bottom CTA strip */}
        <div
          className="rounded-2xl border border-secondary/25 p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          style={{
            background:
              "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(239,68,68,0.08))",
          }}
        >
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-secondary/20 border border-secondary/30 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Keep building momentum.</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Update your film, log your games, and email more coaches every week.
              </p>
            </div>
          </div>
          <Button
            className="rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground whitespace-nowrap"
            onClick={() => (window.location.href = "/recruit")}
          >
            <Star className="w-4 h-4 mr-1.5" />
            Email More Coaches
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
