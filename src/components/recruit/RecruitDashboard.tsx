import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Trophy,
  Mail,
  MailOpen,
  Reply,
  Plus,
  Trash2,
  TrendingUp,
  Target,
  Flame,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Award,
  Sparkles,
} from "lucide-react";
import { OutreachRow } from "./OutreachSidebar";
import { AddOfferDialog } from "./AddOfferDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  rows: OutreachRow[];
  onChange: () => void;
}

interface OfferRow {
  id: string;
  school_name: string;
  coach_name: string;
  offer_date: string;
}

const PROFILE_FIELDS = [
  "first_name", "last_name", "position", "height", "weight", "phone",
  "grad_year", "gpa", "high_school_name", "city", "state",
  "highlight_film_url", "hs_coach_name", "hs_coach_email", "bio",
];

function daysAgo(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

export function RecruitDashboard({ rows, onChange }: Props) {
  const { user, profile } = useAuth();
  const p: any = profile ?? {};

  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [showOfferDialog, setShowOfferDialog] = useState(false);

  const loadOffers = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("recruiting_offers")
      .select("id, school_name, coach_name, offer_date")
      .eq("user_id", user.id)
      .order("offer_date", { ascending: false });
    setOffers((data as any) ?? []);
  };

  useEffect(() => { loadOffers(); /* eslint-disable-next-line */ }, [user?.id]);

  // ---- Outreach metrics
  const contacted = rows.length;
  const replies = rows.filter((r) => r.status === "replied" || r.status === "offer").length;
  const sentNoReply = rows.filter((r) => r.status === "sent").length;
  const replyRate = contacted > 0 ? Math.round((replies / contacted) * 100) : 0;
  const offersCount = offers.length;

  // Unique schools touched
  const uniqueSchools = useMemo(
    () => new Set(rows.map((r) => r.school_name)).size,
    [rows],
  );

  // This-week activity
  const thisWeekSent = useMemo(
    () => rows.filter((r) => daysAgo(r.sent_at) < 7).length,
    [rows],
  );

  // Stale (sent > 10 days, no reply) — needs follow-up
  const needsFollowUp = useMemo(
    () => rows.filter((r) => r.status === "sent" && daysAgo(r.sent_at) >= 10).length,
    [rows],
  );

  // Last activity
  const lastActivity = useMemo(() => {
    if (rows.length === 0) return null;
    const latest = rows.reduce((acc, r) =>
      new Date(r.sent_at) > new Date(acc.sent_at) ? r : acc,
    );
    const d = daysAgo(latest.sent_at);
    if (d === 0) return "Today";
    if (d === 1) return "Yesterday";
    if (d < 7) return `${d} days ago`;
    if (d < 30) return `${Math.floor(d / 7)}w ago`;
    return `${Math.floor(d / 30)}mo ago`;
  }, [rows]);

  // Profile completion
  const completionPct = useMemo(() => {
    const filled = PROFILE_FIELDS.filter((f) => p[f] !== null && p[f] !== undefined && p[f] !== "").length;
    return Math.round((filled / PROFILE_FIELDS.length) * 100);
  }, [p]);

  // Recruiting level — driven by signals
  const hasFilm = Boolean(p.highlight_film_url);
  const level = useMemo(() => {
    if (offersCount >= 3) return { label: "D1", color: "from-emerald-500 to-green-600", desc: "Strong D1 interest" };
    if (offersCount >= 1) return { label: "D1 / D2", color: "from-blue-500 to-cyan-500", desc: "Active recruitment" };
    if (replies >= 3 && hasFilm) return { label: "D2 / D3", color: "from-indigo-500 to-blue-500", desc: "Coaches engaging" };
    if (hasFilm && contacted >= 5) return { label: "D3 / NAIA", color: "from-amber-500 to-orange-500", desc: "Building momentum" };
    return { label: "JUCO / NAIA", color: "from-slate-500 to-gray-600", desc: "Just getting started" };
  }, [offersCount, replies, hasFilm, contacted]);

  // Weekly outreach goal
  const WEEKLY_GOAL = 10;
  const weeklyProgress = Math.min(100, Math.round((thisWeekSent / WEEKLY_GOAL) * 100));

  // Next best action
  const nextAction = useMemo(() => {
    if (completionPct < 70) return { icon: AlertCircle, text: "Complete your profile", tone: "amber" };
    if (!hasFilm) return { icon: AlertCircle, text: "Add your highlight film", tone: "amber" };
    if (needsFollowUp > 0) return { icon: Clock, text: `Follow up with ${needsFollowUp} coach${needsFollowUp > 1 ? "es" : ""}`, tone: "blue" };
    if (thisWeekSent < WEEKLY_GOAL) return { icon: Target, text: `Send ${WEEKLY_GOAL - thisWeekSent} more emails this week`, tone: "blue" };
    return { icon: CheckCircle2, text: "You're on track — keep pushing", tone: "green" };
  }, [completionPct, hasFilm, needsFollowUp, thisWeekSent]);

  const removeOffer = async (id: string) => {
    await supabase.from("recruiting_offers").delete().eq("id", id);
    loadOffers();
  };

  return (
    <aside className="w-full lg:w-80 shrink-0 p-4 space-y-4 overflow-y-auto bg-gray-50">
      {/* Recruiting Level — Hero card */}
      <Card className="overflow-hidden border-gray-200 bg-white">
        <div className={`bg-gradient-to-br ${level.color} p-5 text-white`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/80">
              Recruiting Level
            </span>
            <Trophy className="h-4 w-4 text-white/80" />
          </div>
          <p className="text-3xl font-bold leading-none">{level.label}</p>
          <p className="text-xs text-white/85 mt-1.5">{level.desc}</p>
        </div>
        <div className="px-5 py-3 bg-white border-t border-gray-100 flex items-center justify-between text-xs">
          <span className="text-gray-500">Profile strength</span>
          <span className="font-semibold text-gray-900">{completionPct}%</span>
        </div>
        <div className="px-5 pb-4">
          <Progress value={completionPct} className="h-1.5" />
        </div>
      </Card>

      {/* Next best action */}
      <Card className="p-4 bg-white border-gray-200">
        <div className="flex items-start gap-3">
          <div className={`shrink-0 h-9 w-9 rounded-lg flex items-center justify-center ${
            nextAction.tone === "amber" ? "bg-amber-50 text-amber-600" :
            nextAction.tone === "green" ? "bg-emerald-50 text-emerald-600" :
            "bg-blue-50 text-blue-600"
          }`}>
            <nextAction.icon className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-0.5">
              Next move
            </div>
            <p className="text-sm font-medium text-gray-900 leading-snug">{nextAction.text}</p>
          </div>
        </div>
      </Card>

      {/* Weekly outreach goal */}
      <Card className="p-4 bg-white border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Flame className="h-3.5 w-3.5 text-orange-500" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-600">
              This Week
            </span>
          </div>
          <span className="text-xs font-semibold text-gray-900">
            {thisWeekSent}<span className="text-gray-400 font-normal"> / {WEEKLY_GOAL}</span>
          </span>
        </div>
        <Progress value={weeklyProgress} className="h-2 mb-2" />
        <p className="text-[11px] text-gray-500">
          {thisWeekSent >= WEEKLY_GOAL
            ? "Goal hit. Keep stacking."
            : `${WEEKLY_GOAL - thisWeekSent} more to hit your weekly goal`}
        </p>
      </Card>

      {/* Outreach funnel — 4 stat tiles */}
      <div className="grid grid-cols-2 gap-2.5">
        <Card className="p-3.5 bg-white border-gray-200">
          <div className="flex items-center justify-between mb-1.5">
            <Mail className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-[10px] font-medium text-gray-400 uppercase">Sent</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 leading-none">{contacted}</p>
          <p className="text-[10px] text-gray-500 mt-1">{uniqueSchools} school{uniqueSchools !== 1 ? "s" : ""}</p>
        </Card>

        <Card className="p-3.5 bg-white border-gray-200">
          <div className="flex items-center justify-between mb-1.5">
            <Reply className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-[10px] font-medium text-blue-500 uppercase">Replies</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 leading-none">{replies}</p>
          <p className="text-[10px] text-gray-500 mt-1">{replyRate}% reply rate</p>
        </Card>

        <Card className="p-3.5 bg-white border-gray-200">
          <div className="flex items-center justify-between mb-1.5">
            <MailOpen className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-[10px] font-medium text-gray-400 uppercase">Pending</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 leading-none">{sentNoReply}</p>
          <p className="text-[10px] text-gray-500 mt-1">
            {needsFollowUp > 0 ? (
              <span className="text-amber-600 font-medium">{needsFollowUp} stale</span>
            ) : "Awaiting reply"}
          </p>
        </Card>

        <Card className="p-3.5 bg-white border-gray-200">
          <div className="flex items-center justify-between mb-1.5">
            <Award className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-[10px] font-medium text-emerald-500 uppercase">Offers</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 leading-none">{offersCount}</p>
          <p className="text-[10px] text-gray-500 mt-1">
            {offersCount > 0 ? "Strong position" : "None yet"}
          </p>
        </Card>
      </div>

      {/* Reply rate insight */}
      {contacted >= 3 && (
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-900">
              Performance
            </span>
          </div>
          <p className="text-sm text-gray-800 leading-snug">
            Your <span className="font-bold">{replyRate}%</span> reply rate is{" "}
            {replyRate >= 25 ? (
              <span className="text-emerald-700 font-semibold">above average</span>
            ) : replyRate >= 15 ? (
              <span className="text-blue-700 font-semibold">on par</span>
            ) : (
              <span className="text-amber-700 font-semibold">below average</span>
            )}{" "}
            for high school recruits. Average is ~15-20%.
          </p>
        </Card>
      )}

      {/* Last activity */}
      {lastActivity && (
        <Card className="p-3 bg-white border-gray-200">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-gray-500">
              <Calendar className="h-3.5 w-3.5" />
              <span>Last outreach</span>
            </div>
            <span className="font-medium text-gray-900">{lastActivity}</span>
          </div>
        </Card>
      )}

      {/* Add offer CTA */}
      <Card className="p-4 bg-white border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-700">
                Got an offer?
              </span>
            </div>
            <p className="text-[11px] text-gray-500">Log it to update your level</p>
          </div>
          <Button
            size="sm"
            onClick={() => setShowOfferDialog(true)}
            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add
          </Button>
        </div>
      </Card>

      {/* Offers list */}
      {offers.length > 0 && (
        <Card className="bg-white border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h4 className="text-[11px] font-semibold text-gray-900 uppercase tracking-wider">
              Your Offers
            </h4>
            <span className="text-[10px] text-gray-500">{offers.length} total</span>
          </div>
          <ul className="divide-y divide-gray-100">
            {offers.map((o) => (
              <li key={o.id} className="px-4 py-3 flex items-start gap-2 group">
                <div className="shrink-0 h-7 w-7 rounded-md bg-emerald-50 flex items-center justify-center">
                  <Trophy className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">{o.school_name}</p>
                  <p className="text-[11px] text-gray-500 truncate">
                    {o.coach_name} · {new Date(o.offer_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
                <button
                  onClick={() => removeOffer(o.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 p-1"
                  aria-label="Remove offer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <AddOfferDialog
        open={showOfferDialog}
        onOpenChange={setShowOfferDialog}
        onSaved={loadOffers}
      />
    </aside>
  );
}
