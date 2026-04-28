import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { MomentumHero } from "@/components/progress/MomentumHero";
import { OutreachTracker } from "@/components/progress/OutreachTracker";
import { RecruitingPipeline } from "@/components/progress/RecruitingPipeline";
import { GameLog } from "@/components/progress/GameLog";
import { MediaWall } from "@/components/progress/MediaWall";
import { OffersAndVisits } from "@/components/progress/OffersAndVisits";
import { Separator } from "@/components/ui/separator";

interface OutreachItem {
  id: string;
  sent_at: string;
  status: "sent" | "replied" | "offer";
  school_name: string;
  coach_name: string;
}

interface OfferItem {
  id: string;
  school_name: string;
  coach_name: string;
  offer_date: string;
}

const PROFILE_FIELDS = [
  "first_name", "last_name", "position", "height", "weight",
  "grad_year", "high_school_name", "city", "state", "gpa",
  "highlight_film_url", "hs_coach_name", "hs_coach_email", "bio", "jersey_number",
];

export default function Progress() {
  const { user, profile } = useAuth();
  const [outreach, setOutreach] = useState<OutreachItem[]>([]);
  const [offers, setOffers] = useState<OfferItem[]>([]);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    const [{ data: oData }, { data: fData }] = await Promise.all([
      supabase
        .from("outreach_history")
        .select("id, sent_at, status, school_name, coach_name")
        .eq("user_id", user.id)
        .order("sent_at", { ascending: false }),
      supabase
        .from("recruiting_offers")
        .select("id, school_name, coach_name, offer_date")
        .eq("user_id", user.id)
        .order("offer_date", { ascending: false }),
    ]);
    if (oData) setOutreach(oData as any);
    if (fData) setOffers(fData as any);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const profileCompletion = useMemo(() => {
    if (!profile) return 0;
    const filled = PROFILE_FIELDS.filter((f) => {
      const v = (profile as any)[f];
      return v !== null && v !== undefined && String(v).trim() !== "";
    }).length;
    return Math.round((filled / PROFILE_FIELDS.length) * 100);
  }, [profile]);

  const daysSinceLastOutreach = useMemo(() => {
    if (outreach.length === 0) return null;
    const latest = outreach[0];
    return Math.floor((Date.now() - new Date(latest.sent_at).getTime()) / (1000 * 60 * 60 * 24));
  }, [outreach]);

  const replies = outreach.filter((o) => o.status === "replied" || o.status === "offer").length;
  const firstName = (profile as any)?.first_name?.trim() || "Champ";

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-8">
        {/* Page header */}
        <div>
          <h1 className="text-3xl font-heading text-foreground">RECRUITING COMMAND CENTER</h1>
          <p className="text-muted-foreground text-sm mt-1">
            How visible are you to college coaches — and is that visibility growing?
          </p>
        </div>

        {/* Hero — Recruiting Momentum Score */}
        <MomentumHero
          profileCompletion={profileCompletion}
          contacted={outreach.length}
          replies={replies}
          offers={offers.length}
          daysSinceLastOutreach={daysSinceLastOutreach}
          athleteName={firstName}
        />

        {/* Section 1 — Outreach Tracker */}
        <OutreachTracker rows={outreach} />

        <Separator className="bg-border" />

        {/* Section 2 — Recruiting Pipeline */}
        <RecruitingPipeline outreach={outreach} offers={offers} onChange={fetchAll} />

        <Separator className="bg-border" />

        {/* Section 3 — Recent Games */}
        <GameLog />

        <Separator className="bg-border" />

        {/* Section 4 — Media & Highlights */}
        <MediaWall />

        <Separator className="bg-border" />

        {/* Section 5 — Offers & Visits */}
        <OffersAndVisits offers={offers} onChange={fetchAll} />
      </div>
    </AppLayout>
  );
}
