import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Trophy,
  Calendar,
  MapPin,
  GraduationCap,
  Ruler,
  Mail,
  Phone,
  Play,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { format } from "date-fns";

interface PublicProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  avatar_url: string | null;
  position: string | null;
  positions: string[] | null;
  jersey_number: string | null;
  grad_year: number | null;
  height: string | null;
  weight: string | null;
  wingspan: string | null;
  gpa: number | null;
  gpa_unweighted: number | null;
  sat_score: number | null;
  act_score: number | null;
  city: string | null;
  state: string | null;
  high_school_name: string | null;
  hs_team_name: string | null;
  aau_team: string | null;
  bio: string | null;
  intended_major: string | null;
  highlight_film_url: string | null;
  additional_film_links: any[] | null;
  hs_coach_name: string | null;
  hs_coach_email: string | null;
  hs_coach_phone: string | null;
  aau_coach_name: string | null;
  aau_coach_email: string | null;
}

interface Game {
  id: string;
  game_date: string;
  opponent: string | null;
  game_type: string;
  result: string;
  minutes_played: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  fg_made: number;
  fg_attempted: number;
  three_made: number;
  three_attempted: number;
  ft_made: number;
  ft_attempted: number;
  fg_percentage: number;
  three_percentage: number;
  ft_percentage: number;
}

interface Averages {
  gp: number;
  ppg: number;
  rpg: number;
  apg: number;
  spg: number;
  bpg: number;
  fg_pct: number;
  three_pct: number;
  ft_pct: number;
}

interface Offer {
  id: string;
  school_name: string;
  coach_name: string;
  offer_date: string;
}

interface Payload {
  profile: PublicProfile;
  averages: Averages | null;
  games: Game[];
  offers: Offer[];
}

function getInitials(p: PublicProfile): string {
  const f = (p.first_name || "").trim();
  const l = (p.last_name || "").trim();
  const i = (f[0] || "") + (l[0] || "");
  return i.toUpperCase() || "PIF";
}

function getVideoEmbedUrl(url: string): string | null {
  if (!url) return null;
  // YouTube
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/\s]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  // Vimeo
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  // Hudl — use original URL in an iframe (best effort)
  return null;
}

export default function PublicAthleteProfile() {
  const { identifier } = useParams<{ identifier: string }>();
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!identifier) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: result, error: err } = await supabase.rpc(
        "get_public_athlete_profile" as any,
        { _identifier: identifier },
      );
      if (cancelled) return;
      if (err) {
        setError("We couldn't load this profile.");
      } else if (!result) {
        setError("Profile not found.");
      } else {
        setData(result as unknown as Payload);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [identifier]);

  // SEO: set document title once we have the profile
  useEffect(() => {
    if (data?.profile) {
      const p = data.profile;
      const fullName = [p.first_name, p.last_name].filter(Boolean).join(" ") || "Athlete";
      const cls = p.grad_year ? ` — Class of ${p.grad_year}` : "";
      document.title = `${fullName}${cls} | Recruiting Profile`;
    }
  }, [data]);

  const additionalLinks = useMemo(() => {
    const list: { url: string; label: string }[] = [];
    if (data?.profile?.additional_film_links) {
      data.profile.additional_film_links.forEach((entry: any, i: number) => {
        if (typeof entry === "string" && entry) {
          list.push({ url: entry, label: `Game Clip ${i + 1}` });
        } else if (entry && typeof entry === "object" && entry.url) {
          list.push({ url: entry.url, label: entry.title || `Clip ${i + 1}` });
        }
      });
    }
    return list;
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading recruiting profile…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-heading text-foreground mb-2">Profile not available</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {error || "This recruiting profile is private or doesn't exist."}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold"
          >
            Visit Play it Forward
          </Link>
        </div>
      </div>
    );
  }

  const { profile: p, averages, games, offers } = data;
  const fullName = [p.first_name, p.last_name].filter(Boolean).join(" ") || "Athlete";
  const positionLabel = (p.positions && p.positions.join(" / ")) || p.position || null;
  const hometown = [p.city, p.state].filter(Boolean).join(", ");
  const heroEmbed = p.highlight_film_url ? getVideoEmbedUrl(p.highlight_film_url) : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar — minimal, just brand */}
      <header className="border-b border-border/60 bg-card/40 backdrop-blur">
        <div className="max-w-5xl mx-auto px-5 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-heading text-xs">PIF</span>
            </div>
            <span className="text-xs font-heading tracking-[0.2em] text-foreground uppercase">
              Play it Forward
            </span>
          </Link>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-pif-green" />
            <span>Verified athlete profile</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-8 space-y-10">
        {/* HERO */}
        <section
          className="relative rounded-3xl overflow-hidden border border-border bg-card p-6 md:p-10"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at top right, hsl(var(--pif-blue) / 0.18) 0%, transparent 55%), radial-gradient(ellipse at bottom left, hsl(var(--pif-red) / 0.12) 0%, transparent 60%)",
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.05]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)",
              backgroundSize: "28px 28px",
            }}
          />

          <div className="relative grid md:grid-cols-[200px_1fr] gap-6 md:gap-8">
            {/* Photo */}
            <div className="flex justify-center md:justify-start">
              <div
                className="w-40 h-40 md:w-[200px] md:h-[200px] rounded-2xl overflow-hidden border-2 border-secondary/40 bg-secondary/10 flex items-center justify-center"
                style={{
                  boxShadow:
                    "0 10px 40px rgba(0,0,0,0.5), 0 0 60px hsl(var(--pif-blue) / 0.15)",
                }}
              >
                {p.avatar_url ? (
                  <img
                    src={p.avatar_url}
                    alt={fullName}
                    className="w-full h-full object-cover object-top"
                    loading="eager"
                  />
                ) : (
                  <span className="font-heading text-5xl text-secondary">{getInitials(p)}</span>
                )}
              </div>
            </div>

            {/* Identity */}
            <div className="flex flex-col">
              {p.grad_year && (
                <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                  <span className="text-[11px] font-bold tracking-[0.22em] text-primary uppercase">
                    Class of {p.grad_year}
                  </span>
                  {positionLabel && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                      <span className="text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                        {positionLabel}
                      </span>
                    </>
                  )}
                </div>
              )}
              <h1 className="font-heading text-3xl md:text-5xl text-foreground tracking-tight leading-none text-center md:text-left">
                {p.first_name}{" "}
                {p.last_name && <span className="text-primary">{p.last_name}</span>}
              </h1>
              {(p.jersey_number || p.high_school_name) && (
                <p className="text-sm md:text-base text-muted-foreground mt-2 font-medium text-center md:text-left">
                  {p.jersey_number && `#${p.jersey_number}`}
                  {p.jersey_number && p.high_school_name && " · "}
                  {p.high_school_name}
                </p>
              )}

              {/* Quick facts */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5">
                {p.height && <Fact label="Height" value={p.height} />}
                {p.weight && <Fact label="Weight" value={p.weight} />}
                {(p.gpa || p.gpa_unweighted) && (
                  <Fact label="GPA" value={String(p.gpa ?? p.gpa_unweighted)} />
                )}
                {hometown && <Fact label="From" value={hometown.split(",")[0]} />}
                {p.wingspan && <Fact label="Wingspan" value={p.wingspan} />}
                {p.sat_score && <Fact label="SAT" value={String(p.sat_score)} />}
                {p.act_score && <Fact label="ACT" value={String(p.act_score)} />}
                {p.intended_major && <Fact label="Major" value={p.intended_major} />}
              </div>
            </div>
          </div>

          {/* Bio */}
          {p.bio && (
            <p className="relative mt-6 text-sm md:text-base text-muted-foreground leading-relaxed max-w-3xl">
              {p.bio}
            </p>
          )}
        </section>

        {/* HIGHLIGHT FILM */}
        {(p.highlight_film_url || additionalLinks.length > 0) && (
          <Section title="Highlight Film" eyebrow="Watch the tape">
            {heroEmbed ? (
              <div className="aspect-video rounded-2xl overflow-hidden border border-border bg-card">
                <iframe
                  src={heroEmbed}
                  title="Highlight film"
                  className="w-full h-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : p.highlight_film_url ? (
              <a
                href={p.highlight_film_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block aspect-video rounded-2xl border border-border bg-card hover:border-secondary/60 transition-colors relative overflow-hidden group"
              >
                <div
                  className="absolute inset-0 opacity-60"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at center, hsl(var(--pif-red) / 0.25), transparent 70%)",
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rounded-full bg-background/70 backdrop-blur-sm p-4 group-hover:scale-110 transition-transform">
                    <Play className="h-8 w-8 text-foreground fill-foreground" />
                  </div>
                </div>
                <div className="absolute bottom-3 left-4 text-sm text-foreground font-semibold flex items-center gap-1.5">
                  Watch on Hudl <ExternalLink className="h-3.5 w-3.5" />
                </div>
              </a>
            ) : null}

            {additionalLinks.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                {additionalLinks.map((l, i) => {
                  const embed = getVideoEmbedUrl(l.url);
                  return embed ? (
                    <div
                      key={i}
                      className="aspect-video rounded-xl overflow-hidden border border-border bg-card"
                    >
                      <iframe
                        src={embed}
                        title={l.label}
                        className="w-full h-full"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <a
                      key={i}
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="aspect-video rounded-xl border border-border bg-card hover:border-secondary/60 transition-colors flex flex-col items-center justify-center gap-2 group"
                    >
                      <div className="rounded-full bg-background/70 p-3 group-hover:scale-110 transition-transform">
                        <Play className="h-5 w-5 text-foreground fill-foreground" />
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground">
                        {l.label}
                      </span>
                    </a>
                  );
                })}
              </div>
            )}
          </Section>
        )}

        {/* SEASON STATS */}
        {averages && averages.gp > 0 && (
          <Section title="Season Averages" eyebrow={`${averages.gp} game${averages.gp === 1 ? "" : "s"} logged`}>
            <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                <Stat label="PPG" value={averages.ppg} />
                <Stat label="RPG" value={averages.rpg} />
                <Stat label="APG" value={averages.apg} />
                <Stat label="SPG" value={averages.spg} />
                <Stat label="BPG" value={averages.bpg} />
                <Stat label="FG%" value={`${averages.fg_pct}%`} />
                <Stat label="3P%" value={`${averages.three_pct}%`} />
                <Stat label="FT%" value={`${averages.ft_pct}%`} />
              </div>
            </div>
          </Section>
        )}

        {/* RECENT GAMES */}
        {games.length > 0 && (
          <Section title="Recent Games" eyebrow="The last 10">
            <div className="space-y-2">
              {games.map((g) => (
                <div
                  key={g.id}
                  className="rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6"
                >
                  <div className="sm:w-48">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-heading text-foreground">
                        {format(new Date(g.game_date), "MMM d, yyyy")}
                      </span>
                      <span
                        className={`text-[10px] font-heading px-2 py-0.5 rounded-full ${
                          g.result === "W"
                            ? "bg-pif-green/20 text-pif-green"
                            : "bg-primary/20 text-primary"
                        }`}
                      >
                        {g.result}
                      </span>
                    </div>
                    {g.opponent && (
                      <p className="text-xs text-muted-foreground mt-0.5">vs {g.opponent}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
                    <Inline label="PTS" value={g.points} />
                    <Inline label="REB" value={g.rebounds} />
                    <Inline label="AST" value={g.assists} />
                    <Inline label="STL" value={g.steals} />
                    <Inline label="BLK" value={g.blocks} />
                    <Inline label="FG%" value={`${g.fg_percentage}%`} />
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* OFFERS */}
        {offers.length > 0 && (
          <Section title="Offers & Interest" eyebrow="Recruiting activity">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {offers.map((o) => (
                <div
                  key={o.id}
                  className="rounded-xl border border-border bg-card p-4 relative overflow-hidden"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at top right, hsl(var(--pif-gold) / 0.10) 0%, transparent 60%)",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg p-2 bg-pif-gold/15 border border-pif-gold/30">
                      <Trophy className="h-4 w-4 text-pif-gold" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-heading text-foreground truncate">
                        {o.school_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        Coach {o.coach_name}
                      </p>
                      <p className="text-[11px] text-muted-foreground/80 mt-2 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(o.offer_date), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* CONTACT */}
        {(p.hs_coach_name || p.aau_coach_name) && (
          <Section title="Contact" eyebrow="For coaches">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {p.hs_coach_name && (
                <CoachCard
                  label="High School Coach"
                  team={p.hs_team_name || p.high_school_name}
                  name={p.hs_coach_name}
                  email={p.hs_coach_email}
                  phone={p.hs_coach_phone}
                />
              )}
              {p.aau_coach_name && (
                <CoachCard
                  label="AAU Coach"
                  team={p.aau_team}
                  name={p.aau_coach_name}
                  email={p.aau_coach_email}
                />
              )}
            </div>
          </Section>
        )}

        {/* Footer */}
        <footer className="pt-8 pb-4 text-center border-t border-border/60">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <span>Built with</span>
            <span className="font-heading tracking-[0.2em] text-foreground">Play it Forward</span>
          </Link>
          <p className="text-[11px] text-muted-foreground/70 mt-1">
            The recruiting platform for serious high school athletes.
          </p>
        </footer>
      </main>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────── */
/*  Helpers                                                              */
/* ──────────────────────────────────────────────────────────────────── */

function Section({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-4">
        {eyebrow && (
          <p className="text-[11px] font-bold tracking-[0.22em] text-secondary uppercase mb-1.5">
            {eyebrow}
          </p>
        )}
        <h2 className="text-xl md:text-2xl font-heading text-foreground tracking-tight">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-center md:text-left">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
        {label}
      </p>
      <p className="text-sm font-heading text-foreground mt-0.5">{value}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <p className="text-2xl md:text-3xl font-heading text-foreground tabular-nums">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function Inline({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="text-foreground tabular-nums">
      <span className="font-heading">{value}</span>{" "}
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
    </span>
  );
}

function CoachCard({
  label,
  team,
  name,
  email,
  phone,
}: {
  label: string;
  team?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
        {label}
      </p>
      <p className="text-base font-heading text-foreground">{name}</p>
      {team && <p className="text-xs text-muted-foreground">{team}</p>}
      <div className="mt-3 space-y-1.5">
        {email && (
          <a
            href={`mailto:${email}`}
            className="flex items-center gap-2 text-xs text-secondary hover:underline"
          >
            <Mail className="h-3.5 w-3.5" /> {email}
          </a>
        )}
        {phone && (
          <a
            href={`tel:${phone}`}
            className="flex items-center gap-2 text-xs text-secondary hover:underline"
          >
            <Phone className="h-3.5 w-3.5" /> {phone}
          </a>
        )}
      </div>
    </div>
  );
}
