import { NextResponse } from 'next/server';
import { validateManualClassificationInput } from '@/lib/admin-core';
import { getAdminSupabaseClient, verifyAdminSession } from '@/lib/admin-session';

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

    const { error: manualError } = await supabase
      .from('manual_classifications')
      .insert({
        news_item_id: payload.newsItemId,
        categories,
        priority,
        notes,
      });

    if (manualError) {
      return NextResponse.json({ error: 'Failed to save classification' }, { status: 500 });
    }

    const { error: newsError } = await supabase
      .from('news_items')
      .update({
        categories,
        priority,
      })
      .eq('id', payload.newsItemId);

    if (newsError) {
      return NextResponse.json({ error: 'Classification saved but news update failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
