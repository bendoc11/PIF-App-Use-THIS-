import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface DrillIntroProps {
  athleteName: string;
  athleteAvatar?: string | null;
  drillTitle: string;
  drillDescription: string | null;
  level: string | null;
  equipmentNeeded: string[] | null;
  courseName?: string | null;
  courseId?: string | null;
  drillIndexInCourse?: number;
  totalDrillsInCourse?: number;
  onStart: () => void;
  backTo: string;
  backLabel: string;
}

const levelColors: Record<string, string> = {
  Beginner: "bg-pif-green/20 text-pif-green border-pif-green/30",
  Intermediate: "bg-pif-gold/20 text-pif-gold border-pif-gold/30",
  Advanced: "bg-primary/20 text-primary border-primary/30",
};

export function DrillIntro({
  athleteName,
  athleteAvatar,
  drillTitle,
  drillDescription,
  level,
  equipmentNeeded,
  courseName,
  courseId,
  drillIndexInCourse,
  totalDrillsInCourse,
  onStart,
  backTo,
  backLabel,
}: DrillIntroProps) {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Top nav */}
      <div className="p-4">
        <Link to={backTo} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> {backLabel}
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-4 pb-8 max-w-lg mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Athlete */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              {athleteAvatar ? (
                <img src={athleteAvatar} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-xs font-heading text-muted-foreground">
                  {athleteName.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <span className="text-sm text-muted-foreground">{athleteName}</span>
          </div>

          {/* Course context */}
          {courseName && drillIndexInCourse && totalDrillsInCourse && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-heading tracking-wider">{courseName}</span>
              <span>·</span>
              <span>Drill {drillIndexInCourse} of {totalDrillsInCourse}</span>
            </div>
          )}

          {/* Title & description */}
          <h1 className="text-4xl lg:text-5xl font-heading text-foreground leading-none">
            {drillTitle}
          </h1>
          {drillDescription && (
            <p className="text-muted-foreground leading-relaxed line-clamp-3">{drillDescription}</p>
          )}

          {/* Level badge */}
          {level && (
            <Badge variant="outline" className={`text-xs font-heading tracking-wider px-3 py-1 ${levelColors[level] || "border-border text-muted-foreground"}`}>
              {level}
            </Badge>
          )}

          {/* Equipment */}
          {equipmentNeeded && equipmentNeeded.length > 0 && (
            <div>
              <p className="text-xs font-heading tracking-wider text-muted-foreground mb-2">What you'll need</p>
              <p className="text-sm text-foreground">{equipmentNeeded.join(", ")}</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* CTA — bottom anchored */}
      <div className="p-4 pb-8 max-w-lg mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Button
            onClick={onStart}
            className="w-full h-16 text-lg btn-cta bg-primary hover:bg-primary/90 glow-red-hover"
          >
            Start Drill
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
