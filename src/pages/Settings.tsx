import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { CreditCard, User, RefreshCw } from "lucide-react";

export default function Settings() {
  const { profile, user, subscription, refreshSubscription } = useAuth();
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleManageBilling = async () => {
    setLoadingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
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
                  <span className="text-foreground">
                    {new Date(subscription.trial_end).toLocaleDateString()}
                  </span>
                </div>
              )}
              {subscription.subscription_end && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Next billing date</span>
                  <span className="text-foreground">
                    {new Date(subscription.subscription_end).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              Manage your subscription, update payment method, or cancel your plan through the billing portal.
            </p>

            <div className="flex gap-3">
              <Button
                onClick={handleManageBilling}
                disabled={loadingPortal || !subscription.subscribed}
                className="btn-cta bg-primary hover:bg-primary/90"
              >
                {loadingPortal ? "Opening…" : "Manage Billing"}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
