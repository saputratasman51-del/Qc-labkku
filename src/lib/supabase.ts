import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

let supabaseInstance: SupabaseClient | null = null;

export function cleanSupabaseUrl(rawUrl: string): string {
  let u = rawUrl.trim();
  u = u.replace(/\/rest\/v1\/?$/, '');
  u = u.replace(/\/$/, '');
  return u;
}

export function getSupabaseClient(): SupabaseClient | null {
  const rawUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!rawUrl || !key || rawUrl.includes('your-project') || key.includes('your-anon-key')) {
    return null;
  }

  const url = cleanSupabaseUrl(rawUrl);

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      return null;
    }
  }

  return supabaseInstance;
}

export async function testSupabaseConnection(rawUrl?: string, rawKey?: string): Promise<{ success: boolean; message: string; tablesCount?: number }> {
  try {
    let client: SupabaseClient | null = null;
    if (rawUrl && rawKey) {
      const url = cleanSupabaseUrl(rawUrl);
      client = createClient(url, rawKey.trim(), {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    } else {
      client = getSupabaseClient();
    }
    if (!client) {
      return { success: false, message: 'SUPABASE_URL atau SUPABASE_ANON_KEY belum dikonfigurasi.' };
    }

    // Test query to lab_profile or users
    const { data, error } = await client.from('lab_profile').select('*').limit(1);

    if (error) {
      // Check if table exists
      return { success: false, message: `Gagal mengakses Supabase: ${error.message}` };
    }

    return {
      success: true,
      message: 'Koneksi ke Supabase berhasil! Tabel ditemukan.',
      tablesCount: data ? data.length : 0,
    };
  } catch (error: any) {
    return { success: false, message: `Koneksi gagal: ${error.message || error}` };
  }
}
