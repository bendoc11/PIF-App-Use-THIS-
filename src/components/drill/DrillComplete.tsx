import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface DrillCompleteProps {
  drillTitle: string;
  athleteName: string;
  streakCount: number;
  streakAnimated: boolean;
  // Course context (optional)
  courseId?: string | null;
  courseName?: string | null;
  nextDrillIndex?: number | null;
  totalDrills?: number;
  isLastDrill?: boolean;
}

export function DrillComplete({
  drillTitle,
  athleteName,
  streakCount,
  streakAnimated,
  courseId,
  courseName,
  nextDrillIndex,
  isLastDrill,
}: DrillCompleteProps) {
  const isCourse = !!courseId;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6 max-w-sm w-full"
      >
        {/* Headline */}
        <h1 className="text-4xl lg:text-5xl font-heading text-foreground">Drill Complete</h1>

        {/* Drill & athlete name */}
        <div className="space-y-1">
          <p className="text-lg text-foreground">{drillTitle}</p>
          <p className="text-sm text-muted-foreground">{athleteName}</p>
        </div>

        {/* Streak flame */}
        <div className="flex flex-col items-center gap-2 py-4">
          <motion.div
            animate={
              streakAnimated
                ? { scale: [1, 1.3, 1] }
                : {}
            }
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <Flame className="h-12 w-12 text-pif-gold" />
          </motion.div>
          <p className="text-3xl font-heading text-foreground">{streakCount}-Day Streak</p>
          {!streakAnimated && (
            <p className="text-sm text-muted-foreground">Keep it going 🔥</p>
          )}
        </div>

        {/* Navigation */}
        <div className="space-y-3 pt-4">
          {isCourse && !isLastDrill && nextDrillIndex && (
            <>
              <Link to={`/courses/${courseId}/${nextDrillIndex}`} className="block">
                <Button className="w-full h-14 text-base btn-cta bg-primary hover:bg-primary/90 glow-red-hover">
                  Next Drill →
                </Button>
              </Link>
              <Link to={`/courses/${courseId}/1`} className="block text-sm text-muted-foreground hover:text-foreground transition-colors font-heading tracking-wider">
                Back to Course
              </Link>
            </>
          )}

          {isCourse && isLastDrill && (
            <>
              <Link to="/courses" className="block">
                <Button className="w-full h-14 text-base btn-cta bg-primary hover:bg-primary/90 glow-red-hover">
                  Back to Library
                </Button>
              </Link>
              {courseName && (
                <p className="text-sm text-pif-gold font-heading tracking-wider">
                  🏆 {courseName} Complete!
                </p>
              )}
            </>
          )}

          {!isCourse && (
            <>
              <Link to="/courses" className="block">
                <Button className="w-full h-14 text-base btn-cta bg-primary hover:bg-primary/90 glow-red-hover">
                  Back to Library
                </Button>
              </Link>
              <Link to="/courses" className="block text-sm text-muted-foreground hover:text-foreground transition-colors font-heading tracking-wider">
                Find Another Drill
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
