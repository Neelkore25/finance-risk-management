import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export function isSupabaseConfigured() {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('finance-risk-analytics.supabase.co') &&
    !supabaseUrl.includes('placeholder') &&
    !supabaseUrl.includes('YOUR_SUPABASE_URL')
  );
}

export const supabase = createClient(
  isSupabaseConfigured() ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured() ? supabaseAnonKey : 'placeholder-key',
  {
    auth: {
      persistSession: isSupabaseConfigured(),
      autoRefreshToken: isSupabaseConfigured(),
      detectSessionInUrl: isSupabaseConfigured()
    }
  }
);
