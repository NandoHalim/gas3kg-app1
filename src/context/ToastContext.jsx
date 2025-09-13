import React, { createContext, useContext, useState, useCallback } from 'react';

const Ctx = createContext(null);
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }) {
  const [toasts, set] = useState([]);

  const show = useCallback(({ type = 'info', message }) => {
    const id = Math.random().toString(36).slice(2);
    set((t) => [...t, { id, type, message }]);
    setTimeout(() => set((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <div style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        display: 'grid',
        gap: 10,
        zIndex: 99999,
      }}>
        {toasts.map((t) => (
          <ToastItem key={t.id} type={t.type} message={t.message} />
        ))}
      </div>
    </Ctx.Provider>
  );
}

function ToastItem({ type, message }) {
  const colors = {
    success: { bg: '#dcfce7', border: '#22c55e', text: '#166534', icon: '✅' },
    error: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b', icon: '❌' },
    info: { bg: '#e0f2fe', border: '#3b82f6', text: '#1e3a8a', icon: 'ℹ️' },
    warning: { bg: '#fef9c3', border: '#eab308', text: '#78350f', icon: '⚠️' },
    loading: { bg: '#f1f5f9', border: '#64748b', text: '#334155', icon: '🔄' },
  };

  const c = colors[type] || colors.info;

  return (
    <div
      style={{
        minWidth: 220,
        maxWidth: 320,
        padding: '10px 14px',
        borderRadius: 10,
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.text,
        fontSize: 14,
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        boxShadow: '0 6px 14px rgba(0,0,0,.1)',
        animation: 'slideIn .3s ease',
      }}
    >
      <span style={{
        fontSize: 18,
        animation: type === 'loading' ? 'spin 1s linear infinite' : 'none',
        display: 'inline-block',
      }}>{c.icon}</span>
      <span style={{ flex: 1 }}>{message}</span>

      <style>{`
        @keyframes spin { 
          from { transform: rotate(0deg) } 
          to { transform: rotate(360deg) } 
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
