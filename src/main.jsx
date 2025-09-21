// src/main.jsx
import React, { Suspense, lazy, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// konteks / shell yang sudah ada
import App from "./App.jsx";

// ====== LAZY ROUTES (code-splitting per halaman) ======
const DashboardView  = lazy(() => import("./components/views/DashboardView.jsx"));
const TransaksiView  = lazy(() => import("./components/views/TransaksiView.jsx"));
const RiwayatView    = lazy(() => import("./components/views/RiwayatView.jsx"));
const LaporanView    = lazy(() => import("./components/views/LaporanView.jsx"));
const PengaturanView = lazy(() => import("./components/views/PengaturanView.jsx"));

// prefetch helper (ringan) – buat <link rel="prefetch"> untuk chunk berikutnya
import { prefetch } from "./utils/prefetch.js";

function AppRoutes() {
  // Prefetch saat hover/touch pada link/menu yang punya data-prefetch
  useEffect(() => {
    const onEnter = (e) => {
      const el = e.target.closest("[data-prefetch]");
      if (!el) return;
      const name = el.getAttribute("data-prefetch");
      // mapping ke importer yang sama dengan lazy()
      if (name === "dashboard") prefetch(() => import("./components/views/DashboardView.jsx"));
      if (name === "transaksi") prefetch(() => import("./components/views/TransaksiView.jsx"));
      if (name === "riwayat")   prefetch(() => import("./components/views/RiwayatView.jsx"));
      if (name === "laporan")   prefetch(() => import("./components/views/LaporanView.jsx"));
      if (name === "setting")   prefetch(() => import("./components/views/PengaturanView.jsx"));
    };
    document.addEventListener("mouseover", onEnter, { passive: true });
    document.addEventListener("touchstart", onEnter, { passive: true });
    return () => {
      document.removeEventListener("mouseover", onEnter);
      document.removeEventListener("touchstart", onEnter);
    };
  }, []);

  return (
    <Suspense
      fallback={
        // skeleton ringan saat chunk pertama dimuat
        <div style={{padding:16,fontFamily:"system-ui,Segoe UI,Roboto"}}>
          Memuat…
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardView />} />
          <Route path="transaksi" element={<TransaksiView />} />
          <Route path="riwayat" element={<RiwayatView />} />
          <Route path="laporan" element={<LaporanView />} />
          <Route path="pengaturan" element={<PengaturanView />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </React.StrictMode>
);
