import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProgramCount, formatProgramCount } from "@/hooks/useProgramCount";
import { Film, Play, Newspaper, Share2, ExternalLink, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

interface MediaItem {
  id: string;
  type: "video" | "press";
  title: string;
  source?: string;
  thumbUrl?: string;
  url?: string;
  date?: string;
  duration?: string;
}

export function MediaWall() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const programCount = useProgramCount();
  const firstName = (profile as any)?.first_name?.trim() || "Champ";

  // Pull from profile fields if present
  const highlight = (profile as any)?.highlight_film_url as string | undefined;
  const additional: any[] = ((profile as any)?.additional_film_links as any[]) || [];

  const items: MediaItem[] = [];
  if (highlight) {
    items.push({
      id: "primary",
      type: "video",
      title: "Primary Highlight Reel",
      url: highlight,
    });
  }
  additional.forEach((a, i) => {
    if (typeof a === "string" && a) {
      items.push({ id: `a-${i}`, type: "video", title: `Game Clip ${i + 1}`, url: a });
    } else if (a && typeof a === "object" && a.url) {
      items.push({
        id: `a-${i}`,
        type: a.type === "press" ? "press" : "video",
        title: a.title || `Clip ${i + 1}`,
        source: a.source,
        url: a.url,
      });
    }
  });

  const handleShareAll = async () => {
    const profileUrl = `${window.location.origin}/profile`;
    try {
      await navigator.clipboard.writeText(profileUrl);
      toast({ title: "Link copied", description: "Send this to coaches to see all your media." });
    } catch {
      toast({ title: "Couldn't copy", description: profileUrl });
    }
  };

  return (
    <section className="space-y-4">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-heading text-foreground flex items-center gap-2">
            <Film className="h-5 w-5 text-secondary" /> Media & Highlights
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Everything coaches need to evaluate you, in one place.
          </p>
        </div>
        {items.length > 0 && (
          <Button size="sm" variant="outline" onClick={handleShareAll} className="gap-2">
            <Share2 className="h-4 w-4" /> Share All Media
          </Button>
        )}
      </header>

      {items.length === 0 ? (
        <div
          className="relative overflow-hidden rounded-2xl border border-border bg-card px-6 py-10 text-center"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at top, hsl(var(--pif-blue) / 0.15) 0%, transparent 55%)",
          }}
        >
          <div className="mx-auto mb-4 w-14 h-14 rounded-2xl flex items-center justify-center bg-secondary/15 border border-secondary/30">
            <Film className="w-6 h-6 text-secondary" />
          </div>
          <h3 className="text-xl font-heading text-foreground mb-2">
            {firstName}, your highlight reel is your résumé
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-2">
            {formatProgramCount(programCount)} college programs decide off video first. Add your reel to make sure you're in the conversation.
          </p>
          <Button onClick={() => navigate("/profile")} className="mt-4 rounded-lg font-semibold gap-2">
            <Plus className="h-4 w-4" /> Add Your Highlight Film
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((m) => (
            <a
              key={m.id}
              href={m.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-xl border border-border bg-card hover:border-secondary/60 transition-colors"
            >
              <div className="aspect-video bg-background/50 flex items-center justify-center relative overflow-hidden">
                {m.type === "video" ? (
                  <>
                    <div
                      className="absolute inset-0 opacity-60"
                      style={{
                        backgroundImage:
                          "radial-gradient(circle at center, hsl(var(--pif-red) / 0.25), transparent 70%)",
                      }}
                    />
                    <div className="relative rounded-full bg-background/70 backdrop-blur-sm p-3 group-hover:scale-110 transition-transform">
                      <Play className="h-6 w-6 text-foreground fill-foreground" />
                    </div>
                  </>
                ) : (
                  <Newspaper className="h-10 w-10 text-secondary" />
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold text-foreground truncate">{m.title}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[11px] text-muted-foreground truncate">
                    {m.source || (m.type === "video" ? "Highlight clip" : "Press mention")}
                  </p>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </div>
              </div>
            </a>
          ))}
          <button
            onClick={() => navigate("/profile")}
            className="rounded-xl border border-dashed border-border/70 bg-card/50 hover:bg-card hover:border-secondary/60 transition-colors flex flex-col items-center justify-center min-h-[180px] text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-6 w-6 mb-2" />
            <span className="text-sm font-semibold">Add more media</span>
          </button>
        </div>
      )}
    </section>
  );
}
