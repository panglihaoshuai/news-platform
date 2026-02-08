import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { calculateImportanceScore, KeywordLibrary } from '@/lib/importance-scorer';

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

// POST - Test scoring algorithm
export async function POST(request: Request) {
  try {
    if (!await verifySession()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, sourceName } = await request.json();

    if (!title || !sourceName) {
      return NextResponse.json({ error: 'Title and sourceName are required' }, { status: 400 });
    }

    // Fetch keywords from database
    const { data: keywords } = await supabase
      .from('keyword_library')
      .select('*')
      .eq('is_active', true);

    const keywordLibrary: KeywordLibrary[] = keywords || [];

    // Create a mock news item and source
    const mockNewsItem = {
      id: 'test-id',
      source_id: 'test-source',
      source_name: sourceName,
      source_language: 'en' as const,
      title,
      summary: '',
      original_url: '',
      published_at: new Date().toISOString(),
      geo_lat: 0,
      geo_lng: 0,
      region_code: 'GLOBAL',
      country_code: 'GLOBAL',
      importance_score: 0,
      image_url: null,
      created_at: new Date().toISOString(),
    };

    const mockSource = {
      id: 'test-source',
      name: sourceName,
      feed_url: '',
      region_code: 'GLOBAL',
      country_code: 'GLOBAL',
      language: 'en' as const,
      enabled: true,
    };

    // Calculate score
    const result = calculateImportanceScore(mockNewsItem, mockSource, keywordLibrary);

    return NextResponse.json(result);
  } catch (err) {
    console.error('Test API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
