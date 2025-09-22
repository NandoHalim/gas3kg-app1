import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { DEFAULT_PRICE, PAYMENT_METHODS } from "../utils/constants";

// ==================================
// Context
// ==================================
const SettingsContext = createContext(null);
export const useSettings = () => useContext(SettingsContext);

// Key localStorage untuk fallback
const LS_KEY = "gas3kg_settings";

function readLS() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeLS(obj) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(obj || {}));
  } catch {}
}

// Normalisasi supaya field aman
function normalize(data) {
  return {
    business_name: data?.business_name || "",
    default_price: Number(data?.default_price) || DEFAULT_PRICE,
    hpp: Number(data?.hpp) || 0,
    payment_methods: Array.isArray(data?.payment_methods)
      ? data.payment_methods
      : PAYMENT_METHODS,
    updated_at: data?.updated_at || null,
  };
}

// ==================================
// Provider
// ==================================
export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => normalize(readLS()));
  const [loading, setLoading] = useState(true);

  // Load pertama dari Supabase
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("app_settings")
          .select("business_name, default_price, hpp, payment_methods, updated_at")
          .eq("id", 1)
          .maybeSingle();

        if (error) throw error;
        if (!alive) return;

        const normalized = normalize(data);
        setSettings(normalized);
        writeLS(normalized);
        try {
          window.__appSettings = normalized;
        } catch {}
      } catch {
        if (!alive) return;
        // fallback ke localStorage
        const cached = normalize(readLS());
        setSettings(cached);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // Simpan perubahan ke Supabase + LS
  const saveSettings = async (payload) => {
    const merged = { ...settings, ...payload };
    const normalized = normalize(merged);

    const { error } = await supabase
      .from("app_settings")
      .upsert({ id: 1, ...normalized, updated_at: new Date().toISOString() });

    if (error) throw new Error(error.message || "Gagal menyimpan pengaturan");

    setSettings(normalized);
    writeLS(normalized);

    try {
      window.__appSettings = normalized;
      window.dispatchEvent(
        new CustomEvent("settings:updated", { detail: normalized })
      );
    } catch {}

    return true;
  };

  // Subscribe antar tab
  useEffect(() => {
    const fn = (e) => {
      if (e.detail) setSettings(normalize(e.detail));
    };
    window.addEventListener("settings:updated", fn);
    return () => window.removeEventListener("settings:updated", fn);
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        saveSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}
