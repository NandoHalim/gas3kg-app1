// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const Ctx = createContext({ user: null, initializing: true, role: null });
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // simpan role
  const [initializing, setInit] = useState(true);

  // ambil role dari tabel user_roles
  const fetchRole = async (uid) => {
    if (!uid) {
      setRole(null);
      return;
    }
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("id", uid)
      .maybeSingle();
    if (!error && data) {
      setRole(data.role);
    } else {
      setRole("user"); // default
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (active) {
        setUser(data?.user ?? null);
        await fetchRole(data?.user?.id);
      }
      setInit(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      await fetchRole(session?.user?.id);
    });

    return () => {
      active = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  // login
  const _signInEmailPassword = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setUser(data?.user ?? null);
    await fetchRole(data?.user?.id);
  };

  // logout
  const _signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
  };

  return (
    <Ctx.Provider
      value={{
        user,
        role,
        initializing,
        signInEmailPassword: _signInEmailPassword,
        signInEmailPass: _signInEmailPassword,
        signOut: _signOut,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
