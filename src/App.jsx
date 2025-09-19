import React from "react";
import { Routes, Route } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout.jsx";

import DashboardView from "./components/views/DashboardView.jsx";
import PenjualanView from "./components/views/PenjualanView.jsx";
import StokView from "./components/views/StokView.jsx";
import RiwayatView from "./components/views/RiwayatView.jsx";
import TransaksiView from "./components/views/TransaksiView.jsx";
import PelangganView from "./components/views/PelangganView.jsx";
import BroadcastView from "./components/views/BroadcastView.jsx";
import LaporanView from "./components/views/LaporanView.jsx";
import PengaturanView from "./components/views/PengaturanView.jsx";

export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<DashboardView />} />
        <Route path="/penjualan" element={<PenjualanView />} />
        <Route path="/stok" element={<StokView />} />
        <Route path="/riwayat" element={<RiwayatView />} />
        <Route path="/transaksi" element={<TransaksiView />} />
        <Route path="/pelanggan" element={<PelangganView />} />
        <Route path="/broadcast" element={<BroadcastView />} />
        <Route path="/laporan" element={<LaporanView />} />
        <Route path="/pengaturan" element={<PengaturanView />} />
      </Routes>
    </AppLayout>
  );
}
