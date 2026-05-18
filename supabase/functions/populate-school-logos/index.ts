// Populate missing school logos in college_coaches.
// Tries Clearbit (and Google favicons as last resort) for each distinct
// school_name where logo_url is null/empty, and writes back to every row
// for that school when a valid image is found.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function compactSlug(name: string): string {
  return slugify(name).replace(/-/g, "");
}

function candidatesFor(name: string): string[] {
  const s = compactSlug(name);
  if (!s) return [];
  return [
    `https://logo.clearbit.com/${s}.edu`,
    `https://logo.clearbit.com/${s}athletics.com`,
    `https://logo.clearbit.com/${s}sports.com`,
    `https://logo.clearbit.com/go${s}.com`,
    `https://www.google.com/s2/favicons?domain=${s}.edu&sz=128`,
  ];
}

async function probe(url: string, timeoutMs = 4000): Promise<boolean> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    // Some logo CDNs reject HEAD; fall back to GET with range
    let res = await fetch(url, { method: "HEAD", signal: ctrl.signal });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, {
        method: "GET",
        signal: ctrl.signal,
        headers: { Range: "bytes=0-0" },
      });
    }
    if (!(res.status === 200 || res.status === 206)) return false;
    const ct = res.headers.get("content-type") || "";
    if (!ct.startsWith("image/")) return false;
    // Google favicons default globe is ~tiny; reject very small responses
    const len = Number(res.headers.get("content-length") || "0");
    if (len > 0 && len < 200) return false;
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the caller is an admin
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    const user = userRes?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (!profile || profile.role !== "admin") {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const batchSize = Math.min(Math.max(Number(body.batch_size) || 20, 1), 50);

    // Pick distinct schools missing a logo
    const { data: missing, error: missErr } = await admin
      .from("college_coaches")
      .select("school_name")
      .or("logo_url.is.null,logo_url.eq.")
      .not("school_name", "is", null)
      .limit(5000);
    if (missErr) throw missErr;

    const distinct: string[] = [];
    const seen = new Set<string>();
    for (const r of missing || []) {
      const n = (r as any).school_name as string | null;
      if (!n) continue;
      const key = n.trim();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      distinct.push(key);
      if (distinct.length >= batchSize) break;
    }

    const totalRemaining = seen.size; // approx; capped at 5000
    const results: Array<{ school: string; logo_url: string | null }> = [];
    let updated = 0;

    for (const school of distinct) {
      let found: string | null = null;
      for (const url of candidatesFor(school)) {
        const ok = await probe(url);
        if (ok) {
          found = url;
          break;
        }
      }
      if (found) {
        const { error: upErr } = await admin
          .from("college_coaches")
          .update({ logo_url: found })
          .eq("school_name", school)
          .or("logo_url.is.null,logo_url.eq.");
        if (!upErr) updated++;
      }
      results.push({ school, logo_url: found });
      // 1s pacing per spec
      await new Promise((r) => setTimeout(r, 1000));
    }

    return new Response(
      JSON.stringify({
        processed: distinct.length,
        updated,
        remaining: Math.max(0, totalRemaining - distinct.length),
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
