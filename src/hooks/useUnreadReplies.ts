import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useUnreadReplies() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) { setCount(0); return; }
    let cancelled = false;

    const load = async () => {
      const { count: c } = await supabase
        .from("coach_replies")
        .select("id", { count: "exact", head: true })
        .eq("athlete_id", user.id)
        .eq("is_read", false);
      if (!cancelled) setCount(c ?? 0);
    };
    load();

    const channel = supabase
      .channel(`coach_replies_unread_${user.id}`)
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

  return count;
}
