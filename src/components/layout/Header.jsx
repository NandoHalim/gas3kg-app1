import React from 'react';
import Button from '../ui/Button.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function Header({ onLogout, onResetAll, isAdmin }) {
  const toast = useToast();

  const handleLogout = async () => {
    try {
      await onLogout?.();
      toast?.show?.({ type: 'success', message: 'Logout berhasil' });
    } catch (e) {
      toast?.show?.({ type: 'error', message: e?.message || 'Logout gagal' });
    }
  };

  return (
    <header className='sticky' style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px', background: '#fff', borderBottom: '1px solid #e5e7eb'
    }}>
      <div style={{ fontWeight: 800 }}>🧯 Gas 3KG Manager</div>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
        {isAdmin && <Button onClick={onResetAll}>Reset</Button>}
        <Button onClick={handleLogout}>Logout</Button>
      </div>
    </header>
  );
}
