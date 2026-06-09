import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { fbPixel } from "@/lib/fbpixel";

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  position: string | null;
  plan: string;
  role: string;
  banned: boolean;
  streak_days: number;
  total_drills_completed: number;
  avatar_url: string | null;
  onboarding_completed: boolean;
  primary_goal: string | null;
  training_days_per_week: number | null;
  created_at: string;
  subscription_status: string | null;
  sport: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  hasActiveSubscription: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  hasActiveSubscription: false,
  signOut: async () => {},
  refreshProfile: async () => {},
  refreshSubscription: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  // Track which users we've already fired the Meta Pixel Purchase event for,
  // so we don't double-count on every refresh/poll.
  const purchaseFiredFor = useRef<Set<string>>(new Set());

  const markPurchaseIfNew = (userId: string) => {
    try {
      const key = `fb_purchase_fired:${userId}`;
      if (purchaseFiredFor.current.has(userId)) return;
      if (typeof localStorage !== "undefined" && localStorage.getItem(key)) {
        purchaseFiredFor.current.add(userId);
        return;
      }
      fbPixel.purchase();
      purchaseFiredFor.current.add(userId);
      if (typeof localStorage !== "undefined") localStorage.setItem(key, "1");
    } catch {
      // ignore
    }
  };

  const fetchProfile = async (userId: string): Promise<boolean> => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data && (data as any).banned === true) {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      setHasActiveSubscription(false);
      window.dispatchEvent(new CustomEvent("account-banned"));
      return false;
    }

    setProfile(data);
    return true;
  };

  const checkSubscription = async (userId: string) => {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();
    if (error) {
      console.warn("[auth] subscription check failed", error);
      setHasActiveSubscription(false);
      return false;
    }
    const active = !!data;
    setHasActiveSubscription(active);
    return active;
  };

  // Fallback: if our DB shows no active subscription, ask Stripe directly via
  // the check-subscription edge function. That function persists the result
  // back to Supabase, so the next page load resolves instantly.
  const syncFromStripeIfMissing = async (userId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) {
        console.warn("[auth] check-subscription invoke failed", error);
        return;
      }
      if (data?.subscribed) {
        await checkSubscription(userId);
        await fetchProfile(userId);
      }
    } catch (e) {
      console.warn("[auth] check-subscription threw", e);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const refreshSubscription = async () => {
    if (!user) return;
    const active = await checkSubscription(user.id);
    if (!active) await syncFromStripeIfMissing(user.id);
  };

  useEffect(() => {
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          const uid = session.user.id;
          setTimeout(async () => {
            await fetchProfile(uid);
            const active = await checkSubscription(uid);
            setLoading(false);
            if (!active) syncFromStripeIfMissing(uid);
          }, 0);
        } else {
          setProfile(null);
          setHasActiveSubscription(false);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      if (existingSession?.user) {
        const uid = existingSession.user.id;
        await fetchProfile(uid);
        const active = await checkSubscription(uid);
        setLoading(false);
        if (!active) syncFromStripeIfMissing(uid);
      } else {
        setLoading(false);
      }
    });

    return () => authSub.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setHasActiveSubscription(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        hasActiveSubscription,
        signOut,
        refreshProfile,
        refreshSubscription,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
