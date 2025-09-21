// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

// Bentuk nilai context
const Ctx = createContext({ user: null, initializing: true });
export const useAuth = () => useContext(Ctx);

// Helper: ambil role dari DB (tabel app_admins)
// Return: "admin" jika user_id ada di app_admins, selain itu "user"
async function fetchRole(userId) {
  if (!userId) return "user";
  try {
    const { data, error } = await supabase
      .from("app_admins")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      // Jika tabel belum ada / error lain → fallback user
      console.warn("[Auth] fetchRole error:", error.message);
      return "user";
    }
    return data?.user_id ? "admin" : "user";
  } catch (e) {
    console.warn("[Auth] fetchRole exception:", e?.message || e);
    return "user";
  }
}

// Helper: gabungkan objek user Supabase dengan properti role
async function enrichUser(user) {
  if (!user) return null;
  const role = await fetchRole(user.id);
  // Supabase mengembalikan objek kompleks; kita buat objek plain dengan field penting saja
  return {
    id: user.id,
    email: user.email,
    app_metadata: user.app_metadata,
    user_metadata: user.user_metadata,
    aud: user.aud,
    created_at: user.created_at,
    role, // <<— ini yang dipakai UI
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInit] = useState(true);

  // Init: cek session saat pertama kali load
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const raw = data?.user ?? null;
        const enriched = await enrichUser(raw);
        if (alive) setUser(enriched);
      } catch (e) {
        console.warn("[Auth] getUser error:", e?.message || e);
        if (alive) setUser(null);
      } finally {
        if (alive) setInit(false);
      }
    })();

    // Dengarkan perubahan auth (login/logout/token refresh)
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const raw = session?.user ?? null;
      const enriched = await enrichUser(raw);
      setUser(enriched);
    });

    return () => {
      alive = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  // Implementasi login email+password (dipakai LoginView)
  const _signInEmailPassword = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const enriched = await enrichUser(data?.user ?? null);
    setUser(enriched);
    return enriched;
  };

  const value = {
    user,            // berisi { id, email, role, ... }
    initializing,
    signInEmailPassword: _signInEmailPassword,
    // alias lama untuk kompatibilitas komponen lama
    signInEmailPass: _signInEmailPassword,
    async signOut() {
      await supabase.auth.signOut();
      setUser(null);
    },
    // utility optional buat debug di UI
    async refreshUser() {
      const { data } = await supabase.auth.getUser();
      const enriched = await enrichUser(data?.user ?? null);
      setUser(enriched);
      return enriched;
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
