import Parser from 'rss-parser';
import { NextResponse } from 'next/server';
import { buildRegionCoverage, getSourceHealthStatus } from '@/lib/admin-ops-core';
import { getAdminSupabaseClient, verifyAdminSession } from '@/lib/admin-session';

const parser = new Parser({ timeout: 20_000 });

function ensureValidUrl(url?: string | null): boolean {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    const supabase = getAdminSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    if (!(await verifyAdminSession())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [{ data: sources, error: sourceError }, { data: recentItems, error: newsError }] = await Promise.all([
      supabase
        .from('rss_sources')
        .select('id,name,type,language,region_code,enabled,priority,last_fetched_at,fetch_count,success_rate,feed_url')
        .order('priority', { ascending: true }),
      supabase
        .from('news_items')
        .select('source_id,region_code')
        .gte('published_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    ]);

    if (sourceError || newsError) {
      return NextResponse.json({ error: 'Failed to load source operations data' }, { status: 500 });
    }

    const coverage = buildRegionCoverage((recentItems || []) as Array<{ source_id: string; region_code: string | null }>);
    const sourceList = (sources || []).map((source) => ({
      ...source,
      health_status: getSourceHealthStatus({
        enabled: source.enabled,
        lastFetchedAt: source.last_fetched_at,
        successRate: source.success_rate,
      }),
      recent_count: coverage.bySource[source.id] || 0,
    }));

    return NextResponse.json({
      sources: sourceList,
      coverage,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = getAdminSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    if (!(await verifyAdminSession())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, enabled, priority } = body as { id?: string; enabled?: boolean; priority?: number };

    if (!id) {
      return NextResponse.json({ error: 'Source id is required' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (typeof enabled === 'boolean') updates.enabled = enabled;
    if (typeof priority === 'number') updates.priority = priority;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });
    }

    const { error } = await supabase.from('rss_sources').update(updates).eq('id', id);
    if (error) {
      return NextResponse.json({ error: 'Failed to update source' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getAdminSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    if (!(await verifyAdminSession())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sourceId, action } = body as { sourceId?: string; action?: 'refetch' | 'retry' };

    if (!sourceId || !action) {
      return NextResponse.json({ error: 'sourceId and action are required' }, { status: 400 });
    }

    const { data: source, error: sourceError } = await supabase
      .from('rss_sources')
      .select('id,name,feed_url,region_code,language,fetch_count,success_rate')
      .eq('id', sourceId)
      .single();

    if (sourceError || !source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    if (!ensureValidUrl(source.feed_url)) {
      return NextResponse.json({ error: 'Source has invalid feed URL' }, { status: 400 });
    }

    const feed = await parser.parseURL(source.feed_url);
    const nowIso = new Date().toISOString();
    const items = (feed.items || []).slice(0, 20).map((item, index) => {
      const externalId = `${source.id}:${item.guid || item.link || item.title || index}`;
      return {
        external_id: externalId,
        source_id: source.id,
        source_name: source.name,
        source_language: source.language || 'en',
        title: item.title || 'Untitled',
        summary: (item.contentSnippet || item.content || '').slice(0, 800),
        original_url: item.link || `https://example.invalid/${source.id}/${index}`,
        published_at: item.isoDate ? new Date(item.isoDate).toISOString() : nowIso,
        region_code: source.region_code || 'GLOBAL',
        country_code: null,
        geo_lat: null,
        geo_lng: null,
        categories: item.categories || [],
        priority: 'P3',
        importance_score: 0,
        created_at: nowIso,
      };
    });

    let inserted = 0;
    if (items.length > 0) {
      const { error: insertError } = await supabase
        .from('news_items')
        .upsert(items, { onConflict: 'external_id', ignoreDuplicates: true });

      if (insertError) {
        return NextResponse.json({ error: 'Failed to write refetched items' }, { status: 500 });
      }
      inserted = items.length;
    }

    const previousFetchCount = source.fetch_count || 0;
    const previousSuccessRate = source.success_rate || 100;
    const nextFetchCount = previousFetchCount + 1;
    const successSignal = inserted > 0 ? 100 : 0;
    const nextSuccessRate =
      previousFetchCount === 0
        ? successSignal
        : (previousSuccessRate * previousFetchCount + successSignal) / nextFetchCount;

    await supabase
      .from('rss_sources')
      .update({
        last_fetched_at: nowIso,
        fetch_count: nextFetchCount,
        success_rate: nextSuccessRate,
      })
      .eq('id', source.id);

    return NextResponse.json({
      success: true,
      action,
      sourceId,
      fetched: feed.items?.length || 0,
      inserted,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
