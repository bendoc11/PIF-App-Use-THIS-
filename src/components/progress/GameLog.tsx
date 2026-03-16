import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Plus, CircleDot, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "@/hooks/use-toast";

interface GameLogRow {
  id: string;
  game_date: string;
  opponent: string | null;
  game_type: string;
  result: string;
  minutes_played: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fg_made: number;
  fg_missed: number;
  three_made: number;
  three_missed: number;
  ft_made: number;
  ft_missed: number;
  fg_percentage: number;
  three_percentage: number;
  ft_percentage: number;
  efficiency: number;
  game_rating: number;
}

const GAME_TYPES = ["School Team", "Rec League", "Pickup", "Tournament"];

function calcPct(made: number, missed: number): number {
  const total = made + missed;
  return total > 0 ? Math.round((made / total) * 1000) / 10 : 0;
}

function calcRating(g: Omit<GameLogRow, "id" | "game_date" | "opponent" | "game_type" | "result" | "fg_percentage" | "three_percentage" | "ft_percentage" | "efficiency" | "game_rating" | "fg_made" | "fg_missed" | "three_made" | "three_missed" | "ft_made" | "ft_missed">): number | null {
  if (g.minutes_played === 0) return null;
  const raw = (g.points * 0.4 + g.assists * 0.7 + g.rebounds * 0.5 + g.steals * 1.0 + g.blocks * 1.0 - g.turnovers * 0.8) / (g.minutes_played * 0.1);
  return Math.round(Math.min(10, Math.max(1, raw)) * 10) / 10;
}

function ratingColor(r: number): string {
  if (r >= 8) return "bg-pif-gold text-background";
  if (r >= 6) return "bg-pif-green text-background";
  return "bg-muted text-muted-foreground";
}

export function GameLog() {
  const { user } = useAuth();
  const [games, setGames] = useState<GameLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchGames = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("game_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("game_date", { ascending: false }) as any;
    if (data) setGames(data);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchGames(); }, [fetchGames]);

  const seasonAverages = useMemo(() => {
    if (games.length === 0) return null;
    const n = games.length;
    const sum = (key: keyof GameLogRow) => games.reduce((s, g) => s + (Number(g[key]) || 0), 0);
    const wins = games.filter(g => g.result === "W").length;
    const fgm = sum("fg_made"), fgmiss = sum("fg_missed");
    const tpm = sum("three_made"), tpmiss = sum("three_missed");
    const ftm = sum("ft_made"), ftmiss = sum("ft_missed");
    return {
      ppg: (sum("points") / n).toFixed(1),
      rpg: (sum("rebounds") / n).toFixed(1),
      apg: (sum("assists") / n).toFixed(1),
      spg: (sum("steals") / n).toFixed(1),
      bpg: (sum("blocks") / n).toFixed(1),
      fg: calcPct(fgm, fgmiss),
      tp: calcPct(tpm, tpmiss),
      ft: calcPct(ftm, ftmiss),
      record: `${wins}-${n - wins}`,
      gamesPlayed: n,
    };
  }, [games]);

  const trendData = useMemo(() => {
    if (games.length < 3) return null;
    return [...games].reverse().map(g => ({
      date: format(new Date(g.game_date), "M/d"),
      pts: g.points,
      fg: g.fg_percentage,
    }));
  }, [games]);

  const handleDelete = async (id: string) => {
    await supabase.from("game_logs").delete().eq("id", id) as any;
    setGames(prev => prev.filter(g => g.id !== id));
    toast({ title: "Game deleted" });
  };

  if (loading) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-heading text-foreground">Game Log</h2>
        <Button onClick={() => setModalOpen(true)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Log a Game
        </Button>
      </div>

      {games.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-8 flex flex-col items-center text-center">
            <div className="p-4 rounded-full bg-muted mb-4">
              <CircleDot className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-heading text-foreground text-lg">Track Your Real Game</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Log your stats after every game and watch your averages improve over time
            </p>
            <Button onClick={() => setModalOpen(true)} className="mt-4">Log Your First Game</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Season Averages */}
          {seasonAverages && (
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <p className="text-xs font-heading tracking-wider text-muted-foreground mb-3">SEASON AVERAGES</p>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "PPG", value: seasonAverages.ppg },
                    { label: "RPG", value: seasonAverages.rpg },
                    { label: "APG", value: seasonAverages.apg },
                    { label: "SPG", value: seasonAverages.spg },
                    { label: "BPG", value: seasonAverages.bpg },
                    { label: "FG%", value: `${seasonAverages.fg}%` },
                    { label: "3P%", value: `${seasonAverages.tp}%` },
                    { label: "FT%", value: `${seasonAverages.ft}%` },
                    { label: "Record", value: seasonAverages.record },
                    { label: "Games", value: seasonAverages.gamesPlayed },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <p className="text-base font-heading text-foreground">{s.value}</p>
                      <p className="text-[10px] text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trend charts */}
          {trendData ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <p className="text-xs font-heading tracking-wider text-muted-foreground mb-2">POINTS PER GAME</p>
                  <div className="h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(0 0% 100% / 0.5)" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: "hsl(0 0% 100% / 0.5)" }} axisLine={false} tickLine={false} width={25} />
                        <Tooltip contentStyle={{ background: "hsl(220 40% 13%)", border: "1px solid hsl(0 0% 100% / 0.1)", borderRadius: 8, color: "#fff" }} />
                        <Line type="monotone" dataKey="pts" stroke="hsl(5 78% 55%)" strokeWidth={2} dot={{ r: 3, fill: "hsl(5 78% 55%)" }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <p className="text-xs font-heading tracking-wider text-muted-foreground mb-2">FG% OVER TIME</p>
                  <div className="h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(0 0% 100% / 0.5)" }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(0 0% 100% / 0.5)" }} axisLine={false} tickLine={false} width={25} />
                        <Tooltip contentStyle={{ background: "hsl(220 40% 13%)", border: "1px solid hsl(0 0% 100% / 0.1)", borderRadius: 8, color: "#fff" }} formatter={(v: number) => [`${v}%`, "FG%"]} />
                        <Line type="monotone" dataKey="fg" stroke="hsl(217 74% 57%)" strokeWidth={2} dot={{ r: 3, fill: "hsl(217 74% 57%)" }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="p-5 text-center">
                <p className="text-sm text-muted-foreground">Log 3 games to unlock your trend charts</p>
              </CardContent>
            </Card>
          )}

          {/* Game history */}
          <div className="space-y-2">
            {games.map(g => {
              const expanded = expandedId === g.id;
              const rating = g.game_rating;
              return (
                <Card key={g.id} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0" onClick={() => setExpandedId(expanded ? null : g.id)}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-heading text-foreground">{format(new Date(g.game_date), "MMM d, yyyy")}</span>
                          {g.opponent && <span className="text-sm text-muted-foreground">vs {g.opponent}</span>}
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{g.game_type}</span>
                          <span className={`text-xs font-heading px-2 py-0.5 rounded-full ${g.result === "W" ? "bg-pif-green/20 text-pif-green" : "bg-primary/20 text-primary"}`}>
                            {g.result}
                          </span>
                        </div>
                        <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                          <span>{g.points} PTS</span>
                          <span>{g.rebounds} REB</span>
                          <span>{g.assists} AST</span>
                          <span>{g.steals} STL</span>
                          <span>{g.blocks} BLK</span>
                          <span>{g.turnovers} TO</span>
                        </div>
                        <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground">
                          <span>FG {g.fg_percentage}%</span>
                          <span>3P {g.three_percentage}%</span>
                          <span>FT {g.ft_percentage}%</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {rating > 0 && (
                          <span className={`text-xs font-heading px-2 py-1 rounded-lg ${ratingColor(rating)}`}>
                            {rating}
                          </span>
                        )}
                        <button onClick={() => setExpandedId(expanded ? null : g.id)} className="p-1">
                          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </button>
                      </div>
                    </div>
                    {expanded && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="grid grid-cols-3 gap-2 text-xs text-center">
                          <div><p className="text-foreground font-heading">{g.fg_made}/{g.fg_made + g.fg_missed}</p><p className="text-muted-foreground">FG</p></div>
                          <div><p className="text-foreground font-heading">{g.three_made}/{g.three_made + g.three_missed}</p><p className="text-muted-foreground">3PT</p></div>
                          <div><p className="text-foreground font-heading">{g.ft_made}/{g.ft_made + g.ft_missed}</p><p className="text-muted-foreground">FT</p></div>
                          <div><p className="text-foreground font-heading">{g.minutes_played}</p><p className="text-muted-foreground">MIN</p></div>
                          <div><p className="text-foreground font-heading">{g.efficiency}</p><p className="text-muted-foreground">EFF</p></div>
                          <div><p className="text-foreground font-heading">{g.game_rating > 0 ? g.game_rating : "N/A"}</p><p className="text-muted-foreground">RATING</p></div>
                        </div>
                        <Button variant="ghost" size="sm" className="mt-3 text-destructive w-full" onClick={() => handleDelete(g.id)}>
                          <Trash2 className="h-4 w-4 mr-1" /> Delete Game
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <LogGameModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={fetchGames} />
    </div>
  );
}

// ---- Log Game Modal ----
function LogGameModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [opponent, setOpponent] = useState("");
  const [gameType, setGameType] = useState("Pickup");
  const [result, setResult] = useState<"W" | "L">("W");
  const [minutes, setMinutes] = useState(0);
  const [points, setPoints] = useState(0);
  const [rebounds, setRebounds] = useState(0);
  const [assists, setAssists] = useState(0);
  const [steals, setSteals] = useState(0);
  const [blocks, setBlocks] = useState(0);
  const [turnovers, setTurnovers] = useState(0);
  const [fgMade, setFgMade] = useState(0);
  const [fgMissed, setFgMissed] = useState(0);
  const [threeMade, setThreeMade] = useState(0);
  const [threeMissed, setThreeMissed] = useState(0);
  const [ftMade, setFtMade] = useState(0);
  const [ftMissed, setFtMissed] = useState(0);

  const fgPct = calcPct(fgMade, fgMissed);
  const tpPct = calcPct(threeMade, threeMissed);
  const ftPct = calcPct(ftMade, ftMissed);
  const efficiency = (points + assists + rebounds + steals + blocks) - turnovers;
  const ratingVal = calcRating({ minutes_played: minutes, points, rebounds, assists, steals, blocks, turnovers });

  const resetForm = () => {
    setDate(new Date()); setOpponent(""); setGameType("Pickup"); setResult("W");
    setMinutes(0); setPoints(0); setRebounds(0); setAssists(0); setSteals(0); setBlocks(0); setTurnovers(0);
    setFgMade(0); setFgMissed(0); setThreeMade(0); setThreeMissed(0); setFtMade(0); setFtMissed(0);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("game_logs").insert({
      user_id: user.id,
      game_date: format(date, "yyyy-MM-dd"),
      opponent: opponent || null,
      game_type: gameType,
      result,
      minutes_played: minutes,
      points, rebounds, assists, steals, blocks, turnovers,
      fg_made: fgMade, fg_missed: fgMissed,
      three_made: threeMade, three_missed: threeMissed,
      ft_made: ftMade, ft_missed: ftMissed,
      fg_percentage: fgPct,
      three_percentage: tpPct,
      ft_percentage: ftPct,
      efficiency,
      game_rating: ratingVal ?? 0,
    } as any) as any;
    setSaving(false);
    if (error) {
      toast({ title: "Error saving game", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Game logged! 🏀" });
      resetForm();
      onClose();
      onSaved();
    }
  };

  const numInput = (label: string, value: number, setter: (v: number) => void) => (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type="number"
        min={0}
        value={value}
        onChange={e => setter(Math.max(0, parseInt(e.target.value) || 0))}
        className="h-12 text-center text-lg font-heading bg-muted border-border"
      />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-background border-border">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Log a Game</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Date */}
          <div>
            <Label className="text-xs text-muted-foreground">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-12", !date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>

          {/* Opponent */}
          <div>
            <Label className="text-xs text-muted-foreground">Opponent (optional)</Label>
            <Input value={opponent} onChange={e => setOpponent(e.target.value)} placeholder="e.g. Lincoln High" className="h-12 bg-muted border-border" />
          </div>

          {/* Game Type pills */}
          <div>
            <Label className="text-xs text-muted-foreground">Game Type</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {GAME_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setGameType(t)}
                  className={`px-3 py-2 rounded-lg text-sm font-heading transition-colors ${
                    gameType === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Result */}
          <div>
            <Label className="text-xs text-muted-foreground">Result</Label>
            <div className="flex gap-3 mt-1">
              <button
                onClick={() => setResult("W")}
                className={`flex-1 h-14 rounded-lg text-2xl font-heading transition-colors ${
                  result === "W" ? "bg-pif-green text-background" : "bg-muted text-muted-foreground"
                }`}
              >W</button>
              <button
                onClick={() => setResult("L")}
                className={`flex-1 h-14 rounded-lg text-2xl font-heading transition-colors ${
                  result === "L" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >L</button>
            </div>
          </div>

          {/* Minutes */}
          {numInput("Minutes Played", minutes, setMinutes)}

          {/* Stats grid */}
          <div>
            <Label className="text-xs text-muted-foreground">Stats</Label>
            <div className="grid grid-cols-2 gap-3 mt-1">
              {numInput("Points", points, setPoints)}
              {numInput("Rebounds", rebounds, setRebounds)}
              {numInput("Assists", assists, setAssists)}
              {numInput("Steals", steals, setSteals)}
              {numInput("Blocks", blocks, setBlocks)}
              {numInput("Turnovers", turnovers, setTurnovers)}
            </div>
          </div>

          {/* Shooting */}
          <div>
            <Label className="text-xs text-muted-foreground">Shooting</Label>
            <div className="space-y-2 mt-1">
              <div className="grid grid-cols-2 gap-3">
                {numInput("FG Made", fgMade, setFgMade)}
                {numInput("FG Missed", fgMissed, setFgMissed)}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {numInput("3PM Made", threeMade, setThreeMade)}
                {numInput("3PM Missed", threeMissed, setThreeMissed)}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {numInput("FT Made", ftMade, setFtMade)}
                {numInput("FT Missed", ftMissed, setFtMissed)}
              </div>
            </div>
          </div>

          {/* Live calculations */}
          <Card className="bg-muted border-border">
            <CardContent className="p-4">
              <div className="grid grid-cols-4 gap-3 text-center">
                <div>
                  <p className="text-base font-heading text-foreground">{fgPct}%</p>
                  <p className="text-[10px] text-muted-foreground">FG%</p>
                </div>
                <div>
                  <p className="text-base font-heading text-foreground">{tpPct}%</p>
                  <p className="text-[10px] text-muted-foreground">3P%</p>
                </div>
                <div>
                  <p className="text-base font-heading text-foreground">{ftPct}%</p>
                  <p className="text-[10px] text-muted-foreground">FT%</p>
                </div>
                <div>
                  <p className="text-base font-heading text-foreground">{ratingVal ?? "N/A"}</p>
                  <p className="text-[10px] text-muted-foreground">Rating</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSave} disabled={saving} className="w-full h-12 text-lg font-heading">
            {saving ? "Saving..." : "Save Game"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
