import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { DataService } from "../services/DataService.js";

const Ctx = createContext({
  settings: {},
  refreshSettings: async () => {},
});

export const useSettings = () => useContext(Ctx);

/**
 * SettingsProvider
 * - Membaca pengaturan via DataService.getSettings() (LS fallback)
 * - Menyediakan refreshSettings() supaya halaman lain bisa sync setelah "Simpan"
 */
export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({});

  const refreshSettings = useCallback(async () => {
    try {
      const s = await DataService.getSettings();
      setSettings(s || {});
    } catch {
      // abaikan error; biar UI tetap jalan
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  return (
    <Ctx.Provider value={{ settings, refreshSettings }}>
      {children}
    </Ctx.Provider>
  );
}
