import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 🔎 Debug: expose ke window biar bisa dicek lewat DevTools Console
if (typeof window !== 'undefined') {
  window.supabase = supabase;
  console.log('[SUPABASE] URL:', supabaseUrl);
}
