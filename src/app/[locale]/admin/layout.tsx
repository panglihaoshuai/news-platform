import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function verifySession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  
  if (!token) return false;
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  const tokenHash = hashPassword(token);
  const { data } = await supabase
    .from('admin_sessions')
    .select('expires_at')
    .eq('token_hash', tokenHash)
    .single();
  
  if (!data) return false;
  
  return new Date(data.expires_at) > new Date();
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verify session
  const isAuthenticated = await verifySession();
  
  if (!isAuthenticated) {
    redirect('/admin-login');
  }

  return (
    <div className="flex h-screen bg-black">
      {children}
    </div>
  );
}
