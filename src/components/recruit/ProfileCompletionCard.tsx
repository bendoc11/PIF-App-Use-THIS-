import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { US_STATES } from "@/data/mockSchools";
import { Loader2, UserCheck } from "lucide-react";

interface Props {
  missing: string[];
  onSaved: () => void;
}

const FIELD_LABELS: Record<string, string> = {
  first_name: "First name",
  last_name: "Last name",
  position: "Position",
  height: "Height (e.g. 6'2\")",
  phone: "Phone",
  grad_year: "Graduation year",
  gpa: "GPA",
  high_school_name: "High school",
  city: "City",
  state: "State",
  highlight_film_url: "Highlight film URL",
  aau_team: "AAU team (optional)",
};

export function ProfileCompletionCard({ missing, onSaved }: Props) {
  const { user, refreshProfile, profile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({
    first_name: profile?.first_name ?? "",
    last_name: profile?.last_name ?? "",
    position: profile?.position ?? "",
    height: (profile as any)?.height ?? "",
    phone: (profile as any)?.phone ?? "",
    grad_year: "",
    gpa: "",
    high_school_name: "",
    city: "",
    state: "",
    highlight_film_url: "",
    aau_team: "",
  });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const payload: any = {};
    for (const [k, v] of Object.entries(form)) {
      if (v === "") continue;
      if (k === "grad_year") payload[k] = parseInt(v, 10);
      else if (k === "gpa") payload[k] = parseFloat(v);
      else payload[k] = v;
    }
    const { error } = await supabase.from("profiles").update(payload).eq("id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    await refreshProfile();
    toast({ title: "Profile updated" });
    onSaved();
  };

  return (
    <Card className="p-6 bg-white border-gray-200">
      <div className="flex items-center gap-2 mb-1">
        <UserCheck className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Complete your recruiting profile</h3>
      </div>
      <p className="text-sm text-gray-600 mb-5">
        Coaches need this info in your emails. Fill in the missing fields below.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {missing.map((field) => {
          const label = FIELD_LABELS[field] ?? field;

          if (field === "grad_year") {
            return (
              <div key={field}>
                <Label className="text-gray-700">{label}</Label>
                <Select value={form.grad_year} onValueChange={(v) => set("grad_year", v)}>
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {[2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          }

          if (field === "state") {
            return (
              <div key={field}>
                <Label className="text-gray-700">{label}</Label>
                <Select value={form.state} onValueChange={(v) => set("state", v)}>
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent className="bg-white max-h-72">
                    {US_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            );
          }

          return (
            <div key={field}>
              <Label className="text-gray-700">{label}</Label>
              <Input
                type={field === "gpa" ? "number" : "text"}
                step={field === "gpa" ? "0.01" : undefined}
                min={field === "gpa" ? 0 : undefined}
                max={field === "gpa" ? 4 : undefined}
                value={form[field] ?? ""}
                onChange={(e) => set(field, e.target.value)}
                className="bg-white border-gray-300 text-gray-900"
                placeholder={field === "highlight_film_url" ? "https://hudl.com/..." : ""}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex justify-end">
        <Button onClick={save} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Save profile
        </Button>
      </div>
    </Card>
  );
}
