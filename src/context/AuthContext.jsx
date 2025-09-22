// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

// Bentuk data yang dipakai komponen lain:
// const { user, session, initializing, signIn, signOut, changePassword, refreshUser } = useAuth();
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  // --- helper: refresh user dari Supabase
  const refreshUser = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (!error) setUser(data?.user || null);
    return data?.user || null;
  };

  // --- mount: ambil session awal + pasang listener
  useEffect(() => {
    let mounted = true;
    let unsub = null;

    (async () => {
      try {
        // 1) get session awal
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        setSession(data?.session || null);
        setUser(data?.session?.user || null);
      } catch {
        if (!mounted) return;
        setSession(null);
        setUser(null);
      } finally {
        // PENTING: apapun hasilnya, tutup loading
        if (mounted) setInitializing(false);
      }

      // 2) listener perubahan auth
      const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        if (!mounted) return;
        setSession(nextSession);
        setUser(nextSession?.user || null);
      });
      unsub = sub?.subscription?.unsubscribe ?? sub?.unsubscribe ?? null;
    })();

    // cleanup
    return () => {
      mounted = false;
      try { unsub && unsub(); } catch {}
    };
  }, []);

  // --- actions
  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setSession(data.session);
    setUser(data.user);
    return data.user;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setSession(null);
    setUser(null);
  };

  // ganti password (perlu reauth dengan password lama)
  const changePassword = async (oldPassword, newPassword) => {
    const email = user?.email;
    if (!email) throw new Error("Tidak ada sesi pengguna.");

    // re-auth
    const { error: reauthErr } = await supabase.auth.signInWithPassword({
      email,
      password: oldPassword,
    });
    if (reauthErr) throw new Error("Password lama salah.");

    // update password
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    await refreshUser();
    return true;
  };

  const value = useMemo(
    () => ({ user, session, initializing, signIn, signOut, changePassword, refreshUser }),
    [user, session, initializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
