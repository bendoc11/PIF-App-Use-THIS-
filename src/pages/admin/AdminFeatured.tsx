import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FeaturedCourse {
  id: string;
  title: string;
  category: string | null;
  status: string;
  is_featured: boolean;
  coaches: { name: string } | null;
}

interface FeaturedDrill {
  id: string;
  title: string;
  category: string;
  is_featured: boolean;
  course_id: string | null;
  coaches: { name: string } | null;
}

export default function AdminFeatured() {
  const [courses, setCourses] = useState<FeaturedCourse[]>([]);
  const [drills, setDrills] = useState<FeaturedDrill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [coursesRes, drillsRes] = await Promise.all([
        supabase.from("courses").select("id, title, category, status, is_featured, coaches(name)").order("sort_order"),
        supabase.from("drills").select("id, title, category, is_featured, course_id, coaches(name)").order("sort_order"),
      ]);
      if (coursesRes.data) setCourses(coursesRes.data as any);
      if (drillsRes.data) setDrills(drillsRes.data as any);
      setLoading(false);
    };
    fetch();
  }, []);

  const toggleCourseFeatured = async (course: FeaturedCourse) => {
    const newVal = !course.is_featured;
    const { error } = await supabase.from("courses").update({ is_featured: newVal } as any).eq("id", course.id);
    if (error) {
      toast({ title: "Error updating", description: error.message, variant: "destructive" });
      return;
    }
    setCourses((prev) => prev.map((c) => (c.id === course.id ? { ...c, is_featured: newVal } : c)));
    toast({ title: newVal ? "Workout featured on dashboard" : "Workout removed from dashboard" });
  };

  const toggleDrillFeatured = async (drill: FeaturedDrill) => {
    const newVal = !drill.is_featured;
    const { error } = await supabase.from("drills").update({ is_featured: newVal } as any).eq("id", drill.id);
    if (error) {
      toast({ title: "Error updating", description: error.message, variant: "destructive" });
      return;
    }
    setDrills((prev) => prev.map((d) => (d.id === drill.id ? { ...d, is_featured: newVal } : d)));
    toast({ title: newVal ? "Drill featured on dashboard" : "Drill removed from dashboard" });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading text-foreground">Featured Content</h1>
          <p className="text-muted-foreground mt-1">Choose which workouts and drills appear on the dashboard</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="drills" className="space-y-4">
            <TabsList>
              <TabsTrigger value="drills">Drills ({drills.filter(d => d.is_featured).length} featured)</TabsTrigger>
              <TabsTrigger value="workouts">Workouts ({courses.filter(c => c.is_featured).length} featured)</TabsTrigger>
            </TabsList>

            <TabsContent value="drills">
              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="font-heading tracking-wider">Drill</TableHead>
                      <TableHead className="font-heading tracking-wider">Creator</TableHead>
                      <TableHead className="font-heading tracking-wider">Category</TableHead>
                      <TableHead className="font-heading tracking-wider text-right">Featured</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {drills.map((drill) => (
                      <TableRow key={drill.id} className="border-border">
                        <TableCell className="font-medium text-foreground">{drill.title}</TableCell>
                        <TableCell className="text-muted-foreground">{drill.coaches?.name || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{drill.category}</TableCell>
                        <TableCell className="text-right">
                          <Switch checked={drill.is_featured} onCheckedChange={() => toggleDrillFeatured(drill)} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="workouts">
              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="font-heading tracking-wider">Workout</TableHead>
                      <TableHead className="font-heading tracking-wider">Creator</TableHead>
                      <TableHead className="font-heading tracking-wider">Status</TableHead>
                      <TableHead className="font-heading tracking-wider text-right">Featured</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.map((course) => (
                      <TableRow key={course.id} className="border-border">
                        <TableCell className="font-medium text-foreground">{course.title}</TableCell>
                        <TableCell className="text-muted-foreground">{course.coaches?.name || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{course.status}</TableCell>
                        <TableCell className="text-right">
                          <Switch checked={course.is_featured} onCheckedChange={() => toggleCourseFeatured(course)} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AdminLayout>
  );
}
