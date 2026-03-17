import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

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
}

interface SubscriptionStatus {
  subscribed: boolean;
  product_id: string | null;
  subscription_end: string | null;
  trial_end: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  subscription: SubscriptionStatus;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const defaultSubscription: SubscriptionStatus = {
  subscribed: false,
  product_id: null,
  subscription_end: null,
  trial_end: null,
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  subscription: defaultSubscription,
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
  const [subscription, setSubscription] = useState<SubscriptionStatus>(defaultSubscription);
  const initializedRef = useRef(false);

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!data || error) {
      // Profile not found — sign out
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      setSubscription(defaultSubscription);
      return null;
    }

    if ((data as any).banned === true) {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      setSubscription(defaultSubscription);
      window.dispatchEvent(new CustomEvent("account-banned"));
      return null;
    }

    setProfile(data);
    return data;
  }, []);

  const checkSubscription = useCallback(async (forceRefresh = false) => {
    try {
      if (!forceRefresh) {
        // Check cached result in profiles
        const { data: profileData } = await supabase
          .from("profiles")
          .select("subscription_status, subscription_checked_at")
          .eq("id", user?.id ?? "")
          .single();

        const checkedAt = profileData?.subscription_checked_at
          ? new Date(profileData.subscription_checked_at).getTime()
          : 0;
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

        if (checkedAt > fiveMinutesAgo && profileData?.subscription_status) {
          try {
            const cached = JSON.parse(profileData.subscription_status);
            setSubscription({
              subscribed: cached.subscribed ?? false,
              product_id: cached.product_id ?? null,
              subscription_end: cached.subscription_end ?? null,
              trial_end: cached.trial_end ?? null,
            });
            return;
          } catch {
            // Invalid cache, fall through
          }
        }
      }

      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) {
        console.error("check-subscription error:", error);
        return;
      }
      if (data) {
        const sub = {
          subscribed: data.subscribed ?? false,
          product_id: data.product_id ?? null,
          subscription_end: data.subscription_end ?? null,
          trial_end: data.trial_end ?? null,
        };
        setSubscription(sub);

        // Cache result
        await supabase
          .from("profiles")
          .update({
            subscription_status: JSON.stringify(sub),
            subscription_checked_at: new Date().toISOString(),
          } as any)
          .eq("id", user?.id ?? "");
      }
    } catch (err) {
      console.error("Failed to check subscription:", err);
    }
  }, [user?.id]);

  const refreshSubscription = useCallback(async () => {
    await checkSubscription(true);
  }, [checkSubscription]);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  // Single initialization via onAuthStateChange only
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    console.log("[Auth] Initializing auth listener...");

    // Hard 8s timeout fallback — prevents infinite spinner no matter what
    const loadingTimeout = setTimeout(() => {
      console.warn("[Auth] 8s timeout reached — forcing setLoading(false)");
      setLoading(false);
    }, 8000);

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        console.log("[Auth] onAuthStateChange fired:", _event, "session:", !!newSession);
        setSession(newSession);
        const newUser = newSession?.user ?? null;
        setUser(newUser);

        if (newUser) {
          console.log("[Auth] fetchProfile started for user:", newUser.id);
          const profileData = await fetchProfile(newUser.id);
          console.log("[Auth] fetchProfile completed:", profileData ? "success" : "null/error");
          clearTimeout(loadingTimeout);
          console.log("[Auth] setLoading(false) called");
          setLoading(false);
        } else {
          setProfile(null);
          setSubscription(defaultSubscription);
          clearTimeout(loadingTimeout);
          console.log("[Auth] No user — setLoading(false) called");
          setLoading(false);
        }
      }
    );

    return () => {
      clearTimeout(loadingTimeout);
      authSub.unsubscribe();
    };
  }, [fetchProfile]);

  // Check subscription after user is set (separate from loading)
  useEffect(() => {
    if (!user) return;
    checkSubscription();
    const interval = setInterval(() => checkSubscription(), 60000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setSubscription(defaultSubscription);
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, subscription, signOut, refreshProfile, refreshSubscription }}>
      {children}
    </AuthContext.Provider>
  );
}
