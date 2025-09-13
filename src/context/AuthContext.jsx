import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const Ctx = createContext({ user: null, initializing: true });
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInit] = useState(true);

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

  return (
    <Ctx.Provider
      value={{
        user,
        initializing,

        // ✅ dikembalikan agar kompatibel dengan LoginView sekarang
        async signInAnon() {
          const { data, error } = await supabase.auth.signInAnonymously();
          if (error) throw error;
          setUser(data?.user ?? null);
        },

        // tetap tersedia untuk login email+password jika nanti dibutuhkan
        async signInEmailPass(email, password) {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;
          setUser(data?.user ?? null);
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
