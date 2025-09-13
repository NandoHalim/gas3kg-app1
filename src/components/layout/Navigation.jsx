import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";

export default function Navigation() {
  const style = ({ isActive }) => ({
    background: isActive ? "#1d4ed8" : "transparent",
    color: isActive ? "#fff" : "#0f172a",
    fontWeight: isActive ? 600 : 500,
    borderRadius: 8,
    padding: "10px 14px",
    textDecoration: "none",
    transition: "all 0.2s ease-in-out",
    display: "block",
  });

  const menu = [
    { to: "/", label: "Dashboard", end: true },
    { to: "/stok", label: "Stok" },
    { to: "/penjualan", label: "Penjualan" },
    { to: "/riwayat", label: "Riwayat" },
  ];

  return (
    <motion.aside
      initial={{ x: -220, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -220, opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        width: 220,
        padding: 16,
        borderRight: "1px solid #e5e7eb",
        display: "grid",
        gap: 8,
        background: "#fff",
        height: "100%",
        position: "sticky",
        top: 0,
      }}
    >
      {menu.map((m) => (
        <NavLink key={m.to} to={m.to} style={style} end={m.end}>
          {m.label}
        </NavLink>
      ))}
    </motion.aside>
  );
}
