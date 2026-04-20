import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Mail, Plus, Minus, Trash2 } from "lucide-react";
import { OutreachRow } from "./OutreachSidebar";
import { AddOfferDialog } from "./AddOfferDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface Props {
  rows: OutreachRow[];
  onChange: () => void;
}

interface OfferRow {
  id: string;
  school_name: string;
  coach_name: string;
  offer_date: string;
}

export function RecruitDashboard({ rows, onChange }: Props) {
  const { user, profile } = useAuth();
  const p: any = profile ?? {};

  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [showOfferDialog, setShowOfferDialog] = useState(false);

  const loadOffers = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("recruiting_offers")
      .select("id, school_name, coach_name, offer_date")
      .eq("user_id", user.id)
      .order("offer_date", { ascending: false });
    setOffers((data as any) ?? []);
  };

  useEffect(() => { loadOffers(); /* eslint-disable-next-line */ }, [user?.id]);

  const contacted = rows.length;
  const repliesFromOutreach = rows.filter((r) => r.status === "replied" || r.status === "offer").length;
  const offersCount = offers.length;
  const hasFilm = Boolean(p.highlight_film_url);

  const level = useMemo(() => {
    if (offersCount >= 2) return { label: "D1", color: "bg-green-500" };
    if (offersCount >= 1) return { label: "D2 / D1", color: "bg-blue-500" };
    if (hasFilm) return { label: "D2 / D3", color: "bg-blue-500" };
    return { label: "JUCO / D3 / NAIA", color: "bg-orange-500" };
  }, [offersCount, hasFilm]);

  const bumpReply = async (delta: 1 | -1) => {
    if (delta === 1) {
      const target = rows.find((r) => r.status === "sent");
      if (!target) {
        toast({ title: "No outreach to mark", description: "Send an email first to track replies." });
        return;
      }
      await supabase.from("outreach_history").update({ status: "replied" }).eq("id", target.id);
      onChange();
    } else {
      const target = [...rows].reverse().find((r) => r.status === "replied");
      if (target) {
        await supabase.from("outreach_history").update({ status: "sent" }).eq("id", target.id);
        onChange();
      }
    }
  };

  const removeOffer = async (id: string) => {
    await supabase.from("recruiting_offers").delete().eq("id", id);
    loadOffers();
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
        <div className="flex items-center justify-between">
          <p className="text-3xl font-semibold text-gray-900">{repliesFromOutreach}</p>
          <div className="flex gap-1">
            <Button size="icon" variant="outline" onClick={() => bumpReply(-1)} className="h-8 w-8 border-gray-300">
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="outline" onClick={() => bumpReply(1)} className="h-8 w-8 border-gray-300">
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">Marks the next sent email as replied.</p>
      </Card>

      <Card className="p-5 bg-white border-gray-200">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Offers</span>
          <Trophy className="h-4 w-4 text-gray-400" />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-3xl font-semibold text-gray-900">{offersCount}</p>
          <Button
            size="sm"
            onClick={() => setShowOfferDialog(true)}
            className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add offer
          </Button>
        </div>
      </Card>

      {offers.length > 0 && (
        <Card className="bg-white border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Your offers</h4>
          </div>
          <ul className="divide-y divide-gray-100">
            {offers.map((o) => (
              <li key={o.id} className="px-4 py-3 flex items-start gap-2 group">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{o.school_name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {o.coach_name} · {new Date(o.offer_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <button
                  onClick={() => removeOffer(o.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 p-1"
                  aria-label="Remove offer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <AddOfferDialog
        open={showOfferDialog}
        onOpenChange={setShowOfferDialog}
        onSaved={loadOffers}
      />
    </aside>
  );
}
