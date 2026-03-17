import { ReactNode, useEffect, useState, useRef } from "react";
import { Navigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const PUBLIC_ROUTES = ["/pricing", "/settings", "/onboarding/results"];

function FullScreenSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

/**
 * Isolated Stripe return handler.
 * Only mounts when ?session_id= or ?success=true is in the URL.
 * Polls check-subscription every 2s for up to 20s, then redirects to dashboard.
 */
function StripeReturnPoller({ children }: { children: ReactNode }) {
  const { user, refreshSubscription } = useAuth();
  const [searchParams] = useSearchParams();
  const [polling, setPolling] = useState(false);
  const [done, setDone] = useState(false);
  const pollingRef = useRef(false);

  const hasStripeReturn = searchParams.has("session_id") || searchParams.get("success") === "true";

  useEffect(() => {
    if (!hasStripeReturn || !user || pollingRef.current) return;
    pollingRef.current = true;
    setPolling(true);

    let cancelled = false;
    const maxAttempts = 10; // 10 × 2s = 20s
    const intervalMs = 2000;

    (async () => {
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (cancelled) return;
        try {
          const { data, error } = await supabase.functions.invoke("check-subscription");
          if (!error && data?.subscribed) {
            // Cache and update state
            await supabase.from("profiles").update({
              subscription_status: JSON.stringify(data),
              subscription_checked_at: new Date().toISOString(),
            } as any).eq("id", user.id);
            await refreshSubscription();
            if (!cancelled) {
              setPolling(false);
              setDone(true);
            }
            return;
          }
        } catch {
          // Keep polling
        }
        await new Promise((r) => {
          const id = setInterval(() => { clearInterval(id); r(undefined); }, intervalMs);
        });
      }
      // Exhausted attempts — refresh and proceed anyway
      if (!cancelled) {
        await refreshSubscription();
        setPolling(false);
        setDone(true);
      }
    })();

    return () => { cancelled = true; };
  }, [hasStripeReturn, user, refreshSubscription]);

  if (hasStripeReturn && polling) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <h1 className="text-3xl font-heading text-foreground">Setting Up Your Account…</h1>
          <p className="text-muted-foreground">Payment received! Confirming your subscription now.</p>
        </div>
      </div>
    );
  }

  // Once polling is done, render children (which will do normal routing)
  return <>{children}</>;
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading, profile, subscription } = useAuth();
  const location = useLocation();

  // 1. Loading → spinner, never blank
  if (loading) {
    return <FullScreenSpinner />;
  }

  // 2. No user → login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Profile not yet loaded (edge case: subscription check still running)
  if (!profile) {
    return <FullScreenSpinner />;
  }

  // 4. Admin/creator bypass all subscription/onboarding gates
  const isAdminOrCreator = profile.role === "admin" || profile.role === "creator";
  if (isAdminOrCreator) {
    return <>{children}</>;
  }

  // 5. Route classification
  const isOnboardingRoute = location.pathname.startsWith("/onboarding");
  const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname);

  // 6. Onboarding check (skip for pricing, settings, onboarding itself)
  if (
    !profile.onboarding_completed &&
    !isOnboardingRoute &&
    !isPublicRoute &&
    !location.pathname.startsWith("/admin") &&
    !location.pathname.startsWith("/signup-success")
  ) {
    return <Navigate to="/onboarding" replace />;
  }

  // 7. Allow public routes without subscription
  if (isPublicRoute || isOnboardingRoute) {
    return <>{children}</>;
  }

  // 8. Stripe return polling — only activates when URL has success params
  return (
    <StripeReturnPoller>
      <SubscriptionGate>{children}</SubscriptionGate>
    </StripeReturnPoller>
  );
}

/** Simple subscription gate — redirects to /pricing if not subscribed */
function SubscriptionGate({ children }: { children: ReactNode }) {
  const { subscription } = useAuth();

  if (!subscription.subscribed) {
    return <Navigate to="/pricing" replace />;
  }

  return <>{children}</>;
}
