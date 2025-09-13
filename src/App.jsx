import React, { useEffect, useRef, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";

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

export default function App() {
  const { user, initializing, signOut } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [stocks, setStocks] = useState({ ISI: 0, KOSONG: 0 });
  const [isAdmin, setIsAdmin] = useState(false);

  // Cooldown agar event realtime tidak menimpa update lokal yang baru saja terjadi
  const lastLocalUpdateRef = useRef(0);
  const COOLDOWN_MS = 800;

  // Muat awal & subscribe realtime stok
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const map = await DataService.loadStocks();
        if (alive) setStocks(map);
      } catch (e) {
        toast?.show?.({ type: "error", message: e.message || "Gagal ambil stok" });
      }
    })();

    const ch = supabase
      .channel("stocks-rt-app")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "stocks" },
        async () => {
          const since = Date.now() - lastLocalUpdateRef.current;
          if (since < COOLDOWN_MS) return; // abaikan 1 event realtime segera setelah update lokal

          try {
            const map = await DataService.loadStocks();
            setStocks(map);
          } catch {
            /* noop */
          }
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(ch);
      } catch {
        /* noop */
      }
      alive = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Deteksi role admin dari user metadata
  useEffect(() => {
    if (!user) return setIsAdmin(false);
    const role = (user.user_metadata?.role || "").toLowerCase();
    setIsAdmin(role === "admin");
  }, [user]);

  // Handler reset (dengan toast)
  const handleResetAll = async () => {
    if (!confirm("Yakin reset SEMUA data (stok, log, sales)?")) return;
    try {
      const fresh = await DataService.resetAllData();
      setStocks(fresh);
      lastLocalUpdateRef.current = Date.now();
      toast?.show?.({ type: "success", message: "Data berhasil direset" });
      navigate("/");
    } catch (e) {
      toast?.show?.({ type: "error", message: e.message || "Gagal mereset data" });
    }
  };

  // Dipanggil child (PenjualanView/StokView) saat simpan sukses
  const handleSavedStocks = (snapshot) => {
    setStocks(snapshot);                  // update instan dari hasil RPC
    lastLocalUpdateRef.current = Date.now(); // aktifkan cooldown agar realtime tidak menimpa
  };

  if (initializing) return <div className="p-4">Loading…</div>;
  if (!user) return <LoginView />;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      <Header onLogout={signOut} onResetAll={handleResetAll} isAdmin={isAdmin} />

      <div style={{ display: "flex", flex: 1 }}>
        <Navigation />
        <main style={{ flex: 1, padding: 16 }}>
          <Routes>
            <Route path="/" element={<DashboardView stocks={stocks} />} />

            <Route
              path="/stok"
              element={
                <StokView
                  stocks={stocks}
                  onSaved={handleSavedStocks}
                  onCancel={() => navigate("/")}
                />
              }
            />

            <Route
              path="/penjualan"
              element={
                <PenjualanView
                  stocks={stocks}
                  onSaved={handleSavedStocks}
                  onCancel={() => navigate("/")}
                />
              }
            />

            <Route
              path="/riwayat"
              element={<RiwayatView onCancel={() => navigate("/")} />}
            />
          </Routes>
        </main>
      </div>

      <footer style={{ padding: 12, textAlign: "center", color: COLORS.secondary }}>
        © {new Date().getFullYear()} Gas 3KG Manager
      </footer>
    </div>
  );
}
