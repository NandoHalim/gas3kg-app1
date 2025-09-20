import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const Ctx = createContext({ user: null, initializing: true });
export const useAuth = () => useContext(Ctx);

// Helper: ambil role dari tabel public.user_roles
async function fetchUserRole(userId) {
  if (!userId) return "user";
  // pastikan ada RLS policy SELECT untuk authenticated users
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.warn("fetchUserRole error:", error.message);
    return "user";
  }
  return (data?.role || "user").toLowerCase();
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInit] = useState(true);

  // gabungkan user Supabase + role DB jadi satu objek
  const setUserWithRole = async (sbUser) => {
    if (!sbUser) {
      setUser(null);
      return;
    }
    const role = await fetchUserRole(sbUser.id);
    // satukan: properti user asli Supabase + role kustom
    setUser({ ...sbUser, role });
  };

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!active) return;
        await setUserWithRole(data?.user ?? null);
      } finally {
        if (active) setInit(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      await setUserWithRole(session?.user ?? null);
    });

    return () => {
      active = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  // Sign in (email/password)
  const _signInEmailPassword = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await setUserWithRole(data?.user ?? null);
  };

  // Expose context
  return (
    <Ctx.Provider
      value={{
        user,
        initializing,
        signInEmailPassword: _signInEmailPassword,
        signInEmailPass: _signInEmailPassword, // alias
        async refreshRole() {
          if (user?.id) await setUserWithRole(user);
        },
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
