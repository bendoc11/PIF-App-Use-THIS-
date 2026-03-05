import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, Pencil, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Coach {
  id: string;
  name: string;
  school: string | null;
  position: string | null;
  focus_area: string | null;
  bio: string | null;
  avatar_url: string | null;
  initials: string | null;
}

export default function AdminCoaches() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Coach | null>(null);
  const [form, setForm] = useState({ name: "", school: "", position: "", focus_area: "", bio: "" });
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const fetchCoaches = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("coaches")
      .select("id, name, school, position, focus_area, bio, avatar_url, initials")
      .order("name");
    if (error) {
      toast({ title: "Error loading coaches", description: error.message, variant: "destructive" });
    }
    setCoaches((data as Coach[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchCoaches(); }, []);

  const openEdit = (coach: Coach) => {
    setEditing(coach);
    setForm({
      school: coach.school || "",
      position: coach.position || "",
      focus_area: coach.focus_area || "",
      bio: coach.bio || "",
    });
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    const { error } = await supabase.from("coaches").update({
      school: form.school || null,
      position: form.position || null,
      focus_area: form.focus_area || null,
      bio: form.bio || null,
    }).eq("id", editing.id);
    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Coach updated" });
      setCoaches((prev) => prev.map((c) => c.id === editing.id ? { ...c, ...form } : c));
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editing) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const path = `coaches/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("course-thumbnails").upload(path, file);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploadingAvatar(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("course-thumbnails").getPublicUrl(path);
    const avatarUrl = urlData.publicUrl;
    const { error: updateError } = await supabase.from("coaches").update({ avatar_url: avatarUrl }).eq("id", editing.id);
    if (updateError) {
      toast({ title: "Error saving photo", description: updateError.message, variant: "destructive" });
    } else {
      setEditing({ ...editing, avatar_url: avatarUrl });
      setCoaches((prev) => prev.map((c) => c.id === editing.id ? { ...c, avatar_url: avatarUrl } : c));
      toast({ title: "Photo updated" });
    }
    setUploadingAvatar(false);
  };

  const removeAvatar = async () => {
    if (!editing) return;
    await supabase.from("coaches").update({ avatar_url: null }).eq("id", editing.id);
    setEditing({ ...editing, avatar_url: null });
    setCoaches((prev) => prev.map((c) => c.id === editing.id ? { ...c, avatar_url: null } : c));
    toast({ title: "Photo removed" });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-heading text-foreground">Coaches</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : coaches.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground">No coaches found.</p>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="font-heading tracking-wider">Photo</TableHead>
                  <TableHead className="font-heading tracking-wider">Name</TableHead>
                  <TableHead className="font-heading tracking-wider">School</TableHead>
                  <TableHead className="font-heading tracking-wider">Position</TableHead>
                  <TableHead className="font-heading tracking-wider">Focus</TableHead>
                  <TableHead className="font-heading tracking-wider text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coaches.map((coach) => (
                  <TableRow key={coach.id} className="border-border">
                    <TableCell>
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border">
                        {coach.avatar_url ? (
                          <img src={coach.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-heading text-muted-foreground">{coach.initials || coach.name.charAt(0)}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{coach.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{coach.school || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{coach.position || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{coach.focus_area || "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(coach)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Edit Modal */}
        {editing && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-heading text-foreground">Edit {editing.name}</h3>
                <button onClick={() => setEditing(null)} className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border shrink-0">
                  {editing.avatar_url ? (
                    <img src={editing.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-heading text-muted-foreground">{editing.initials || editing.name.charAt(0)}</span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-muted hover:bg-muted/80 cursor-pointer transition-colors w-fit">
                    {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    <span className="text-sm">{uploadingAvatar ? "Uploading..." : editing.avatar_url ? "Replace Photo" : "Upload Photo"}</span>
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={uploadingAvatar} />
                  </label>
                  {editing.avatar_url && (
                    <button onClick={removeAvatar} className="text-xs text-destructive hover:underline w-fit">Remove photo</button>
                  )}
                </div>
              </div>

              {/* Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">School</label>
                  <Input value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} placeholder="e.g. Duke University" className="bg-muted border-border text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Position</label>
                  <Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="e.g. Point Guard" className="bg-muted border-border text-sm" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Focus Area</label>
                <Input value={form.focus_area} onChange={(e) => setForm({ ...form, focus_area: e.target.value })} placeholder="e.g. Ball Handling, Shooting" className="bg-muted border-border text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Bio</label>
                <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Write a short bio..." rows={3} className="bg-muted border-border text-sm" />
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : "Save Changes"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
