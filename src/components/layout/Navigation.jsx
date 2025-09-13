import { NavLink } from "react-router-dom";

export default function Navigation() {
  const baseLink = {
    borderRadius: 8,
    padding: "10px 14px",
    textDecoration: "none",
    transition: "all .15s ease",
    display: "block",
    whiteSpace: "nowrap",
  };
  const style = ({ isActive }) => ({
    ...baseLink,
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
      {/* Sidebar untuk desktop/tablet */}
      <aside className="nav-desktop" style={{
        width: 220,
        padding: 16,
        borderRight: "1px solid #e5e7eb",
        display: "grid",
        gap: 8,
        background: "#fff",
        height: "100%",
        position: "sticky",
        top: 0
      }}>
        {menu.map(m => (
          <NavLink key={m.to} to={m.to} style={style} end={m.end}>
            {m.label}
          </NavLink>
        ))}
      </aside>

      {/* Top tabs untuk mobile */}
      <nav className="nav-mobile" style={{
        width: "100%",
        background: "#fff",
        borderBottom: "1px solid #e5e7eb",
      }}>
        <div style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          padding: "10px 12px",
        }}>
          {menu.map(m => (
            <NavLink
              key={m.to}
              to={m.to}
              end={m.end}
              style={({ isActive }) => ({
                ...baseLink,
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

      {/* CSS responsif: tampilkan salah satu saja */}
      <style>{`
        /* default: sembunyikan keduanya (di-overwrite di media query) agar tidak "lompat" saat SSR/CSR */
        .nav-desktop { display: none; }
        .nav-mobile  { display: none; }

        /* >= 768px: pakai sidebar kiri */
        @media (min-width: 768px) {
          .nav-desktop { display: grid; }
          .nav-mobile  { display: none; }
        }

        /* < 768px: pakai top tabs */
        @media (max-width: 767px) {
          .nav-desktop { display: none; }
          .nav-mobile  { display: block; }
        }
      `}</style>
    </>
  );
}
