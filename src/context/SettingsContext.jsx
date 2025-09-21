import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { DataService } from "../services/DataService";

// Bentuk data setting yg dipakai app
const DEFAULTS = {
  business_name: "Usaha Saya",
  default_price: 23000,
  hpp: 0,
  payment_methods: ["TUNAI", "TRANSFER", "HUTANG"],
};

const Ctx = createContext({
  settings: DEFAULTS,
  loading: true,
  saveSettings: async (_payload) => {},
  changePassword: async (_old, _next) => {},
});

export const useSettings = () => useContext(Ctx);

export function SettingProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);

  // initial load
  useEffect(() => {
    let on = true;
    (async () => {
      try {
        setLoading(true);
        const s = await DataService.getSettings();
        const merged = { ...DEFAULTS, ...(s || {}) };
        if (on) setSettings(merged);
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => { on = false; };
  }, []);

  // simpan + sinkronkan state global
  const saveSettings = async (payload) => {
    const safe = { ...payload };
    // jaga business_name tidak kosong
    if ("business_name" in safe) {
      const trimmed = String(safe.business_name || "").trim();
      if (!trimmed) {
        safe.business_name = settings.business_name || DEFAULTS.business_name;
      } else {
        safe.business_name = trimmed;
      }
    }
    await DataService.saveSettings(safe);
    setSettings((prev) => ({ ...prev, ...safe }));
  };

  // ganti password
  const changePassword = async (oldPass, newPass) => {
    const { data: u } = await supabase.auth.getUser();
    const email = u?.user?.email;
    if (!email) throw new Error("Tidak ada sesi login.");

    // verifikasi oldPass dengan sign-in ulang (silent)
    const signIn = await supabase.auth.signInWithPassword({ email, password: oldPass });
    if (signIn.error) throw new Error("Password lama salah.");

    const upd = await supabase.auth.updateUser({ password: newPass });
    if (upd.error) throw new Error(upd.error.message || "Gagal mengubah password.");
    return true;
  };

  return (
    <Ctx.Provider value={{ settings, loading, saveSettings, changePassword }}>
      {children}
    </Ctx.Provider>
  );
}
