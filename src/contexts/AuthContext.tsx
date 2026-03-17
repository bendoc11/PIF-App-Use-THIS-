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

  const checkSubscription = useCallback(async (_forceRefresh = false) => {
    if (_forceRefresh) {
      // Kept for API compatibility; profile cache writes are intentionally disabled.
    }

    try {
      setSubscriptionLoading(true);

      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) {
        console.error("check-subscription error:", error);
        return;
      }

      if (data) {
        setSubscription({
          subscribed: data.subscribed ?? false,
          product_id: data.product_id ?? null,
          subscription_end: data.subscription_end ?? null,
          trial_end: data.trial_end ?? null,
        });
      }
    } catch (err) {
      console.error("Failed to check subscription:", err);
    } finally {
      setSubscriptionLoading(false);
    }
  }, []);

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

    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      let activeSession = existingSession;

      // If no session, try restoring from pre-checkout backup
      if (!activeSession) {
        const savedSession = localStorage.getItem("pif_pre_checkout_session");
        if (savedSession) {
          try {
            const { access_token, refresh_token } = JSON.parse(savedSession);
            const { data: restored } = await supabase.auth.setSession({ access_token, refresh_token });
            if (restored?.session) {
              activeSession = restored.session;
              console.log("[AuthContext] Session restored from pre-checkout backup");
            }
          } catch (e) {
            console.error("[AuthContext] Failed to restore session:", e);
          }
          localStorage.removeItem("pif_pre_checkout_session");
        }
      }

      setSession(activeSession);
      setUser(activeSession?.user ?? null);

      if (activeSession?.user) {
        // Check if returning from checkout — mark onboarding complete
        const postCheckout = localStorage.getItem("pif_post_checkout");
        if (postCheckout) {
          try {
            const { userId, onboardingCompleted, returnTime } = JSON.parse(postCheckout);
            const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
            if (onboardingCompleted && returnTime > tenMinutesAgo && userId === activeSession.user.id) {
              await supabase
                .from("profiles")
                .update({ onboarding_completed: true })
                .eq("id", userId);
              console.log("[AuthContext] Marked onboarding_completed after checkout return");
            }
          } catch (e) {
            console.error("[AuthContext] Failed to process post-checkout flag:", e);
          }
          localStorage.removeItem("pif_post_checkout");
        }

        await fetchProfile(activeSession.user.id);
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
