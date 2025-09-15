// src/App.js
import React, { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";

// Layout
import Header from "./components/layout/Header.jsx";
import Navigation from "./components/layout/Navigation.jsx";

// Views
import DashboardView from "./components/views/DashboardView.jsx";
import LoginView from "./components/views/LoginView.jsx";
import PenjualanView from "./components/views/PenjualanView.jsx";
import StokView from "./components/views/StokView.jsx";
import RiwayatView from "./components/views/RiwayatView.jsx";
import TransaksiView from "./components/views/TransaksiView.jsx";
import PelangganView from "./components/views/PelangganView.jsx";
import LaporanView from "./components/views/LaporanView.jsx";
import PengaturanView from "./components/views/PengaturanView.jsx";

// Context & Services
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

  // Helper untuk tampilkan notifikasi
  const push = (m, t = "success") =>
    toast?.show ? toast.show({ type: t, message: m }) : alert(m);

  // 🔄 Load realtime stok
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const map = await DataService.loadStocks();
        if (alive) setStocks(map);
      } catch (e) {
        console.error(e);
      }
    })();

    const ch = supabase
      .channel("stocks-rt-app")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "stocks" },
        async () => {
          try {
            setStocks(await DataService.loadStocks());
          } catch {}
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(ch);
      } catch {}
      alive = false;
    };
  }, []);

  // 🔐 Reset admin tiap kali user berubah
  useEffect(() => setIsAdmin(false), [user]);

  // 🔄 Reset semua data (hanya admin)
  const handleResetAll = async () => {
    if (!confirm("Yakin reset SEMUA data (stok, log, sales)?")) return;
    try {
      setStocks(await DataService.resetAllData());
      push("🧹 Data berhasil direset", "success");
      navigate("/");
    } catch (e) {
      push(`❌ ${e.message || "Gagal mereset data"}`, "error");
    }
  };

  // 🕒 Loading / Belum login
  if (initializing) return <div className="p-4">Loading…</div>;
  if (!user) return <LoginView />;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      <Header onLogout={signOut} onResetAll={handleResetAll} isAdmin={isAdmin} />

      {/* BODY */}
      <div className="app-body">
        <Navigation />
        <main style={{ flex: 1, padding: 16 }}>
          <Routes>
            {/* 📊 Dashboard */}
            <Route path="/" element={<DashboardView stocks={stocks} />} />

            {/* 📦 Manajemen Stok */}
            <Route
              path="/stok"
              element={
                <StokView
                  stocks={stocks}
                  onSaved={setStocks}
                  onCancel={() => navigate("/")}
                />
              }
            />

            {/* 🛒 Penjualan */}
            <Route
              path="/penjualan"
              element={
                <PenjualanView
                  stocks={stocks}
                  onSaved={setStocks}
                  onCancel={() => navigate("/")}
                />
              }
            />

            {/* 📜 Riwayat */}
            <Route
              path="/riwayat"
              element={<RiwayatView onCancel={() => navigate("/")} />}
            />

            {/* 🔄 Transaksi */}
            <Route
              path="/transaksi"
              element={<TransaksiView stocks={stocks} onSaved={setStocks} />}
            />

            {/* 👥 Pelanggan */}
            <Route path="/pelanggan" element={<PelangganView />} />

            {/* 📑 Laporan */}
            <Route path="/laporan" element={<LaporanView />} />

            {/* ⚙️ Pengaturan */}
            <Route path="/pengaturan" element={<PengaturanView />} />
          </Routes>
        </main>
      </div>

      {/* FOOTER */}
      <footer
        style={{
          padding: 12,
          textAlign: "center",
          color: COLORS.secondary,
          background: "#fff",
          borderTop: "1px solid #e5e7eb",
        }}
      >
        © {new Date().getFullYear()} Gas 3KG Manager
      </footer>
    </div>
  );
}
