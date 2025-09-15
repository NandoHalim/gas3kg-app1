import React, { useEffect, useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import Header from "./components/layout/Header.jsx";
import Navigation from "./components/layout/Navigation.jsx";
import DashboardView from "./components/views/DashboardView.jsx";
import LoginView from "./components/views/LoginView.jsx";
import PenjualanView from "./components/views/PenjualanView.jsx";
import StokView from "./components/views/StokView.jsx";
import RiwayatView from "./components/views/RiwayatView.jsx";
// ✅ Tambahan view baru
import TransaksiView from "./components/views/TransaksiView.jsx";
import PelangganView from "./components/views/PelangganView.jsx";
import LaporanView from "./components/views/LaporanView.jsx";
import PengaturanView from "./components/views/PengaturanView.jsx";

import { useToast } from "./context/ToastContext.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { DataService } from "./services/DataService.js";
import { supabase } from "./lib/supabase.js";
import { COLORS } from "./utils/constants.js";

export default function App() {
  const { user, initializing, signOut } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation(); // 👈 dipakai untuk refresh ringan saat pindah menu

  const push = (m, t = "success") =>
    toast?.show ? toast.show({ type: t, message: m }) : alert(m);

  const [stocks, setStocks] = useState({ ISI: 0, KOSONG: 0 });
  const [isAdmin, setIsAdmin] = useState(false);

  // 🔄 Helper: refresh stok ringan (dipakai di beberapa tempat)
  const refreshStocks = async () => {
    try {
      const map = await DataService.loadStocks();
      setStocks(map);
    } catch (e) {
      console.error(e);
    }
  };

  // 1) Initial load + Realtime (SATU channel untuk stocks & sales)
  useEffect(() => {
    let alive = true;

    // initial snapshot
    (async () => {
      try {
        const map = await DataService.loadStocks();
        if (alive) setStocks(map);
      } catch (e) {
        console.error(e);
      }
    })();

    // satu channel untuk dua tabel: stocks & sales
    const ch = supabase
      .channel("rt-app")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "stocks" },
        async () => {
          try {
            // perubahan stok → refresh snapshot
            await refreshStocks();
          } catch {}
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sales" },
        async () => {
          try {
            // perubahan transaksi → stok ikut berubah via fungsi SQL
            await refreshStocks();
            // (opsional) di sini bisa tambahkan event bus lokal kalau mau refresh komponen lain
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

  // 2) Refresh ringan setiap pindah menu (cepat, hanya snapshot stok)
  useEffect(() => {
    // saat route berubah (Dashboard ↔ Transaksi ↔ Stok ↔ Riwayat), ambil snapshot terbaru
    refreshStocks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => setIsAdmin(false), [user]);

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
            {/* Halaman utama & lama */}
            <Route path="/" element={<DashboardView stocks={stocks} />} />
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
            <Route
              path="/riwayat"
              element={<RiwayatView onCancel={() => navigate("/")} />}
            />

            {/* ✅ Route baru sesuai struktur menu */}
            <Route
              path="/transaksi"
              element={<TransaksiView stocks={stocks} onSaved={setStocks} />}
            />
            <Route path="/pelanggan" element={<PelangganView />} />
            <Route path="/laporan" element={<LaporanView />} />
            <Route path="/pengaturan" element={<PengaturanView />} />
          </Routes>
        </main>
      </div>

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
