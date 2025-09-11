import Button from "../ui/Button.jsx";

export default function Header({ onLogout, onResetAll, isAdmin }) {
  const roleLabel = isAdmin ? "(Admin)" : "(User)";

  return (
    <header
      className="sticky"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        background: "#fff",
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      <div style={{ fontWeight: 800 }}>
        🧯 Gas 3KG Manager{" "}
        <span style={{ color: isAdmin ? "red" : "#64748b" }}>{roleLabel}</span>
      </div>

      <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
        {isAdmin && <Button onClick={onResetAll}>Reset</Button>}
        <Button onClick={onLogout}>Logout</Button>
      </div>
    </header>
  );
}
