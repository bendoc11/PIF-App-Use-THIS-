import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Division, AcademicLevel, SchoolSize, US_STATES, DIVISION_COLORS } from "@/data/mockSchools";
import { X } from "lucide-react";

export interface MapFilters {
  state: string;
  divisions: Division[];
  size: SchoolSize | "All";
  academic: AcademicLevel | "All";
}

interface Props {
  value: MapFilters;
  onChange: (next: MapFilters) => void;
}

const ALL_DIVS: Division[] = ["D1", "D2", "D3", "JUCO", "NAIA"];

export function MapFiltersBar({ value, onChange }: Props) {
  const toggleDiv = (d: Division) => {
    const has = value.divisions.includes(d);
    onChange({ ...value, divisions: has ? value.divisions.filter((x) => x !== d) : [...value.divisions, d] });
  };

  const reset = () =>
    onChange({ state: "All", divisions: ALL_DIVS, size: "All", academic: "All" });

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[160px]">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">State</label>
          <Select value={value.state} onValueChange={(v) => onChange({ ...value, state: v })}>
            <SelectTrigger className="bg-white border-gray-300 text-gray-900"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-white max-h-72">
              <SelectItem value="All">All states</SelectItem>
              {US_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[160px]">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">School size</label>
          <Select value={value.size} onValueChange={(v) => onChange({ ...value, size: v as any })}>
            <SelectTrigger className="bg-white border-gray-300 text-gray-900"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="All">All sizes</SelectItem>
              <SelectItem value="Small">Small (&lt;3000)</SelectItem>
              <SelectItem value="Medium">Medium (3K–10K)</SelectItem>
              <SelectItem value="Large">Large (&gt;10K)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[160px]">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">Academic</label>
          <Select value={value.academic} onValueChange={(v) => onChange({ ...value, academic: v as any })}>
            <SelectTrigger className="bg-white border-gray-300 text-gray-900"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="All">All levels</SelectItem>
              <SelectItem value="Good">Good</SelectItem>
              <SelectItem value="Great">Great</SelectItem>
              <SelectItem value="Elite">Elite</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="ghost" size="sm" onClick={reset} className="text-gray-600 mb-0.5">
          <X className="h-3.5 w-3.5 mr-1" /> Reset
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide self-center mr-1">Division</span>
        {ALL_DIVS.map((d) => {
          const active = value.divisions.includes(d);
          return (
            <button
              key={d}
              onClick={() => toggleDiv(d)}
              style={active ? { backgroundColor: DIVISION_COLORS[d], borderColor: DIVISION_COLORS[d], color: "white" } : {}}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                active ? "" : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}
