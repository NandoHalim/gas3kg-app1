// src/context/SettingsContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { DataService } from "../services/DataService.js";

const Ctx = createContext({
  settings: {},
  loading: true,
  saveSettings: async () => {},
  changePassword: async () => {},
});

export const useSettings = () => useContext(Ctx);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  // initial load dari DataService
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const s = await DataService.getActiveSettings();
        if (alive) setSettings(s);
      } catch (e) {
        console.warn("[SettingsProvider] gagal ambil settings:", e.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    // subscribe perubahan settings
    const unsub = DataService.onSettingsChange((s) => setSettings(s));
    return () => {
      alive = false;
      unsub?.();
    };
  }, []);

  const saveSettings = async (payload) => {
    await DataService.saveSettings(payload);
    setSettings(await DataService.getActiveSettings());
  };

  // sementara fungsi ganti password dummy
  const changePassword = async (_oldPass, _newPass) => {
    return Promise.resolve(true);
  };

  return (
    <Ctx.Provider value={{ settings, loading, saveSettings, changePassword }}>
      {children}
    </Ctx.Provider>
  );
}
