import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Division, SchoolSize, US_STATES, DIVISION_COLORS } from "@/data/mockSchools";
import { Check, ChevronDown, X } from "lucide-react";

export type GpaBand = "All" | "3.7+" | "3.3-3.7" | "<3.3";

export interface MapFilters {
  states: string[]; // empty = all
  divisions: Division[];
  size: SchoolSize | "All";
  gpa: GpaBand;
}

interface Props {
  value: MapFilters;
  onChange: (next: MapFilters) => void;
}

const ALL_DIVS: Division[] = ["D1", "D2", "D3", "JUCO", "NAIA"];

export function MapFiltersBar({ value: rawValue, onChange }: Props) {
  // Defensive: handle stale shape where `states` may be missing
  const value: MapFilters = {
    states: Array.isArray(rawValue?.states) ? rawValue.states : [],
    divisions: Array.isArray(rawValue?.divisions) ? rawValue.divisions : ALL_DIVS,
    size: rawValue?.size ?? "All",
    gpa: rawValue?.gpa ?? "All",
  };
  const [stateSearch, setStateSearch] = useState("");
  const [stateOpen, setStateOpen] = useState(false);

  const toggleDiv = (d: Division) => {
    const has = value.divisions.includes(d);
    onChange({ ...value, divisions: has ? value.divisions.filter((x) => x !== d) : [...value.divisions, d] });
  };

  const toggleState = (s: string) => {
    const has = value.states.includes(s);
    onChange({ ...value, states: has ? value.states.filter((x) => x !== s) : [...value.states, s] });
  };

  const removeState = (s: string) =>
    onChange({ ...value, states: value.states.filter((x) => x !== s) });

  const clearStates = () => onChange({ ...value, states: [] });

  const reset = () =>
    onChange({ states: [], divisions: ALL_DIVS, size: "All", gpa: "All" });

  const filteredStates = US_STATES.filter((s) =>
    s.toLowerCase().includes(stateSearch.toLowerCase()),
  );

  const stateLabel =
    value.states.length === 0
      ? "All states"
      : value.states.length === 1
        ? value.states[0]
        : `${value.states.length} states`;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
      <div className="flex flex-wrap items-end gap-3">
        {/* Multi-state */}
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">States</label>
          <Popover open={stateOpen} onOpenChange={setStateOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between bg-white border-gray-300 text-gray-900 font-normal hover:bg-gray-50"
              >
                <span className={value.states.length === 0 ? "text-gray-500" : ""}>{stateLabel}</span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[260px] p-0 bg-white" align="start">
              <div className="p-2 border-b border-gray-100">
                <Input
                  value={stateSearch}
                  onChange={(e) => setStateSearch(e.target.value)}
                  placeholder="Search states…"
                  className="h-8 text-sm bg-white border-gray-200"
                />
              </div>
              <div className="max-h-64 overflow-y-auto py-1">
                {filteredStates.map((s) => {
                  const checked = value.states.includes(s);
                  return (
                    <button
                      key={s}
                      onClick={() => toggleState(s)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-50 text-left"
                    >
                      <Checkbox checked={checked} className="pointer-events-none" />
                      <span className="flex-1">{s}</span>
                      {checked && <Check className="h-3.5 w-3.5 text-blue-600" />}
                    </button>
                  );
                })}
                {filteredStates.length === 0 && (
                  <div className="px-3 py-4 text-xs text-gray-500 text-center">No matches</div>
                )}
              </div>
              {value.states.length > 0 && (
                <div className="p-2 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-xs text-gray-500">{value.states.length} selected</span>
                  <button
                    onClick={clearStates}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear
                  </button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex-1 min-w-[160px]">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">School size</label>
          <Select value={value.size} onValueChange={(v) => onChange({ ...value, size: v as any })}>
            <SelectTrigger className="bg-white border-gray-300 text-gray-900"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-white text-gray-900">
              <SelectItem value="All" className="text-gray-900 focus:text-gray-900">All sizes</SelectItem>
              <SelectItem value="Small" className="text-gray-900 focus:text-gray-900">Small (&lt;3000)</SelectItem>
              <SelectItem value="Medium" className="text-gray-900 focus:text-gray-900">Medium (3K–10K)</SelectItem>
              <SelectItem value="Large" className="text-gray-900 focus:text-gray-900">Large (&gt;10K)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[160px]">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">Avg GPA</label>
          <Select value={value.gpa} onValueChange={(v) => onChange({ ...value, gpa: v as GpaBand })}>
            <SelectTrigger className="bg-white border-gray-300 text-gray-900"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-white text-gray-900">
              <SelectItem value="All" className="text-gray-900 focus:text-gray-900">All GPAs</SelectItem>
              <SelectItem value="3.7+" className="text-gray-900 focus:text-gray-900">Elite (3.7+)</SelectItem>
              <SelectItem value="3.3-3.7" className="text-gray-900 focus:text-gray-900">Great (3.3–3.7)</SelectItem>
              <SelectItem value="<3.3" className="text-gray-900 focus:text-gray-900">Good (&lt;3.3)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="ghost" size="sm" onClick={reset} className="text-gray-600 mb-0.5">
          <X className="h-3.5 w-3.5 mr-1" /> Reset
        </Button>
      </div>

      {/* Selected state chips */}
      {value.states.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide self-center mr-1">Selected</span>
          {value.states.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 pl-2.5 pr-1 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200"
            >
              {s}
              <button
                onClick={() => removeState(s)}
                className="hover:bg-blue-100 rounded-full p-0.5"
                aria-label={`Remove ${s}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

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
