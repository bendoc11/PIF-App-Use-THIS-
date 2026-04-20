import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, GraduationCap, MapPin, Users } from "lucide-react";
import { MockCoach, MockSchool, DIVISION_COLORS } from "@/data/mockSchools";

interface Props {
  school: MockSchool;
  onBack: () => void;
  onCompose: (coaches: MockCoach[]) => void;
}

export function SchoolDetail({ school, onBack, onCompose }: Props) {
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const toggle = (email: string) => {
    setPicked((prev) => {
      const next = new Set(prev);
      next.has(email) ? next.delete(email) : next.add(email);
      return next;
    });
  };

  const selectedCoaches = school.coaches.filter((c) => picked.has(c.email));

  return (
    <Card className="p-6 bg-white border-gray-200">
      <Button variant="ghost" size="sm" onClick={onBack} className="text-gray-600 mb-4 -ml-2">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to map
      </Button>

      <div className="mb-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-2xl font-semibold text-gray-900">{school.name}</h2>
          <Badge
            style={{ backgroundColor: DIVISION_COLORS[school.division], color: "white" }}
            className="border-0"
          >
            {school.division}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-sm text-gray-600">
          <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{school.city}, {school.state}</span>
          <span className="inline-flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" />{school.academicLevel}</span>
          <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{school.enrollment.toLocaleString()} ({school.size})</span>
        </div>
      </div>

      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Coaching staff</h3>
      <div className="space-y-2 mb-5">
        {school.coaches.map((c) => (
          <label
            key={c.email}
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <Checkbox
              checked={picked.has(c.email)}
              onCheckedChange={() => toggle(c.email)}
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900">{c.name}</p>
              <p className="text-xs text-gray-500">{c.title} · {c.email}</p>
            </div>
          </label>
        ))}
      </div>

      <Button
        disabled={selectedCoaches.length === 0}
        onClick={() => onCompose(selectedCoaches)}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      >
        Add {selectedCoaches.length} coach{selectedCoaches.length !== 1 ? "es" : ""} to outreach
      </Button>
    </Card>
  );
}
