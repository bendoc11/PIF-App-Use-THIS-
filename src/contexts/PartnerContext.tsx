import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Partner {
  id: string;
  slug: string;
  partner_name: string;
  logo_url: string | null;
  primary_color: string | null;
  active: boolean;
}

interface PartnerContextValue {
  partner: Partner | null;
  loading: boolean;
}

const PartnerContext = createContext<PartnerContextValue>({ partner: null, loading: true });

export const usePartner = () => useContext(PartnerContext);

export const REFERRAL_KEY = "referral_slug";

export function PartnerProvider({ slug, children }: { slug?: string | null; children: ReactNode }) {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(!!slug);

  useEffect(() => {
    let cancelled = false;
    const effectiveSlug = slug || localStorage.getItem(REFERRAL_KEY);
    if (!effectiveSlug) {
      setPartner(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from("partners")
      .select("id,slug,partner_name,logo_url,primary_color,active")
      .eq("slug", effectiveSlug)
      .eq("active", true)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (data) {
          setPartner(data as Partner);
          if (slug) localStorage.setItem(REFERRAL_KEY, slug);
          document.title = `${data.partner_name} Recruiting`;
        } else {
          setPartner(null);
        }
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [slug]);

  return <PartnerContext.Provider value={{ partner, loading }}>{children}</PartnerContext.Provider>;
}
