import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { MockCoach, MockSchool } from "@/data/mockSchools";
import { useColleges } from "@/hooks/useColleges";
import { UsMap } from "@/components/recruit/UsMap";
import { MapFiltersBar, MapFilters } from "@/components/recruit/MapFiltersBar";
import { SchoolDetail } from "@/components/recruit/SchoolDetail";
import { EmailComposer } from "@/components/recruit/EmailComposer";
import { OutreachSidebar, OutreachRow } from "@/components/recruit/OutreachSidebar";
import { RecruitDashboard } from "@/components/recruit/RecruitDashboard";
import { ProfileCompletionCard } from "@/components/recruit/ProfileCompletionCard";
import { SchoolList } from "@/components/recruit/SchoolList";
import { Loader2, ArrowLeft, PenSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

type View =
  | { kind: "map" }
  | { kind: "school"; school: MockSchool }
  | {
      kind: "compose";
      school: MockSchool;
      coaches: MockCoach[];
      initialDraft?: { subject: string; body: string } | null;
    }
  // "Compose new outreach" entry — pick a school first
  | { kind: "compose-pick" };

const REQUIRED_FIELDS = [
  "first_name", "last_name", "position", "height", "phone",
  "grad_year", "gpa", "high_school_name", "city", "state", "highlight_film_url",
];

function lastNameOf(full: string) {
  const parts = full.trim().split(/\s+/);
  return parts[parts.length - 1] ?? full;
}

function buildFollowUpDraft(row: OutreachRow): { subject: string; body: string } {
  const last = lastNameOf(row.coach_name);
  const subject = row.subject.toLowerCase().startsWith("re:")
    ? row.subject
    : `Re: ${row.subject}`;
  const body = `Dear Coach ${last},

I wanted to follow up on my previous email regarding my interest in ${row.school_name}. I remain very interested in your program and would love the opportunity to connect.

Please let me know if there is any additional information I can provide. Thank you again for your time and consideration.

Best regards,`;
  return { subject, body };
}

export default function Recruit() {
  const { user, profile } = useAuth();
  const { schools, loading, error } = useColleges();
  const [view, setView] = useState<View>({ kind: "map" });
  const [outreach, setOutreach] = useState<OutreachRow[]>([]);
  const [filters, setFilters] = useState<MapFilters>({
    states: [],
    divisions: ["D1", "D2", "D3", "JUCO", "NAIA"],
    size: "All",
    gpa: "All",
  });

  const loadOutreach = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("outreach_history")
      .select("*")
      .eq("user_id", user.id)
      .order("sent_at", { ascending: false });
    setOutreach((data as any) ?? []);
  };

  useEffect(() => {
    loadOutreach(); /* eslint-disable-next-line */
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

  const missingFields = useMemo(() => {
    const p: any = profile ?? {};
    return REQUIRED_FIELDS.filter((f) => !p[f] && p[f] !== 0);
  }, [profile]);

  const handleFollowUp = (row: OutreachRow) => {
    // Find the school in our list, or build a minimal stub from the outreach row
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

    setView({
      kind: "compose",
      school,
      coaches: [coach],
      initialDraft: buildFollowUpDraft(row),
    });
  };

  return (
    <AppLayout>
      <div className="bg-gray-50 min-h-[calc(100vh-3.5rem)]">
        <div className="flex flex-col lg:flex-row h-[calc(100vh-3.5rem)]">
          {/* Left: Outreach */}
          <OutreachSidebar
            rows={outreach}
            onChange={loadOutreach}
            onCompose={() => setView({ kind: "compose-pick" })}
            onFollowUp={handleFollowUp}
          />

          {/* Center */}
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-5xl mx-auto">
              <header className="mb-5">
                <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Get Recruited</h1>
                <p className="text-gray-500 mt-1">Find programs, contact coaches, track your outreach.</p>
              </header>

              {missingFields.length > 0 && (
                <div className="mb-5">
                  <ProfileCompletionCard missing={missingFields} onSaved={() => { /* profile auto-refreshes */ }} />
                </div>
              )}

              {view.kind === "map" && (
                <>
                  <MapFiltersBar value={filters} onChange={setFilters} />

                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-200">
                      <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
                      <p className="text-sm text-gray-500 mt-3">Loading {schools.length || "thousands of"} schools…</p>
                    </div>
                  ) : error ? (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 text-sm">
                      Failed to load schools: {error}
                    </div>
                  ) : (
                    <>
                      <UsMap schools={filtered} onSelect={(s) => setView({ kind: "school", school: s })} />
                      <p className="text-xs text-gray-500 mt-3 text-center">
                        Showing {filtered.length.toLocaleString()} of {schools.length.toLocaleString()} schools. Click any dot or row to view coaches.
                      </p>
                      <SchoolList schools={filtered} onSelect={(s) => setView({ kind: "school", school: s })} />
                    </>
                  )}
                </>
              )}

              {view.kind === "compose-pick" && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setView({ kind: "map" })}
                      className="text-gray-600 -ml-2"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                    <div className="inline-flex items-center gap-1.5 text-sm text-gray-500">
                      <PenSquare className="h-3.5 w-3.5" />
                      Compose new outreach
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Pick a school</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Filter, then click a school to choose coaches and send.</p>
                  </div>
                  <MapFiltersBar value={filters} onChange={setFilters} />
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-200">
                      <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
                    </div>
                  ) : (
                    <SchoolList schools={filtered} onSelect={(s) => setView({ kind: "school", school: s })} />
                  )}
                </div>
              )}

              {view.kind === "school" && (
                <SchoolDetail
                  school={view.school}
                  onBack={() => setView({ kind: "map" })}
                  onCompose={(coaches) => setView({ kind: "compose", school: view.school, coaches })}
                />
              )}

              {view.kind === "compose" && (
                <EmailComposer
                  school={view.school}
                  selected={view.coaches}
                  initialDraft={view.initialDraft ?? null}
                  onBack={() => setView({ kind: "school", school: view.school })}
                  onRemoveCoach={(email) =>
                    setView({
                      ...view,
                      coaches: view.coaches.filter((c) => c.email !== email),
                    })
                  }
                  onSent={() => {
                    loadOutreach();
                    setView({ kind: "map" });
                  }}
                />
              )}
            </div>
          </main>

          {/* Right: Dashboard */}
          <RecruitDashboard rows={outreach} onChange={loadOutreach} />
        </div>
      </div>
    </AppLayout>
  );
}
