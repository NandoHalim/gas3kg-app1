import React, { useEffect, useState } from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout.jsx";

import DashboardView from "./components/views/DashboardView.jsx";
import LoginView from "./components/views/LoginView.jsx";
import PenjualanView from "./components/views/PenjualanView.jsx";
import StokView from "./components/views/StokView.jsx";
import RiwayatView from "./components/views/RiwayatView.jsx";
import TransaksiView from "./components/views/TransaksiView.jsx";
import PelangganView from "./components/views/PelangganView.jsx";
import BroadcastView from "./components/views/BroadcastView.jsx";
import LaporanView from "./components/views/LaporanView.jsx";
import PengaturanView from "./components/views/PengaturanView.jsx";

import { useToast } from "./context/ToastContext.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { DataService } from "./services/DataService.js";
import { supabase } from "./lib/supabase.js";
import { COLORS } from "./utils/constants.js";

/* ===== Guard: Admin Only ===== */
function RequireAdmin({ children }) {
  const { user, initializing } = useAuth();
  const role =
    (user?.role || (typeof window !== "undefined" ? window.__userRole : "") || "user").toLowerCase();

  if (initializing) return <div className="p-4">Loading…</div>;
  if (!user) return <LoginView />;           // jangan redirect — langsung tampilkan form login
  if (role !== "admin") return <Navigate to="/" replace />; // user biasa → balik ke dashboard
  return children;
}

export default function App() {
  const { user, initializing } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const push = (m, t = "success") =>
    toast?.show ? toast.show({ type: t, message: m }) : alert(m);

  const [stocks, setStocks] = useState({ ISI: 0, KOSONG: 0 });

  // Ambil snapshot stok
  const refreshStocks = async () => {
    try {
      const map = await DataService.loadStocks();
      setStocks(map);
    } catch (e) {
      console.error("❌ Refresh stok gagal:", e?.message || e);
    }
  };

  // initial load + realtime listener (stocks & sales)
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
      .channel("rt-app")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "stocks" },
        async () => {
          await refreshStocks();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sales" },
        async () => {
          await refreshStocks();
        }
      )
      .subscribe();

    return () => {
      alive = false;
      try {
        supabase.removeChannel(ch);
      } catch {}
    };
  }, []);

  // setiap ganti route → refresh stok
  useEffect(() => {
    refreshStocks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

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
    <AppLayout onResetAll={handleResetAll}>
      <main style={{ flex: 1 }}>
        <Routes>
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
          <Route path="/riwayat" element={<RiwayatView onCancel={() => navigate("/")} />} />

          {/* menu tambahan */}
          <Route path="/transaksi" element={<TransaksiView stocks={stocks} onSaved={setStocks} />} />
          <Route path="/pelanggan" element={<PelangganView />} />
          <Route path="/broadcast" element={<BroadcastView />} />
          <Route path="/laporan" element={<LaporanView />} />

          {/* ADMIN‐ONLY */}
          <Route
            path="/pengaturan"
            element={
              <RequireAdmin>
                <PengaturanView />
              </RequireAdmin>
            }
          />
        </Routes>
      </main>

      <footer
        style={{
          padding: 12,
          textAlign: "center",
          color: COLORS.secondary,
          background: "#fff",
          borderTop: "1px solid #e5e7eb",
          marginTop: 24,
        }}
      >
        © {new Date().getFullYear()} Gas 3KG Manager
      </footer>
    </AppLayout>
  );
}
