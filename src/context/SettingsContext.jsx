// src/context/SettingsContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { DataService } from "../services/DataService";
import { DEFAULT_PRICE, PAYMENT_METHODS } from "../utils/constants";

const SettingsContext = createContext(null);

const SAFE_DEFAULTS = {
  business_name: "",
  default_price: DEFAULT_PRICE,
  hpp: 0,
  payment_methods: PAYMENT_METHODS,
  updated_at: null,
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(SAFE_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // initial load + subscribe perubahan dari DataService
  useEffect(() => {
    let isMounted = true;
    let unsubscribe = null;

    (async () => {
      try {
        setLoading(true);
        const s = await DataService.getActiveSettings();
        if (isMounted) {
          setSettings({ ...SAFE_DEFAULTS, ...(s || {}) });
          setError("");
        }
      } catch (e) {
        if (isMounted) {
          setError(e?.message || "Gagal memuat pengaturan");
        }
      } finally {
        if (isMounted) setLoading(false);
      }

      // dengarkan broadcast "settings:updated" dari DataService
      unsubscribe = DataService.onSettingsChange((next) => {
        if (!isMounted || !next) return;
        setSettings((prev) => ({ ...prev, ...next }));
      });
    })();

    return () => {
      isMounted = false;
      try { unsubscribe && unsubscribe(); } catch {}
    };
  }, []);

  // simpan pengaturan (langsung via DataService → Supabase)
  const saveSettings = async (payload) => {
    await DataService.saveSettings(payload);
    // DataService sudah broadcast event; namun kita merge lokal untuk responsif
    setSettings((prev) => ({ ...prev, ...payload, updated_at: new Date().toISOString() }));
    return true;
  };

  // optional: force reload dari server (abaikan cache LS)
  const refresh = async () => {
    setLoading(true);
    try {
      const s = await DataService.getSettings();
      setSettings({ ...SAFE_DEFAULTS, ...(s || {}) });
      setError("");
    } catch (e) {
      setError(e?.message || "Gagal refresh pengaturan");
    } finally {
      setLoading(false);
    }
  };

  // util ganti password (dipakai di PengaturanView) – sinkron dengan AuthContext patch
  const changePassword = async (oldPass, newPass) => {
    const { data: u } = await supabase.auth.getUser();
    const email = u?.user?.email;
    if (!email) throw new Error("Tidak ada sesi aktif.");
    const re = await supabase.auth.signInWithPassword({ email, password: oldPass });
    if (re.error) throw new Error("Password lama salah.");
    const { error } = await supabase.auth.updateUser({ password: newPass });
    if (error) throw error;
    return true;
  };

  const value = useMemo(
    () => ({
      settings,
      loading,
      error,
      saveSettings,
      refresh,
      changePassword,
    }),
    [settings, loading, error]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
