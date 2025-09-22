// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

/**
 * AuthContext:
 * - user: objek user Supabase (null jika belum login)
 * - initializing: true saat bootstrap auth (supaya guard/route bisa tunggu)
 * - signOut: helper opsional
 */
const AuthContext = createContext({ user: null, initializing: true });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let alive = true;
    let unsub = null;

    (async () => {
      try {
        // 1) Bootstrap: cek session saat ini
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.warn("[Auth] getSession error:", error.message);
        }
        const curUser = data?.session?.user ?? null;
        if (alive) setUser(curUser);
      } catch (e) {
        console.warn("[Auth] getSession exception:", e?.message || e);
      } finally {
        // Penting: matikan initializing meski gagal
        if (alive) setInitializing(false);
      }

      // 2) Subscribe perubahan auth
      const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
        // event: 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'USER_UPDATED' | ...
        const nextUser = session?.user ?? null;
        setUser(nextUser);

        // Emit event ringan untuk listener lain (opsional)
        try {
          window.dispatchEvent(new CustomEvent("auth:changed", { detail: { event, user: nextUser } }));
        } catch {}

        // Safety: di beberapa edge-case, pastikan initializing padam
        setInitializing(false);
      });

      unsub = sub?.subscription;
    })();

    // Cleanup agar tidak double subscribe di React.StrictMode (dev)
    return () => {
      alive = false;
      try {
        unsub?.unsubscribe?.();
      } catch {}
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("[Auth] signOut error:", e?.message || e);
    }
  };

  const value = useMemo(
    () => ({ user, initializing, signOut }),
    [user, initializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
