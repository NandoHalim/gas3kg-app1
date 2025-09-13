import React, { useEffect, useRef, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

import Header from "./components/layout/Header.jsx";
import Navigation from "./components/layout/Navigation.jsx";
import DashboardView from "./components/views/DashboardView.jsx";
import LoginView from "./components/views/LoginView.jsx";
import PenjualanView from "./components/views/PenjualanView.jsx";
import StokView from "./components/views/StokView.jsx";
import RiwayatView from "./components/views/RiwayatView.jsx";

import { useToast } from "./context/ToastContext.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { DataService } from "./services/DataService.js";
import { supabase } from "./lib/supabase.js";
import { COLORS } from "./utils/constants.js";

function RequireAuth({ children }) {
  const { user, initializing } = useAuth();
  if (initializing) return <div className="p-4">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { user, signOut } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [stocks, setStocks] = useState({ ISI: 0, KOSONG: 0 });
  const [isAdmin, setIsAdmin] = useState(false);

  const lastLocalUpdateRef = useRef(0);
  const COOLDOWN_MS = 800;

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const map = await DataService.loadStocks();
        if (alive) setStocks(map);
      } catch (e) {
        console.error(e);
        toast?.show?.({ type: "error", message: e.message || "Gagal ambil stok" });
      }
    })();

    const ch = supabase
      .channel("stocks-rt-app")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "stocks" },
        async () => {
          if (Date.now() - lastLocalUpdateRef.current < COOLDOWN_MS) return;
          try {
            const map = await DataService.loadStocks();
            setStocks(map);
          } catch {}
        }
      )
      .subscribe();

    return () => {
      try { supabase.removeChannel(ch); } catch {}
      alive = false;
    };
  }, []); // eslint-disable-line

  useEffect(() => {
    if (!user) return setIsAdmin(false);
    const role = (user.user_metadata?.role || "").toLowerCase();
    setIsAdmin(role === "admin");
  }, [user]);

  const handleResetAll = async () => {
    if (!confirm("Yakin reset SEMUA data (stok, log, sales)?")) return;
    try {
      const fresh = await DataService.resetAllData();
      setStocks(fresh);
      lastLocalUpdateRef.current = Date.now();
      toast?.show?.({
        type: "success",
        title: "Reset Berhasil",
        message: "Semua data telah direset.",
      });
      navigate("/", { replace: true });
    } catch (e) {
      toast?.show?.({
        type: "error",
        title: "Reset Gagal",
        message: e.message || "Reset ditolak. Pastikan Anda admin.",
      });
    }
  };

  const handleSavedStocks = (snapshot) => {
    setStocks(snapshot);
    lastLocalUpdateRef.current = Date.now();
  };

  const shell = user ? (
    <>
      <Header onLogout={signOut} onResetAll={handleResetAll} isAdmin={isAdmin} />
      <div style={{ display: "flex", flex: 1 }}>
        <Navigation />
        <main style={{ flex: 1, padding: 16 }}>
          <Routes>
            <Route path="/" element={<DashboardView stocks={stocks} />} />
            <Route
              path="/stok"
              element={
                <RequireAuth>
                  <StokView
                    stocks={stocks}
                    onSaved={handleSavedStocks}
                    onCancel={() => navigate("/")}
                  />
                </RequireAuth>
              }
            />
            <Route
              path="/penjualan"
              element={
                <RequireAuth>
                  <PenjualanView
                    stocks={stocks}
                    onSaved={handleSavedStocks}
                    onCancel={() => navigate("/")}
                  />
                </RequireAuth>
              }
            />
            <Route
              path="/riwayat"
              element={
                <RequireAuth>
                  <RiwayatView onCancel={() => navigate("/")} />
                </RequireAuth>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </>
  ) : (
    <Routes>
      <Route path="/login" element={<LoginView />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      {shell}
      <footer style={{ padding: 12, textAlign: "center", color: COLORS?.secondary || "#64748b" }}>
        © {new Date().getFullYear()} Gas 3KG Manager
      </footer>
    </div>
  );
}
