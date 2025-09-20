// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const Ctx = createContext({ user: null, initializing: true });
export const useAuth = () => useContext(Ctx);

// helper: ambil role dari DB, dukung 2 skema: by user_id atau by email
async function fetchUserRoleSafe(u) {
  if (!u) return "user";

  // 1) coba pakai user_id
  try {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", u.id)
      .maybeSingle();

    if (!error && data?.role) return String(data.role);
  } catch (_) {}

  // 2) fallback pakai email (sesuai tabel kamu sekarang)
  try {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("email", u.email)
      .maybeSingle();

    if (!error && data?.role) return String(data.role);
  } catch (_) {}

  // default jika tak ketemu
  return "user";
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInit] = useState(true);

  // tarik session & role saat awal
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const baseUser = data?.user ?? null;

        if (!alive) return;

        if (baseUser) {
          const role = await fetchUserRoleSafe(baseUser);
          setUser({ ...baseUser, role });
        } else {
          setUser(null);
        }
      } finally {
        if (alive) setInit(false);
      }
    })();

    // update saat login/logout
    const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, session) => {
      const baseUser = session?.user ?? null;
      if (baseUser) {
        const role = await fetchUserRoleSafe(baseUser);
        setUser({ ...baseUser, role });
      } else {
        setUser(null);
      }
    });

    return () => {
      alive = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  // signin (email+password)
  const _signInEmailPassword = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const baseUser = data?.user ?? null;
    if (baseUser) {
      const role = await fetchUserRoleSafe(baseUser);
      setUser({ ...baseUser, role });
    } else {
      setUser(null);
    }
  };

  return (
    <Ctx.Provider
      value={{
        user,
        initializing,
        signInEmailPassword: _signInEmailPassword,
        signInEmailPass: _signInEmailPassword, // alias kompatibilitas
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
