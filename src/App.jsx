import React, { useEffect, useState, Suspense, lazy } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout.jsx";

import DashboardView from "./components/views/DashboardView.jsx";
import LoginView from "./components/views/LoginView.jsx";
import PenjualanView from "./components/views/PenjualanView.jsx";
import StokView from "./components/views/StokView.jsx";
import TransaksiView from "./components/views/TransaksiView.jsx";
import PelangganView from "./components/views/PelangganView.jsx";
import BroadcastView from "./components/views/BroadcastView.jsx";

// ⬇️ Halaman yang relatif berat → lazy
const RiwayatView = lazy(() => import("./components/views/RiwayatView.jsx"));
const LaporanView = lazy(() => import("./components/views/LaporanView.jsx"));
const PengaturanView = lazy(() => import("./components/views/PengaturanView.jsx"));

import { useToast } from "./context/ToastContext.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { DataService } from "./services/DataService.js";
import { supabase } from "./lib/supabase.js";
import { COLORS } from "./utils/constants.js";

/* ---------- Error Boundary sederhana ---------- */
class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      // hanya log di dev; di prod console.* sudah dibersihkan oleh plugin vite
      // eslint-disable-next-line no-console
      console.error("Route render error:", error, info);
    }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 16, color: "#b91c1c" }}>
          <h3 style={{ marginTop: 0 }}>❌ Terjadi kesalahan saat memuat halaman</h3>
          <div style={{ whiteSpace: "pre-wrap", fontFamily: "monospace", fontSize: 13 }}>
            {this.state.error?.message || String(this.state.error)}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
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
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error("❌ Refresh stok gagal:", e?.message || e);
      }
    }
  };

  // Initial load + realtime listener (stocks & sales)
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const map = await DataService.loadStocks();
        if (alive) setStocks(map);
      } catch (e) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error(e);
        }
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
          // setiap penjualan memengaruhi stok → refresh
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

  // Prefetch modul berat saat idle / setelah mount
  useEffect(() => {
    const idle =
      typeof window !== "undefined" && "requestIdleCallback" in window
        ? window.requestIdleCallback
        : (cb) => setTimeout(cb, 1200);

    const cancel =
      typeof window !== "undefined" && "cancelIdleCallback" in window
        ? window.cancelIdleCallback
        : (id) => clearTimeout(id);

    const id = idle(() => {
      // warm-up chunks untuk navigasi pertama yang lebih cepat
      import("./components/views/RiwayatView.jsx");
      import("./components/views/LaporanView.jsx");
      import("./components/views/PengaturanView.jsx");
    });

    return () => cancel(id);
  }, []);

  // setiap ganti route → refresh stok (agar dashboard selalu terbaru)
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
        {/* Suspense + ErrorBoundary untuk halaman lazy */}
        <RouteErrorBoundary>
          <Suspense fallback={<div style={{ padding: 16 }}>Memuat halaman…</div>}>
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

              {/* ⬇️ ini sekarang lazy-loaded */}
              <Route
                path="/riwayat"
                element={<RiwayatView onCancel={() => navigate("/")} />}
              />

              {/* menu tambahan */}
              <Route
                path="/transaksi"
                element={<TransaksiView stocks={stocks} onSaved={setStocks} />}
              />
              <Route path="/pelanggan" element={<PelangganView />} />
              <Route path="/broadcast" element={<BroadcastView />} />

              {/* ⬇️ lazy-loaded */}
              <Route path="/laporan" element={<LaporanView />} />
              <Route path="/pengaturan" element={<PengaturanView />} />
            </Routes>
          </Suspense>
        </RouteErrorBoundary>
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
