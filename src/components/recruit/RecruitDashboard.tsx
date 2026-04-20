import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Mail, Plus, Minus } from "lucide-react";
import { OutreachRow } from "./OutreachSidebar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  rows: OutreachRow[];
  onChange: () => void;
}

export function RecruitDashboard({ rows, onChange }: Props) {
  const { profile } = useAuth();
  const p: any = profile ?? {};

  const contacted = rows.length;
  const replies = rows.filter((r) => r.status === "replied" || r.status === "offer").length;
  const offers = rows.filter((r) => r.status === "offer").length;
  const hasFilm = Boolean(p.highlight_film_url);

  const level = useMemo(() => {
    if (offers >= 2) return { label: "D1", color: "bg-green-500" };
    if (offers >= 1) return { label: "D2 / D1", color: "bg-blue-500" };
    if (hasFilm) return { label: "D2 / D3", color: "bg-blue-500" };
    return { label: "JUCO / D3 / NAIA", color: "bg-orange-500" };
  }, [offers, hasFilm]);

  const bumpOffer = async (delta: 1 | -1) => {
    if (!profile) return;
    if (delta === 1) {
      // Mark the most recent non-offer row as offer
      const target = rows.find((r) => r.status !== "offer");
      if (target) {
        await supabase.from("outreach_history").update({ status: "offer" }).eq("id", target.id);
        onChange();
      }
    } else {
      const target = [...rows].reverse().find((r) => r.status === "offer");
      if (target) {
        await supabase.from("outreach_history").update({ status: "replied" }).eq("id", target.id);
        onChange();
      }
    }
  };

  return (
    <aside className="w-full lg:w-80 shrink-0 p-4 space-y-4 overflow-y-auto">
      <Card className="p-5 bg-white border-gray-200">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Current level</div>
        <div className="flex items-center gap-3">
          <div className={`${level.color} w-12 h-12 rounded-xl flex items-center justify-center text-white`}>
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xl font-semibold text-gray-900 leading-tight">{level.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">Recommendation</p>
          </div>
        </div>
      </Card>

      <Card className="p-5 bg-white border-gray-200">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Schools contacted</span>
          <Mail className="h-4 w-4 text-gray-400" />
        </div>
        <p className="text-3xl font-semibold text-gray-900">{contacted}</p>
      </Card>

      <Card className="p-5 bg-white border-gray-200">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Replies</span>
          <Users className="h-4 w-4 text-gray-400" />
        </div>
        <p className="text-3xl font-semibold text-gray-900">{replies}</p>
      </Card>

      <Card className="p-5 bg-white border-gray-200">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Offers</span>
          <Trophy className="h-4 w-4 text-gray-400" />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-3xl font-semibold text-gray-900">{offers}</p>
          <div className="flex gap-1">
            <Button size="icon" variant="outline" onClick={() => bumpOffer(-1)} className="h-8 w-8 border-gray-300">
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="outline" onClick={() => bumpOffer(1)} className="h-8 w-8 border-gray-300">
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">+ marks the most recent contact as an offer.</p>
      </Card>
    </aside>
  );
}
