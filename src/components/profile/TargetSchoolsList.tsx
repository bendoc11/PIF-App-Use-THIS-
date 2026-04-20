import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, GraduationCap } from "lucide-react";

const CLASS_COLORS: Record<string, string> = {
  Dream: "bg-pif-gold/20 text-pif-gold border-pif-gold/30",
  Target: "bg-pif-blue/20 text-pif-blue border-pif-blue/30",
  Safety: "bg-pif-green/20 text-pif-green border-pif-green/30",
};

const STATUS_OPTIONS = ["Interested", "Contacted", "Replied", "Visited", "Offered", "Committed"];

interface TargetSchool {
  id: string;
  school_name: string;
  division: string | null;
  state: string | null;
  classification: string;
  status: string;
}

export function TargetSchoolsList({ userId }: { userId?: string }) {
  const [schools, setSchools] = useState<TargetSchool[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newSchool, setNewSchool] = useState({ school_name: "", division: "", state: "", classification: "Target" });

  useEffect(() => {
    if (!userId) return;
    fetchSchools();
  }, [userId]);

  const fetchSchools = async () => {
    const { data } = await supabase
      .from("target_schools")
      .select("*")
      .eq("user_id", userId!)
      .order("created_at", { ascending: false });
    if (data) setSchools(data as TargetSchool[]);
  };

  // Also sync with outreach history
  useEffect(() => {
    if (!userId) return;
    const syncOutreach = async () => {
      const { data: outreach } = await supabase
        .from("outreach_history")
        .select("school_name")
        .eq("user_id", userId);
      if (!outreach?.length) return;

      const { data: existing } = await supabase
        .from("target_schools")
        .select("school_name")
        .eq("user_id", userId);

      const existingNames = new Set((existing || []).map((s: any) => s.school_name.toLowerCase()));
      const toAdd = outreach
        .filter((o: any) => !existingNames.has(o.school_name.toLowerCase()))
        .map((o: any) => o.school_name)
        .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i);

      if (toAdd.length > 0) {
        await supabase.from("target_schools").insert(
          toAdd.map((name: string) => ({
            user_id: userId,
            school_name: name,
            classification: "target",
            status: "Contacted",
          }))
        );
        fetchSchools();
      }
    };
    syncOutreach();
  }, [userId]);

  const addSchool = async () => {
    if (!userId || !newSchool.school_name.trim()) return;
    const { error } = await supabase.from("target_schools").insert({
      user_id: userId,
      school_name: newSchool.school_name,
      division: newSchool.division || null,
      state: newSchool.state || null,
      classification: newSchool.classification.toLowerCase(),
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setNewSchool({ school_name: "", division: "", state: "", classification: "Target" });
    setShowAdd(false);
    fetchSchools();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("target_schools").update({ status }).eq("id", id);
    setSchools((s) => s.map((sc) => (sc.id === id ? { ...sc, status } : sc)));
  };

  const removeSchool = async (id: string) => {
    await supabase.from("target_schools").delete().eq("id", id);
    setSchools((s) => s.filter((sc) => sc.id !== id));
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 md:p-6">
      <div className="flex items-center justify-between mb-5 border-b border-border pb-3">
        <h2 className="font-heading text-lg tracking-widest text-foreground">MY TARGET SCHOOLS</h2>
        <Button variant="outline" size="sm" onClick={() => setShowAdd(!showAdd)} className="font-heading text-xs">
          <Plus className="h-3 w-3 mr-1" /> ADD SCHOOL
        </Button>
      </div>

      {showAdd && (
        <div className="bg-muted rounded-lg p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Input value={newSchool.school_name} onChange={(e) => setNewSchool({ ...newSchool, school_name: e.target.value })} placeholder="School name" className="bg-background border-border" />
            <Input value={newSchool.division} onChange={(e) => setNewSchool({ ...newSchool, division: e.target.value })} placeholder="Division" className="bg-background border-border" />
            <Input value={newSchool.state} onChange={(e) => setNewSchool({ ...newSchool, state: e.target.value })} placeholder="State" className="bg-background border-border" />
            <select
              value={newSchool.classification}
              onChange={(e) => setNewSchool({ ...newSchool, classification: e.target.value })}
              className="bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground"
            >
              <option>Dream</option>
              <option>Target</option>
              <option>Safety</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={addSchool} className="btn-cta bg-primary text-foreground font-heading text-xs">ADD</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)} className="font-heading text-xs">CANCEL</Button>
          </div>
        </div>
      )}

      {schools.length === 0 ? (
        <div className="text-center py-8">
          <GraduationCap className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No target schools yet. Add schools you're interested in.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {schools.map((school) => {
            const classKey = school.classification.charAt(0).toUpperCase() + school.classification.slice(1);
            return (
              <div key={school.id} className="flex items-center gap-3 bg-muted/50 rounded-lg px-4 py-3">
                <span className={`text-[10px] font-heading tracking-wider px-2 py-0.5 rounded border ${CLASS_COLORS[classKey] || CLASS_COLORS.Target}`}>
                  {classKey.toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-heading text-sm text-foreground truncate">{school.school_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[school.division, school.state].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <select
                  value={school.status}
                  onChange={(e) => updateStatus(school.id, e.target.value)}
                  className="bg-background border border-border rounded px-2 py-1 text-xs text-foreground"
                >
                  {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                </select>
                <button onClick={() => removeSchool(school.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
