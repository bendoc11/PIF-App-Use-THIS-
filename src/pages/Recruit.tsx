import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { MockCoach, MockSchool } from "@/data/mockSchools";
import { useColleges } from "@/hooks/useColleges";
import { SchoolDetail } from "@/components/recruit/SchoolDetail";
import { EmailComposer } from "@/components/recruit/EmailComposer";
import { OutreachRow } from "@/components/recruit/OutreachSidebar";
import { SchoolList } from "@/components/recruit/SchoolList";
import { MapFiltersBar, MapFilters } from "@/components/recruit/MapFiltersBar";
import { RepliesPanel } from "@/components/recruit/RepliesPanel";
import { UnreadRepliesBanner } from "@/components/recruit/UnreadRepliesBanner";
import { FirstReplyCelebration } from "@/components/recruit/FirstReplyCelebration";
import { AddOfferDialog } from "@/components/recruit/AddOfferDialog";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import "@/components/recruit/scoreboard/tokens.css";
import { RecruitTopBar } from "@/components/recruit/scoreboard/RecruitTopBar";
import { HeroMetrics } from "@/components/recruit/scoreboard/HeroMetrics";
import { FindYourSchoolMap } from "@/components/recruit/scoreboard/FindYourSchoolMap";
import { RecommendedSchools } from "@/components/recruit/RecommendedSchools";
import { DailyLimitPaywall } from "@/components/paywall/DailyLimitPaywall";
import { isPaidSubscriber } from "@/lib/subscription";
import { NextMoves, QuestItem } from "@/components/recruit/scoreboard/NextMoves";
import { WeeklyGoalDark } from "@/components/recruit/scoreboard/WeeklyGoalDark";
import { YourSchoolsCard } from "@/components/recruit/scoreboard/YourSchoolsCard";
import { GotOfferCTA } from "@/components/recruit/scoreboard/GotOfferCTA";
import { QuickSendSheet } from "@/components/recruit/QuickSendSheet";

const WEEKLY_GOAL = 10;
const REPLY_TARGET = 20;

type View =
  | { kind: "map" }
  | { kind: "school"; school: MockSchool }
  | {
      kind: "compose";
      school: MockSchool;
      coaches: MockCoach[];
      initialDraft?: { subject: string; body: string } | null;
    }
  | { kind: "compose-pick" };

function lastNameOf(full: string) {
  const parts = full.trim().split(/\s+/);
  return parts[parts.length - 1] ?? full;
}

function buildFollowUpDraft(row: OutreachRow): { subject: string; body: string } {
  const last = lastNameOf(row.coach_name);
  const subject = row.subject.toLowerCase().startsWith("re:") ? row.subject : `Re: ${row.subject}`;
  const body = `Dear Coach ${last},\n\nI wanted to follow up on my previous email regarding my interest in ${row.school_name}. I remain very interested in your program and would love the opportunity to connect.\n\nPlease let me know if there is any additional information I can provide. Thank you again for your time and consideration.\n\nBest regards,`;
  return { subject, body };
}

function daysAgo(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

export default function Recruit() {
  const { user, profile, hasActiveSubscription, refreshProfile } = useAuth();
  const { schools: rawSchools, loading, error } = useColleges();
  const p: any = profile ?? {};
  const isPaid = isPaidSubscriber(profile, hasActiveSubscription);

  // Deduplicate schools by id (prevents duplicates like Alabama A&M appearing twice)
  const schools = useMemo(() => {
    const seen = new Set<string>();
    return rawSchools.filter((s) => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  }, [rawSchools]);

  const [view, setView] = useState<View>({ kind: "map" });
  const [outreach, setOutreach] = useState<OutreachRow[]>([]);
  const [repliesCount, setRepliesCount] = useState(0);
  const [offersCount, setOffersCount] = useState(0);
  const [interestedSchools, setInterestedSchools] = useState<Set<string>>(new Set());
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [showDailyLimitPaywall, setShowDailyLimitPaywall] = useState(false);
  const [quickSend, setQuickSend] = useState<MockSchool | null>(null);

  const [filters, setFilters] = useState<MapFilters>({
    states: [],
    divisions: ["D1", "D2", "D3", "JUCO", "NAIA"],
    size: "All",
    gpa: "All",
  });

  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    const welcome = searchParams.get("welcome");
    if (welcome) {
      toast.success(welcome, { duration: 8000 });
      searchParams.delete("welcome");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const loadOutreach = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("outreach_history")
      .select("*")
      .eq("user_id", user.id)
      .order("sent_at", { ascending: false });
    setOutreach((data as any) ?? []);
  };

  const loadOffers = async () => {
    if (!user) return;
    const { count } = await supabase
      .from("recruiting_offers")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    setOffersCount(count ?? 0);
  };

  useEffect(() => {
    loadOutreach();
    loadOffers();
    // eslint-disable-next-line
  }, [user?.id]);

  const filtered = useMemo(() => {
    return schools.filter((s) => {
      if (filters.states.length > 0 && !filters.states.includes(s.state)) return false;
      if (!filters.divisions.includes(s.division)) return false;
      if (filters.size !== "All" && s.size !== filters.size) return false;
      if (filters.gpa !== "All") {
        const g = s.avgGpa;
        if (g == null) return false;
        if (filters.gpa === "3.7+" && g < 3.7) return false;
        if (filters.gpa === "3.3-3.7" && (g < 3.3 || g >= 3.7)) return false;
        if (filters.gpa === "<3.3" && g >= 3.3) return false;
      }
      return true;
    });
  }, [filters, schools]);

  const contactedNames = useMemo(() => new Set(outreach.map((r) => r.school_name)), [outreach]);

  const weeklySent = useMemo(() => outreach.filter((r) => daysAgo(r.sent_at) < 7).length, [outreach]);

  const repliedSchools = useMemo(
    () =>
      new Set(
        outreach.filter((r) => r.status === "replied" || r.replied_at).map((r) => r.school_name),
      ),
    [outreach],
  );

  const offerSchoolNames = useMemo(
    () => new Set(outreach.filter((r) => r.status === "offer").map((r) => r.school_name)),
    [outreach],
  );

  // Schools-interested merges: replied + manually starred + offers
  const allInterested = useMemo(() => {
    const s = new Set<string>(interestedSchools);
    repliedSchools.forEach((n) => s.add(n));
    offerSchoolNames.forEach((n) => s.add(n));
    return s;
  }, [interestedSchools, repliedSchools, offerSchoolNames]);

  const yourSchools = useMemo(() => {
    const items: { name: string; status: "Contacted" | "Interested" | "Offer" }[] = [];
    const seen = new Set<string>();
    for (const r of outreach) {
      if (seen.has(r.school_name)) continue;
      seen.add(r.school_name);
      let status: "Contacted" | "Interested" | "Offer" = "Contacted";
      if (offerSchoolNames.has(r.school_name)) status = "Offer";
      else if (allInterested.has(r.school_name)) status = "Interested";
      items.push({ name: r.school_name, status });
      if (items.length >= 5) break;
    }
    return items;
  }, [outreach, offerSchoolNames, allInterested]);

  const quests: QuestItem[] = useMemo(() => {
    const profileDone = !!(p.first_name && p.last_name && p.position && p.height && p.grad_year && p.gpa && p.high_school_name);
    return [
      { id: "film", label: "Add your highlight film", done: !!p.highlight_film_url },
      { id: "profile", label: "Complete your profile (height, GPA, position)", done: profileDone },
      {
        id: "weekly",
        label:
          weeklySent >= WEEKLY_GOAL
            ? "Hit your weekly goal of 10 coaches"
            : `Message ${WEEKLY_GOAL - weeklySent} more coaches this week`,
        done: weeklySent >= WEEKLY_GOAL,
      },
      { id: "first", label: "Send your first message", done: outreach.length > 0 },
    ];
  }, [p, weeklySent, outreach.length]);

  const handleFollowUp = (row: OutreachRow) => {
    const school =
      schools.find((s) => s.name === row.school_name) ??
      ({
        id: `stub-${row.school_name}`,
        name: row.school_name,
        city: "",
        state: "",
        stateCode: "",
        coordinates: [0, 0],
        division: "D1",
        academicLevel: "Good",
        enrollment: 0,
        size: "Medium",
        avgGpa: null,
        coaches: [],
      } as MockSchool);
    const coach: MockCoach = {
      name: row.coach_name,
      title: row.coach_title || "Coach",
      email: row.coach_email,
    };
    setView({ kind: "compose", school, coaches: [coach], initialDraft: buildFollowUpDraft(row) });
  };

  // Free users can browse and click freely; the paywall only appears when the
  // server returns a 429 daily_limit_reached during an actual send.
  const guardMessage = (action: () => void) => {
    action();
  };

  const openQuickSend = (s: MockSchool) => {
    if (!s.coaches || s.coaches.length === 0) {
      // No coach data — fall back to school detail
      setView({ kind: "school", school: s });
      return;
    }
    if (contactedNames.has(s.name)) return;
    setQuickSend(s);
  };

  const onMessageSchool = (s: MockSchool) => {
    guardMessage(() => openQuickSend(s));
  };

  const advanceToNext = (current: MockSchool): MockSchool | null => {
    // Recommended ordering: D3 first (matches RecommendedSchools logic loosely),
    // skip contacted + current school, prefer schools with coach data.
    const skip = new Set(contactedNames);
    skip.add(current.name);
    const candidates = schools.filter(
      (s) => !skip.has(s.name) && s.coaches && s.coaches.length > 0,
    );
    // Prefer same division, then any
    const sameDiv = candidates.find((s) => s.division === current.division);
    return sameDiv ?? candidates[0] ?? null;
  };

  const onEditFirst = (
    s: MockSchool,
    coach: MockCoach,
    draft: { subject: string; body: string },
  ) => {
    setQuickSend(null);
    setView({ kind: "compose", school: s, coaches: [coach], initialDraft: draft });
  };

  const onToggleInterested = (s: MockSchool) => {
    setInterestedSchools((prev) => {
      const next = new Set(prev);
      if (next.has(s.name)) next.delete(s.name);
      else next.add(s.name);
      return next;
    });
  };

  const scrollToReplies = () => {
    document.getElementById("replies-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const firstName = p.first_name || "";

  return (
    <AppLayout>
      <FirstReplyCelebration repliesCount={repliesCount} contactedCount={outreach.length} />
      <div className="recruit-scoreboard min-h-[calc(100vh-3.5rem)]">
        <UnreadRepliesBanner onView={scrollToReplies} />

        {/* Outreach progress banner — shown until user hits 20 sends */}
        {view.kind === "map" && outreach.length < REPLY_TARGET && (
          <div
            className="max-w-7xl mx-auto px-4 lg:px-6 pt-4"
            style={{ fontFamily: "-apple-system, 'SF Pro Text', sans-serif" }}
          >
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #D2D2D7",
                borderRadius: 12,
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1D1D1F" }}>
                  {outreach.length} coach{outreach.length === 1 ? "" : "es"} contacted
                </div>
                <div style={{ fontSize: 12, color: "#6E6E73", marginTop: 2 }}>
                  Athletes who contact 20+ are 4x more likely to hear back.
                </div>
              </div>
              <div
                style={{
                  width: 90,
                  height: 6,
                  background: "#E8E8ED",
                  borderRadius: 980,
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: `${Math.min(100, (outreach.length / REPLY_TARGET) * 100)}%`,
                    height: "100%",
                    background: "#0071E3",
                    transition: "width 400ms ease-out",
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-5">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
            {/* Main column */}
            <div>
              {view.kind === "map" && (
                <>
                  <RecruitTopBar
                    firstName={firstName}
                    weeklySent={weeklySent}
                    weeklyGoal={WEEKLY_GOAL}
                    onMessageClick={() => guardMessage(() => setView({ kind: "compose-pick" }))}
                  />

                  <HeroMetrics
                    schoolsInterested={allInterested.size}
                    coachesMessaged={outreach.length}
                    offersReceived={offersCount}
                    weeklyGoal={WEEKLY_GOAL}
                    weeklySent={weeklySent}
                  />

                  {!loading && !error && (
                    <RecommendedSchools
                      schools={schools}
                      contactedNames={contactedNames}
                      repliedNames={repliedSchools}
                      onMessage={(s) => guardMessage(() => openQuickSend(s))}
                      onReadReply={() => scrollToReplies()}
                    />
                  )}

                  {loading ? (
                    <div className="rs-card flex flex-col items-center justify-center py-16">
                      <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--brand-muted)" }} />
                      <p className="text-sm mt-3" style={{ color: "var(--brand-muted)" }}>
                        Loading schools…
                      </p>
                    </div>
                  ) : error ? (
                    <div className="rs-card p-6 text-sm" style={{ color: "var(--brand-orange)" }}>
                      Failed to load schools: {error}
                    </div>
                  ) : (
                    <FindYourSchoolMap
                      schools={filtered}
                      contactedNames={contactedNames}
                      interestedNames={allInterested}
                      onSelectSchool={(s) => guardMessage(() => openQuickSend(s))}
                      onMessageSchool={onMessageSchool}
                      onToggleInterested={onToggleInterested}
                      onBrowseAll={() => guardMessage(() => setView({ kind: "compose-pick" }))}
                    />
                  )}

                  <div id="replies-panel" className="mb-5">
                    <RepliesPanel
                      onCountChange={setRepliesCount}
                      locked={!isPaid}
                    />
                  </div>
                </>
              )}

              {view.kind === "compose-pick" && (
                <div className="rs-fade-up">
                  <div className="flex items-center justify-between mb-4">
                    <Button variant="ghost" size="sm" onClick={() => setView({ kind: "map" })} className="-ml-2">
                      <ArrowLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                    <span className="rs-display text-[18px]">Pick a school to message</span>
                  </div>
                  <div className="rs-card p-5 mb-4">
                    <p className="text-sm" style={{ color: "var(--brand-muted)" }}>
                      Filter, then click a school to choose coaches and send.
                    </p>
                  </div>
                  <MapFiltersBar value={filters} onChange={setFilters} />
                  {loading ? (
                    <div className="rs-card flex flex-col items-center justify-center py-16">
                      <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--brand-muted)" }} />
                    </div>
                  ) : (
                    <SchoolList schools={filtered} onSelect={(s) => openQuickSend(s)} />
                  )}
                </div>
              )}

              {view.kind === "school" && (
                <div className="rs-fade-up">
                  <SchoolDetail
                    school={view.school}
                    onBack={() => setView({ kind: "map" })}
                    onCompose={(coaches) => setView({ kind: "compose", school: view.school, coaches })}
                  />
                </div>
              )}

              {view.kind === "compose" && (
                <div className="rs-fade-up">
                  <EmailComposer
                    school={view.school}
                    selected={view.coaches}
                    initialDraft={view.initialDraft ?? null}
                    onBack={() => setView({ kind: "school", school: view.school })}
                    onRemoveCoach={(email) =>
                      setView({ ...view, coaches: view.coaches.filter((c) => c.email !== email) })
                    }
                    onSent={async () => {
                      await loadOutreach();
                      await refreshProfile();
                      setView({ kind: "map" });
                    }}
                    onDailyLimitReached={() => setShowDailyLimitPaywall(true)}
                  />
                </div>
              )}
            </div>

            {/* Right rail */}
            <aside className="space-y-4">
              <NextMoves items={quests} />
              <WeeklyGoalDark sent={weeklySent} goal={WEEKLY_GOAL} />
              <YourSchoolsCard
                stats={{
                  contacted: contactedNames.size,
                  interested: allInterested.size,
                  offers: offersCount,
                }}
                schools={yourSchools}
              />
              <GotOfferCTA onLog={() => setShowOfferDialog(true)} />
            </aside>
          </div>
        </div>
      </div>

      {showDailyLimitPaywall && !isPaid && <DailyLimitPaywall />}

      <AddOfferDialog open={showOfferDialog} onOpenChange={setShowOfferDialog} onSaved={loadOffers} />

      <QuickSendSheet
        open={!!quickSend}
        school={quickSend}
        onClose={() => setQuickSend(null)}
        onSent={async () => {
          await loadOutreach();
          await refreshProfile();
        }}
        onAdvance={advanceToNext}
        onEditFirst={onEditFirst}
        onDailyLimitReached={() => {
          setQuickSend(null);
          setShowDailyLimitPaywall(true);
        }}
      />
    </AppLayout>
  );
}
