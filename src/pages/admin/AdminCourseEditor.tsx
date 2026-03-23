import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ArrowUp, ArrowDown, Plus, Trash2, Loader2, Save, X, Upload, Search, Link2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const CATEGORIES = ["Shooting", "Ball Handling", "Defense", "Finishing", "Conditioning", "Mindset", "Skill Development"];
const DRILL_TAGS = ["Shooting", "Ball Handling", "Defense", "Finishing", "Conditioning", "Beginner", "Intermediate", "Advanced"];
const SKILL_LEVELS = ["beginner", "intermediate", "advanced"];

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
  sort_order: number;
  drill_type: string;
  reps: number | null;
  sets: number | null;
  isLinked?: boolean;
  workoutCount?: number;
  thumbnail_url: string | null;
}

interface ExistingDrill {
  id: string;
  title: string;
  category: string;
  level: string | null;
  duration_seconds: number | null;
  coaches: { name: string } | null;
}

export default function AdminCourseEditor() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const role = profile?.role || "user";
  const isNew = courseId === "new";

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  // Course fields
  const [title, setTitle] = useState("");
  const [coachName, setCoachName] = useState("");
  const [coachSchool, setCoachSchool] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("draft");
  const [isFeatured, setIsFeatured] = useState(false);
  const [coachId, setCoachId] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [skillLevels, setSkillLevels] = useState<string[]>([]);
  const [ratingCategories, setRatingCategories] = useState<string[]>([]);
  const [coachAvatarUrl, setCoachAvatarUrl] = useState<string | null>(null);

  // Drills
  const [drills, setDrills] = useState<DrillForm[]>([]);
  const [editingDrill, setEditingDrill] = useState<DrillForm | null>(null);
  const [equipmentInput, setEquipmentInput] = useState("");
  const [uploadingDrillThumb, setUploadingDrillThumb] = useState(false);
  // Add Existing Drill modal
  const [showExistingModal, setShowExistingModal] = useState(false);
  const [existingDrills, setExistingDrills] = useState<ExistingDrill[]>([]);
  const [existingSearch, setExistingSearch] = useState("");
  const [existingCategoryFilter, setExistingCategoryFilter] = useState("All");
  const [existingLevelFilter, setExistingLevelFilter] = useState("All");
  const [loadingExisting, setLoadingExisting] = useState(false);

  useEffect(() => {
    if (isNew) return;
    const fetch = async () => {
      const { data: course } = await supabase
        .from("courses")
        .select("*, coaches(id, name, school, avatar_url)")
        .eq("id", courseId)
        .single();
      if (course) {
        setTitle(course.title);
        setCategory(course.category || "");
        setDescription(course.description || "");
        setStatus((course as any).status || "draft");
        setIsFeatured(course.is_featured || false);
        setThumbnailUrl(course.thumbnail_url || null);
        setSkillLevels((course as any).skill_levels || []);
        if ((course as any).coaches) {
          setCoachName((course as any).coaches.name);
          setCoachSchool((course as any).coaches.school || "");
          setCoachId((course as any).coaches.id);
          setCoachAvatarUrl((course as any).coaches.avatar_url || null);
        }
      }

      // Fetch drills via junction table
      const { data: junctionData } = await supabase
        .from("workout_drills")
        .select("drill_id, position, drills(*)")
        .eq("workout_id", courseId)
        .order("position");

      if (junctionData) {
        // Get workout counts for each drill to detect shared drills
        const drillIds = junctionData.map((j: any) => j.drill_id);
        let workoutCounts: Record<string, number> = {};
        if (drillIds.length > 0) {
          const { data: countData } = await supabase
            .from("workout_drills")
            .select("drill_id")
            .in("drill_id", drillIds);
          if (countData) {
            for (const row of countData as any[]) {
              workoutCounts[row.drill_id] = (workoutCounts[row.drill_id] || 0) + 1;
            }
          }
        }

        setDrills(
          junctionData.map((j: any) => {
            const d = j.drills;
            return {
              id: d.id,
              title: d.title,
              vimeo_id: d.vimeo_id || "",
              mux_playback_id: d.mux_playback_id || "",
              duration_seconds: d.duration_seconds || 0,
              description: d.description || "",
              coaching_tips: Array.isArray(d.coaching_tips) ? d.coaching_tips.join("\n") : "",
              equipment_needed: d.equipment_needed || [],
              category: d.category || "",
              level: d.level || "",
              sort_order: j.position,
              drill_type: d.drill_type || "",
              reps: d.reps ?? null,
              sets: d.sets ?? null,
              isLinked: d.course_id !== courseId,
              workoutCount: workoutCounts[d.id] || 1,
              thumbnail_url: d.thumbnail_url || null,
            };
          })
        );
      }
      setLoading(false);
    };
    fetch();
  }, [courseId, isNew]);

  const extractVimeoId = (input: string) => {
    const iframeMatch = input.match(/player\.vimeo\.com\/video\/(\d+)/);
    if (iframeMatch) return iframeMatch[1];
    const urlMatch = input.match(/vimeo\.com\/(\d+)/);
    if (urlMatch) return urlMatch[1];
    return input.replace(/\D/g, "");
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

  const moveDrill = (index: number, direction: "up" | "down") => {
    const newDrills = [...drills];
    const swapIdx = direction === "up" ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= newDrills.length) return;
    [newDrills[index], newDrills[swapIdx]] = [newDrills[swapIdx], newDrills[index]];
    newDrills.forEach((d, i) => (d.sort_order = i + 1));
    setDrills(newDrills);
  };

  const addEquipmentItem = () => {
    if (!equipmentInput.trim() || !editingDrill) return;
    setEditingDrill({
      ...editingDrill,
      equipment_needed: [...editingDrill.equipment_needed, equipmentInput.trim()],
    });
    setEquipmentInput("");
  };

  const removeEquipmentItem = (index: number) => {
    if (!editingDrill) return;
    setEditingDrill({
      ...editingDrill,
      equipment_needed: editingDrill.equipment_needed.filter((_, i) => i !== index),
    });
  };

  const handleDrillThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingDrill) return;
    setUploadingDrillThumb(true);
    const ext = file.name.split(".").pop();
    const path = `drills/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("course-thumbnails").upload(path, file);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploadingDrillThumb(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("course-thumbnails").getPublicUrl(path);
    setEditingDrill({ ...editingDrill, thumbnail_url: urlData.publicUrl });
    setUploadingDrillThumb(false);
    toast({ title: "Thumbnail uploaded" });
  };

  const saveDrillToList = () => {
    if (!editingDrill || !editingDrill.title) return;
    if (editingDrill.id || drills.find((d) => d === editingDrill)) {
      setDrills((prev) =>
        prev.map((d) => (d === editingDrill || (editingDrill.id && d.id === editingDrill.id) ? editingDrill : d))
      );
    } else {
      setDrills((prev) => [...prev, { ...editingDrill, sort_order: prev.length + 1 }]);
    }
    setEditingDrill(null);
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingThumb(true);
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("course-thumbnails").upload(path, file);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploadingThumb(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("course-thumbnails").getPublicUrl(path);
    setThumbnailUrl(urlData.publicUrl);
    setUploadingThumb(false);
    toast({ title: "Thumbnail uploaded" });
  };

  // Open Add Existing Drill modal
  const openExistingModal = async () => {
    setShowExistingModal(true);
    setLoadingExisting(true);
    setExistingSearch("");
    setExistingCategoryFilter("All");
    setExistingLevelFilter("All");
    const { data } = await supabase
      .from("drills")
      .select("id, title, category, level, duration_seconds, coaches(name)")
      .order("title");
    setExistingDrills((data as any) || []);
    setLoadingExisting(false);
  };

  const addExistingDrill = (drill: ExistingDrill) => {
    // Check if already in list
    if (drills.some((d) => d.id === drill.id)) {
      toast({ title: "This drill is already in this workout" });
      return;
    }
    setDrills((prev) => [
      ...prev,
      {
        id: drill.id,
        title: drill.title,
        vimeo_id: "",
        mux_playback_id: "",
        duration_seconds: drill.duration_seconds || 0,
        description: "",
        coaching_tips: "",
        equipment_needed: [],
        category: drill.category || "",
        level: drill.level || "",
        sort_order: prev.length + 1,
        drill_type: "",
        reps: null,
        sets: null,
        isLinked: true,
        workoutCount: 2,
        thumbnail_url: null,
      },
    ]);
    setShowExistingModal(false);
    toast({ title: "Drill added to workout" });
  };

  const filteredExisting = existingDrills.filter((d) => {
    const matchSearch = d.title.toLowerCase().includes(existingSearch.toLowerCase());
    const matchCat = existingCategoryFilter === "All" || d.category === existingCategoryFilter;
    const matchLvl = existingLevelFilter === "All" || d.level === existingLevelFilter;
    return matchSearch && matchCat && matchLvl;
  });

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: "Workout title is required", variant: "destructive" });
      return;
    }
    if (skillLevels.length === 0) {
      toast({ title: "At least one skill level is required", variant: "destructive" });
      return;
    }
    setSaving(true);

    try {
      // Upsert coach — reuse existing by name to avoid duplicates
      let finalCoachId = coachId;
      if (coachName.trim()) {
        if (finalCoachId) {
          await supabase.from("coaches").update({ name: coachName, school: coachSchool }).eq("id", finalCoachId);
        } else {
          // Check if a coach with this name already exists
          const { data: existingCoach } = await supabase
            .from("coaches")
            .select("id")
            .eq("name", coachName.trim())
            .maybeSingle();
          if (existingCoach) {
            finalCoachId = existingCoach.id;
            await supabase.from("coaches").update({ school: coachSchool }).eq("id", finalCoachId);
          } else {
            const { data: newCoach } = await supabase
              .from("coaches")
              .insert({ name: coachName.trim(), school: coachSchool, initials: coachName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) })
              .select("id")
              .single();
            if (newCoach) finalCoachId = newCoach.id;
          }
        }
      }

      const courseData = {
        title,
        category: category || null,
        description: description || null,
        thumbnail_url: thumbnailUrl,
        status: role === "admin" ? status : "draft",
        is_featured: isFeatured,
        coach_id: finalCoachId,
        drill_count: drills.length,
        total_duration_seconds: drills.reduce((a, d) => a + d.duration_seconds, 0),
        skill_levels: skillLevels,
      };

      let savedCourseId = courseId;
      if (isNew) {
        const { data, error } = await supabase.from("courses").insert(courseData).select("id").single();
        if (error) throw error;
        savedCourseId = data.id;
      } else {
        const { error } = await supabase.from("courses").update(courseData).eq("id", courseId);
        if (error) throw error;
      }

      // Save drills - for new drills (no id), create the drill first
      // For existing/linked drills, just update the drill record (if not linked)
      for (const drill of drills) {
        if (drill.isLinked && drill.id) {
          // Linked drill — don't update the drill itself, just junction
          continue;
        }
         const drillData: any = {
          title: drill.title,
          vimeo_id: drill.vimeo_id,
          mux_playback_id: drill.mux_playback_id || null,
          duration_seconds: drill.duration_seconds,
          description: drill.description || null,
          coaching_tips: drill.coaching_tips ? drill.coaching_tips.split("\n").filter(Boolean) : null,
          equipment_needed: drill.equipment_needed.length > 0 ? drill.equipment_needed : null,
          category: drill.category || category || "Ball Handling",
          level: drill.level || null,
          sort_order: drill.sort_order,
          course_id: savedCourseId,
          coach_id: finalCoachId,
          drill_type: drill.drill_type || null,
          reps: drill.reps,
          sets: drill.sets,
          thumbnail_url: drill.thumbnail_url,
        };

        if (drill.id) {
          await supabase.from("drills").update(drillData).eq("id", drill.id);
        } else {
          const { data } = await supabase.from("drills").insert(drillData).select("id").single();
          if (data) drill.id = data.id;
        }
      }

      // Sync junction table: delete old entries, insert new
      if (!isNew) {
        await supabase.from("workout_drills").delete().eq("workout_id", savedCourseId!);
      }
      const junctionRows = drills
        .filter((d) => d.id)
        .map((d, i) => ({
          workout_id: savedCourseId!,
          drill_id: d.id!,
          position: i + 1,
        }));
      if (junctionRows.length > 0) {
        await supabase.from("workout_drills").insert(junctionRows as any);
      }

      toast({ title: "Workout saved successfully" });
      if (isNew) navigate(`/admin/courses/${savedCourseId}`);
    } catch (err: any) {
      toast({ title: "Error saving", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-4xl">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-heading text-foreground">{isNew ? "New Workout" : "Edit Workout"}</h1>
          <Button onClick={handleSave} disabled={saving} className="btn-cta bg-primary hover:bg-primary/90 glow-red-hover">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Workout
          </Button>
        </div>

        {/* Course Fields */}
        <div className="space-y-6 p-6 bg-card border border-border rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-heading tracking-wider text-sm">Workout Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Elite Ball Handling" />
            </div>
            <div className="space-y-2">
              <Label className="font-heading tracking-wider text-sm">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-heading tracking-wider text-sm">Athlete / Creator Name</Label>
              <div className="flex items-center gap-3">
                {coachAvatarUrl && (
                  <div className="w-10 h-10 rounded-full bg-muted overflow-hidden border border-border shrink-0">
                    <img src={coachAvatarUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <Input value={coachName} onChange={(e) => setCoachName(e.target.value)} placeholder="e.g. Jordan Miles" className="flex-1" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-heading tracking-wider text-sm">School / Affiliation</Label>
              <Input value={coachSchool} onChange={(e) => setCoachSchool(e.target.value)} placeholder="e.g. Duke University" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="font-heading tracking-wider text-sm">Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Workout description..." rows={3} />
          </div>
          {/* Skill Levels */}
          <div className="space-y-2">
            <Label className="font-heading tracking-wider text-sm">Skill Levels *</Label>
            <div className="flex gap-4">
              {SKILL_LEVELS.map((level) => {
                const label = level.charAt(0).toUpperCase() + level.slice(1);
                const checked = skillLevels.includes(level);
                return (
                  <label key={level} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(c) => {
                        if (c) setSkillLevels((prev) => [...prev, level]);
                        else setSkillLevels((prev) => prev.filter((l) => l !== level));
                      }}
                    />
                    <span className="text-sm text-foreground">{label}</span>
                  </label>
                );
              })}
            </div>
          </div>
          {/* Thumbnail Upload */}
          <div className="space-y-2">
            <Label className="font-heading tracking-wider text-sm">Workout Thumbnail</Label>
            <div className="flex items-start gap-4">
              {thumbnailUrl && (
                <div className="w-32 h-20 rounded-lg overflow-hidden border border-border bg-muted shrink-0">
                  <img src={thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1">
                <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-muted hover:bg-muted/80 cursor-pointer transition-colors w-fit">
                  {uploadingThumb ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  <span className="text-sm">{uploadingThumb ? "Uploading..." : thumbnailUrl ? "Replace" : "Upload Image"}</span>
                  <input type="file" accept="image/*" onChange={handleThumbnailUpload} className="hidden" disabled={uploadingThumb} />
                </label>
              </div>
            </div>
          </div>
          {role === "admin" && (
            <div className="flex items-center gap-6">
              <div className="space-y-2">
                <Label className="font-heading tracking-wider text-sm">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="live">Live</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-heading tracking-wider text-sm">Featured on Dashboard</Label>
                <div className="flex items-center gap-2 pt-1">
                  <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
                  <span className="text-sm text-muted-foreground">{isFeatured ? "Yes" : "No"}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Drill List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-heading text-foreground">Drills ({drills.length})</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={openExistingModal}>
                <Link2 className="h-4 w-4 mr-2" /> Add Existing Drill
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setEditingDrill({
                    title: "", vimeo_id: "", mux_playback_id: "", duration_seconds: 0, description: "",
                    coaching_tips: "", equipment_needed: [], category: category || "",
                    level: "", sort_order: drills.length + 1, drill_type: "", reps: null, sets: null,
                    thumbnail_url: null,
                  })
                }
              >
                <Plus className="h-4 w-4 mr-2" /> Create New Drill
              </Button>
            </div>
          </div>

          {drills.length > 0 && (
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="w-16 font-heading tracking-wider">Order</TableHead>
                    <TableHead className="font-heading tracking-wider">Title</TableHead>
                    <TableHead className="font-heading tracking-wider">Duration</TableHead>
                    <TableHead className="font-heading tracking-wider text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drills.map((drill, i) => (
                    <TableRow key={drill.id || i} className="border-border">
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <button onClick={() => moveDrill(i, "up")} disabled={i === 0} className="p-1 rounded hover:bg-muted disabled:opacity-20 transition-colors">
                            <ArrowUp className="h-3 w-3" />
                          </button>
                          <button onClick={() => moveDrill(i, "down")} disabled={i === drills.length - 1} className="p-1 rounded hover:bg-muted disabled:opacity-20 transition-colors">
                            <ArrowDown className="h-3 w-3" />
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{drill.title}</span>
                          {(drill.workoutCount || 0) > 1 && (
                            <Badge variant="secondary" className="text-[10px] font-heading tracking-wider bg-secondary/20 text-secondary border-secondary/30">
                              <Link2 className="h-3 w-3 mr-1" />
                              Shared
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDuration(drill.duration_seconds)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setEditingDrill(drill)}>
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDrills((prev) => prev.filter((_, idx) => idx !== i))}>
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

        {/* Drill Editor Modal */}
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
                  {uploadingDrillThumb ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  <span className="text-sm">{uploadingDrillThumb ? "Uploading..." : editingDrill.thumbnail_url ? "Replace" : "Upload Image"}</span>
                  <input type="file" accept="image/*" onChange={handleDrillThumbnailUpload} className="hidden" disabled={uploadingDrillThumb} />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-heading tracking-wider text-sm">Vimeo URL</Label>
                  <Input value={editingDrill.vimeo_id} onChange={(e) => setEditingDrill({ ...editingDrill, vimeo_id: extractVimeoId(e.target.value) })} placeholder="Paste Vimeo URL or iframe embed code" />
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
                    <SelectContent>{DRILL_TAGS.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}</SelectContent>
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

              <div className="space-y-2">
                <Label className="font-heading tracking-wider text-sm">Description</Label>
                <Textarea value={editingDrill.description} onChange={(e) => setEditingDrill({ ...editingDrill, description: e.target.value })} placeholder="Drill overview..." rows={3} />
              </div>

              <div className="space-y-2">
                <Label className="font-heading tracking-wider text-sm">Coaching Tips (one per line)</Label>
                <Textarea value={editingDrill.coaching_tips} onChange={(e) => setEditingDrill({ ...editingDrill, coaching_tips: e.target.value })} placeholder="Keep your eyes up&#10;Stay low in your stance&#10;Explode out of each move" rows={4} />
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
                <Button onClick={saveDrillToList} className="btn-cta bg-primary hover:bg-primary/90">
                  {editingDrill.id ? "Update Drill" : "Add Drill"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Add Existing Drill Modal */}
        {showExistingModal && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-heading text-foreground">Add Existing Drill</h3>
                <button onClick={() => setShowExistingModal(false)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Search & Filters */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={existingSearch} onChange={(e) => setExistingSearch(e.target.value)} placeholder="Search drills by title..." className="pl-10" />
                </div>
                <div className="flex gap-3">
                  <Select value={existingCategoryFilter} onValueChange={setExistingCategoryFilter}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Categories</SelectItem>
                      {DRILL_TAGS.slice(0, 5).map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <Select value={existingLevelFilter} onValueChange={setExistingLevelFilter}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Levels</SelectItem>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {loadingExisting ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filteredExisting.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No drills found</p>
              ) : (
                <div className="border border-border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="font-heading tracking-wider">Title</TableHead>
                        <TableHead className="font-heading tracking-wider">Creator</TableHead>
                        <TableHead className="font-heading tracking-wider">Category</TableHead>
                        <TableHead className="font-heading tracking-wider">Level</TableHead>
                        <TableHead className="text-right"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExisting.map((drill) => {
                        const alreadyAdded = drills.some((d) => d.id === drill.id);
                        return (
                          <TableRow key={drill.id} className="border-border">
                            <TableCell className="font-medium text-foreground">{drill.title}</TableCell>
                            <TableCell className="text-muted-foreground">{drill.coaches?.name || "—"}</TableCell>
                            <TableCell className="text-muted-foreground">{drill.category}</TableCell>
                            <TableCell className="text-muted-foreground">{drill.level || "—"}</TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant={alreadyAdded ? "ghost" : "default"} disabled={alreadyAdded}
                                onClick={() => addExistingDrill(drill)}
                                className={alreadyAdded ? "" : "bg-primary hover:bg-primary/90"}>
                                {alreadyAdded ? "Added" : "Add"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
