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
  const [rosterStats, setRosterStats] = useState<RosterStats>({ schools_with_data: 0, total_players: 0, last_scraped: null });
  const [scrapeLog, setScrapeLog] = useState<ScrapeLogEntry[]>([]);
  const [scrapingBatch, setScrapingBatch] = useState(false);
  const [scrapingAll, setScrapingAll] = useState(false);

  const fetchRosterStats = async () => {
    const { count: total_players } = await supabase
      .from("school_rosters")
      .select("*", { count: "exact", head: true });
    const PAGE = 1000;
    const schoolSet = new Set<string>();
    let f = 0;
    while (true) {
      const { data } = await supabase
        .from("school_rosters")
        .select("school_name")
        .not("school_name", "is", null)
        .range(f, f + PAGE - 1);
      if (!data || data.length === 0) break;
      for (const r of data as any[]) schoolSet.add(r.school_name);
      if (data.length < PAGE) break;
      f += PAGE;
    }
    const { data: lastData } = await supabase
      .from("school_rosters")
      .select("scraped_at")
      .order("scraped_at", { ascending: false })
      .limit(1);
    setRosterStats({
      schools_with_data: schoolSet.size,
      total_players: total_players ?? 0,
      last_scraped: (lastData?.[0] as any)?.scraped_at ?? null,
    });
  };

  const runScrapeBatch = async (): Promise<{ remaining: number }> => {
    const { data, error } = await supabase.functions.invoke("bulk-scrape-rosters", { body: { limit: 10 } });
    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || "Bulk scrape failed");
    setScrapeLog((prev) => [...(data.log ?? []), ...prev].slice(0, 300));
    await fetchRosterStats();
    return { remaining: data.remaining ?? 0 };
  };

  const handleScrapeBatch = async () => {
    setScrapingBatch(true);
    try {
      const { remaining } = await runScrapeBatch();
      toast({ title: "Batch scraped", description: `${remaining} schools remaining` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setScrapingBatch(false);
    }
  };

  const handleScrapeAll = async () => {
    setScrapingAll(true);
    try {
      let remaining = 1;
      let safety = 1000;
      while (remaining > 0 && safety-- > 0) {
        const r = await runScrapeBatch();
        remaining = r.remaining;
        if (remaining > 0) await new Promise((res) => setTimeout(res, 3000));
      }
      toast({ title: "All rosters scraped" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setScrapingAll(false);
    }
  };

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
    fetchRosterStats();
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

        <div className="pt-8 border-t border-border">
          <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Roster Data Scraper
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <Card className="p-4 bg-card">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Schools With Roster Data</div>
              <div className="text-3xl font-bold mt-1 text-green-500">{rosterStats.schools_with_data.toLocaleString()}</div>
            </Card>
            <Card className="p-4 bg-card">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Total Players in Database</div>
              <div className="text-3xl font-bold mt-1">{rosterStats.total_players.toLocaleString()}</div>
            </Card>
            <Card className="p-4 bg-card">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Schools Remaining</div>
              <div className="text-3xl font-bold mt-1 text-yellow-500">
                {Math.max(stats.confirmed - rosterStats.schools_with_data, 0).toLocaleString()}
              </div>
            </Card>
            <Card className="p-4 bg-card">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Last Scraped</div>
              <div className="text-sm font-semibold mt-2">
                {rosterStats.last_scraped ? new Date(rosterStats.last_scraped).toLocaleString() : "Never"}
              </div>
            </Card>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Progress</span>
              <span>
                {rosterStats.schools_with_data} / {stats.confirmed} (
                {stats.confirmed > 0 ? Math.round((rosterStats.schools_with_data / stats.confirmed) * 100) : 0}%)
              </span>
            </div>
            <Progress value={stats.confirmed > 0 ? (rosterStats.schools_with_data / stats.confirmed) * 100 : 0} />
          </div>

          <div className="flex gap-3 mb-4">
            <Button onClick={handleScrapeBatch} disabled={scrapingBatch || scrapingAll} className="bg-red-600 hover:bg-red-700 text-white">
              {scrapingBatch ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Scraping…</> : "Scrape Batch (10)"}
            </Button>
            <Button onClick={handleScrapeAll} disabled={scrapingBatch || scrapingAll} variant="outline">
              {scrapingAll ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Scraping All…</> : "Scrape All"}
            </Button>
          </div>

          <Card className="p-4 bg-card">
            <div className="font-semibold mb-3">Scrape Results Log</div>
            {scrapeLog.length === 0 ? (
              <div className="text-sm text-muted-foreground">No scrapes yet.</div>
            ) : (
              <div className="space-y-1 max-h-96 overflow-y-auto text-sm font-mono">
                {scrapeLog.map((e, i) => (
                  <div key={i} className="flex items-start gap-2 py-1 border-b border-border/40">
                    {e.status === "ok" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold">{e.school}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {e.status === "ok" ? `${e.players_inserted} players` : e.error || "failed"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
