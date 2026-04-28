import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/components/ui/animated-number";
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
  MapPin,
  GraduationCap,
  TrendingUp,
  Share2,
  Pencil,
  Film,
  Video,
  Star,
  CheckCircle2,
  Clock,
  Award,
} from "lucide-react";
import zacErvinHero from "@/assets/zac-ervin-hero.jpg";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/*  DEMO DATA — Zac Ervin                        */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const ATHLETE = {
  firstName: "Zac",
  lastName: "Ervin",
  position: "SG / SF",
  gradYear: 2026,
  height: `6'5"`,
  weight: "195 lbs",
  gpa: "3.84",
  hometown: "Richmond, VA",
  highSchool: "Benedictine College Preparatory",
  jersey: 11,
  completion: 92,
  weeklyViews: 47,
  totalViews: 312,
  ranking: "#9 in VA",
  verified: true,
};

const HIGHLIGHTS = [
  {
    id: 1,
    title: "Senior Year Mixtape — 30 PPG",
    date: "Mar 18, 2026",
    duration: "4:12",
    views: 1284,
    thumb: zacErvinHero,
  },
  {
    id: 2,
    title: "vs. Trinity Episcopal — 38 PTS",
    date: "Mar 04, 2026",
    duration: "6:48",
    views: 612,
    thumb: zacErvinHero,
  },
  {
    id: 3,
    title: "Holiday Classic Highlights",
    date: "Dec 28, 2025",
    duration: "5:21",
    views: 894,
    thumb: zacErvinHero,
  },
  {
    id: 4,
    title: "AAU Summer Circuit — Top Plays",
    date: "Aug 12, 2025",
    duration: "7:03",
    views: 2103,
    thumb: zacErvinHero,
  },
];

const GAMES = [
  {
    id: 1,
    date: "Mar 22, 2026",
    opponent: "Jefferson High",
    result: "W 78–64",
    pts: 31,
    reb: 8,
    ast: 6,
    stl: 3,
    notes: "Career-high 7 threes. Closed the game on a 14–0 run.",
  },
  {
    id: 2,
    date: "Mar 15, 2026",
    opponent: "St. Christopher's",
    result: "W 71–69",
    pts: 24,
    reb: 9,
    ast: 5,
    stl: 2,
    notes: "Game-winning floater with 0.8 left. Coach said best two-way game of the season.",
  },
  {
    id: 3,
    date: "Mar 08, 2026",
    opponent: "Collegiate School",
    result: "L 62–67",
    pts: 28,
    reb: 11,
    ast: 4,
    stl: 1,
    notes: "First double-double of the playoffs. Team came up short late.",
  },
];

const OFFERS = [
  { id: 1, school: "Davidson College", division: "D1", date: "Mar 20, 2026", status: "Offer", logoColor: "#C8102E" },
  { id: 2, school: "Richmond Spiders", division: "D1", date: "Mar 12, 2026", status: "Official Visit", logoColor: "#990000" },
  { id: 3, school: "VCU Rams", division: "D1", date: "Feb 28, 2026", status: "Offer", logoColor: "#F8B800" },
  { id: 4, school: "Williams College", division: "D3", date: "Feb 14, 2026", status: "Scholarship", logoColor: "#512888" },
  { id: 5, school: "Elon University", division: "D1", date: "Jan 30, 2026", status: "Walk-On Interest", logoColor: "#73000A" },
];

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/*  SHARED PRIMITIVES                            */
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
        {value}
      </p>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/*  SECTION 1 — PROFILE HEADER                   */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function ProfileHeader() {
  return (
    <section className="relative rounded-3xl overflow-hidden border border-border/60 bg-card">
      {/* Hero gradient backdrop */}
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
              className="w-44 h-44 md:w-56 md:h-56 lg:w-[260px] lg:h-[260px] rounded-2xl overflow-hidden border-2"
              style={{
                borderColor: "rgba(59,130,246,0.4)",
                boxShadow: "0 10px 40px rgba(0,0,0,0.5), 0 0 80px rgba(59,130,246,0.15)",
              }}
            >
              <img src={zacErvinHero} alt={`${ATHLETE.firstName} ${ATHLETE.lastName}`} className="w-full h-full object-cover object-top" />
            </div>
            <button
              className="absolute -bottom-3 -right-3 w-11 h-11 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center border-2 border-background transition-transform hover:scale-105"
              aria-label="Update photo"
            >
              <Camera className="w-5 h-5 text-primary-foreground" />
            </button>
            {ATHLETE.verified && (
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
                <span className="text-[11px] font-bold tracking-[0.22em] text-primary uppercase">Class of {ATHLETE.gradYear}</span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                <span className="text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">{ATHLETE.ranking}</span>
              </div>
              <h1 className="font-sans text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tight leading-none">
                {ATHLETE.firstName} <span className="text-primary">{ATHLETE.lastName}</span>
              </h1>
              <p className="text-sm md:text-base text-muted-foreground mt-2 font-medium">
                {ATHLETE.position} · #{ATHLETE.jersey} · {ATHLETE.highSchool}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="rounded-lg border-border/70 text-foreground hover:bg-muted">
                <Pencil className="w-4 h-4 mr-1.5" />
                Edit
              </Button>
              <Button size="sm" className="rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground">
                <Share2 className="w-4 h-4 mr-1.5" />
                Share Profile
              </Button>
            </div>
          </div>

          {/* Quick facts row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
            <StatChip label="Height" value={ATHLETE.height} />
            <StatChip label="Weight" value={ATHLETE.weight} />
            <StatChip label="GPA" value={ATHLETE.gpa} />
            <StatChip label="From" value={ATHLETE.hometown.split(",")[0]} />
          </div>

          {/* Bottom: completion + coach views */}
          <div className="grid sm:grid-cols-[1fr_auto] gap-4 mt-auto">
            <div className="rounded-xl border border-border/60 bg-background/40 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-secondary" />
                  <span className="text-xs font-semibold tracking-wider text-foreground uppercase">Profile Completion</span>
                </div>
                <span className="text-sm font-bold text-secondary">{ATHLETE.completion}%</span>
              </div>
              <Progress value={ATHLETE.completion} className="h-2 bg-muted" />
              <p className="text-[11px] text-muted-foreground mt-2">
                Add academic transcripts to reach 100% — coaches request this most.
              </p>
            </div>

            <div
              className="rounded-xl border border-secondary/30 px-5 py-4 flex items-center gap-3 min-w-[180px]"
              style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.18), rgba(59,130,246,0.04))" }}
            >
              <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                <Eye className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground leading-none">{ATHLETE.weeklyViews}</p>
                <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mt-1">
                  Coach views this week
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/*  SECTION 2 — INTRO VIDEO                      */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function IntroVideoSection() {
  const [hasVideo] = useState(false); // demo empty state

  return (
    <section>
      <SectionHeader
        eyebrow="First Impression"
        title="Your Intro Video"
        subtitle="This is the first thing college coaches see. Make it count."
      />

      {hasVideo ? (
        <div className="rounded-2xl overflow-hidden border border-border/60 bg-card aspect-video" />
      ) : (
        <div
          className="relative rounded-2xl border border-dashed border-border/70 overflow-hidden group cursor-pointer transition-colors hover:border-secondary/50"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(59,130,246,0.08) 0%, rgba(11,17,32,0.4) 70%)",
          }}
        >
          <div className="aspect-video flex flex-col items-center justify-center px-6 py-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-secondary/15 border border-secondary/30 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <Video className="w-8 h-8 text-secondary" />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-foreground mb-2">
              Upload your intro video
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mb-6">
              Coaches want to see who you are beyond the highlights. 60–90 seconds. Look at the camera.
              Tell them your name, school, position, and what you bring to a team.
            </p>
            <Button className="rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground">
              <Upload className="w-4 h-4 mr-2" />
              Upload Intro Video
            </Button>
            <p className="text-[11px] text-muted-foreground mt-4">MP4, MOV up to 500 MB · Recommended 1080p</p>
          </div>
        </div>
      )}
    </section>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/*  SECTION 3 — HIGHLIGHT TAPE                   */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function HighlightTapeSection() {
  return (
    <section>
      <SectionHeader
        eyebrow="Film Room"
        title="Your Highlight Tape"
        subtitle="Your film gets you recruited. Keep it current."
        action={
          <Button size="sm" className="rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="w-4 h-4 mr-1.5" />
            Add Highlight
          </Button>
        }
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {HIGHLIGHTS.map((h) => (
          <div
            key={h.id}
            className="group rounded-xl overflow-hidden border border-border/60 bg-card hover:border-secondary/40 transition-all hover:-translate-y-0.5 cursor-pointer"
          >
            <div className="relative aspect-video overflow-hidden bg-black">
              <img
                src={h.thumb}
                alt={h.title}
                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-primary/90 backdrop-blur flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <Play className="w-5 h-5 text-primary-foreground fill-current ml-0.5" />
                </div>
              </div>
              <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[11px] font-semibold text-foreground">
                {h.duration}
              </span>
            </div>
            <div className="p-3.5">
              <h4 className="text-sm font-semibold text-foreground line-clamp-1 mb-1.5">
                {h.title}
              </h4>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {h.date}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {h.views.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Add slot */}
        <button
          className="rounded-xl border border-dashed border-border/60 bg-card/40 hover:border-secondary/40 hover:bg-card transition-colors flex flex-col items-center justify-center min-h-[200px] group"
        >
          <div className="w-12 h-12 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Film className="w-5 h-5 text-secondary" />
          </div>
          <span className="text-sm font-semibold text-foreground">Add film</span>
          <span className="text-[11px] text-muted-foreground mt-1">Coaches are watching</span>
        </button>
      </div>
    </section>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/*  SECTION 4 — GAME LOG                         */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function GameLogSection() {
  return (
    <section>
      <SectionHeader
        eyebrow="Recent Games"
        title="Game Log"
        subtitle="Show coaches you're playing — and producing — right now."
        action={
          <Button size="sm" className="rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="w-4 h-4 mr-1.5" />
            Add Game
          </Button>
        }
      />

      <div className="space-y-3">
        {GAMES.map((g) => {
          const win = g.result.startsWith("W");
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
                    <p className="text-sm font-bold text-foreground">vs. {g.opponent}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {g.date}
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                      <span>{g.result}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-3">
                {[
                  { label: "PTS", value: g.pts, hot: g.pts >= 25 },
                  { label: "REB", value: g.reb, hot: g.reb >= 10 },
                  { label: "AST", value: g.ast },
                  { label: "STL", value: g.stl },
                ].map((s) => (
                  <div
                    key={s.label}
                    className={`rounded-lg border px-3 py-2 text-center ${
                      s.hot
                        ? "bg-secondary/10 border-secondary/30"
                        : "bg-background/40 border-border/50"
                    }`}
                  >
                    <p className={`text-xl font-bold tracking-tight ${s.hot ? "text-secondary" : "text-foreground"}`}>
                      {s.value}
                    </p>
                    <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mt-0.5">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-3">
                {g.notes}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/*  SECTION 5 — OFFERS & INTEREST                */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  Offer: { bg: "bg-primary/15", text: "text-primary", border: "border-primary/30" },
  "Official Visit": { bg: "bg-secondary/15", text: "text-secondary", border: "border-secondary/30" },
  Scholarship: { bg: "bg-pif-gold/15", text: "text-pif-gold", border: "border-pif-gold/30" },
  "Walk-On Interest": { bg: "bg-muted", text: "text-muted-foreground", border: "border-border" },
};

function OffersSection() {
  return (
    <section>
      <SectionHeader
        eyebrow="The Trophy Case"
        title="Offers & Interest"
        subtitle="Every program that's reached out to you. Keep it updated — coaches notice momentum."
        action={
          <Button size="sm" className="rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="w-4 h-4 mr-1.5" />
            Add Offer
          </Button>
        }
      />

      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
        {OFFERS.map((o, i) => {
          const s = STATUS_STYLES[o.status] || STATUS_STYLES.Offer;
          return (
            <div
              key={o.id}
              className={`flex items-center gap-4 p-4 md:px-5 hover:bg-muted/30 transition-colors ${
                i !== OFFERS.length - 1 ? "border-b border-border/50" : ""
              }`}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
                style={{ background: o.logoColor }}
              >
                {o.school
                  .split(" ")
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{o.school}</p>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <Trophy className="w-3 h-3" />
                  {o.division}
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                  <Clock className="w-3 h-3" />
                  {o.date}
                </p>
              </div>

              <span
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase border ${s.bg} ${s.text} ${s.border}`}
              >
                {o.status}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/*  PAGE                                         */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export default function MyProfile() {
  return (
    <AppLayout>
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 space-y-10 md:space-y-12">
        <ProfileHeader />
        <IntroVideoSection />
        <HighlightTapeSection />
        <GameLogSection />
        <OffersSection />

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
              <h3 className="text-lg font-bold text-foreground">Your profile is performing.</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {ATHLETE.weeklyViews} coach views this week. Keep your film and game log fresh — momentum gets you recruited.
              </p>
            </div>
          </div>
          <Button className="rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground whitespace-nowrap">
            <Star className="w-4 h-4 mr-1.5" />
            Email More Coaches
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
