import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const Ctx = createContext({ user: null, initializing: true });
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInit] = useState(true);

  async function fetchProfile(sessionUser) {
    if (!sessionUser) {
      setUser(null);
      return;
    }
    // Ambil role dari tabel public.users
    const { data, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", sessionUser.id)
      .single();

    if (!error && data) {
      setUser({ ...sessionUser, role: data.role });
    } else {
      setUser({ ...sessionUser, role: "user" }); // default
    }
  }

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (active) await fetchProfile(data?.user ?? null);
      setInit(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchProfile(session?.user ?? null);
    });

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
    await fetchProfile(data?.user ?? null);
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
