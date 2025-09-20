import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const Ctx = createContext({ user: null, initializing: true });
export const useAuth = () => useContext(Ctx);

// 👉 Allow-list fallback (bisa diisi dari env nanti)
const ADMIN_EMAILS = ["admin@mail.com"];

// Ambil role dari DB dengan 2 cara, lalu fallback ke allow-list email
async function fetchUserRoleSafe(u) {
  if (!u) return "user";

  // 1) cari berdasarkan user_id
  try {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", u.id)
      .maybeSingle();
    if (!error && data?.role) return String(data.role);
  } catch (_) {}

  // 2) fallback cari berdasarkan email
  try {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("email", u.email)
      .maybeSingle();
    if (!error && data?.role) return String(data.role);
  } catch (_) {}

  // 3) ultimate fallback: allow-list by email
  if (ADMIN_EMAILS.map((e) => e.toLowerCase()).includes((u.email || "").toLowerCase())) {
    return "admin";
  }

  return "user";
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInit] = useState(true);

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
        // alias kompatibilitas
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
