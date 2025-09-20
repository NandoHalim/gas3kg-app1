// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const Ctx = createContext({ user: null, initializing: true });
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInit] = useState(true);

  // === fungsi ambil role dari tabel user_roles ===
  async function fetchUserRole(userId) {
    if (!userId) return "user";
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    console.log("🔎 fetchUserRole:", { userId, data, error }); // debug

    if (error) {
      console.warn("fetchUserRole error:", error.message);
      return "user";
    }
    return (data?.role || "user").toLowerCase();
  }

  useEffect(() => {
    let active = true;

    (async () => {
      const { data } = await supabase.auth.getUser();
      let u = data?.user ?? null;

      if (u) {
        const role = await fetchUserRole(u.id);
        u = { ...u, role };
      }

      if (active) setUser(u);
      setInit(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        let u = session?.user ?? null;
        if (u) {
          const role = await fetchUserRole(u.id);
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
      const role = await fetchUserRole(u.id);
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
        signInEmailPass: _signInEmailPassword, // alias lama
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
