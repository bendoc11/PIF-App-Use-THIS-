import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Search, Play, Lock } from "lucide-react";

interface CourseWithCoach {
  id: string;
  title: string;
  category: string;
  description: string;
  drill_count: number;
  total_duration_seconds: number;
  level: string;
  is_free: boolean;
  coaches: { name: string; school: string; initials: string; avatar_color: string } | null;
}

const categories = ["All", "Ball Handling", "Shooting", "Athletics", "Basketball IQ"];
const categoryColors: Record<string, string> = {
  "Ball Handling": "bg-primary",
  "Shooting": "bg-secondary",
  "Athletics": "bg-pif-green",
  "Basketball IQ": "bg-pif-gold",
  "Mental Game": "bg-pif-purple",
  "Scoring": "bg-pif-orange",
  "Post Game": "bg-pif-orange",
};

export default function Courses() {
  const [courses, setCourses] = useState<CourseWithCoach[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    supabase
      .from("courses")
      .select("id, title, category, description, drill_count, total_duration_seconds, level, is_free, coaches(name, school, initials, avatar_color)")
      .order("sort_order")
      .then(({ data }) => {
        if (data) setCourses(data as any);
      });
  }, []);

  const filtered = courses.filter((c) => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === "All" || c.category === activeCategory;
    return matchSearch && matchCategory;
  });

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-heading text-foreground">Courses</h1>
          <p className="text-muted-foreground mt-1">Structured training programs from elite coaches</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search courses..." className="pl-10 bg-muted border-border h-10" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-heading tracking-wider transition-all ${
                  activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{filtered.length} Courses</p>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((course, i) => (
            <motion.div key={course.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link to={`/courses/${course.id}/1`}>
                <Card className="bg-card border-border hover:border-primary/20 transition-all overflow-hidden group">
                  <CardContent className="p-0">
                    <div className="relative h-40 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                      {!course.is_free && (
                        <div className="absolute top-3 right-3">
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <Play className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="absolute top-3 left-3 text-[10px] font-heading tracking-widest text-muted-foreground bg-background/80 px-2 py-0.5 rounded">COURSE</span>
                    </div>
                    <div className="p-5 space-y-3">
                      <h3 className="text-lg font-heading text-foreground">{course.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-[10px] font-heading text-muted-foreground">{course.coaches?.initials}</span>
                        </div>
                        <div>
                          <p className="text-sm text-foreground">{course.coaches?.name}</p>
                          <p className="text-xs text-muted-foreground">{course.coaches?.school}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 pt-1">
                        <span className={`w-2 h-2 rounded-full ${categoryColors[course.category] || "bg-muted-foreground"}`} />
                        <span className="text-xs text-muted-foreground">{course.category}</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{course.drill_count} drills</span>
                        <span className="ml-auto text-[10px] font-heading tracking-wider text-muted-foreground px-2 py-0.5 rounded bg-muted">{course.level}</span>
                      </div>
                      <button className="w-full mt-2 py-2.5 rounded-lg bg-primary text-primary-foreground btn-cta text-sm glow-red-hover transition-all">
                        {course.is_free ? "Start Course →" : "Start Course →"}
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
