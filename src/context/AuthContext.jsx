// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const Ctx = createContext({ user: null, initializing: true });
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInit] = useState(true);

  // Helper untuk mengambil role dari berbagai kemungkinan lokasi
  const role = useMemo(() => {
    const r =
      user?.user_metadata?.role ??
      user?.app_metadata?.role ??
      user?.role ??
      ""; // fallback
    return typeof r === "string" ? r : "";
  }, [user]);

  const isAdmin = useMemo(() => {
    return String(role).trim().toLowerCase() === "admin";
  }, [role]);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (active) setUser(data?.user ?? null);
      setInit(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      active = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  // Implementasi tunggal
  const _signInEmailPassword = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setUser(data?.user ?? null);
  };

  return (
    <Ctx.Provider
      value={{
        user,
        role,      // <-- tambahkan role
        isAdmin,   // <-- convenience flag
        initializing,
        // Nama utama yang dipakai LoginView versi terbaru
        signInEmailPassword: _signInEmailPassword,
        // Alias untuk kompatibilitas bila ada komponen lama
        signInEmailPass: _signInEmailPassword,
        async signOut() {
          await supabase.auth.signOut();
          setUser(null);
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
