import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Apple, Globe, Check, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { isIAPAvailable, purchaseSubscription, getProduct, initializeStore } from "@/lib/in-app-purchases";

const FEATURES = [
  "Unlimited access to all drills & courses",
  "Personalized training plans",
  "Shot tracking & progress analytics",
  "Community access",
  "New content added weekly",
];

export default function Pricing() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [purchasing, setPurchasing] = useState(false);
  const [iapReady, setIapReady] = useState(false);
  const [priceLabel, setPriceLabel] = useState("$12.99/month");

  useEffect(() => {
    if (isIAPAvailable()) {
      initializeStore().then(() => {
        setIapReady(true);
        const product = getProduct();
        if (product?.pricing?.price) {
          setPriceLabel(`${product.pricing.price}/${product.pricing.priceMicros ? "month" : "month"}`);
        }
      });
    }
  }, []);

  const handleApplePurchase = async () => {
    setPurchasing(true);
    try {
      const { error } = await purchaseSubscription();
      if (error) {
        toast.error(error);
      } else {
        toast.success("Subscription activated! Welcome to Pro.");
        navigate("/dashboard");
      }
    } catch {
      toast.error("Purchase failed. Please try again.");
    } finally {
      setPurchasing(false);
    }
  };

  const isSubscribed = profile?.subscription_status === "active" || profile?.plan === "pro";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-heading font-bold text-foreground">Go Pro</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full">
        {isSubscribed ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-heading font-bold text-foreground">You're a Pro!</h2>
            <p className="text-muted-foreground">You have full access to all features.</p>
            <Button onClick={() => navigate("/dashboard")} className="w-full">
              Go to Dashboard
            </Button>
          </div>
        ) : (
          <div className="space-y-8 w-full">
            {/* Hero */}
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-heading font-bold text-foreground">
                Unlock Everything
              </h2>
              <p className="text-muted-foreground">
                Get unlimited access to all drills, courses, and training tools.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-3">
              {FEATURES.map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-sm text-foreground">{feature}</span>
                </div>
              ))}
            </div>

            {/* Price */}
            <div className="text-center">
              <span className="text-4xl font-bold text-foreground">$12.99</span>
              <span className="text-muted-foreground">/month</span>
            </div>

            {/* Buttons */}
            <div className="space-y-3">
              {isIAPAvailable() && (
                <Button
                  onClick={handleApplePurchase}
                  disabled={purchasing || !iapReady}
                  className="w-full h-12 text-base gap-2 bg-foreground text-background hover:bg-foreground/90"
                >
                  {purchasing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Apple className="w-5 h-5" />
                  )}
                  Subscribe with Apple
                </Button>
              )}

              <Button
                variant={isIAPAvailable() ? "outline" : "default"}
                onClick={() => {
                  window.open("https://playitforward.app/pricing", "_blank");
                }}
                className="w-full h-12 text-base gap-2"
              >
                <Globe className="w-5 h-5" />
                Subscribe on Website
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Cancel anytime. Subscription auto-renews monthly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
