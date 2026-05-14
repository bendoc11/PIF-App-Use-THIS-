import { useState } from "react";
import { Star, Flame, Trophy, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface BookmarkedSchool {
  id: string;
  school_name: string;
  division: string | null;
  state: string | null;
  status: string;
}

interface Props {
  schoolsBookmarked: number;        // athlete's own list
  schoolsInterestedInMe: number;    // distinct schools that replied
  coachesMessaged: number;
  offersReceived: number;
  weeklyGoal: number;
  weeklySent: number;
  bookmarkedSchools?: BookmarkedSchool[];
}

export function HeroMetrics({
  schoolsBookmarked,
  schoolsInterestedInMe,
  coachesMessaged,
  offersReceived,
  weeklyGoal,
  weeklySent,
  bookmarkedSchools = [],
}: Props) {
  const [showList, setShowList] = useState(false);
  const remaining = Math.max(0, weeklyGoal - weeklySent);

  const SF = "'Plus Jakarta Sans', system-ui, sans-serif";
  const STAT = "'Space Grotesk', 'Plus Jakarta Sans', system-ui, sans-serif";

  return (
    <div className="mb-5">
      {/* HERO — Coach Interest. Dark card, red typographic hero. */}
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 12,
          padding: "26px 26px",
          marginBottom: 12,
          position: "relative",
          overflow: "hidden",
          fontFamily: SF,
        }}
      >
        {/* subtle red glow behind hero number */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 40,
            left: 10,
            width: 240,
            height: 240,
            background:
              "radial-gradient(circle, hsl(var(--pif-red) / 0.15) 0%, hsl(var(--pif-red) / 0) 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.1em",
            color: "hsl(var(--pif-red))",
            textTransform: "uppercase",
            position: "relative",
          }}
        >
          <Flame className="h-3.5 w-3.5" />
          Coach Interest
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 14,
            marginTop: 10,
            position: "relative",
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 0.95,
              fontFamily: STAT,
              fontFeatureSettings: '"tnum" 1',
              color: "hsl(var(--pif-red))",
            }}
          >
            {schoolsInterestedInMe}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.80)" }}>
            {schoolsInterestedInMe === 1 ? "school" : "schools"} replied
          </div>
        </div>

        <p
          style={{
            fontSize: 13,
            marginTop: 10,
            color: "rgba(255,255,255,0.60)",
            fontWeight: 400,
            maxWidth: 460,
            position: "relative",
          }}
        >
          {schoolsInterestedInMe > 0
            ? "Coaches are responding to you. This is real recruiting interest — keep building on it."
            : "Your first reply will land here. Stay consistent — coaches respond to athletes who keep showing up."}
        </p>
      </div>

      {/* Secondary row — three smaller stats */}
      <div className="grid grid-cols-3 gap-2.5">
        <SecondaryStat
          icon={<Star className="h-3 w-3" />}
          label="My List"
          value={schoolsBookmarked}
          sub={schoolsBookmarked > 0 ? "Tap to view" : "Bookmarked"}
          onClick={() => setShowList(true)}
        />
        <SecondaryStat
          icon={<Mail className="h-3 w-3" />}
          label="Coaches Messaged"
          value={coachesMessaged}
          sub={remaining > 0 ? `${remaining} to weekly goal` : "Weekly goal hit"}
        />
        <SecondaryStat
          icon={<Trophy className="h-3 w-3" />}
          label="Offers"
          value={offersReceived}
          sub={offersReceived > 0 ? "Real momentum" : "None yet"}
        />
      </div>

      <Dialog open={showList} onOpenChange={setShowList}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              My List ({bookmarkedSchools.length})
            </DialogTitle>
          </DialogHeader>
          {bookmarkedSchools.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              You haven't bookmarked any schools yet. Add schools from the map or your search results to build your list.
            </p>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto space-y-2 mt-2">
              {bookmarkedSchools.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-border bg-muted/30"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{s.school_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[s.division, s.state].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SecondaryStat({
  icon,
  label,
  value,
  sub,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub: string;
  onClick?: () => void;
}) {
  const Comp: any = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      type={onClick ? "button" : undefined}
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: "12px 14px",
        textAlign: "left",
        width: "100%",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <div
        className="rs-label"
        style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
      >
        {icon}
        {label}
      </div>
      <div
        style={{
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          lineHeight: 1,
          marginTop: 6,
          color: "var(--text-primary)",
          fontFamily: "'Space Grotesk', 'Plus Jakarta Sans', system-ui, sans-serif",
          fontFeatureSettings: '"tnum" 1',
        }}
      >
        {value}
      </div>
      <p style={{ fontSize: 11, marginTop: 4, color: "var(--text-secondary)" }}>{sub}</p>
    </Comp>
  );
}
