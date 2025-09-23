// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';

// ⚡ Ambil config dari Vite (.env) untuk web/dev
let supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ⚡ Coba ambil dari capacitor.config jika jalan di Android/iOS
try {
  if (Capacitor.isNativePlatform()) {
    // ⛔ Jangan pakai import static, karena config bisa beda-beda
    // Load dari file JSON/TS config di root project
    const capConfig = require('../../capacitor.config'); // pastikan path sesuai
    const supaCfg = capConfig?.plugins?.Supabase;

    if (supaCfg?.url && supaCfg?.anonKey) {
      supabaseUrl = supaCfg.url;
      supabaseAnonKey = supaCfg.anonKey;
    }
  }
} catch (e) {
  console.warn('[Supabase Config] fallback ke .env →', e?.message || e);
}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("❌ Supabase config tidak ditemukan. Pastikan sudah set di .env atau capacitor.config.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 🔎 Debug (hilangkan setelah fix)
if (typeof window !== 'undefined') {
  window.supabase = supabase;
  console.log('[SUPABASE] URL:', supabaseUrl);
}
