import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function AdminRosterScraper() {
  const [schoolName, setSchoolName] = useState("Duke");
  const [url, setUrl] = useState("https://www.sports-reference.com/cbb/schools/duke/2025.html");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScrape = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-roster", {
        body: { school_name: schoolName, url },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Unknown error");
      setResult(data);
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Roster Scraper
        </h1>

        <Card className="p-6 space-y-4 bg-card">
          <div className="space-y-2">
            <Label htmlFor="school">School Name</Label>
            <Input id="school" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="url">Sports Reference URL</Label>
            <Input id="url" value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>
          <Button
            onClick={handleScrape}
            disabled={loading || !schoolName || !url}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scraping…</>
            ) : (
              "Scrape Roster"
            )}
          </Button>
        </Card>

        {error && (
          <Card className="p-4 border-red-600 bg-red-950/30 text-red-200">
            <div className="font-semibold">Error</div>
            <div className="text-sm">{error}</div>
          </Card>
        )}

        {result && (
          <Card className="p-6 space-y-4 bg-card">
            <div>
              <span className="font-semibold text-green-500">Success</span> — inserted{" "}
              <span className="font-bold">{result.players_inserted}</span> players for{" "}
              <span className="font-bold">{result.school_name}</span>
            </div>
            {result.players?.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="py-2 pr-4">Name</th>
                      <th className="py-2 pr-4">Position</th>
                      <th className="py-2 pr-4">Class</th>
                      <th className="py-2 pr-4">Grad Year</th>
                      <th className="py-2 pr-4">Height</th>
                      <th className="py-2 pr-4">Hometown</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.players.slice(0, 10).map((p: any, i: number) => (
                      <tr key={i} className="border-b border-border/40">
                        <td className="py-2 pr-4">{p.player_name ?? "—"}</td>
                        <td className="py-2 pr-4">{p.position ?? "—"}</td>
                        <td className="py-2 pr-4">{p.class_year ?? "—"}</td>
                        <td className="py-2 pr-4">{p.graduation_year ?? "—"}</td>
                        <td className="py-2 pr-4">{p.height ?? "—"}</td>
                        <td className="py-2 pr-4">{p.hometown ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
