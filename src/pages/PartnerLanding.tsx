import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import LandingPage from "./LandingPage";
import { PartnerProvider, REFERRAL_KEY } from "@/contexts/PartnerContext";

// Reserved top-level route segments that must NOT be treated as partner slugs.
const RESERVED = new Set([
  "", "partners", "login", "signup-success", "reset-password", "auth", "gmail",
  "subscribe", "paywall", "onboarding", "dashboard", "home", "courses", "drill",
  "drills", "pricing", "settings", "coaches", "community", "progress", "recruit",
  "replies", "open-spots", "profile", "p", "athlete", "admin", "privacy", "terms",
]);

export default function PartnerLanding() {
  const { slug } = useParams<{ slug: string }>();
  const [status, setStatus] = useState<"loading" | "found" | "notfound">("loading");

  useEffect(() => {
    if (!slug || RESERVED.has(slug.toLowerCase())) {
      setStatus("notfound");
      return;
    }
    supabase
      .from("partners")
      .select("id,slug")
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          localStorage.setItem(REFERRAL_KEY, slug);
          setStatus("found");
        } else {
          setStatus("notfound");
        }
      });
  }, [slug]);

  if (status === "loading") {
    return <div className="min-h-screen bg-background" />;
  }
  if (status === "notfound") {
    return <Navigate to="/" replace />;
  }

  return (
    <PartnerProvider slug={slug}>
      <LandingPage />
    </PartnerProvider>
  );
}
