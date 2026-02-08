import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function verifySession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  
  if (!token) return false;
  
  const tokenHash = hashPassword(token);
  const { data } = await supabase
    .from('admin_sessions')
    .select('expires_at')
    .eq('token_hash', tokenHash)
    .single();
  
  if (!data) return false;
  
  return new Date(data.expires_at) > new Date();
}

// GET - List all keywords
export async function GET() {
  try {
    if (!await verifySession()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('keyword_library')
      .select('*')
      .eq('is_active', true)
      .order('tier', { ascending: true })
      .order('match_count', { ascending: false });

    if (error) {
      console.error('Fetch keywords error:', error);
      return NextResponse.json({ error: 'Failed to fetch keywords' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('Keywords API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new keyword
export async function POST(request: Request) {
  try {
    if (!await verifySession()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { keyword, tier, categories } = await request.json();

    if (!keyword || !tier) {
      return NextResponse.json({ error: 'Keyword and tier are required' }, { status: 400 });
    }

    const weight = tier === 'P0' ? 35 : tier === 'P1' ? 25 : tier === 'P2' ? 15 : 8;

    const { data, error } = await supabase
      .from('keyword_library')
      .insert({
        keyword: keyword.trim(),
        tier,
        categories: categories || [],
        weight,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Keyword already exists' }, { status: 409 });
      }
      console.error('Create keyword error:', error);
      return NextResponse.json({ error: 'Failed to create keyword' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('Keywords API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update keyword
export async function PUT(request: Request) {
  try {
    if (!await verifySession()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, keyword, tier, categories } = await request.json();

    if (!id || !keyword || !tier) {
      return NextResponse.json({ error: 'ID, keyword and tier are required' }, { status: 400 });
    }

    const weight = tier === 'P0' ? 35 : tier === 'P1' ? 25 : tier === 'P2' ? 15 : 8;

    const { data, error } = await supabase
      .from('keyword_library')
      .update({
        keyword: keyword.trim(),
        tier,
        categories: categories || [],
        weight,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update keyword error:', error);
      return NextResponse.json({ error: 'Failed to update keyword' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('Keywords API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete keyword (soft delete)
export async function DELETE(request: Request) {
  try {
    if (!await verifySession()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('keyword_library')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Delete keyword error:', error);
      return NextResponse.json({ error: 'Failed to delete keyword' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Keywords API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
