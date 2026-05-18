import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { isPaidSubscriber, STRIPE_CHECKOUT_URL, SUBSCRIPTION_PRICE_DISPLAY } from "@/lib/subscription";

interface Coach {
  id: string;
  name: string;
  school: string | null;
  bio: string | null;
  avatar_url: string | null;
  initials: string | null;
  focus_area: string | null;
  calendly_url: string | null;
  credential_badge: string | null;
}

const DEFAULT_CALENDLY = "https://calendly.com/bdaugherty216/play-it-forward-intro-call";

export default function Coaches() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile, hasActiveSubscription } = useAuth();
  const isPaid = isPaidSubscriber(profile, hasActiveSubscription);

  useEffect(() => {
    async function fetchCoaches() {
      const { data } = await supabase
        .from("coaches")
        .select("id, name, school, bio, avatar_url, initials, focus_area, calendly_url, credential_badge" as any)
        .order("sort_order")
        .order("name");
      setCoaches(((data as any[]) || []) as Coach[]);
      setLoading(false);
    }
    fetchCoaches();
  }, []);

  const openCalendly = (url: string | null) => {
    window.open(url || DEFAULT_CALENDLY, "_blank", "noopener,noreferrer");
  };

  return (
    <AppLayout>
      {!isPaid && (
        <div className="sticky top-0 z-30 bg-pif-red text-white px-4 py-3 shadow-lg">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm font-medium text-center sm:text-left">
              Book a free call with our staff — included with every Play it Forward subscription.
            </p>
            <a
              href={STRIPE_CHECKOUT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-pif-red font-semibold text-sm px-4 py-2 rounded-md hover:bg-white/90 transition-colors whitespace-nowrap"
            >
              Subscribe — {SUBSCRIPTION_PRICE_DISPLAY.replace("/month", "/month")}
            </a>
          </div>
        </div>
      )}

      <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-heading text-foreground">OUR TEAM</h1>
          <p className="text-muted-foreground mt-1">
            Former D1 players and coaches personally invested in your athlete's recruiting success.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coaches.map((coach) => (
              <Card
                key={coach.id}
                className="bg-card border-border overflow-hidden flex flex-col"
              >
                <div className="w-full h-[220px] bg-muted">
                  {coach.avatar_url ? (
                    <img
                      src={coach.avatar_url}
                      alt={coach.name}
                      className="w-full h-full object-cover object-[center_top]"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-3xl font-heading text-muted-foreground">
                        {coach.initials || coach.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <CardContent className="p-5 flex flex-col items-center text-center space-y-3 flex-1">
                  <div className="space-y-2">
                    <h3 className="text-lg font-heading font-bold text-foreground">{coach.name}</h3>
                    {coach.credential_badge && (
                      <span className="inline-block bg-pif-red/15 text-pif-red text-[11px] font-semibold px-2.5 py-1 rounded-full border border-pif-red/30">
                        {coach.credential_badge}
                      </span>
                    )}
                    {coach.school && !coach.credential_badge && (
                      <p className="text-sm text-muted-foreground">{coach.school}</p>
                    )}
                  </div>
                  {coach.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-3 flex-1">{coach.bio}</p>
                  )}
                  <Button
                    onClick={() => openCalendly(coach.calendly_url)}
                    className="w-full bg-pif-red hover:bg-pif-red/90 text-white mt-auto"
                  >
                    <Calendar className="h-4 w-4 mr-1.5" /> Book a Free Call
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Trust stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-border">
          {[
            { num: "7,800+", label: "College Coaches in Database" },
            { num: "All Divisions", label: "D1 through JUCO" },
            { num: "Former D1", label: "Athletes On Staff" },
          ].map((s) => (
            <div key={s.label} className="text-center py-4">
              <p className="font-heading font-bold text-white text-2xl sm:text-3xl">{s.num}</p>
              <p
                className="text-white/70 mt-1"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 400, fontSize: 12 }}
              >
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* What happens on your call */}
        <div className="space-y-5 pt-6 border-t border-border">
          <h2 className="text-xl font-heading text-foreground">What happens on your call?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { n: 1, t: "Profile Review", d: "We review your athlete's profile and highlight film" },
              { n: 2, t: "School Matching", d: "We identify programs based on level, region, and roster needs" },
              { n: 3, t: "Outreach Setup", d: "We set up your outreach so coaches actually respond" },
            ].map((step) => (
              <div key={step.n} className="flex gap-4 items-start">
                <div className="shrink-0 w-9 h-9 rounded-full bg-pif-red text-white flex items-center justify-center font-heading font-bold">
                  {step.n}
                </div>
                <div>
                  <p
                    className="text-white"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 }}
                  >
                    {step.t}
                  </p>
                  <p
                    className="text-white/60 mt-1 text-sm"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 400 }}
                  >
                    {step.d}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
