import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Trophy, Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddOfferDialog } from "@/components/recruit/AddOfferDialog";
import { useProgramCount, formatProgramCount } from "@/hooks/useProgramCount";
import { format } from "date-fns";

interface OfferRow {
  id: string;
  school_name: string;
  coach_name: string;
  offer_date: string;
}

interface Props {
  offers: OfferRow[];
  onChange: () => void;
}

export function OffersAndVisits({ offers, onChange }: Props) {
  const navigate = useNavigate();
  const [openAdd, setOpenAdd] = useState(false);
  const programCount = useProgramCount();

  return (
    <section className="space-y-4">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-heading text-foreground flex items-center gap-2">
            <Trophy className="h-5 w-5 text-pif-gold" /> Trophy Case
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Official offers and visits — the stuff you worked for.
          </p>
        </div>
        <Button size="sm" onClick={() => setOpenAdd(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Offer
        </Button>
      </header>

      {offers.length === 0 ? (
        <div
          className="relative overflow-hidden rounded-2xl border border-border bg-card px-6 py-10 text-center"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at top, hsl(var(--pif-gold) / 0.18) 0%, transparent 55%)",
          }}
        >
          <div className="mx-auto mb-4 w-14 h-14 rounded-2xl flex items-center justify-center bg-pif-gold/15 border border-pif-gold/30">
            <Trophy className="w-6 h-6 text-pif-gold" />
          </div>
          <h3 className="text-xl font-heading text-foreground mb-2">No offers yet</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-5">
            But you're {formatProgramCount(programCount)} coaches away from changing that.
          </p>
          <Button onClick={() => navigate("/recruit")} className="rounded-lg font-semibold">
            Go to Get Recruited
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {offers.map((o) => (
            <div
              key={o.id}
              className="relative rounded-xl border border-border bg-card p-4 overflow-hidden"
              style={{
                backgroundImage:
                  "radial-gradient(circle at top right, hsl(var(--pif-gold) / 0.10) 0%, transparent 60%)",
              }}
            >
              <div className="flex items-start gap-3">
                <div className="rounded-lg p-2 bg-pif-gold/15 border border-pif-gold/30">
                  <Trophy className="h-4 w-4 text-pif-gold" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-heading text-foreground truncate">{o.school_name}</p>
                  <p className="text-xs text-muted-foreground truncate">Coach {o.coach_name}</p>
                  <p className="text-[11px] text-muted-foreground/80 mt-2 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(o.offer_date), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddOfferDialog
        open={openAdd}
        onOpenChange={setOpenAdd}
        onSaved={onChange}
      />
    </section>
  );
}
