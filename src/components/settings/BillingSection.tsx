import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  CreditCard,
  RefreshCw,
  ExternalLink,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
} from "lucide-react";
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

interface PaymentMethod {
  brand: string | null;
  last4: string | null;
  exp_month: number | null;
  exp_year: number | null;
}

interface Plan {
  name: string;
  amount: number | null;
  currency: string;
  interval: string;
}

interface Subscription {
  id: string;
  status: string;
  cancel_at_period_end: boolean;
  cancel_at: string | null;
  current_period_start: string;
  current_period_end: string;
  trial_start: string | null;
  trial_end: string | null;
  plan: Plan;
  payment_method: PaymentMethod | null;
}

interface Invoice {
  id: string;
  number: string | null;
  amount_paid: number;
  currency: string;
  status: string | null;
  created: string;
  hosted_invoice_url: string | null;
  pdf: string | null;
}

interface BillingData {
  has_subscription: boolean;
  customer: { id: string; email: string } | null;
  subscription: Subscription | null;
  invoices: Invoice[];
}

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle }> = {
  active: { label: "Active", variant: "default", icon: CheckCircle },
  trialing: { label: "Trial", variant: "secondary", icon: Clock },
  past_due: { label: "Past Due", variant: "destructive", icon: AlertTriangle },
  canceled: { label: "Canceled", variant: "outline", icon: XCircle },
  incomplete: { label: "Incomplete", variant: "destructive", icon: AlertTriangle },
};

export function BillingSection() {
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);

  const fetchBilling = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-subscription", {
        body: { action: "get" },
      });
      if (error) throw error;
      setBilling(data);
    } catch (err: any) {
      console.error("Failed to fetch billing:", err);
      toast({ title: "Error", description: "Could not load billing info", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBilling();
  }, [fetchBilling]);

  const handleCancel = async () => {
    setCanceling(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-subscription", {
        body: { action: "cancel" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Subscription canceled", description: "You'll retain access until the end of your billing period." });
      fetchBilling();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Could not cancel subscription", variant: "destructive" });
    } finally {
      setCanceling(false);
    }
  };

  const handleReactivate = async () => {
    setReactivating(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-subscription", {
        body: { action: "reactivate" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Subscription reactivated!", description: "Your plan will continue as normal." });
      fetchBilling();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Could not reactivate", variant: "destructive" });
    } finally {
      setReactivating(false);
    }
  };

  const handleOpenPortal = async () => {
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

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const sub = billing?.subscription;
  const invoices = billing?.invoices ?? [];
  const statusCfg = sub ? STATUS_CONFIG[sub.status] || STATUS_CONFIG.active : null;
  const StatusIcon = statusCfg?.icon || CheckCircle;

  const isTrialing = sub?.status === "trialing";
  const isCanceling = sub?.cancel_at_period_end;
  const canCancel = sub && ["active", "trialing"].includes(sub.status) && !isCanceling;
  const canReactivate = sub && isCanceling && ["active", "trialing"].includes(sub.status);

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(amount);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const brandIcon = (brand: string | null) => {
    const b = (brand || "").toLowerCase();
    if (b === "visa") return "💳 Visa";
    if (b === "mastercard") return "💳 Mastercard";
    if (b === "amex") return "💳 Amex";
    return `💳 ${brand || "Card"}`;
  };

  return (
    <div className="space-y-4">
      {/* Plan & Status */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-heading">
            <CreditCard className="h-5 w-5 text-primary" /> Plan & Billing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!sub ? (
            <div className="text-sm text-muted-foreground">
              <p>No active subscription found.</p>
              <Button className="mt-3" onClick={() => window.location.href = "/pricing"}>
                View Plans
              </Button>
            </div>
          ) : (
            <>
              {/* Plan overview */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-heading text-foreground">{sub.plan.name}</h3>
                  {sub.plan.amount != null && (
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(sub.plan.amount, sub.plan.currency)} / {sub.plan.interval}
                    </p>
                  )}
                </div>
                <Badge variant={statusCfg?.variant || "default"} className="flex items-center gap-1">
                  <StatusIcon className="h-3 w-3" />
                  {statusCfg?.label || sub.status}
                </Badge>
              </div>

              {/* Key dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {isTrialing && sub.trial_end && (
                  <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                    <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Trial ends</p>
                    <p className="font-medium text-foreground">{formatDate(sub.trial_end)}</p>
                  </div>
                )}
                <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                  <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">
                    {isCanceling ? "Access until" : "Next billing date"}
                  </p>
                  <p className="font-medium text-foreground">{formatDate(sub.current_period_end)}</p>
                </div>
              </div>

              {/* Canceling notice */}
              {isCanceling && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground">Cancellation pending</p>
                    <p className="text-muted-foreground">
                      Your plan will end on {formatDate(sub.current_period_end)}. You'll retain full access until then.
                    </p>
                  </div>
                </div>
              )}

              {/* Past due notice */}
              {sub.status === "past_due" && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground">Payment failed</p>
                    <p className="text-muted-foreground">
                      Please update your payment method to avoid losing access.
                    </p>
                  </div>
                </div>
              )}

              {/* Payment method */}
              {sub.payment_method ? (
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border">
                  <div className="flex items-center gap-2 text-sm">
                    <span>{brandIcon(sub.payment_method.brand)}</span>
                    <span className="text-foreground">•••• {sub.payment_method.last4}</span>
                    <span className="text-muted-foreground">
                      {sub.payment_method.exp_month}/{sub.payment_method.exp_year}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleOpenPortal} disabled={loadingPortal}>
                    {loadingPortal ? <Loader2 className="h-3 w-3 animate-spin" /> : "Update"}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  {isTrialing ? "No payment method on file — one will be required when your trial ends." : "No payment method on file."}
                </p>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-2">
                {canCancel && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        Cancel Plan
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel your subscription?</AlertDialogTitle>
                        <AlertDialogDescription>
                          You'll keep full access until {formatDate(sub.current_period_end)}.
                          After that your plan will not renew and you'll lose access to Pro features.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep Plan</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleCancel}
                          disabled={canceling}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {canceling ? "Canceling…" : "Yes, Cancel"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                {canReactivate && (
                  <Button onClick={handleReactivate} disabled={reactivating} size="sm">
                    {reactivating ? "Reactivating…" : "Reactivate Plan"}
                  </Button>
                )}

                <Button variant="outline" size="sm" onClick={handleOpenPortal} disabled={loadingPortal}>
                  <ExternalLink className="h-3 w-3 mr-1" />
                  {loadingPortal ? "Opening…" : "Full Billing Portal"}
                </Button>

                <Button variant="ghost" size="icon" onClick={fetchBilling} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Invoice history */}
      {invoices.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-heading">
              <FileText className="h-5 w-5 text-primary" /> Invoice History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between py-2 border-b border-border last:border-0 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">{formatDate(inv.created)}</span>
                    <span className="text-foreground font-medium">
                      {formatCurrency(inv.amount_paid, inv.currency)}
                    </span>
                    <Badge variant={inv.status === "paid" ? "default" : "outline"} className="text-xs">
                      {inv.status || "unknown"}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    {inv.hosted_invoice_url && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={inv.hosted_invoice_url} target="_blank" rel="noopener noreferrer">
                          View
                        </a>
                      </Button>
                    )}
                    {inv.pdf && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={inv.pdf} target="_blank" rel="noopener noreferrer">
                          PDF
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
