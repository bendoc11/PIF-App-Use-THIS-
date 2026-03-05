import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, ArrowRight } from "lucide-react";

interface Coach {
  id: string;
  name: string;
  school: string | null;
  bio: string | null;
  avatar_url: string | null;
  initials: string | null;
  focus_area: string | null;
  drillCount: number;
  workoutCount: number;
}

export default function Coaches() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCoaches() {
      // Get all coaches
      const { data: coachesData } = await supabase
        .from("coaches")
        .select("id, name, school, bio, avatar_url, initials, focus_area")
        .order("name");

      if (!coachesData) {
        setLoading(false);
        return;
      }

      // Get live courses and drills for stats
      const [{ data: liveCourses }, { data: drills }] = await Promise.all([
        supabase.from("courses").select("id, coach_id").eq("status", "live"),
        supabase.from("drills").select("id, coach_id"),
      ]);

      const workoutCountMap: Record<string, number> = {};
      const drillCountMap: Record<string, number> = {};

      for (const course of liveCourses || []) {
        if (course.coach_id) {
          workoutCountMap[course.coach_id] = (workoutCountMap[course.coach_id] || 0) + 1;
        }
      }

      for (const drill of drills || []) {
        if (drill.coach_id) {
          drillCountMap[drill.coach_id] = (drillCountMap[drill.coach_id] || 0) + 1;
        }
      }

      // Show ALL coaches
      const mapped = coachesData.map((c) => ({
        ...c,
        drillCount: drillCountMap[c.id] || 0,
        workoutCount: workoutCountMap[c.id] || 0,
      }));

      setCoaches(mapped);
      setLoading(false);
    }

    fetchCoaches();
  }, []);

  const handleViewWorkouts = (coach: Coach) => {
    setSelectedCoach(null);
    navigate(`/courses?coach=${encodeURIComponent(coach.name)}`);
  };

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-heading text-foreground">FEATURED COACHES</h1>
          <p className="text-muted-foreground mt-1">
            Elite players sharing what got them to the next level.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : coaches.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">No coaches available yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coaches.map((coach) => (
              <Card
                key={coach.id}
                className="bg-card border-border hover:border-primary/30 transition-colors cursor-pointer overflow-hidden"
                onClick={() => setSelectedCoach(coach)}
              >
                {/* Large rectangular photo */}
                <div className="w-full h-[220px] bg-muted">
                  {coach.avatar_url ? (
                    <img
                      src={coach.avatar_url}
                      alt={coach.name}
                      className="w-full h-full object-cover object-[center_top]"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-3xl font-heading text-muted-foreground">
                        {coach.initials || coach.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <CardContent className="p-5 flex flex-col items-center text-center space-y-2">
                  <div>
                    <h3 className="text-lg font-heading font-bold text-foreground">{coach.name}</h3>
                    {coach.school && (
                      <p className="text-sm text-muted-foreground">{coach.school}</p>
                    )}
                  </div>
                  {coach.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{coach.bio}</p>
                  )}
                  <p className="text-xs font-heading tracking-wider text-muted-foreground">
                    {coach.drillCount} Drill{coach.drillCount !== 1 ? "s" : ""}
                  </p>
                  <button
                    className="text-sm font-heading tracking-wider text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCoach(coach);
                    }}
                  >
                    View Coach <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Coach Profile Modal */}
        <Dialog open={!!selectedCoach} onOpenChange={(open) => !open && setSelectedCoach(null)}>
          <DialogContent className="sm:max-w-md bg-card border-border">
            {selectedCoach && (
              <>
                <DialogHeader className="flex flex-col items-center text-center space-y-3 pt-2">
                  <div className="h-[120px] w-[120px] rounded-full overflow-hidden bg-muted mx-auto">
                    {selectedCoach.avatar_url ? (
                      <img src={selectedCoach.avatar_url} alt={selectedCoach.name} className="w-full h-full object-cover object-[center_top]" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-2xl font-heading text-muted-foreground">
                          {selectedCoach.initials || selectedCoach.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-heading text-foreground">
                      {selectedCoach.name}
                    </DialogTitle>
                    {selectedCoach.school && (
                      <DialogDescription className="text-sm text-muted-foreground mt-1">
                        {selectedCoach.school}
                      </DialogDescription>
                    )}
                  </div>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                  {selectedCoach.bio && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedCoach.bio}
                    </p>
                  )}

                  {/* Stats row */}
                  <div className="flex justify-center gap-8">
                    <div className="text-center">
                      <p className="text-2xl font-heading text-foreground">{selectedCoach.drillCount}</p>
                      <p className="text-xs font-heading tracking-wider text-muted-foreground">DRILLS</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-heading text-foreground">{selectedCoach.workoutCount}</p>
                      <p className="text-xs font-heading tracking-wider text-muted-foreground">WORKOUTS</p>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => handleViewWorkouts(selectedCoach)}
                  >
                    View Their Workouts <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
