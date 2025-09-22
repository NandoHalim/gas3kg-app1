// src/context/SettingsContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { DataService } from "../services/DataService";
import { DEFAULT_PRICE, PAYMENT_METHODS } from "../utils/constants";

// ---- Context shape
const Ctx = createContext({
  settings: null,
  loading: true,
  error: "",
  refresh: async () => {},
  update: async (_payload) => {},
});

export const useSettings = () => useContext(Ctx);

// ---- Helper: sanitize + default
function coerceSettings(s) {
  const safe = s || {};
  return {
    id: 1,
    business_name: (safe.business_name || "").trim(),
    default_price:
      Number(safe.default_price) > 0 ? Number(safe.default_price) : DEFAULT_PRICE,
    hpp: Number(safe.hpp) > 0 ? Number(safe.hpp) : 0,
    payment_methods:
      Array.isArray(safe.payment_methods) && safe.payment_methods.length
        ? safe.payment_methods
        : PAYMENT_METHODS,
    updated_at: safe.updated_at || null,
  };
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setErr] = useState("");
  const unsubRef = useRef(() => {});

  // ---- initial load (Supabase first, fallback LS)
  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      // Gunakan DataService (sudah pindah ke Supabase + cache LS)
      const s = await DataService.getActiveSettings();
      setSettings(coerceSettings(s));
      try {
        // expose utk debug cepat
        window.__appSettings = s;
      } catch {}
    } catch (e) {
      setErr(e?.message || "Gagal memuat pengaturan");
      // fallback aman
      const s = await DataService.getSettings().catch(() => ({}));
      setSettings(coerceSettings(s));
    } finally {
      setLoading(false);
    }
  };

  // ---- update (admin) → tulis ke Supabase via DataService
  const update = async (payload) => {
    // Optimistic UI: tampilkan dulu di UI
    const prev = settings;
    const merged = coerceSettings({ ...(prev || {}), ...(payload || {}) });
    setSettings(merged);
    try {
      await DataService.saveAppSettings(payload);
      // DataService akan mem-broadcast "settings:updated"; kita tetap set sekarang supaya terasa instan
    } catch (e) {
      // rollback jika gagal
      setSettings(prev);
      setErr(e?.message || "Gagal menyimpan pengaturan");
      throw e;
    }
  };

  // ---- subscriptions
  useEffect(() => {
    let alive = true;

    // 1) initial
    load();

    // 2) dengarkan broadcast FE (DataService.saveAppSettings / saveSettings)
    const off = DataService.onSettingsChange((s) => {
      if (!alive) return;
      setSettings(coerceSettings(s));
    });
    unsubRef.current = off;

    // 3) realtime dari Supabase (app_settings) supaya semua user ikut update
    const ch = supabase
      .channel("rt-app-settings")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_settings" },
        async () => {
          // ambil dari DB lagi agar akurat (hindari race)
          try {
            const latest = await DataService.getAppSettings();
            setSettings(coerceSettings(latest));
            setErr("");
          } catch (e) {
            // diamkan; tetap ada state saat ini
            console.warn("[settings:realtime] fetch fail:", e?.message || e);
          }
        }
      )
      .subscribe();

    return () => {
      alive = false;
      try {
        supabase.removeChannel(ch);
      } catch {}
      try {
        unsubRef.current?.();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({
      settings,
      loading,
      error,
      refresh: load,
      update,
    }),
    [settings, loading, error]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
