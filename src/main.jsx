// src/main.jsx
import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";

// Providers (pastikan file2 ini ada)
import { ToastProvider } from "./context/ToastContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { SettingsProvider } from "./context/SettingsContext.jsx";

// Prefetch helper (ringan) – buat <link rel="prefetch"> untuk chunk berikutnya
import { prefetch } from "./utils/prefetch.js";

/**
 * Pasang prefetch saat hover/touch ke elemen yang punya atribut data-prefetch
 * (nama harus sesuai mapping importer lazy di App/komponen terkait).
 */
function PrefetchBoot() {
  useEffect(() => {
    const onEnter = (e) => {
      const el = e.target.closest?.("[data-prefetch]");
      if (!el) return;
      const name = el.getAttribute("data-prefetch");

      if (name === "dashboard")
        prefetch(() => import("./components/views/DashboardView.jsx"));
      if (name === "transaksi")
        prefetch(() => import("./components/views/TransaksiView.jsx"));
      if (name === "riwayat")
        prefetch(() => import("./components/views/RiwayatView.jsx"));
      if (name === "laporan")
        prefetch(() => import("./components/views/LaporanView.jsx"));
      if (name === "setting")
        prefetch(() => import("./components/views/PengaturanView.jsx"));
    };

    document.addEventListener("mouseover", onEnter, { passive: true });
    document.addEventListener("touchstart", onEnter, { passive: true });
    return () => {
      document.removeEventListener("mouseover", onEnter);
      document.removeEventListener("touchstart", onEnter);
    };
  }, []);

  return null;
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <SettingsProvider>
            <PrefetchBoot />
            {/* Seluruh routing sudah diatur di dalam App.jsx */}
            <App />
          </SettingsProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
);
