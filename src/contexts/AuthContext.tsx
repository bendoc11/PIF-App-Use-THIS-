import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
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
  subscriptionLoading: boolean;
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
  subscriptionLoading: true,
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
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

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
      setSubscription(defaultSubscription);
      // Dispatch a custom event so the login page can show the message
      window.dispatchEvent(new CustomEvent("account-banned"));
      return false;
    }

    setProfile(data);
    return true;
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const checkSubscription = useCallback(async (forceRefresh = false) => {
    try {
      setSubscriptionLoading(true);

      // Skip cache if force refresh requested (e.g. post-checkout)
      if (!forceRefresh) {
        // Check if we have a recent cached result in profiles
        const { data: profileData } = await supabase
          .from("profiles")
          .select("subscription_status, subscription_checked_at")
          .eq("id", user?.id ?? "")
          .single();

        const checkedAt = profileData?.subscription_checked_at
          ? new Date(profileData.subscription_checked_at).getTime()
          : 0;
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

        // Use cached value if checked within last 5 minutes
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
            // Invalid JSON in cache, fall through to live check
          }
        }
      }

      // Call edge function for fresh check
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

        // Cache result in profiles
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
    } finally {
      setSubscriptionLoading(false);
    }
  }, [user?.id]);

  const refreshSubscription = useCallback(async () => {
    await checkSubscription(true);
  }, [checkSubscription]);

  useEffect(() => {
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(async () => {
            await fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setSubscription(defaultSubscription);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => authSub.unsubscribe();
  }, []);

  // Check subscription after user is set
  useEffect(() => {
    if (user) {
      // If returning from checkout, force a fresh check
      const confirmed = sessionStorage.getItem("pif_subscription_confirmed");
      const forceRefresh = !!confirmed;
      if (confirmed) sessionStorage.removeItem("pif_subscription_confirmed");
      
      checkSubscription(forceRefresh);
      const interval = setInterval(() => checkSubscription(), 60000);
      return () => clearInterval(interval);
    }
  }, [user, checkSubscription]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setSubscription(defaultSubscription);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, subscriptionLoading, subscription, signOut, refreshProfile, refreshSubscription }}>
      {children}
    </AuthContext.Provider>
  );
}
