import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export function getAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
}

export function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function verifyAdminSession(): Promise<boolean> {
  const supabase = getAdminSupabaseClient();
  if (!supabase) return false;

  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  if (!token) return false;

  const tokenHash = hashSessionToken(token);
  const { data } = await supabase
    .from('admin_sessions')
    .select('expires_at')
    .eq('token_hash', tokenHash)
    .single();

  if (!data) return false;
  return new Date(data.expires_at) > new Date();
}
