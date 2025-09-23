import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,       // simpan session di localStorage
    autoRefreshToken: true,     // refresh token otomatis
    detectSessionInUrl: true,   // dukung login lewat redirect
  },
});

// 🔎 Debug: expose ke window biar bisa dicek lewat DevTools Console
if (typeof window !== 'undefined') {
  window.supabase = supabase;
  console.log('[SUPABASE] URL:', supabaseUrl);
}
