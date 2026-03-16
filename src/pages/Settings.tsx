import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CreditCard, User, RefreshCw, Calendar, X, Plus } from "lucide-react";
import {
  type SessionType,
  type ScheduleRow,
  SESSION_TYPE_LABELS,
  SESSION_TYPE_ICONS,
  SESSION_TYPE_COLORS,
  DAY_LABELS_FULL,
  ALL_SESSION_TYPES,
  getSessionsForDay,
  generateMultiSessionSchedule,
} from "@/lib/schedule-utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Settings() {
  const { profile, user, subscription, refreshSubscription } = useAuth();
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleRow[]>([]);
  const [scheduleLoaded, setScheduleLoaded] = useState(false);
  const [editingDay, setEditingDay] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("weekly_schedule_templates")
      .select("day_of_week, session_type, order_index")
      .eq("user_id", user.id)
      .order("day_of_week")
      .order("order_index")
      .then(({ data }) => {
        if (data && data.length > 0) {
          setSchedule(
            (data as any[]).map((r) => ({
              day_of_week: r.day_of_week,
              session_type: r.session_type as SessionType,
              order_index: r.order_index ?? 0,
            }))
          );
        }
        setScheduleLoaded(true);
      });
  }, [user]);

  const persistSchedule = async (newSchedule: ScheduleRow[]) => {
    if (!user) return;
    await supabase.from("weekly_schedule_templates").delete().eq("user_id", user.id);
    if (newSchedule.length > 0) {
      await supabase.from("weekly_schedule_templates").insert(
        newSchedule.map((r) => ({
          user_id: user.id,
          day_of_week: r.day_of_week,
          session_type: r.session_type,
          order_index: r.order_index,
        }))
      );
    }
  };

  const handleRemoveSession = async (dow: number, orderIndex: number) => {
    let next = schedule.filter(
      (r) => !(r.day_of_week === dow && r.order_index === orderIndex)
    );
    let idx = 0;
    next = next.map((r) => {
      if (r.day_of_week === dow) return { ...r, order_index: idx++ };
      return r;
    });
    setSchedule(next);
    await persistSchedule(next);
    toast({ title: `${DAY_LABELS_FULL[dow]} updated` });
  };

  const handleAddSession = async (dow: number, type: SessionType) => {
    const daySessions = getSessionsForDay(schedule, dow);
    if (daySessions.length >= 4) return;

    let next = [...schedule];
    if (type !== "rest") {
      const onlyRest = daySessions.length === 1 && daySessions[0].session_type === "rest";
      if (onlyRest) {
        next = next.filter((r) => r.day_of_week !== dow);
        next.push({ day_of_week: dow, session_type: type, order_index: 0 });
        setSchedule(next);
        await persistSchedule(next);
        toast({ title: `${DAY_LABELS_FULL[dow]} updated` });
        return;
      }
    }
    next.push({ day_of_week: dow, session_type: type, order_index: daySessions.length });
    setSchedule(next);
    await persistSchedule(next);
    toast({ title: `${DAY_LABELS_FULL[dow]} updated` });
  };

  const handleResetSchedule = async () => {
    const recommended = generateMultiSessionSchedule(profile?.primary_goal || null);
    setSchedule(recommended);
    await persistSchedule(recommended);
    toast({ title: "Schedule reset to recommended plan" });
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
            <CardContent className="space-y-2">
              {Array.from({ length: 7 }, (_, dow) => {
                const daySessions = getSessionsForDay(schedule, dow);
                const isEditing = editingDay === dow;

                return (
                  <div key={dow} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-sm font-heading font-bold text-foreground w-10 shrink-0">
                          {DAY_LABELS_FULL[dow]}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {daySessions.length === 0 ? (
                            <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground">
                              {SESSION_TYPE_ICONS.rest} Rest
                            </span>
                          ) : (
                            daySessions.map((s) => (
                              <span
                                key={`${s.day_of_week}-${s.order_index}`}
                                className={`px-2.5 py-1 rounded-md text-xs font-medium ${SESSION_TYPE_COLORS[s.session_type]}`}
                              >
                                {SESSION_TYPE_ICONS[s.session_type]} {SESSION_TYPE_LABELS[s.session_type]}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground shrink-0"
                        onClick={() => setEditingDay(isEditing ? null : dow)}
                      >
                        {isEditing ? "Done" : "Edit"}
                      </Button>
                    </div>

                    {isEditing && (
                      <div className="mt-3 pt-3 border-t border-border space-y-3">
                        <div className="flex flex-wrap gap-1.5">
                          {daySessions.map((s) => (
                            <button
                              key={`edit-${s.day_of_week}-${s.order_index}`}
                              onClick={() => handleRemoveSession(dow, s.order_index)}
                              className={`px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 ${SESSION_TYPE_COLORS[s.session_type]}`}
                            >
                              {SESSION_TYPE_ICONS[s.session_type]} {SESSION_TYPE_LABELS[s.session_type]}
                              <X className="h-3 w-3 ml-1" />
                            </button>
                          ))}
                        </div>
                        {daySessions.length < 4 && (
                          <div className="flex flex-wrap gap-1.5">
                            {ALL_SESSION_TYPES.filter(
                              (t) => !daySessions.some((s) => s.session_type === t)
                            ).map((type) => (
                              <button
                                key={type}
                                onClick={() => handleAddSession(dow, type)}
                                className="px-2.5 py-1.5 rounded-md text-xs font-medium bg-muted/50 text-muted-foreground hover:bg-muted transition-colors flex items-center gap-1"
                              >
                                <Plus className="h-3 w-3" />
                                {SESSION_TYPE_ICONS[type]} {SESSION_TYPE_LABELS[type]}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full mt-3">
                    Reset to Recommended Schedule
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset Schedule?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will reset your schedule to the recommended plan for your goal. Continue?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetSchedule}>Reset</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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
