// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const Ctx = createContext({ user: null, initializing: true });
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInit] = useState(true);

  // helper ambil role dari tabel user_roles
  const fetchRole = async (id) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("id", id)
        .single();
      if (error) return null;
      return data?.role || null;
    } catch {
      return null;
    }
  };

  const enrichUser = async (u) => {
    if (!u) return null;
    const role = await fetchRole(u.id);
    return { ...u, role: role || "user" };
  };

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const rawUser = data?.user ?? null;
      const u = await enrichUser(rawUser);
      if (active) setUser(u);
      setInit(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const rawUser = session?.user ?? null;
      const u = await enrichUser(rawUser);
      setUser(u);
    });

    return () => {
      active = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  const _signInEmailPassword = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const u = await enrichUser(data?.user ?? null);
    setUser(u);
  };

  return (
    <Ctx.Provider
      value={{
        user,
        initializing,
        signInEmailPassword: _signInEmailPassword,
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
