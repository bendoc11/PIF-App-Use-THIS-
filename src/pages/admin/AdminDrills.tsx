import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Loader2, X, Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const DRILL_TAGS = ["Shooting", "Ball Handling", "Defense", "Finishing", "Conditioning", "Beginner", "Intermediate", "Advanced"];

interface DrillRow {
  id: string;
  title: string;
  category: string;
  level: string | null;
  created_at: string;
  drill_type: string | null;
  duration_seconds: number | null;
  reps: number | null;
  sets: number | null;
  vimeo_id: string | null;
  description: string | null;
  coaching_tips: any;
  equipment_needed: string[] | null;
  course_id: string | null;
  coaches: { name: string } | null;
}

interface DrillForm {
  id?: string;
  title: string;
  vimeo_id: string;
  mux_playback_id: string;
  duration_seconds: number;
  description: string;
  coaching_tips: string;
  equipment_needed: string[];
  category: string;
  level: string;
  drill_type: string;
  reps: number | null;
  sets: number | null;
  thumbnail_url: string | null;
  enable_shot_tracking: boolean;
  shot_attempts: number | null;
}

export default function AdminDrills() {
  const { profile } = useAuth();
  const role = profile?.role || "user";
  const [drills, setDrills] = useState<DrillRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDrill, setEditingDrill] = useState<DrillForm | null>(null);
  const [equipmentInput, setEquipmentInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);

  const fetchDrills = async () => {
    setLoading(true);
    // Fetch standalone drills (no course_id) + also all drills for admin visibility
    const { data, error } = await supabase
      .from("drills")
      .select("id, title, category, level, created_at, drill_type, duration_seconds, reps, sets, vimeo_id, description, coaching_tips, equipment_needed, course_id, thumbnail_url, coaches(name)")
      .is("course_id", null)
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error loading drills", description: error.message, variant: "destructive" });
    }
    setDrills((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchDrills(); }, []);

  const extractVimeoId = (input: string) => {
    const iframeMatch = input.match(/player\.vimeo\.com\/video\/(\d+)/);
    if (iframeMatch) return iframeMatch[1];
    const urlMatch = input.match(/vimeo\.com\/(\d+)/);
    if (urlMatch) return urlMatch[1];
    return input.replace(/\D/g, "");
  };

  const openNewDrill = () => {
    setEditingDrill({
      title: "", vimeo_id: "", mux_playback_id: "", duration_seconds: 0, description: "",
      coaching_tips: "", equipment_needed: [], category: "", level: "",
      drill_type: "", reps: null, sets: null, thumbnail_url: null,
      enable_shot_tracking: false, shot_attempts: null,
    });
  };

  const openEditDrill = (d: DrillRow) => {
    setEditingDrill({
      id: d.id,
      title: d.title,
      vimeo_id: d.vimeo_id || "",
      mux_playback_id: (d as any).mux_playback_id || "",
      duration_seconds: d.duration_seconds || 0,
      description: d.description || "",
      coaching_tips: Array.isArray(d.coaching_tips) ? d.coaching_tips.join("\n") : "",
      equipment_needed: d.equipment_needed || [],
      category: d.category || "",
      level: d.level || "",
      drill_type: d.drill_type || "",
      reps: d.reps ?? null,
      sets: d.sets ?? null,
      thumbnail_url: (d as any).thumbnail_url || null,
      enable_shot_tracking: (d as any).enable_shot_tracking || false,
      shot_attempts: (d as any).shot_attempts ?? null,
    });
  };

  const handleDrillThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingDrill) return;
    setUploadingThumb(true);
    const ext = file.name.split(".").pop();
    const path = `drills/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("course-thumbnails").upload(path, file);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploadingThumb(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("course-thumbnails").getPublicUrl(path);
    console.log("[AdminDrills] Thumbnail uploaded, public URL:", urlData.publicUrl);
    setEditingDrill({ ...editingDrill, thumbnail_url: urlData.publicUrl });
    setUploadingThumb(false);
    toast({ title: "Thumbnail uploaded" });
  };

  const parseDuration = (input: string): number => {
    const parts = input.split(":").map(Number);
    if (parts.length === 2) return (parts[0] || 0) * 60 + (parts[1] || 0);
    return parts[0] || 0;
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const addEquipmentItem = () => {
    if (!equipmentInput.trim() || !editingDrill) return;
    setEditingDrill({ ...editingDrill, equipment_needed: [...editingDrill.equipment_needed, equipmentInput.trim()] });
    setEquipmentInput("");
  };

  const removeEquipmentItem = (index: number) => {
    if (!editingDrill) return;
    setEditingDrill({ ...editingDrill, equipment_needed: editingDrill.equipment_needed.filter((_, i) => i !== index) });
  };

  const handleSaveDrill = async () => {
    if (!editingDrill || !editingDrill.title.trim()) {
      toast({ title: "Drill title is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const drillData: any = {
      title: editingDrill.title,
      vimeo_id: editingDrill.vimeo_id || null,
      mux_playback_id: editingDrill.mux_playback_id || null,
      duration_seconds: editingDrill.duration_seconds || null,
      description: editingDrill.description || null,
      coaching_tips: editingDrill.coaching_tips ? editingDrill.coaching_tips.split("\n").filter(Boolean) : null,
      equipment_needed: editingDrill.equipment_needed.length > 0 ? editingDrill.equipment_needed : null,
      category: editingDrill.category || "Ball Handling",
      level: editingDrill.level || null,
      drill_type: editingDrill.drill_type || null,
      reps: editingDrill.reps,
      sets: editingDrill.sets,
      course_id: null, // standalone
      thumbnail_url: editingDrill.thumbnail_url,
      enable_shot_tracking: editingDrill.enable_shot_tracking,
      shot_attempts: editingDrill.enable_shot_tracking ? editingDrill.shot_attempts : null,
    };

    console.log("[AdminDrills] Saving drill, thumbnail_url:", drillData.thumbnail_url);
    try {
      if (editingDrill.id) {
        const { error, data } = await supabase.from("drills").update(drillData).eq("id", editingDrill.id).select();
        console.log("[AdminDrills] Update result:", { error, data });
        if (error) throw error;
        toast({ title: "Drill updated" });
      } else {
        const { error, data } = await supabase.from("drills").insert(drillData).select();
        console.log("[AdminDrills] Insert result:", { error, data });
        if (error) throw error;
        toast({ title: "Drill created" });
      }
      setEditingDrill(null);
      fetchDrills();
    } catch (err: any) {
      toast({ title: "Error saving drill", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const deleteDrill = async (id: string) => {
    if (!confirm("Delete this drill? This cannot be undone.")) return;
    const { error } = await supabase.from("drills").delete().eq("id", id);
    if (error) {
      toast({ title: "Error deleting drill", description: error.message, variant: "destructive" });
      return;
    }
    setDrills((prev) => prev.filter((d) => d.id !== id));
    toast({ title: "Drill deleted" });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-heading text-foreground">Standalone Drills</h1>
          <Button onClick={openNewDrill} className="btn-cta bg-primary hover:bg-primary/90 glow-red-hover">
            <Plus className="h-4 w-4 mr-2" /> Create New Drill
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : drills.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No standalone drills yet. Create your first drill to get started.</p>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="font-heading tracking-wider">Drill Title</TableHead>
                  <TableHead className="font-heading tracking-wider">Creator</TableHead>
                  <TableHead className="font-heading tracking-wider">Category</TableHead>
                  <TableHead className="font-heading tracking-wider">Level</TableHead>
                  <TableHead className="font-heading tracking-wider">Created</TableHead>
                  <TableHead className="font-heading tracking-wider text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drills.map((drill) => (
                  <TableRow key={drill.id} className="border-border">
                    <TableCell className="font-medium text-foreground">{drill.title}</TableCell>
                    <TableCell className="text-muted-foreground">{drill.coaches?.name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{drill.category}</TableCell>
                    <TableCell className="text-muted-foreground">{drill.level || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(drill.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditDrill(drill)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteDrill(drill.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Drill Editor Modal - same as workout editor */}
      {editingDrill && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-heading text-foreground">{editingDrill.id ? "Edit Drill" : "New Drill"}</h3>
              <button onClick={() => setEditingDrill(null)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2">
              <Label className="font-heading tracking-wider text-sm">Drill Title</Label>
              <Input value={editingDrill.title} onChange={(e) => setEditingDrill({ ...editingDrill, title: e.target.value })} placeholder="e.g. Crossover Sprint" />
            </div>

            <div className="space-y-2">
              <Label className="font-heading tracking-wider text-sm">Thumbnail</Label>
              {editingDrill.thumbnail_url && (
                <div className="relative w-full max-w-xs">
                  <img src={editingDrill.thumbnail_url} alt="Drill thumbnail" className="rounded-lg border border-border w-full aspect-video object-cover" />
                  <button type="button" onClick={() => setEditingDrill({ ...editingDrill, thumbnail_url: null })} className="absolute top-1 right-1 p-1 bg-background/80 rounded-full hover:bg-destructive hover:text-destructive-foreground transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-muted hover:bg-muted/80 cursor-pointer transition-colors w-fit">
                {uploadingThumb ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                <span className="text-sm">{uploadingThumb ? "Uploading..." : editingDrill.thumbnail_url ? "Replace" : "Upload Image"}</span>
                <input type="file" accept="image/*" onChange={handleDrillThumbnailUpload} className="hidden" disabled={uploadingThumb} />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-heading tracking-wider text-sm">Vimeo URL</Label>
                <Input value={editingDrill.vimeo_id} onChange={(e) => setEditingDrill({ ...editingDrill, vimeo_id: extractVimeoId(e.target.value) })} placeholder="Paste Vimeo URL or iframe" />
              </div>
              <div className="space-y-2">
                <Label className="font-heading tracking-wider text-sm">Mux Playback ID</Label>
                <Input value={editingDrill.mux_playback_id} onChange={(e) => setEditingDrill({ ...editingDrill, mux_playback_id: e.target.value.trim() })} placeholder="e.g. a1b2c3d4e5" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-heading tracking-wider text-sm">Duration (m:ss)</Label>
                <Input defaultValue={formatDuration(editingDrill.duration_seconds)} onBlur={(e) => setEditingDrill({ ...editingDrill, duration_seconds: parseDuration(e.target.value) })} placeholder="5:00" />
              </div>
            </div>

            {editingDrill.vimeo_id && /^\d+$/.test(editingDrill.vimeo_id) && (
              <div className="aspect-video bg-background rounded-lg overflow-hidden border border-border">
                <iframe src={`https://player.vimeo.com/video/${editingDrill.vimeo_id}?color=E8453C&title=0&byline=0&portrait=0`} className="w-full h-full" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
              </div>
            )}

            {/* Drill Type Selector */}
            <div className="space-y-2">
              <Label className="font-heading tracking-wider text-sm">Drill Type</Label>
              <div className="flex rounded-lg border border-border overflow-hidden">
                {[
                  { value: "", label: "None" },
                  { value: "timed", label: "Timed" },
                  { value: "reps", label: "Reps" },
                  { value: "sets_reps", label: "Sets × Reps" },
                ].map((opt) => (
                  <button key={opt.value} type="button"
                    onClick={() => setEditingDrill({ ...editingDrill, drill_type: opt.value, reps: opt.value === "timed" || opt.value === "" ? null : editingDrill.reps, sets: opt.value !== "sets_reps" ? null : editingDrill.sets })}
                    className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${editingDrill.drill_type === opt.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {editingDrill.drill_type === "timed" && (
              <div className="space-y-2">
                <Label className="font-heading tracking-wider text-sm">Duration (seconds)</Label>
                <Input type="number" value={editingDrill.duration_seconds || ""} onChange={(e) => setEditingDrill({ ...editingDrill, duration_seconds: parseInt(e.target.value) || 0 })} placeholder="e.g. 30" className="w-40" />
              </div>
            )}
            {editingDrill.drill_type === "reps" && (
              <div className="space-y-2">
                <Label className="font-heading tracking-wider text-sm">Reps</Label>
                <Input type="number" value={editingDrill.reps ?? ""} onChange={(e) => setEditingDrill({ ...editingDrill, reps: e.target.value ? parseInt(e.target.value) : null })} placeholder="e.g. 10" className="w-40" />
              </div>
            )}
            {editingDrill.drill_type === "sets_reps" && (
              <div className="flex gap-4">
                <div className="space-y-2">
                  <Label className="font-heading tracking-wider text-sm">Sets</Label>
                  <Input type="number" value={editingDrill.sets ?? ""} onChange={(e) => setEditingDrill({ ...editingDrill, sets: e.target.value ? parseInt(e.target.value) : null })} placeholder="e.g. 3" className="w-32" />
                </div>
                <div className="space-y-2">
                  <Label className="font-heading tracking-wider text-sm">Reps</Label>
                  <Input type="number" value={editingDrill.reps ?? ""} onChange={(e) => setEditingDrill({ ...editingDrill, reps: e.target.value ? parseInt(e.target.value) : null })} placeholder="e.g. 10" className="w-32" />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-heading tracking-wider text-sm">Category</Label>
                <Select value={editingDrill.category} onValueChange={(v) => setEditingDrill({ ...editingDrill, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {DRILL_TAGS.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-heading tracking-wider text-sm">Level</Label>
                <Select value={editingDrill.level} onValueChange={(v) => setEditingDrill({ ...editingDrill, level: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Shot Tracking */}
            <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/30">
              <div className="flex items-center justify-between">
                <Label className="font-heading tracking-wider text-sm">Shot Tracking</Label>
                <button
                  type="button"
                  onClick={() => setEditingDrill({ ...editingDrill, enable_shot_tracking: !editingDrill.enable_shot_tracking, shot_attempts: !editingDrill.enable_shot_tracking ? editingDrill.shot_attempts : null })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${editingDrill.enable_shot_tracking ? "bg-primary" : "bg-muted"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${editingDrill.enable_shot_tracking ? "translate-x-5" : ""}`} />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Enable shot tracking for this drill</p>
              {editingDrill.enable_shot_tracking && (
                <div className="space-y-2 pt-1">
                  <Label className="font-heading tracking-wider text-sm">Total shots to attempt</Label>
                  <Input type="number" value={editingDrill.shot_attempts ?? ""} onChange={(e) => setEditingDrill({ ...editingDrill, shot_attempts: e.target.value ? parseInt(e.target.value) : null })} placeholder="e.g. 20" className="w-40" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="font-heading tracking-wider text-sm">Description</Label>
              <Textarea value={editingDrill.description} onChange={(e) => setEditingDrill({ ...editingDrill, description: e.target.value })} placeholder="Drill overview..." rows={3} />
            </div>

            <div className="space-y-2">
              <Label className="font-heading tracking-wider text-sm">Coaching Tips (one per line)</Label>
              <Textarea value={editingDrill.coaching_tips} onChange={(e) => setEditingDrill({ ...editingDrill, coaching_tips: e.target.value })} placeholder="Keep your eyes up&#10;Stay low in your stance" rows={4} />
            </div>

            <div className="space-y-2">
              <Label className="font-heading tracking-wider text-sm">What You'll Need</Label>
              <div className="flex gap-2">
                <Input value={equipmentInput} onChange={(e) => setEquipmentInput(e.target.value)} placeholder="e.g. 1 basketball" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addEquipmentItem())} />
                <Button variant="outline" onClick={addEquipmentItem} type="button">Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {editingDrill.equipment_needed.map((item, i) => (
                  <Badge key={i} variant="secondary" className="gap-1 pr-1">
                    {item}
                    <button onClick={() => removeEquipmentItem(i)} className="ml-1 hover:text-destructive"><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setEditingDrill(null)}>Cancel</Button>
              <Button onClick={handleSaveDrill} disabled={saving} className="btn-cta bg-primary hover:bg-primary/90">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingDrill.id ? "Update Drill" : "Create Drill"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
