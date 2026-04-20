import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Copy, Eye, Edit3, Camera, Check, Plus, Trash2, ExternalLink, ChevronDown } from "lucide-react";
import { ProfileCompletionBar } from "@/components/profile/ProfileCompletionBar";
import { TargetSchoolsList } from "@/components/profile/TargetSchoolsList";

const POSITIONS = ["PG", "SG", "SF", "PF", "C"];
const CLASSIFICATIONS = ["Dream", "Target", "Safety"] as const;
const STATUSES = ["Interested", "Contacted", "Replied", "Visited", "Offered", "Committed"] as const;

type FilmLink = { label: string; url: string };
type UpcomingEvent = { name: string; location: string; date: string };

function calculateCompletion(p: any): number {
  const fields = [
    p?.avatar_url, p?.grad_year, p?.gpa, p?.highlight_film_url,
    p?.bio, p?.positions?.length, p?.height, p?.weight,
    p?.high_school_name, p?.hs_team_name, p?.intended_major,
    p?.city, p?.state, p?.gpa_unweighted, p?.jersey_number,
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

function getRequiredFieldsMissing(p: any): string[] {
  const missing: string[] = [];
  if (!p?.avatar_url) missing.push("Profile photo");
  if (!p?.grad_year) missing.push("Graduation year");
  if (!p?.gpa) missing.push("GPA");
  if (!p?.highlight_film_url) missing.push("Highlight film link");
  return missing;
}

/* ── Section wrapper ── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 md:p-6">
      <h2 className="font-heading text-lg tracking-widest text-foreground mb-5 border-b border-border pb-3">{title}</h2>
      {children}
    </div>
  );
}

/* ── Field row ── */
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="font-heading text-xs tracking-widest text-muted-foreground">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground/60">{hint}</p>}
    </div>
  );
}

/* ── Public profile view ── */
function PublicProfileView({ profile: p }: { profile: any }) {
  const filmLinks: FilmLink[] = Array.isArray(p.additional_film_links) ? p.additional_film_links : [];
  const events: UpcomingEvent[] = Array.isArray(p.upcoming_events) ? p.upcoming_events : [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12 space-y-6">
        {/* Header */}
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <div className="w-24 h-24 rounded-full bg-muted mx-auto mb-4 overflow-hidden border-2 border-primary/30">
            {p.avatar_url ? (
              <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-heading text-2xl text-muted-foreground">
                {(p.first_name?.[0] || "")}{(p.last_name?.[0] || "")}
              </div>
            )}
          </div>
          <h1 className="font-heading text-2xl text-foreground">{p.first_name} {p.last_name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {[p.grad_year && `Class of ${p.grad_year}`, p.position, p.height, p.high_school_name, p.city && p.state ? `${p.city}, ${p.state}` : p.state].filter(Boolean).join(" · ")}
          </p>
          <Button variant="outline" className="mt-4" disabled>Request Info</Button>
        </div>

        {/* About */}
        {(p.bio || p.intended_major) && (
          <Section title="ABOUT">
            {p.bio && <p className="font-body text-sm text-muted-foreground leading-relaxed">{p.bio}</p>}
            {p.intended_major && (
              <p className="text-sm text-muted-foreground mt-3"><span className="text-foreground font-medium">Intended Major:</span> {p.intended_major}</p>
            )}
          </Section>
        )}

        {/* Athletic */}
        <Section title="ATHLETIC PROFILE">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            {p.positions?.length > 0 && <div><span className="text-muted-foreground">Position(s):</span> <span className="text-foreground">{p.positions.join(", ")}</span></div>}
            {p.height && <div><span className="text-muted-foreground">Height:</span> <span className="text-foreground">{p.height}</span></div>}
            {p.weight && <div><span className="text-muted-foreground">Weight:</span> <span className="text-foreground">{p.weight} lbs</span></div>}
            {p.wingspan && <div><span className="text-muted-foreground">Wingspan:</span> <span className="text-foreground">{p.wingspan}</span></div>}
            {p.jersey_number && <div><span className="text-muted-foreground">Jersey #:</span> <span className="text-foreground">{p.jersey_number}</span></div>}
          </div>
          {p.high_school_name && (
            <p className="text-sm text-muted-foreground mt-3">
              <span className="text-foreground">{p.hs_team_name || p.high_school_name}</span>
              {p.hs_coach_name && <> · Coach {p.hs_coach_name}</>}
            </p>
          )}
          {p.aau_team && (
            <p className="text-sm text-muted-foreground mt-1">
              AAU: <span className="text-foreground">{p.aau_team}</span>
              {p.aau_coach_name && <> · Coach {p.aau_coach_name}</>}
            </p>
          )}
          {events.length > 0 && (
            <div className="mt-4">
              <p className="font-heading text-xs tracking-widest text-muted-foreground mb-2">UPCOMING EVENTS</p>
              {events.map((e, i) => (
                <p key={i} className="text-sm text-foreground">{e.name} · {e.location} · {e.date}</p>
              ))}
            </div>
          )}
        </Section>

        {/* Academic */}
        <Section title="ACADEMIC PROFILE">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            {p.gpa && <div><span className="text-muted-foreground">GPA (W):</span> <span className="text-foreground">{p.gpa}</span></div>}
            {p.gpa_unweighted && <div><span className="text-muted-foreground">GPA (UW):</span> <span className="text-foreground">{p.gpa_unweighted}</span></div>}
            {p.sat_score && <div><span className="text-muted-foreground">SAT:</span> <span className="text-foreground">{p.sat_score}</span></div>}
            {p.act_score && <div><span className="text-muted-foreground">ACT:</span> <span className="text-foreground">{p.act_score}</span></div>}
            {p.grad_year && <div><span className="text-muted-foreground">Grad Year:</span> <span className="text-foreground">{p.grad_year}</span></div>}
            {p.intended_major && <div><span className="text-muted-foreground">Major:</span> <span className="text-foreground">{p.intended_major}</span></div>}
          </div>
          {p.academic_honors && <p className="text-sm text-muted-foreground mt-3"><span className="text-foreground font-medium">Honors:</span> {p.academic_honors}</p>}
        </Section>

        {/* Video */}
        {(p.highlight_film_url || filmLinks.length > 0) && (
          <Section title="VIDEO & FILM">
            {p.highlight_film_url && (
              <a href={p.highlight_film_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline mb-3">
                <ExternalLink className="h-4 w-4" /> Featured Highlight Film
              </a>
            )}
            {filmLinks.map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                <ExternalLink className="h-4 w-4" /> {link.label || `Film ${i + 1}`}
              </a>
            ))}
          </Section>
        )}

        <p className="text-center text-xs text-muted-foreground py-4">
          Powered by <span className="text-primary font-medium">Play it Forward Basketball</span>
        </p>
      </div>
    </div>
  );
}

/* ── Main Profile Page ── */
export default function RecruitProfile() {
  const { username } = useParams();
  const { user, profile: authProfile } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  // Form state
  const [form, setForm] = useState<any>({});
  const [filmLinks, setFilmLinks] = useState<FilmLink[]>([]);
  const [events, setEvents] = useState<UpcomingEvent[]>([]);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      if (username) {
        // Public view by username
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("username", username)
          .maybeSingle();
        if (data) {
          setProfile(data);
          setIsOwner(user?.id === data.id);
          initForm(data);
        }
      } else if (user) {
        // Own profile
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (data) {
          setProfile(data);
          setIsOwner(true);
          initForm(data);
          // Auto-generate username if missing
          if (!data.username && data.first_name && data.last_name) {
            const base = `${data.first_name}${data.last_name}`.toLowerCase().replace(/[^a-z0-9]/g, "");
            const uname = `${base}${data.grad_year || ""}`;
            await supabase.from("profiles").update({ username: uname }).eq("id", user.id);
            setForm((f: any) => ({ ...f, username: uname }));
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }, [username, user]);

  function initForm(data: any) {
    setForm({ ...data });
    setFilmLinks(Array.isArray(data.additional_film_links) ? data.additional_film_links : []);
    setEvents(Array.isArray(data.upcoming_events) ? data.upcoming_events : []);
  }

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const updateField = (key: string, value: any) => setForm((f: any) => ({ ...f, [key]: value }));

  const togglePosition = (pos: string) => {
    const current: string[] = form.positions || [];
    const next = current.includes(pos) ? current.filter((p: string) => p !== pos) : [...current, pos];
    updateField("positions", next);
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({
        bio: form.bio,
        intended_major: form.intended_major,
        weight: form.weight,
        wingspan: form.wingspan,
        jersey_number: form.jersey_number,
        positions: form.positions,
        height: form.height,
        hs_team_name: form.hs_team_name,
        hs_coach_name: form.hs_coach_name,
        hs_coach_email: form.hs_coach_email,
        hs_coach_phone: form.hs_coach_phone,
        aau_team: form.aau_team,
        aau_coach_name: form.aau_coach_name,
        aau_coach_email: form.aau_coach_email,
        gpa: form.gpa ? Number(form.gpa) : null,
        gpa_unweighted: form.gpa_unweighted ? Number(form.gpa_unweighted) : null,
        sat_score: form.sat_score ? Number(form.sat_score) : null,
        act_score: form.act_score ? Number(form.act_score) : null,
        academic_honors: form.academic_honors,
        highlight_film_url: form.highlight_film_url,
        additional_film_links: filmLinks,
        upcoming_events: events,
        parent_name: form.parent_name,
        parent_email: form.parent_email,
        parent_phone: form.parent_phone,
        high_school_name: form.high_school_name,
        city: form.city,
        state: form.state,
        grad_year: form.grad_year ? Number(form.grad_year) : null,
        username: form.username,
      }).eq("id", user.id);

      if (error) throw error;
      toast({ title: "Profile saved!" });
      setProfile({ ...profile, ...form, additional_film_links: filmLinks, upcoming_events: events });
    } catch (e: any) {
      toast({ title: "Error saving", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) { toast({ title: "Upload failed", variant: "destructive" }); return; }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
    updateField("avatar_url", publicUrl);
    toast({ title: "Photo updated!" });
  };

  const copyProfileLink = () => {
    const link = `${window.location.origin}/profile/${form.username || ""}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Profile link copied!" });
  };

  if (loading) {
    return username ? (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    ) : (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!profile) {
    return username ? (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
        <div className="text-center">
          <h1 className="font-heading text-2xl mb-2">PROFILE NOT FOUND</h1>
          <p className="text-muted-foreground">This recruiting profile doesn't exist.</p>
        </div>
      </div>
    ) : null;
  }

  // Public view (not logged in or viewing someone else's profile)
  if (username && !isOwner) {
    return <PublicProfileView profile={profile} />;
  }

  // Preview mode
  if (previewMode) {
    return (
      <div className="relative">
        <div className="fixed top-0 left-0 right-0 z-50 bg-primary py-2 text-center">
          <span className="font-heading text-sm tracking-widest text-foreground">PREVIEW MODE — THIS IS WHAT COACHES SEE</span>
          <Button variant="ghost" className="ml-4 text-foreground font-heading text-xs" onClick={() => setPreviewMode(false)}>
            ← BACK TO EDITING
          </Button>
        </div>
        <div className="pt-10">
          <PublicProfileView profile={{ ...form, additional_film_links: filmLinks, upcoming_events: events }} />
        </div>
      </div>
    );
  }

  const completion = calculateCompletion(form);
  const missingRequired = getRequiredFieldsMissing(form);

  // Edit mode
  const content = (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-heading text-2xl tracking-widest text-foreground">MY RECRUITING PROFILE</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPreviewMode(true)} className="font-heading text-xs tracking-wider">
            <Eye className="h-4 w-4 mr-1" /> PREVIEW AS COACH
          </Button>
          {form.username && (
            <Button variant="outline" size="sm" onClick={copyProfileLink} className="font-heading text-xs tracking-wider">
              <Copy className="h-4 w-4 mr-1" /> COPY LINK
            </Button>
          )}
          <Button size="sm" onClick={saveProfile} disabled={saving} className="btn-cta bg-primary text-foreground font-heading text-xs tracking-wider">
            {saving ? "Saving..." : "SAVE PROFILE"}
          </Button>
        </div>
      </div>

      {/* Completion bar */}
      <ProfileCompletionBar completion={completion} missingRequired={missingRequired} />

      {/* Header / Avatar */}
      <div className="bg-card border border-border rounded-xl p-6 flex flex-col sm:flex-row items-center gap-5">
        <div className="relative group">
          <div className="w-24 h-24 rounded-full bg-muted overflow-hidden border-2 border-primary/30">
            {form.avatar_url ? (
              <img src={form.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-heading text-2xl text-muted-foreground">
                {(form.first_name?.[0] || "")}{(form.last_name?.[0] || "")}
              </div>
            )}
          </div>
          <label className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
            <Camera className="h-6 w-6 text-foreground" />
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </label>
        </div>
        <div className="flex-1 space-y-3 w-full">
          <div className="grid grid-cols-2 gap-3">
            <Field label="FIRST NAME">
              <Input value={form.first_name || ""} onChange={(e) => updateField("first_name", e.target.value)} className="bg-muted border-border" />
            </Field>
            <Field label="LAST NAME">
              <Input value={form.last_name || ""} onChange={(e) => updateField("last_name", e.target.value)} className="bg-muted border-border" />
            </Field>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field label="GRAD YEAR">
              <Input type="number" value={form.grad_year || ""} onChange={(e) => updateField("grad_year", e.target.value)} className="bg-muted border-border" />
            </Field>
            <Field label="HEIGHT">
              <Input value={form.height || ""} onChange={(e) => updateField("height", e.target.value)} placeholder={`6'2"`} className="bg-muted border-border" />
            </Field>
            <Field label="CITY">
              <Input value={form.city || ""} onChange={(e) => updateField("city", e.target.value)} className="bg-muted border-border" />
            </Field>
            <Field label="STATE">
              <Input value={form.state || ""} onChange={(e) => updateField("state", e.target.value)} className="bg-muted border-border" />
            </Field>
          </div>
          <Field label="USERNAME">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">playitforward.app/profile/</span>
              <Input value={form.username || ""} onChange={(e) => updateField("username", e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))} className="bg-muted border-border flex-1" />
            </div>
          </Field>
        </div>
      </div>

      {/* About */}
      <Section title="ABOUT">
        <div className="space-y-4">
          <Field label="BIO" hint="Introduce yourself to coaches. Tell them who you are beyond your stats. (800 characters max)">
            <Textarea
              value={form.bio || ""}
              onChange={(e) => { if (e.target.value.length <= 800) updateField("bio", e.target.value); }}
              rows={4}
              className="bg-muted border-border resize-none"
              placeholder="Tell coaches about yourself, your work ethic, and what drives you..."
            />
            <p className="text-xs text-muted-foreground/50 text-right">{(form.bio || "").length}/800</p>
          </Field>
          <Field label="INTENDED MAJOR">
            <Input value={form.intended_major || ""} onChange={(e) => updateField("intended_major", e.target.value)} className="bg-muted border-border" placeholder="e.g. Business Administration" />
          </Field>
        </div>
      </Section>

      {/* Athletic Profile */}
      <Section title="ATHLETIC PROFILE">
        <div className="space-y-5">
          <Field label="POSITION(S)">
            <div className="flex gap-2 flex-wrap">
              {POSITIONS.map((pos) => (
                <button
                  key={pos}
                  onClick={() => togglePosition(pos)}
                  className={`px-4 py-2 rounded-lg font-heading text-xs tracking-wider transition-colors ${
                    (form.positions || []).includes(pos)
                      ? "bg-primary text-foreground"
                      : "bg-muted border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field label="WEIGHT (LBS)">
              <Input value={form.weight || ""} onChange={(e) => updateField("weight", e.target.value)} className="bg-muted border-border" />
            </Field>
            <Field label="WINGSPAN">
              <Input value={form.wingspan || ""} onChange={(e) => updateField("wingspan", e.target.value)} className="bg-muted border-border" placeholder={`6'8"`} />
            </Field>
            <Field label="JERSEY #">
              <Input value={form.jersey_number || ""} onChange={(e) => updateField("jersey_number", e.target.value)} className="bg-muted border-border" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="HIGH SCHOOL">
              <Input value={form.high_school_name || ""} onChange={(e) => updateField("high_school_name", e.target.value)} className="bg-muted border-border" />
            </Field>
            <Field label="HS TEAM NAME">
              <Input value={form.hs_team_name || ""} onChange={(e) => updateField("hs_team_name", e.target.value)} className="bg-muted border-border" />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="HS COACH NAME">
              <Input value={form.hs_coach_name || ""} onChange={(e) => updateField("hs_coach_name", e.target.value)} className="bg-muted border-border" />
            </Field>
            <Field label="HS COACH EMAIL">
              <Input type="email" value={form.hs_coach_email || ""} onChange={(e) => updateField("hs_coach_email", e.target.value)} className="bg-muted border-border" />
            </Field>
            <Field label="HS COACH PHONE">
              <Input value={form.hs_coach_phone || ""} onChange={(e) => updateField("hs_coach_phone", e.target.value)} className="bg-muted border-border" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="AAU/CLUB TEAM">
              <Input value={form.aau_team || ""} onChange={(e) => updateField("aau_team", e.target.value)} className="bg-muted border-border" />
            </Field>
            <Field label="AAU COACH NAME">
              <Input value={form.aau_coach_name || ""} onChange={(e) => updateField("aau_coach_name", e.target.value)} className="bg-muted border-border" />
            </Field>
          </div>
          <Field label="AAU COACH EMAIL">
            <Input type="email" value={form.aau_coach_email || ""} onChange={(e) => updateField("aau_coach_email", e.target.value)} className="bg-muted border-border w-full sm:w-1/2" />
          </Field>

          {/* Upcoming events */}
          <Field label="UPCOMING SHOWCASES / EVENTS">
            <div className="space-y-2">
              {events.map((ev, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input value={ev.name} onChange={(e) => { const n = [...events]; n[i].name = e.target.value; setEvents(n); }} placeholder="Event name" className="bg-muted border-border flex-1" />
                  <Input value={ev.location} onChange={(e) => { const n = [...events]; n[i].location = e.target.value; setEvents(n); }} placeholder="Location" className="bg-muted border-border w-32" />
                  <Input type="date" value={ev.date} onChange={(e) => { const n = [...events]; n[i].date = e.target.value; setEvents(n); }} className="bg-muted border-border w-36" />
                  <button onClick={() => setEvents(events.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setEvents([...events, { name: "", location: "", date: "" }])} className="font-heading text-xs">
                <Plus className="h-3 w-3 mr-1" /> ADD EVENT
              </Button>
            </div>
          </Field>
        </div>
      </Section>

      {/* Academic Profile */}
      <Section title="ACADEMIC PROFILE">
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field label="GPA (WEIGHTED)">
              <Input type="number" step="0.01" value={form.gpa || ""} onChange={(e) => updateField("gpa", e.target.value)} className="bg-muted border-border" />
            </Field>
            <Field label="GPA (UNWEIGHTED)">
              <Input type="number" step="0.01" value={form.gpa_unweighted || ""} onChange={(e) => updateField("gpa_unweighted", e.target.value)} className="bg-muted border-border" />
            </Field>
            <Field label="SAT SCORE">
              <Input type="number" value={form.sat_score || ""} onChange={(e) => updateField("sat_score", e.target.value)} className="bg-muted border-border" />
            </Field>
            <Field label="ACT SCORE">
              <Input type="number" value={form.act_score || ""} onChange={(e) => updateField("act_score", e.target.value)} className="bg-muted border-border" />
            </Field>
          </div>
          <Field label="ACADEMIC HONORS">
            <Textarea
              value={form.academic_honors || ""}
              onChange={(e) => updateField("academic_honors", e.target.value)}
              rows={2}
              className="bg-muted border-border resize-none"
              placeholder="Honor roll, AP courses, National Honor Society, etc."
            />
          </Field>
        </div>
      </Section>

      {/* Video & Film */}
      <Section title="VIDEO & FILM">
        <div className="space-y-4">
          <Field label="FEATURED HIGHLIGHT FILM" hint="YouTube, Hudl, or Vimeo link">
            <Input value={form.highlight_film_url || ""} onChange={(e) => updateField("highlight_film_url", e.target.value)} className="bg-muted border-border" placeholder="https://..." />
          </Field>
          <Field label="ADDITIONAL FILM LINKS" hint="Up to 5 additional links">
            <div className="space-y-2">
              {filmLinks.map((link, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input value={link.label} onChange={(e) => { const n = [...filmLinks]; n[i].label = e.target.value; setFilmLinks(n); }} placeholder="Label (e.g. Full game vs. Oak Hill)" className="bg-muted border-border w-48" />
                  <Input value={link.url} onChange={(e) => { const n = [...filmLinks]; n[i].url = e.target.value; setFilmLinks(n); }} placeholder="https://..." className="bg-muted border-border flex-1" />
                  <button onClick={() => setFilmLinks(filmLinks.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              {filmLinks.length < 5 && (
                <Button variant="outline" size="sm" onClick={() => setFilmLinks([...filmLinks, { label: "", url: "" }])} className="font-heading text-xs">
                  <Plus className="h-3 w-3 mr-1" /> ADD LINK
                </Button>
              )}
            </div>
          </Field>
        </div>
      </Section>

      {/* Parent/Guardian */}
      <Section title="PARENT / GUARDIAN (PRIVATE)">
        <p className="text-xs text-muted-foreground mb-4">This information is private and will not appear on your public profile.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="PARENT NAME">
            <Input value={form.parent_name || ""} onChange={(e) => updateField("parent_name", e.target.value)} className="bg-muted border-border" />
          </Field>
          <Field label="PARENT EMAIL">
            <Input type="email" value={form.parent_email || ""} onChange={(e) => updateField("parent_email", e.target.value)} className="bg-muted border-border" />
          </Field>
          <Field label="PARENT PHONE">
            <Input value={form.parent_phone || ""} onChange={(e) => updateField("parent_phone", e.target.value)} className="bg-muted border-border" />
          </Field>
        </div>
      </Section>

      {/* Target Schools */}
      <TargetSchoolsList userId={user?.id} />

      {/* Bottom save */}
      <div className="flex justify-end">
        <Button onClick={saveProfile} disabled={saving} className="btn-cta bg-primary text-foreground font-heading tracking-wider px-8 py-5">
          {saving ? "SAVING..." : "SAVE PROFILE"}
        </Button>
      </div>
    </div>
  );

  return username ? content : <AppLayout>{content}</AppLayout>;
}
