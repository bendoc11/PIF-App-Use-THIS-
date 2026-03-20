import { useState, useCallback, useRef } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Download, Upload, Eye, Play, AlertCircle, CheckCircle2, FileSpreadsheet, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const CSV_COLUMNS = [
  "title", "description", "coaching_tips", "video_url", "mux_playback_id", "category", "level",
  "drill_type", "duration", "duration_seconds", "coach_name", "workout_title",
  "workout_category", "equipment", "is_featured", "shot_tracking", "shot_attempts",
];

const EXAMPLE_ROW = [
  "Crossover Attack", "Learn the basic crossover move to beat defenders", "Keep your head up and push the ball low",
  "https://vimeo.com/123456789", "", "Ball Handling", "Beginner", "Timed", "0:40", "40",
  "Zac Ervin", "Handles 101", "Ball Handling", "Basketball", "false", "false", "",
];

function generateCSVTemplate(): string {
  const header = CSV_COLUMNS.join(",");
  const example = EXAMPLE_ROW.map((v) => `"${v}"`).join(",");
  const blank = CSV_COLUMNS.map(() => "").join(",");
  return `${header}\n${example}\n${blank}`;
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h.trim().toLowerCase()] = (values[i] || "").trim();
    });
    return row;
  }).filter((row) => Object.values(row).some((v) => v));
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current); current = "";
    } else { current += char; }
  }
  result.push(current);
  return result;
}

function parseDuration(dur: string): number | null {
  if (!dur) return null;
  const parts = dur.split(":");
  if (parts.length === 2) {
    const mins = parseInt(parts[0], 10);
    const secs = parseInt(parts[1], 10);
    if (!isNaN(mins) && !isNaN(secs)) return mins * 60 + secs;
  }
  return null;
}

type ImportResult = { created: number; workoutsCreated: number; skipped: number; errors: { row: number; reason: string }[] };

export default function AdminBulkUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [previewing, setPreviewing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    const csv = generateCSVTemplate();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "drill-import-template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = (f: File | null) => {
    if (!f) return;
    setFile(f); setRows([]); setResult(null); setPreviewing(false);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith(".csv")) handleFile(f);
    else toast({ title: "Invalid file", description: "Please upload a .csv file", variant: "destructive" });
  }, []);

  const handlePreview = async () => {
    if (!file) return;
    const text = await file.text();
    const parsed = parseCSV(text);
    if (!parsed.length) { toast({ title: "Empty CSV", description: "No data rows found", variant: "destructive" }); return; }
    setRows(parsed); setPreviewing(true);
  };

  const handleImport = async () => {
    if (!rows.length) return;
    setImporting(true); setProgress(0); setResult(null);

    const res: ImportResult = { created: 0, workoutsCreated: 0, skipped: 0, errors: [] };

    // Fetch coaches for name lookup
    const { data: coaches } = await supabase.from("coaches").select("id, name");
    const coachMap = new Map((coaches || []).map((c) => [c.name.toLowerCase(), c.id]));

    // Cache for workouts created/found during this import
    const workoutCache = new Map<string, string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // 1-indexed + header
      try {
        // Validate required fields
        if (!row.title) { res.errors.push({ row: rowNum, reason: "Missing title" }); continue; }
        if (!row.video_url && !row.vimeo_url && !row.mux_playback_id) { res.errors.push({ row: rowNum, reason: "Missing video_url or mux_playback_id" }); continue; }
        if (!row.category) { res.errors.push({ row: rowNum, reason: "Missing category" }); continue; }
        if (!row.level) { res.errors.push({ row: rowNum, reason: "Missing level" }); continue; }
        if (!row.drill_type) { res.errors.push({ row: rowNum, reason: "Missing drill_type" }); continue; }

        // Extract vimeo_id from URL
        const vimeoMatch = row.vimeo_url.match(/vimeo\.com\/(\d+)/);
        const vimeoId = vimeoMatch ? vimeoMatch[1] : row.vimeo_url;

        // Check duplicate
        const { data: existing } = await supabase.from("drills").select("id").eq("title", row.title).eq("vimeo_id", vimeoId).maybeSingle();
        if (existing) { res.skipped++; continue; }

        // Duration
        let durationSecs: number | null = row.duration_seconds ? parseInt(row.duration_seconds, 10) : null;
        if (!durationSecs && row.duration) durationSecs = parseDuration(row.duration);

        // Coach
        const coachId = row.coach_name ? coachMap.get(row.coach_name.toLowerCase()) || null : null;

        // Workout
        let courseId: string | null = null;
        if (row.workout_title) {
          const cacheKey = row.workout_title.toLowerCase();
          if (workoutCache.has(cacheKey)) {
            courseId = workoutCache.get(cacheKey)!;
          } else {
            const { data: existingCourse } = await supabase.from("courses").select("id").eq("title", row.workout_title).maybeSingle();
            if (existingCourse) {
              courseId = existingCourse.id;
            } else {
              const { data: newCourse, error: courseErr } = await supabase.from("courses").insert({
                title: row.workout_title,
                category: row.workout_category || row.category || null,
                status: "live",
              }).select("id").single();
              if (courseErr) { res.errors.push({ row: rowNum, reason: `Workout create failed: ${courseErr.message}` }); continue; }
              courseId = newCourse.id;
              res.workoutsCreated++;
            }
            workoutCache.set(cacheKey, courseId);
          }
        }

        // Parse coaching tips as JSON array
        let coachingTips = null;
        if (row.coaching_tips) {
          coachingTips = row.coaching_tips.split("|").map((t) => t.trim()).filter(Boolean);
        }

        // Parse equipment
        const equipment = row.equipment ? row.equipment.split("|").map((e) => e.trim()).filter(Boolean) : null;

        // Insert drill
        const { data: drill, error: drillErr } = await supabase.from("drills").insert({
          title: row.title,
          description: row.description || null,
          coaching_tips: coachingTips,
          vimeo_id: vimeoId,
          category: row.category,
          level: row.level,
          drill_type: row.drill_type,
          duration_seconds: durationSecs,
          coach_id: coachId,
          course_id: courseId,
          equipment_needed: equipment,
          is_featured: row.is_featured?.toLowerCase() === "true",
          enable_shot_tracking: row.shot_tracking?.toLowerCase() === "true",
          shot_attempts: row.shot_attempts ? parseInt(row.shot_attempts, 10) : null,
        }).select("id").single();

        if (drillErr) { res.errors.push({ row: rowNum, reason: drillErr.message }); continue; }

        // If workout exists, also add to workout_drills junction
        if (courseId && drill) {
          const { data: existingDrills } = await supabase.from("workout_drills").select("position").eq("workout_id", courseId).order("position", { ascending: false }).limit(1);
          const nextPos = existingDrills?.length ? (existingDrills[0].position + 1) : 0;
          await supabase.from("workout_drills").insert({ workout_id: courseId, drill_id: drill.id, position: nextPos });
        }

        res.created++;
      } catch (err: any) {
        res.errors.push({ row: rowNum, reason: err.message || "Unknown error" });
      }

      setProgress(Math.round(((i + 1) / rows.length) * 100));
    }

    setResult(res); setImporting(false);
    toast({ title: "Import complete", description: `${res.created} drills created, ${res.workoutsCreated} workouts created, ${res.skipped} skipped, ${res.errors.length} errors` });
  };

  const handleReset = () => {
    setFile(null); setRows([]); setPreviewing(false); setResult(null); setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading tracking-wider text-foreground">Bulk Upload</h1>
          <p className="text-sm text-muted-foreground mt-1">Import drills from a CSV spreadsheet</p>
        </div>

        {/* Step 1: Download template */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-heading tracking-wider">Step 1 — Download Template</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={handleDownloadTemplate} className="gap-2">
              <Download className="h-4 w-4" /> Download CSV Template
            </Button>
          </CardContent>
        </Card>

        {/* Step 2: Upload */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-heading tracking-wider">Step 2 — Upload CSV</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => inputRef.current?.click()}
            >
              <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileSpreadsheet className="h-8 w-8 text-primary" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleReset(); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-10 w-10 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">Drag & drop a CSV file here, or click to browse</p>
                </div>
              )}
            </div>
            {file && !previewing && (
              <Button className="mt-4 gap-2" onClick={handlePreview}>
                <Eye className="h-4 w-4" /> Preview
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Step 3: Preview */}
        {previewing && rows.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-heading tracking-wider">Step 3 — Preview ({rows.length} rows)</CardTitle>
                <Button onClick={handleImport} disabled={importing} className="gap-2">
                  <Play className="h-4 w-4" /> Import {rows.length} Drills
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {importing && (
                <div className="mb-4 space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">{progress}% complete</p>
                </div>
              )}
              <ScrollArea className="h-[400px] rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs w-12">#</TableHead>
                      {CSV_COLUMNS.map((col) => (
                        <TableHead key={col} className="text-xs whitespace-nowrap">{col}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs text-muted-foreground">{i + 2}</TableCell>
                        {CSV_COLUMNS.map((col) => (
                          <TableCell key={col} className="text-xs max-w-[200px] truncate">{row[col] || "—"}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {result && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading tracking-wider">Import Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-pif-green/10 border border-pif-green/20">
                  <CheckCircle2 className="h-5 w-5 text-pif-green" />
                  <div>
                    <p className="text-lg font-bold text-foreground">{result.created}</p>
                    <p className="text-xs text-muted-foreground">Drills Created</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-pif-blue/10 border border-pif-blue/20">
                  <FileSpreadsheet className="h-5 w-5 text-pif-blue" />
                  <div>
                    <p className="text-lg font-bold text-foreground">{result.workoutsCreated}</p>
                    <p className="text-xs text-muted-foreground">Workouts Created</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-pif-orange/10 border border-pif-orange/20">
                  <AlertCircle className="h-5 w-5 text-pif-orange" />
                  <div>
                    <p className="text-lg font-bold text-foreground">{result.skipped + result.errors.length}</p>
                    <p className="text-xs text-muted-foreground">Skipped / Errors</p>
                  </div>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                  <p className="text-sm font-medium text-destructive mb-2">Error Log</p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {result.errors.map((e, i) => (
                      <p key={i} className="text-xs text-muted-foreground">
                        <span className="text-destructive font-medium">Row {e.row}:</span> {e.reason}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              <Button variant="outline" onClick={handleReset} className="gap-2">
                <Upload className="h-4 w-4" /> Upload Another
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
