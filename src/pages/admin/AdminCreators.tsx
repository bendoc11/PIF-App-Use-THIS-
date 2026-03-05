import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Eye, Upload, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

interface Creator {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
  banned: boolean;
  created_at: string;
  courseCount?: number;
}

export default function AdminCreators() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingCreator, setViewingCreator] = useState<Creator | null>(null);
  const [creatorCourses, setCreatorCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [bio, setBio] = useState("");
  const [school, setSchool] = useState("");
  const [position, setPosition] = useState("");
  const [focusArea, setFocusArea] = useState("");
  const [coachId, setCoachId] = useState<string | null>(null);
  const [savingCoach, setSavingCoach] = useState(false);
  const fetchCreators = async () => {
    setLoading(true);
    const { data, error } = await (supabase
      .from("profiles")
      .select("id, first_name, last_name, email, banned, created_at, avatar_url") as any)
      .eq("role", "creator")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error loading creators", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Get course counts - simplified approach
    const creatorsData = (data as Creator[]) || [];
    const { data: allCourses } = await supabase
      .from("courses")
      .select("coach_id, coaches(name)");
    
    const courseCountByName: Record<string, number> = {};
    if (allCourses) {
      for (const c of allCourses as any[]) {
        const name = c.coaches?.name || "";
        courseCountByName[name] = (courseCountByName[name] || 0) + 1;
      }
    }

    const creatorsWithCounts = creatorsData.map((creator) => {
      const name = `${creator.first_name || ""} ${creator.last_name || ""}`.trim();
      return { ...creator, courseCount: courseCountByName[name] || 0 };
    });
    setCreators(creatorsWithCounts);
    setLoading(false);
  };

  useEffect(() => {
    fetchCreators();
  }, []);

  const viewCreatorCourses = async (creator: Creator) => {
    setViewingCreator(creator);
    setLoadingCourses(true);
    setBio("");
    const name = `${creator.first_name || ""} ${creator.last_name || ""}`.trim();
    // Find coach by name, then get their courses
    const { data: coach } = await supabase
      .from("coaches")
      .select("id, bio")
      .eq("name", name)
      .maybeSingle();
    if (coach) {
      setBio(coach.bio || "");
      const { data: courses } = await supabase
        .from("courses")
        .select("id, title, drill_count, status, created_at")
        .eq("coach_id", coach.id)
        .order("sort_order");
      setCreatorCourses(courses || []);
    } else {
      setCreatorCourses([]);
    }
    setLoadingCourses(false);
  };

  const handleSaveBio = async () => {
    if (!viewingCreator) return;
    setSavingBio(true);
    const name = `${viewingCreator.first_name || ""} ${viewingCreator.last_name || ""}`.trim();
    if (name) {
      const { error } = await supabase.from("coaches").update({ bio }).eq("name", name);
      if (error) {
        toast({ title: "Error saving bio", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Bio updated" });
      }
    }
    setSavingBio(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!viewingCreator) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const path = `creators/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("course-thumbnails").upload(path, file);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploadingAvatar(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("course-thumbnails").getPublicUrl(path);
    const avatarUrl = urlData.publicUrl;

    // Update profile
    const { error: updateError } = await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", viewingCreator.id);
    if (updateError) {
      toast({ title: "Error saving photo", description: updateError.message, variant: "destructive" });
      setUploadingAvatar(false);
      return;
    }

    // Also update matching coach record(s)
    const name = `${viewingCreator.first_name || ""} ${viewingCreator.last_name || ""}`.trim();
    if (name) {
      const { error: coachError } = await supabase.from("coaches").update({ avatar_url: avatarUrl }).eq("name", name);
      if (coachError) {
        console.error("Failed to update coach avatar_url:", coachError);
      }
    }

    setViewingCreator({ ...viewingCreator, avatar_url: avatarUrl });
    setCreators((prev) => prev.map((c) => (c.id === viewingCreator.id ? { ...c, avatar_url: avatarUrl } : c)));
    setUploadingAvatar(false);
    toast({ title: "Creator photo updated" });
  };

  const toggleSuspend = async (creator: Creator) => {
    const newBanned = !creator.banned;
    const { error } = await supabase
      .from("profiles")
      .update({ banned: newBanned } as any)
      .eq("id", creator.id);
    if (error) {
      toast({ title: "Error updating creator", description: error.message, variant: "destructive" });
      return;
    }
    setCreators((prev) => prev.map((c) => (c.id === creator.id ? { ...c, banned: newBanned } : c)));
    toast({ title: newBanned ? "Creator suspended" : "Creator reactivated" });
  };

  const deleteCreator = async (id: string) => {
    if (!confirm("Remove creator role from this account? They will become a regular user.")) return;
    const { error } = await supabase
      .from("profiles")
      .update({ role: "user" } as any)
      .eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setCreators((prev) => prev.filter((c) => c.id !== id));
    toast({ title: "Creator role removed" });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-heading text-foreground">Creator Management</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : creators.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No creators yet. Assign the "creator" role to a user in the database to get started.</p>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="font-heading tracking-wider">Name</TableHead>
                  <TableHead className="font-heading tracking-wider">Email</TableHead>
                  <TableHead className="font-heading tracking-wider">Workouts</TableHead>
                  <TableHead className="font-heading tracking-wider">Status</TableHead>
                  <TableHead className="font-heading tracking-wider text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {creators.map((creator) => (
                  <TableRow key={creator.id} className="border-border">
                    <TableCell>
                      <button
                        onClick={() => viewCreatorCourses(creator)}
                        className="font-medium text-foreground hover:text-primary transition-colors text-left"
                      >
                        {creator.first_name} {creator.last_name}
                      </button>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{creator.email || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{creator.courseCount ?? 0}</TableCell>
                    <TableCell>
                      <Badge
                        variant={creator.banned ? "destructive" : "default"}
                        className={`font-heading tracking-wider text-xs ${
                          !creator.banned ? "bg-pif-green/20 text-pif-green border-pif-green/30" : ""
                        }`}
                      >
                        {creator.banned ? "Suspended" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => viewCreatorCourses(creator)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => toggleSuspend(creator)}>
                          {creator.banned ? "Reactivate" : "Suspend"}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteCreator(creator.id)}>
                          Remove
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Creator Courses Drawer */}
        {viewingCreator && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl p-6 max-w-xl w-full max-h-[80vh] overflow-y-auto space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-heading text-foreground">
                  {viewingCreator.first_name} {viewingCreator.last_name}'s Workouts
                </h3>
                <button onClick={() => setViewingCreator(null)} className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                  ✕
                </button>
              </div>
              {/* Creator Photo */}
              <div className="space-y-3">
                <p className="text-sm font-heading tracking-wider text-muted-foreground">Creator Photo</p>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border shrink-0">
                    {viewingCreator.avatar_url ? (
                      <img src={viewingCreator.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-heading text-muted-foreground">
                        {(viewingCreator.first_name || "").charAt(0)}{(viewingCreator.last_name || "").charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-muted hover:bg-muted/80 cursor-pointer transition-colors w-fit">
                      {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      <span className="text-sm">{uploadingAvatar ? "Uploading..." : viewingCreator.avatar_url ? "Replace Photo" : "Upload Photo"}</span>
                      <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={uploadingAvatar} />
                    </label>
                    {viewingCreator.avatar_url && (
                      <button
                        onClick={async () => {
                          await supabase.from("profiles").update({ avatar_url: null }).eq("id", viewingCreator.id);
                          const name = `${viewingCreator.first_name || ""} ${viewingCreator.last_name || ""}`.trim();
                          if (name) await supabase.from("coaches").update({ avatar_url: null }).eq("name", name);
                          setViewingCreator({ ...viewingCreator, avatar_url: null });
                          setCreators((prev) => prev.map((c) => (c.id === viewingCreator.id ? { ...c, avatar_url: null } : c)));
                          toast({ title: "Photo removed" });
                        }}
                        className="text-xs text-destructive hover:underline w-fit"
                      >
                        Remove photo
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {/* Bio */}
              <div className="space-y-2">
                <p className="text-sm font-heading tracking-wider text-muted-foreground">Bio</p>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Write a short bio for this coach..."
                  rows={3}
                  className="bg-muted border-border text-sm"
                />
                <Button size="sm" onClick={handleSaveBio} disabled={savingBio} className="text-xs">
                  {savingBio ? <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Saving...</> : "Save Bio"}
                </Button>
              </div>
              {loadingCourses ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : creatorCourses.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4">No workouts found for this creator.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="font-heading tracking-wider">Title</TableHead>
                      <TableHead className="font-heading tracking-wider">Drills</TableHead>
                      <TableHead className="font-heading tracking-wider">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {creatorCourses.map((c: any) => (
                      <TableRow key={c.id} className="border-border">
                        <TableCell className="font-medium text-foreground">{c.title}</TableCell>
                        <TableCell className="text-muted-foreground">{c.drill_count}</TableCell>
                        <TableCell>
                          <Badge
                            variant={c.status === "live" ? "default" : "secondary"}
                            className={`font-heading tracking-wider text-xs ${
                              c.status === "live" ? "bg-pif-green/20 text-pif-green border-pif-green/30" : ""
                            }`}
                          >
                            {c.status === "live" ? "Live" : "Draft"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
