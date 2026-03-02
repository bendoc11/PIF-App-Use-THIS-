import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface CourseRow {
  id: string;
  title: string;
  category: string | null;
  drill_count: number;
  status: string;
  created_at: string;
  coach_id: string | null;
  coaches: { name: string } | null;
}

export default function AdminCourses() {
  const { user, profile } = useAuth();
  const role = profile?.role || "user";
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = async () => {
    setLoading(true);

    // For creators, first find their coach_id
    let creatorCoachId: string | null = null;
    if (role === "creator" && user) {
      const { data: coachData } = await supabase
        .from("coaches")
        .select("id")
        .eq("name", `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim())
        .maybeSingle();
      creatorCoachId = coachData?.id || null;
    }

    let query = supabase
      .from("courses")
      .select("id, title, category, drill_count, status, created_at, coach_id, coaches(name)")
      .order("sort_order");

    // Creators only see their own courses
    if (role === "creator" && creatorCoachId) {
      query = query.eq("coach_id", creatorCoachId);
    } else if (role === "creator") {
      // Creator has no linked coach — show nothing
      setCourses([]);
      setLoading(false);
      return;
    }

    const { data, error } = await query;
    if (error) {
      toast({ title: "Error loading workouts", description: error.message, variant: "destructive" });
    }
    setCourses((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const toggleStatus = async (course: CourseRow) => {
    if (role !== "admin") {
      toast({ title: "Only admins can publish workouts", variant: "destructive" });
      return;
    }
    const newStatus = course.status === "live" ? "draft" : "live";
    const { error } = await supabase.from("courses").update({ status: newStatus } as any).eq("id", course.id);
    if (error) {
      toast({ title: "Error updating status", description: error.message, variant: "destructive" });
      return;
    }
    setCourses((prev) => prev.map((c) => (c.id === course.id ? { ...c, status: newStatus } : c)));
    toast({ title: `Workout ${newStatus === "live" ? "published" : "set to draft"}` });
  };

  const deleteCourse = async (id: string) => {
    if (!confirm("Are you sure you want to delete this workout? This cannot be undone.")) return;
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) {
      toast({ title: "Error deleting course", description: error.message, variant: "destructive" });
      return;
    }
    setCourses((prev) => prev.filter((c) => c.id !== id));
    toast({ title: "Workout deleted" });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-heading text-foreground">Workouts</h1>
          <Link to="/admin/courses/new">
            <Button className="btn-cta bg-primary hover:bg-primary/90 glow-red-hover">
              <Plus className="h-4 w-4 mr-2" /> Create New Workout
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No workouts yet. Create your first workout to get started.</p>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="font-heading tracking-wider">Workout Title</TableHead>
                  <TableHead className="font-heading tracking-wider">Creator</TableHead>
                  <TableHead className="font-heading tracking-wider">Drills</TableHead>
                  <TableHead className="font-heading tracking-wider">Status</TableHead>
                  <TableHead className="font-heading tracking-wider">Last Updated</TableHead>
                  <TableHead className="font-heading tracking-wider text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.id} className="border-border">
                    <TableCell className="font-medium text-foreground">{course.title}</TableCell>
                    <TableCell className="text-muted-foreground">{course.coaches?.name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{course.drill_count}</TableCell>
                    <TableCell>
                      <Badge
                        variant={course.status === "live" ? "default" : "secondary"}
                        className={`font-heading tracking-wider text-xs cursor-pointer ${
                          course.status === "live" ? "bg-pif-green/20 text-pif-green border-pif-green/30" : ""
                        }`}
                        onClick={() => toggleStatus(course)}
                      >
                        {course.status === "live" ? "Live" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(course.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/admin/courses/${course.id}`}>
                          <Button variant="ghost" size="sm">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm" onClick={() => deleteCourse(course.id)}>
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
    </AdminLayout>
  );
}
