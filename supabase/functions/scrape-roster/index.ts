import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const EXTRACTION_PROMPT = `Extract the basketball roster table from this markdown content. Return ONLY a valid JSON array with absolutely no other text, explanation, or markdown formatting — just the raw JSON array. Each object in the array must have exactly these fields: player_name (string), position (string), class_year (string — use FR, SO, JR, or SR only), graduation_year (integer — calculate as: FR=2029, SO=2028, JR=2027, SR=2026), height (string), weight (string), hometown (string), high_school (string), jersey_number (string). Use null for any field not available. If no roster table is found return an empty array [].`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!FIRECRAWL_API_KEY) throw new Error('FIRECRAWL_API_KEY is not configured');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const { school_name, url } = await req.json();
    if (!school_name || !url) {
      return new Response(JSON.stringify({ success: false, error: 'school_name and url required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1) Firecrawl scrape
    const fcRes = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, formats: ['markdown'] }),
    });
    const fcData = await fcRes.json();
    if (!fcRes.ok || !fcData?.success) {
      throw new Error(`Firecrawl error: ${fcData?.error || fcRes.statusText}`);
    }
    const markdown: string = fcData?.data?.markdown || fcData?.markdown || '';
    if (!markdown) throw new Error('No markdown returned from Firecrawl');

    // 2) Lovable AI extraction
    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: EXTRACTION_PROMPT },
          { role: 'user', content: markdown.slice(0, 120000) },
        ],
      }),
    });
    if (!aiRes.ok) {
      const txt = await aiRes.text();
      throw new Error(`AI gateway error ${aiRes.status}: ${txt}`);
    }
    const aiData = await aiRes.json();
    let content: string = aiData?.choices?.[0]?.message?.content ?? '';
    // Strip code fences if any
    content = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();

    let players: any[] = [];
    try {
      players = JSON.parse(content);
    } catch {
      const match = content.match(/\[[\s\S]*\]/);
      if (match) players = JSON.parse(match[0]);
    }
    if (!Array.isArray(players)) players = [];

    // 3) Insert
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    let inserted: any[] = [];
    if (players.length > 0) {
      const rows = players.map((p) => ({
        school_name,
        source_url: url,
        player_name: p.player_name ?? null,
        position: p.position ?? null,
        class_year: p.class_year ?? null,
        graduation_year: p.graduation_year ?? null,
        height: p.height ?? null,
        weight: p.weight ?? null,
        hometown: p.hometown ?? null,
        high_school: p.high_school ?? null,
        jersey_number: p.jersey_number ? String(p.jersey_number) : null,
      }));
      const { data, error } = await supabase.from('school_rosters').insert(rows).select();
      if (error) throw new Error(`Insert error: ${error.message}`);
      inserted = data ?? [];
    }

    return new Response(
      JSON.stringify({
        success: true,
        school_name,
        players_inserted: inserted.length,
        players: inserted.slice(0, 10),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('scrape-roster error', e);
    return new Response(JSON.stringify({ success: false, error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
