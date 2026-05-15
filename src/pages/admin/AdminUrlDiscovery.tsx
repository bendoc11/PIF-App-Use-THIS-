import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface RosterStats {
  schools_with_data: number;
  total_players: number;
  last_scraped: string | null;
}

interface ScrapeLogEntry {
  school: string;
  players_inserted: number;
  status: "ok" | "failed";
  error?: string;
}

interface Stats {
  total: number;
  confirmed: number;
  failed: number;
  pending: number;
}

interface LogEntry {
  school: string;
  status: "confirmed" | "failed";
  url: string | null;
  method: "pattern" | "ai" | null;
}

interface FailedRow {
  school_name: string;
  manualUrl: string;
}

export default function AdminUrlDiscovery() {
  const [stats, setStats] = useState<Stats>({ total: 0, confirmed: 0, failed: 0, pending: 0 });
  const [running, setRunning] = useState(false);
  const [runningAll, setRunningAll] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [failedRows, setFailedRows] = useState<FailedRow[]>([]);
  const [savingSchools, setSavingSchools] = useState<Set<string>>(new Set());

  const fetchStats = async () => {
    // Fetch all (school_name, status) and compute DISTINCT counts client-side.
    const all: { school_name: string; roster_url_status: string | null }[] = [];
    const PAGE = 1000;
    let from = 0;
    // Page through in case of >1000 rows.
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { data, error } = await supabase
        .from("college_coaches")
        .select("school_name, roster_url_status")
        .not("school_name", "is", null)
        .range(from, from + PAGE - 1);
      if (error || !data || data.length === 0) break;
      all.push(...(data as any));
      if (data.length < PAGE) break;
      from += PAGE;
    }
    const total = new Set<string>();
    const confirmed = new Set<string>();
    const failed = new Set<string>();
    const pending = new Set<string>();
    for (const r of all) {
      const n = r.school_name?.trim();
      if (!n) continue;
      total.add(n);
      if (r.roster_url_status === "confirmed") confirmed.add(n);
      else if (r.roster_url_status === "failed") failed.add(n);
      else if (r.roster_url_status === "pending") pending.add(n);
    }
    setStats({
      total: total.size,
      confirmed: confirmed.size,
      failed: failed.size,
      pending: pending.size,
    });
  };

  const fetchFailed = async () => {
    const { data } = await supabase
      .from("college_coaches")
      .select("school_name")
      .eq("roster_url_status", "failed")
      .limit(2000);
    const seen = new Set<string>();
    const rows: FailedRow[] = [];
    for (const r of data ?? []) {
      const n = (r as any).school_name;
      if (!n || seen.has(n)) continue;
      seen.add(n);
      rows.push({ school_name: n, manualUrl: "" });
    }
    setFailedRows(rows);
  };

  useEffect(() => {
    fetchStats();
    fetchFailed();
  }, []);

  const runBatch = async (): Promise<number> => {
    const { data, error } = await supabase.functions.invoke("discover-roster-urls", { body: {} });
    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || "Batch failed");
    setLog((prev) => [...(data.log ?? []), ...prev].slice(0, 200));
    await fetchStats();
    await fetchFailed();
    return data.urls_pending ?? 0;
  };

  const handleRunBatch = async () => {
    setRunning(true);
    try {
      await runBatch();
      toast({ title: "Batch complete" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setRunning(false);
    }
  };

  const handleRunAll = async () => {
    setRunningAll(true);
    try {
      let pending = 1;
      let safety = 500;
      while (pending > 0 && safety-- > 0) {
        pending = await runBatch();
        if (pending > 0) await new Promise((r) => setTimeout(r, 2000));
      }
      toast({ title: "All schools processed" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setRunningAll(false);
    }
  };

  const saveManual = async (school: string, url: string) => {
    if (!url.trim()) return;
    setSavingSchools((prev) => new Set(prev).add(school));
    try {
      const { data, error } = await supabase.functions.invoke("discover-roster-urls", {
        body: { action: "manual-save", school, url: url.trim() },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Manual save failed");
      console.log("Manual roster URL save affected rows:", data.affected_rows, { school, url: url.trim() });
      toast({ title: `Saved URL for ${school}` });
      setFailedRows((prev) => prev.filter((r) => r.school_name !== school));
      await Promise.all([fetchStats(), fetchFailed()]);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSavingSchools((prev) => {
        const next = new Set(prev);
        next.delete(school);
        return next;
      });
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Roster URL Discovery
        </h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Schools", value: stats.total, color: "text-foreground" },
            { label: "Confirmed", value: stats.confirmed, color: "text-green-500" },
            { label: "Failed", value: stats.failed, color: "text-red-500" },
            { label: "Pending", value: stats.pending, color: "text-yellow-500" },
          ].map((s) => (
            <Card key={s.label} className="p-4 bg-card">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
              <div className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value.toLocaleString()}</div>
            </Card>
          ))}
        </div>

        <div className="flex gap-3">
          <Button onClick={handleRunBatch} disabled={running || runningAll} className="bg-red-600 hover:bg-red-700 text-white">
            {running ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Running…</> : "Run Batch (10)"}
          </Button>
          <Button onClick={handleRunAll} disabled={running || runningAll} variant="outline">
            {runningAll ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Running All…</> : "Run All Pending"}
          </Button>
        </div>

        <Card className="p-4 bg-card">
          <div className="font-semibold mb-3">Live Results Log</div>
          {log.length === 0 ? (
            <div className="text-sm text-muted-foreground">No runs yet.</div>
          ) : (
            <div className="space-y-1 max-h-96 overflow-y-auto text-sm font-mono">
              {log.map((e, i) => (
                <div key={i} className="flex items-start gap-2 py-1 border-b border-border/40">
                  {e.status === "confirmed" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold">{e.school}</span>
                    {e.method && <span className="text-xs text-muted-foreground ml-2">({e.method})</span>}
                    {e.url && <div className="text-xs text-muted-foreground truncate">{e.url}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4 bg-card">
          <div className="font-semibold mb-3">Failed Schools — Manual URL Entry ({failedRows.length})</div>
          {failedRows.length === 0 ? (
            <div className="text-sm text-muted-foreground">None.</div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {failedRows.map((row, i) => (
                <div key={row.school_name} className="flex gap-2 items-center">
                  <div className="w-48 text-sm truncate">{row.school_name}</div>
                  <Input
                    placeholder="https://..."
                    value={row.manualUrl}
                    onChange={(e) => {
                      const next = [...failedRows];
                      next[i] = { ...row, manualUrl: e.target.value };
                      setFailedRows(next);
                    }}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={() => saveManual(row.school_name, row.manualUrl)} disabled={savingSchools.has(row.school_name)} className="bg-green-600 hover:bg-green-700 text-white">
                    {savingSchools.has(row.school_name) ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
