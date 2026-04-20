import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, MapPin } from "lucide-react";
import { MockSchool, DIVISION_COLORS } from "@/data/mockSchools";

interface Props {
  schools: MockSchool[];
  onSelect: (school: MockSchool) => void;
}

export function SchoolList({ schools, onSelect }: Props) {
  return (
    <div className="mt-4 bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Schools</h3>
        <span className="text-xs text-gray-500">{schools.length} result{schools.length !== 1 ? "s" : ""}</span>
      </div>
      <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-100">
        {schools.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No schools match your filters.</div>
        ) : (
          schools.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelect(s)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-medium text-gray-900 text-sm truncate">{s.name}</p>
                  <Badge
                    style={{ backgroundColor: DIVISION_COLORS[s.division], color: "white" }}
                    className="border-0 text-[10px] px-1.5 py-0 h-4 shrink-0"
                  >
                    {s.division}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                  <MapPin className="h-3 w-3" />
                  {s.city}, {s.stateCode}
                  <span className="text-gray-300">·</span>
                  <span>{s.academicLevel}</span>
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 px-2 text-xs font-medium shrink-0"
              >
                View Coaches <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
              </Button>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
