// src/lib/supabase.ts
import { createBrowserClient } from '@supabase/ssr';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured =
  SUPABASE_URL.startsWith('https://') && SUPABASE_KEY.startsWith('eyJ');

export function createClient() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
}
