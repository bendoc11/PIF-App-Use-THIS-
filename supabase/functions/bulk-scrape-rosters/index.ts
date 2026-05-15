import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const limit: number = Math.min(Math.max(Number(body?.limit ?? 10), 1), 50);
    const offset: number = Math.max(Number(body?.offset ?? 0), 0);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch confirmed schools (paginate to handle >1000)
    const confirmed: { school_name: string; roster_url: string }[] = [];
    const seen = new Set<string>();
    let from = 0;
    const PAGE = 1000;
    while (true) {
      const { data, error } = await supabase
        .from('college_coaches')
        .select('school_name, roster_url')
        .eq('roster_url_status', 'confirmed')
        .not('roster_url', 'is', null)
        .not('school_name', 'is', null)
        .order('school_name', { ascending: true })
        .range(from, from + PAGE - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      for (const r of data as any[]) {
        if (!seen.has(r.school_name)) {
          seen.add(r.school_name);
          confirmed.push({ school_name: r.school_name, roster_url: r.roster_url });
        }
      }
      if (data.length < PAGE) break;
      from += PAGE;
    }

    // Already-scraped schools
    const scrapedSet = new Set<string>();
    {
      let f = 0;
      while (true) {
        const { data, error } = await supabase
          .from('school_rosters')
          .select('school_name')
          .not('school_name', 'is', null)
          .range(f, f + PAGE - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        for (const r of data as any[]) scrapedSet.add(r.school_name);
        if (data.length < PAGE) break;
        f += PAGE;
      }
    }

    const remaining = confirmed.filter((s) => !scrapedSet.has(s.school_name));
    const batch = remaining.slice(offset, offset + limit);

    const log: { school: string; players_inserted: number; status: 'ok' | 'failed'; error?: string }[] = [];
    let schools_scraped = 0;
    let players_inserted = 0;
    let schools_failed = 0;

    for (const s of batch) {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/scrape-roster`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({ school_name: s.school_name, url: s.roster_url }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.success) {
          schools_failed++;
          log.push({ school: s.school_name, players_inserted: 0, status: 'failed', error: data?.error || res.statusText });
        } else {
          schools_scraped++;
          players_inserted += data.players_inserted ?? 0;
          log.push({ school: s.school_name, players_inserted: data.players_inserted ?? 0, status: 'ok' });
        }
      } catch (e) {
        schools_failed++;
        log.push({ school: s.school_name, players_inserted: 0, status: 'failed', error: (e as Error).message });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        schools_scraped,
        players_inserted,
        schools_failed,
        processed: batch.length,
        remaining: Math.max(remaining.length - batch.length - offset, 0),
        total_confirmed: confirmed.length,
        already_scraped: scrapedSet.size,
        log,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('bulk-scrape-rosters error', e);
    return new Response(JSON.stringify({ success: false, error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
