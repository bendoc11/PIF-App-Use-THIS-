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
import { Loader2 } from "lucide-react";

type View =
  | { kind: "map" }
  | { kind: "school"; school: MockSchool }
  | { kind: "compose"; school: MockSchool; coaches: MockCoach[] };

const REQUIRED_FIELDS = [
  "first_name", "last_name", "position", "height", "phone",
  "grad_year", "gpa", "high_school_name", "city", "state", "highlight_film_url",
];

export default function Recruit() {
  const { user, profile } = useAuth();
  const { schools, loading, error } = useColleges();
  const [view, setView] = useState<View>({ kind: "map" });
  const [outreach, setOutreach] = useState<OutreachRow[]>([]);
  const [filters, setFilters] = useState<MapFilters>({
    state: "All",
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
      if (filters.state !== "All" && s.state !== filters.state) return false;
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

  return (
    <AppLayout>
      <div className="bg-gray-50 min-h-[calc(100vh-3.5rem)]">
        <div className="flex flex-col lg:flex-row h-[calc(100vh-3.5rem)]">
          {/* Left: Outreach */}
          <OutreachSidebar rows={outreach} onChange={loadOutreach} />

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
