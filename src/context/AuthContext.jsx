// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

/**
 * AuthContext
 * - Menyediakan: user, initializing, signInEmailPassword, signOut, changePassword
 * - Menjamin: flag `initializing` SELALU dimatikan, bahkan saat error
 * - Cleanup: unsubscribe onAuthStateChange saat unmount
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  // --- Initial session + listener
  useEffect(() => {
    let isMounted = true;
    let unsub = null;

    (async () => {
      try {
        // 1) Ambil session awal
        const { data, error } = await supabase.auth.getSession();
        if (error) console.warn("[Auth] getSession error:", error.message);
        if (isMounted) {
          setUser(data?.session?.user ?? null);
        }
      } catch (e) {
        console.warn("[Auth] getSession exception:", e?.message || e);
      } finally {
        // Penting: matikan initializing meski error
        if (isMounted) setInitializing(false);
      }

      // 2) Dengarkan perubahan auth
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!isMounted) return;
        setUser(session?.user ?? null);
        // Pastikan initializing padam juga jika state datang terlambat
        setInitializing(false);
      });

      unsub = () => {
        try {
          sub?.subscription?.unsubscribe?.();
        } catch {}
      };
    })();

    return () => {
      isMounted = false;
      try {
        unsub && unsub();
      } catch {}
    };
  }, []);

  // --- Actions
  const signInEmailPassword = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // `onAuthStateChange` akan meng-update `user`; kita tetap kembalikan data untuk caller.
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  /**
   * Ubah password user yang sedang login.
   * - Re-auth sederhana: verifikasi oldPass dengan signIn ulang (tidak mengubah sesi aktif).
   * - Lalu panggil updateUser({ password })
   */
  const changePassword = async (oldPass, newPass) => {
    const { data: u } = await supabase.auth.getUser();
    const email = u?.user?.email;
    if (!email) throw new Error("Tidak ada sesi aktif.");

    // Re-auth dengan oldPass untuk keamanan dasar
    const reauth = await supabase.auth.signInWithPassword({ email, password: oldPass });
    if (reauth.error) throw new Error("Password lama salah.");

    const { error } = await supabase.auth.updateUser({ password: newPass });
    if (error) throw error;
    return true;
  };

  const value = useMemo(
    () => ({
      user,
      initializing,
      signInEmailPassword,
      signOut,
      changePassword,
    }),
    [user, initializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth harus dipakai di dalam <AuthProvider>");
  }
  return ctx;
}
