// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const Ctx = createContext({ user: null, initializing: true });
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInit] = useState(true);

  // ambil role admin dari tabel app_admins
  const fetchRole = async (uid) => {
    try {
      const { data, error } = await supabase
        .from("app_admins")
        .select("user_id")
        .eq("user_id", uid)
        .maybeSingle();

      if (error) {
        console.error("❌ fetchRole error:", error.message);
        return "user";
      }
      return data ? "admin" : "user";
    } catch (err) {
      console.error("❌ fetchRole exception:", err);
      return "user";
    }
  };

  useEffect(() => {
    let active = true;

    (async () => {
      const { data } = await supabase.auth.getUser();
      let u = data?.user ?? null;

      if (u) {
        const role = await fetchRole(u.id);
        u = { ...u, role };
      }

      if (active) setUser(u);
      setInit(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        let u = session?.user ?? null;
        if (u) {
          const role = await fetchRole(u.id);
          u = { ...u, role };
        }
        setUser(u);
      }
    );

    return () => {
      active = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  const _signInEmailPassword = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    let u = data?.user ?? null;
    if (u) {
      const role = await fetchRole(u.id);
      u = { ...u, role };
    }
    setUser(u);
  };

  return (
    <Ctx.Provider
      value={{
        user,
        initializing,
        signInEmailPassword: _signInEmailPassword,
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
