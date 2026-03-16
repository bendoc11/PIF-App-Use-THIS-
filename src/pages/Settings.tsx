import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CreditCard, User, RefreshCw, Calendar } from "lucide-react";
import {
  type SessionType,
  SESSION_TYPE_LABELS,
  SESSION_TYPE_ICONS,
  DAY_LABELS,
  ALL_SESSION_TYPES,
} from "@/lib/schedule-utils";

export default function Settings() {
  const { profile, user, subscription, refreshSubscription } = useAuth();
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [schedule, setSchedule] = useState<SessionType[]>(Array(7).fill("rest"));
  const [scheduleLoaded, setScheduleLoaded] = useState(false);

  // Load schedule
  useEffect(() => {
    if (!user) return;
    supabase
      .from("weekly_schedule_templates")
      .select("day_of_week, session_type")
      .eq("user_id", user.id)
      .order("day_of_week")
      .then(({ data }) => {
        if (data && data.length > 0) {
          const s: SessionType[] = Array(7).fill("rest");
          (data as any[]).forEach((r) => {
            s[r.day_of_week] = r.session_type as SessionType;
          });
          setSchedule(s);
        }
        setScheduleLoaded(true);
      });
  }, [user]);

  const handleScheduleChange = async (dayIndex: number, value: SessionType) => {
    if (!user) return;
    const next = [...schedule];
    next[dayIndex] = value;
    setSchedule(next);

    // Upsert: delete old + insert new for this day
    await supabase
      .from("weekly_schedule_templates")
      .delete()
      .eq("user_id", user.id)
      .eq("day_of_week", dayIndex);

    await supabase.from("weekly_schedule_templates").insert({
      user_id: user.id,
      day_of_week: dayIndex,
      session_type: value,
      order_index: dayIndex,
    });

    toast({ title: `${DAY_LABELS[dayIndex]} updated` });
  };

  const handleManageBilling = async () => {
    setLoadingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Could not open billing portal", variant: "destructive" });
    } finally {
      setLoadingPortal(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshSubscription();
    setRefreshing(false);
    toast({ title: "Subscription status refreshed" });
  };

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-heading text-foreground">Settings</h1>

        {/* Account */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-heading">
              <User className="h-5 w-5 text-primary" /> Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="text-foreground">{profile?.first_name} {profile?.last_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="text-foreground">{user?.email}</span>
            </div>
          </CardContent>
        </Card>

        {/* Training Schedule */}
        {scheduleLoaded && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg font-heading">
                <Calendar className="h-5 w-5 text-primary" /> Training Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {DAY_LABELS.map((day, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-10 text-sm font-heading text-muted-foreground">{day}</span>
                  <div className="flex-1">
                    <select
                      value={schedule[i]}
                      onChange={(e) => handleScheduleChange(i, e.target.value as SessionType)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {ALL_SESSION_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {SESSION_TYPE_ICONS[type]} {SESSION_TYPE_LABELS[type]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Billing */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-heading">
              <CreditCard className="h-5 w-5 text-primary" /> Billing & Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className={`font-medium ${subscription.subscribed ? "text-pif-green" : "text-destructive"}`}>
                  {subscription.subscribed ? "Active" : "Inactive"}
                </span>
              </div>
              {subscription.trial_end && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trial ends</span>
                  <span className="text-foreground">{new Date(subscription.trial_end).toLocaleDateString()}</span>
                </div>
              )}
              {subscription.subscription_end && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Next billing date</span>
                  <span className="text-foreground">{new Date(subscription.subscription_end).toLocaleDateString()}</span>
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Manage your subscription, update payment method, or cancel your plan through the billing portal.
            </p>
            <div className="flex gap-3">
              <Button onClick={handleManageBilling} disabled={loadingPortal || !subscription.subscribed} className="btn-cta bg-primary hover:bg-primary/90">
                {loadingPortal ? "Opening…" : "Manage Billing"}
              </Button>
              <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
