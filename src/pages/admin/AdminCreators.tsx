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
    const name = `${creator.first_name || ""} ${creator.last_name || ""}`.trim();
    // Find coach by name, then get their courses
    const { data: coaches } = await supabase
      .from("coaches")
      .select("id")
      .eq("name", name)
      .maybeSingle();
    if (coaches) {
      const { data: courses } = await supabase
        .from("courses")
        .select("id, title, drill_count, status, created_at")
        .eq("coach_id", coaches.id)
        .order("sort_order");
      setCreatorCourses(courses || []);
    } else {
      setCreatorCourses([]);
    }
    setLoadingCourses(false);
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
