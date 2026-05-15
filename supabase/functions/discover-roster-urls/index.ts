import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const ROSTER_KEYWORDS = ['roster', 'player', 'height', 'position', 'guard', 'forward', 'center'];

async function requireAdmin(req: Request, supabase: ReturnType<typeof createClient>) {
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) throw new Error('Not authenticated');

  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData.user) throw new Error('Not authenticated');

  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .maybeSingle();
  if (profileErr || profile?.role !== 'admin') throw new Error('Admin access required');
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function urlPatterns(school: string): string[] {
  const slug = slugify(school);
  const slugNoHyphen = slug.replace(/-/g, '');
  const nicknames = ['hawks', 'tigers', 'eagles', 'warriors', 'knights', 'bulldogs', 'panthers'];
  const patterns = [
    `https://${slugNoHyphen}athletics.com/sports/mens-basketball/roster`,
    `https://${slug}.com/sports/mens-basketball/roster`,
    `https://${slugNoHyphen}sports.com/sports/mens-basketball/roster`,
    `https://${slug}.edu/sports/mens-basketball/roster`,
    `https://athletics.${slug}.edu/sports/mens-basketball/roster`,
    `https://go${slugNoHyphen}.com/sports/mens-basketball/roster`,
  ];
  for (const nick of nicknames) {
    patterns.push(`https://${slugNoHyphen}${nick}.com/sports/mens-basketball/roster`);
  }
  patterns.push(
    `https://${slugNoHyphen}athletics.com/sports/mbkb/2025-26/roster`,
    `https://${slug}.com/sports/mbkb/2025-26/roster`,
    `https://${slugNoHyphen}sports.com/sports/mbkb/2025-26/roster`,
    `https://${slug}.edu/sports/mbkb/2025-26/roster`,
  );
  return patterns;
}

async function checkUrl(url: string): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    // Some athletics sites reject HEAD; try GET with no body read.
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: ctrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PIFRosterBot/1.0)' },
    });
    clearTimeout(t);
    // Drain to free socket
    try { await res.body?.cancel(); } catch (_) { /* noop */ }
    return res.status === 200;
  } catch (_) {
    return false;
  }
}

async function aiGuessUrl(schoolName: string): Promise<string | null> {
  if (!LOVABLE_API_KEY) return null;
  const prompt = `What is the official men's basketball roster page URL for ${schoolName}? This may be a small D2, D3, NAIA, or JUCO program. Check these common patterns: [school nickname]sports.com, [school abbreviation]athletics.com, go[school nickname].com. The page should end in /sports/mens-basketball/roster or /sports/mbkb/roster or similar. Return only the complete URL starting with https://, nothing else. If completely uncertain return null.`;
  const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) {
    console.error('AI gateway error', res.status, await res.text());
    return null;
  }
  const data = await res.json();
  const txt: string = (data?.choices?.[0]?.message?.content ?? '').trim();
  if (!txt || txt.toLowerCase() === 'null') return null;
  const match = txt.match(/https?:\/\/\S+/);
  return match ? match[0].replace(/[)\].,]+$/, '') : null;
}

async function firecrawlValidate(url: string): Promise<boolean> {
  if (!FIRECRAWL_API_KEY) return false;
  try {
    const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, formats: ['markdown'] }),
    });
    const data = await res.json();
    if (!res.ok || !data?.success) return false;
    const md: string = (data?.data?.markdown || data?.markdown || '').toLowerCase();
    if (!md) return false;
    const hits = ROSTER_KEYWORDS.filter((k) => md.includes(k)).length;
    return hits >= 3;
  } catch (e) {
    console.error('firecrawl validate error', e);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    await requireAdmin(req, supabase);

    const body = await req.json().catch(() => ({}));

    if (body?.action === 'manual-save') {
      const school = String(body.school ?? '').trim();
      const url = String(body.url ?? '').trim();
      if (!school || !url) throw new Error('School and URL are required');

      const { data: updatedRows, error: updateErr } = await supabase
        .from('college_coaches')
        .update({ roster_url: url, roster_url_status: 'confirmed' })
        .eq('school_name', school)
        .select('id');

      if (updateErr) throw new Error(updateErr.message);
      const affectedRows = updatedRows?.length ?? 0;
      console.log('manual roster URL save', { school, affectedRows, url });
      if (affectedRows < 1) throw new Error(`No college_coaches rows updated for ${school}`);

      return new Response(
        JSON.stringify({ success: true, school, roster_url: url, roster_url_status: 'confirmed', affected_rows: affectedRows }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (body?.action === 'run-all-background') {
      // Kick off a background task that processes all pending schools, then return immediately.
      const task = (async () => {
        try {
          let safety = 5000;
          while (safety-- > 0) {
            const { data: rows } = await supabase
              .from('college_coaches')
              .select('school_name')
              .eq('roster_url_status', 'pending')
              .not('school_name', 'is', null)
              .limit(10000);
            const seen = new Set<string>();
            const schools: string[] = [];
            for (const r of rows ?? []) {
              const n = (r as any).school_name?.trim();
              if (!n || seen.has(n)) continue;
              seen.add(n);
              schools.push(n);
              if (schools.length >= 10) break;
            }
            if (schools.length === 0) {
              console.log('run-all-background: complete, no pending schools left');
              break;
            }
            for (const school of schools) {
              let foundUrl: string | null = null;
              for (const candidate of urlPatterns(school)) {
                if (await checkUrl(candidate)) { foundUrl = candidate; break; }
              }
              if (!foundUrl) {
                const guessed = await aiGuessUrl(school);
                if (guessed && (await firecrawlValidate(guessed))) foundUrl = guessed;
              }
              if (foundUrl) {
                await supabase.from('college_coaches')
                  .update({ roster_url: foundUrl, roster_url_status: 'confirmed' })
                  .eq('school_name', school);
                console.log('bg confirmed', school, foundUrl);
              } else {
                await supabase.from('college_coaches')
                  .update({ roster_url_status: 'failed' })
                  .eq('school_name', school);
                console.log('bg failed', school);
              }
            }
            await new Promise((r) => setTimeout(r, 1500));
          }
        } catch (e) {
          console.error('run-all-background error', e);
        }
      })();
      // @ts-ignore EdgeRuntime is available in Supabase edge runtime
      if (typeof EdgeRuntime !== 'undefined' && (EdgeRuntime as any).waitUntil) {
        // @ts-ignore
        EdgeRuntime.waitUntil(task);
      }
      return new Response(
        JSON.stringify({ success: true, started: true, message: 'Background processing started' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Get distinct pending school names (limit 10).
    // distinct() isn't directly available — fetch with limit and dedupe.
    const { data: rows, error } = await supabase
      .from('college_coaches')
      .select('school_name')
      .eq('roster_url_status', 'pending')
      .not('school_name', 'is', null)
      .limit(10000);
    if (error) throw new Error(error.message);

    const seen = new Set<string>();
    const schools: string[] = [];
    for (const r of rows ?? []) {
      const n = (r as any).school_name?.trim();
      if (!n || seen.has(n)) continue;
      seen.add(n);
      schools.push(n);
      if (schools.length >= 10) break;
    }

    const log: any[] = [];
    let confirmed = 0;
    let failed = 0;

    for (const school of schools) {
      let foundUrl: string | null = null;
      let method: 'pattern' | 'ai' | null = null;

      for (const candidate of urlPatterns(school)) {
        if (await checkUrl(candidate)) {
          foundUrl = candidate;
          method = 'pattern';
          break;
        }
      }

      if (!foundUrl) {
        const guessed = await aiGuessUrl(school);
        if (guessed && (await firecrawlValidate(guessed))) {
          foundUrl = guessed;
          method = 'ai';
        }
      }

      if (foundUrl) {
        const { error: upErr } = await supabase
          .from('college_coaches')
          .update({ roster_url: foundUrl, roster_url_status: 'confirmed' })
          .eq('school_name', school);
        if (upErr) console.error('update err', school, upErr);
        confirmed++;
        log.push({ school, status: 'confirmed', url: foundUrl, method });
      } else {
        await supabase
          .from('college_coaches')
          .update({ roster_url_status: 'failed' })
          .eq('school_name', school);
        failed++;
        log.push({ school, status: 'failed', url: null, method: null });
      }
    }

    // Distinct pending school count remaining
    const { data: pendRows } = await supabase
      .from('college_coaches')
      .select('school_name')
      .eq('roster_url_status', 'pending')
      .not('school_name', 'is', null)
      .limit(20000);
    const pendingCount = new Set((pendRows ?? []).map((r: any) => r.school_name?.trim()).filter(Boolean)).size;

    return new Response(
      JSON.stringify({
        success: true,
        schools_processed: schools.length,
        urls_confirmed: confirmed,
        urls_failed: failed,
        urls_pending: pendingCount ?? 0,
        log,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('discover-roster-urls error', e);
    return new Response(JSON.stringify({ success: false, error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
