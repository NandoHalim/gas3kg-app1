import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

// Bentuk context
const Ctx = createContext({ user: null, initializing: true });
export const useAuth = () => useContext(Ctx);

// Helper: ambil role dari DB
async function fetchRoleFromDB(userId) {
  if (!userId) return "user";
  try {
    // Pastikan ada tabel public.app_admins (kolom: user_id uuid primary key)
    const { data, error } = await supabase
      .from("app_admins")
      .select("user_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn("[AUTH] fetchRoleFromDB error:", error.message);
      return "user";
    }
    const isAdmin = !!data?.user_id;
    return isAdmin ? "admin" : "user";
  } catch (e) {
    console.warn("[AUTH] fetchRoleFromDB catch:", e?.message || e);
    return "user";
  }
}

// Gabungkan user supabase + role custom
function composeUser(sessionUser, role) {
  if (!sessionUser) return null;
  // tempelkan role ke objek user
  return { ...sessionUser, role: role || "user" };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInit] = useState(true);

  // Resolusi sesi awal
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const sessionUser = data?.user ?? null;

      if (!sessionUser) {
        if (alive) {
          setUser(null);
          setInit(false);
        }
        return;
      }

      const role = await fetchRoleFromDB(sessionUser.id);
      const composed = composeUser(sessionUser, role);

      // Debug log
      console.log("[AUTH:init] email:", composed?.email, "id:", composed?.id, "role:", role);
      // Simpan ke window untuk pengecekan cepat di console
      try { window.__userRole = role; } catch {}

      if (alive) {
        setUser(composed);
        setInit(false);
      }
    })();

    // subscribe perubahan auth
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const sessionUser = session?.user ?? null;
      if (!sessionUser) {
        console.log("[AUTH:onChange] signed out");
        try { window.__userRole = null; } catch {}
        setUser(null);
        return;
      }
      const role = await fetchRoleFromDB(sessionUser.id);
      const composed = composeUser(sessionUser, role);
      console.log("[AUTH:onChange] email:", composed?.email, "id:", composed?.id, "role:", role);
      try { window.__userRole = role; } catch {}
      setUser(composed);
    });

    return () => {
      alive = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  // SSO email+password (dipakai LoginView)
  const signInEmailPassword = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const sessionUser = data?.user ?? null;
    const role = await fetchRoleFromDB(sessionUser?.id);
    const composed = composeUser(sessionUser, role);
    console.log("[AUTH:login] email:", composed?.email, "id:", composed?.id, "role:", role);
    try { window.__userRole = role; } catch {}
    setUser(composed);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    console.log("[AUTH] signed out");
    try { window.__userRole = null; } catch {}
    setUser(null);
  };

  return (
    <Ctx.Provider
      value={{
        user,
        initializing,
        signInEmailPassword,
        signInEmailPass: signInEmailPassword, // alias kompatibilitas
        signOut,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
