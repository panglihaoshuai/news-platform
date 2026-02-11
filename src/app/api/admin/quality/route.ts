import { NextResponse } from 'next/server';
import {
  buildManualClassificationIndex,
  isLowConfidence,
  parseQueueFilter,
} from '@/lib/admin-ops-core';
import { validateManualClassificationInput } from '@/lib/admin-core';
import { getAdminSupabaseClient, verifyAdminSession } from '@/lib/admin-session';

export async function GET(request: Request) {
  try {
    const supabase = getAdminSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    if (!(await verifyAdminSession())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = parseQueueFilter(searchParams.get('filter'));
    const limit = Math.min(Math.max(Number.parseInt(searchParams.get('limit') || '50', 10) || 50, 1), 200);

    const { data: newsItems, error: newsError } = await supabase
      .from('news_items')
      .select(
        'id,title,summary,source_name,published_at,country_code,region_code,categories,priority,classification_source,classification_confidence,used_llm,domain,domain_keywords,importance_score'
      )
      .order('published_at', { ascending: false })
      .limit(500);

    if (newsError) {
      return NextResponse.json({ error: 'Failed to load quality queue' }, { status: 500 });
    }

    const ids = (newsItems || []).map((item) => item.id);
    const { data: manualClassifications } = ids.length
      ? await supabase
          .from('manual_classifications')
          .select('news_item_id,categories,priority,notes,created_at')
          .in('news_item_id', ids)
          .order('created_at', { ascending: false })
      : { data: [] as Array<Record<string, unknown>> };

    const manualIndex = buildManualClassificationIndex(
      (manualClassifications || []) as Array<{ news_item_id: string; created_at?: string }>
    );

    const queue = (newsItems || []).map((item) => {
      const manual = manualIndex[item.id] || null;
      const reviewed = !!manual;
      return {
        ...item,
        review_status: reviewed ? 'reviewed' : 'unreviewed',
        explainability: {
          classification_source: item.classification_source || 'unknown',
          classification_confidence: item.classification_confidence ?? 0,
          used_llm: item.used_llm ?? false,
          domain_keywords: item.domain_keywords || [],
        },
        manual_classification: manual,
      };
    });

    const filtered = queue.filter((item) => {
      if (filter === 'reviewed') return item.review_status === 'reviewed';
      if (filter === 'unreviewed') return item.review_status === 'unreviewed';
      if (filter === 'low-confidence') return isLowConfidence(item.classification_confidence);
      return true;
    });

    return NextResponse.json({
      filter,
      total: filtered.length,
      items: filtered.slice(0, limit),
    });
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

    const payload = await request.json();
    const validation = validateManualClassificationInput(payload);
    if (!validation.valid || !validation.normalized) {
      return NextResponse.json({ error: validation.error || 'Invalid payload' }, { status: 400 });
    }

    const { categories, priority, notes } = validation.normalized;

    const { error: insertError } = await supabase.from('manual_classifications').insert({
      news_item_id: payload.newsItemId,
      categories,
      priority,
      notes,
      classified_by: 'admin',
    });

    if (insertError) {
      return NextResponse.json({ error: 'Failed to save manual review' }, { status: 500 });
    }

    const { error: updateError } = await supabase
      .from('news_items')
      .update({
        categories,
        priority,
      })
      .eq('id', payload.newsItemId);

    if (updateError) {
      return NextResponse.json({ error: 'Saved review but failed to write back' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
