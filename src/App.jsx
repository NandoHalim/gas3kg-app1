import React, { useEffect, useState } from "react";
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

  const push = (m, t = "success") =>
    toast?.show ? toast.show({ type: t, message: m }) : alert(m);

  const [stocks, setStocks] = useState({ ISI: 0, KOSONG: 0 });
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const map = await DataService.loadStocks();
        if (alive) setStocks(map);
      } catch (e) { console.error(e); }
    })();

    const ch = supabase
      .channel("stocks-rt-app")
      .on("postgres_changes",
        { event: "*", schema: "public", table: "stocks" },
        async () => {
          try { setStocks(await DataService.loadStocks()); } catch {}
        })
      .subscribe();

    return () => { try { supabase.removeChannel(ch); } catch {} alive = false; };
  }, []);

  useEffect(() => setIsAdmin(false), [user]);

  const handleResetAll = async () => {
    if (!confirm("Yakin reset SEMUA data (stok, log, sales)?")) return;
    try {
      setStocks(await DataService.resetAllData());
      // ⬇️ hanya ganti pesan toast (lebih jelas), fungsi tetap sama
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
            <Route path="/" element={<DashboardView stocks={stocks} />} />
            <Route path="/stok" element={<StokView stocks={stocks} onSaved={setStocks} onCancel={() => navigate("/")} />} />
            <Route path="/penjualan" element={<PenjualanView stocks={stocks} onSaved={setStocks} onCancel={() => navigate("/")} />} />
            <Route path="/riwayat" element={<RiwayatView onCancel={() => navigate("/")} />} />
          </Routes>
        </main>
      </div>

      <footer style={{ padding:12, textAlign:"center", color:COLORS.secondary, background:"#fff", borderTop:"1px solid #e5e7eb" }}>
        © {new Date().getFullYear()} Gas 3KG Manager
      </footer>
    </div>
  );
}
