export const MENU_ITEMS = (role = "user") => {
  const base = [
    { key: "dashboard",  label: "🏠 Dashboard",    to: "/" },
    { key: "transaksi",  label: "💰 Transaksi",    to: "/transaksi" },
    { key: "stok",       label: "📦 Kelola Stok",  to: "/stok" },
    { key: "riwayat",    label: "📊 Riwayat",      to: "/riwayat" },
    { key: "pelanggan",  label: "👥 Pelanggan",    to: "/pelanggan" },
  ];
  const adminOnly = [
    { key: "laporan",    label: "📋 Laporan",      to: "/laporan" },
    { key: "pengaturan", label: "⚙️ Pengaturan",   to: "/pengaturan" },
  ];
  const isAdmin = ["admin","owner"].includes(String(role).toLowerCase());
  return isAdmin ? [...base, ...adminOnly] : base;
};
