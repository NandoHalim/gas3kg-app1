import { NavLink } from "react-router-dom";

export default function Navigation() {
  const base = {
    borderRadius: 8,
    padding: "10px 14px",
    textDecoration: "none",
    transition: "all .15s ease",
    display: "block",
    whiteSpace: "nowrap",
  };
  const style = ({ isActive }) => ({
    ...base,
    background: isActive ? "#1d4ed8" : "transparent",
    color: isActive ? "#fff" : "#0f172a",
    fontWeight: isActive ? 700 : 500,
  });

  const menu = [
    { to: "/", label: "Dashboard", end: true },
    { to: "/stok", label: "Stok" },
    { to: "/penjualan", label: "Penjualan" },
    { to: "/riwayat", label: "Riwayat" },
  ];

  return (
    <>
      {/* Sidebar (desktop ≥1025px) */}
      <aside
        className="nav-desktop"
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
        {menu.map(m => (
          <NavLink key={m.to} to={m.to} style={style} end={m.end}>
            {m.label}
          </NavLink>
        ))}
      </aside>

      {/* Top tabs (HP/Tablet ≤1024px) — STICKY under header */}
      <nav className="nav-mobile">
        <div className="tabs">
          {menu.map(m => (
            <NavLink
              key={m.to}
              to={m.to}
              end={m.end}
              style={({ isActive }) => ({
                ...base,
                background: isActive ? "#1d4ed8" : "#e2e8f0",
                color: isActive ? "#fff" : "#0f172a",
                fontWeight: isActive ? 700 : 500,
                padding: "10px 12px",
              })}
            >
              {m.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
