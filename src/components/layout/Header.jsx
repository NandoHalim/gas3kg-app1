import Button from '../ui/Button.jsx';

export default function Header({ onLogout, onResetAll, isAdmin }) {
  return (
    <header
      className="sticky top-0 z-10"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: '#fff',
        borderBottom: '1px solid #e5e7eb',
      }}
    >
      {/* Logo + Judul */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <img
          src="/lpg.jpg"
          alt="Logo LPG"
          style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 6 }}
        />
        <span style={{ fontWeight: 800, fontSize: 18 }}>
          Pangkalan LPG Putria
        </span>
      </div>

      {/* Tombol di kanan */}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
        {isAdmin && <Button onClick={onResetAll}>Reset</Button>}
        <Button onClick={onLogout}>Logout</Button>
      </div>
    </header>
  );
}
