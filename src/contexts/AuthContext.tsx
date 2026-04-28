import { createContext, useContext, useEffect, useState, ReactNode } from "react";
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
  created_at: string;
  subscription_status: string | null;
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
      return;
    }
    setHasActiveSubscription(!!data);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const refreshSubscription = async () => {
    if (user) await checkSubscription(user.id);
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
            await checkSubscription(uid);
            setLoading(false);
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
        await fetchProfile(existingSession.user.id);
        await checkSubscription(existingSession.user.id);
      }
      setLoading(false);
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
