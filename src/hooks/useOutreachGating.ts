import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface OutreachGating {
  sentCount: number;
  firstSentAt: string | null;
  hasRealReply: boolean;
  loaded: boolean;
}

export function useOutreachGating(): OutreachGating {
  const { user } = useAuth();
  const [state, setState] = useState<OutreachGating>({
    sentCount: 0,
    firstSentAt: null,
    hasRealReply: false,
    loaded: false,
  });

  useEffect(() => {
    if (!user) {
      setState({ sentCount: 0, firstSentAt: null, hasRealReply: false, loaded: true });
      return;
    }
    let cancelled = false;

    const load = async () => {
      const [{ count: sentCount }, firstRes, { count: replyCount }] = await Promise.all([
        supabase
          .from("outreach_history")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("outreach_history")
          .select("sent_at")
          .eq("user_id", user.id)
          .order("sent_at", { ascending: true })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("coach_replies")
          .select("id", { count: "exact", head: true })
          .eq("athlete_id", user.id),
      ]);
      if (cancelled) return;
      setState({
        sentCount: sentCount ?? 0,
        firstSentAt: (firstRes.data as any)?.sent_at ?? null,
        hasRealReply: (replyCount ?? 0) > 0,
        loaded: true,
      });
    };

    load();

    const channel = supabase
      .channel(`outreach_gating_${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "outreach_history", filter: `user_id=eq.${user.id}` },
        () => load(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "coach_replies", filter: `athlete_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return state;
}

export function getLockedBannerCopy(g: OutreachGating): string | null {
  if (!g.loaded) return null;
  if (g.hasRealReply) return "A coach has responded to your outreach — unlock to read now.";
  if (g.sentCount < 3) return null;
  if (g.firstSentAt) {
    const ageMs = Date.now() - new Date(g.firstSentAt).getTime();
    if (ageMs >= 24 * 60 * 60 * 1000) {
      return "Don't miss a coach response — replies are locked.";
    }
  }
  return "Your replies inbox is locked — coaches may have already responded.";
}
