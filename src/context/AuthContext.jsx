import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const Ctx = createContext({ user: null, initializing: true });
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInit] = useState(true);

  // muat sesi awal + subscribe perubahan auth
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (alive) setUser(data?.user ?? null);
      } finally {
        if (alive) setInit(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => sub?.subscription?.unsubscribe?.();
  }, []);

  // --- API yang diekspos ke FE ---
  const signInAnon = async () => {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    setUser(data?.user ?? null);
    return data?.user ?? null;
  };

  const signInWithPassword = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setUser(data?.user ?? null);
    return data?.user ?? null;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <Ctx.Provider
      value={{
        user,
        initializing,
        signInAnon,
        signInWithPassword, // << dipakai LoginView
        signOut,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
