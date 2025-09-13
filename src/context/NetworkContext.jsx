import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const NetCtx = createContext({ isOnline: true, isBusy: false });
export const useNetwork = () => useContext(NetCtx);

export function NetworkProvider({ children }) {
  const [isOnline, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [busyCount, setBusyCount] = useState(0);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  useEffect(() => {
    const inc = () => setBusyCount((n) => n + 1);
    const dec = () => setBusyCount((n) => Math.max(0, n - 1));
    window.addEventListener('net:busy:start', inc);
    window.addEventListener('net:busy:stop', dec);
    return () => {
      window.removeEventListener('net:busy:start', inc);
      window.removeEventListener('net:busy:stop', dec);
    };
  }, []);

  const value = useMemo(() => ({
    isOnline,
    isBusy: busyCount > 0,
  }), [isOnline, busyCount]);

  return (
    <NetCtx.Provider value={value}>
      {children}
      <LoadingOverlay />
    </NetCtx.Provider>
  );
}

function LoadingOverlay() {
  const { isOnline, isBusy } = useNetwork();

  return (
    <>
      {!isOnline && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
          background: '#fee2e2', color: '#991b1b',
          borderBottom: '1px solid #ef4444',
          padding: '8px 12px', textAlign: 'center', fontWeight: 600
        }}>
          ⚠️ Offline — periksa koneksi internet Anda
        </div>
      )}

      <DelayedMount when={isBusy && isOnline} delay={400}>
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.18)',
          backdropFilter: 'blur(1px)'
        }}>
          <div style={{
            display: 'grid', placeItems: 'center', gap: 10,
            background: '#ffffff', padding: '16px 18px', borderRadius: 12,
            border: '1px solid #e5e7eb',
            boxShadow: '0 12px 32px rgba(0,0,0,.18)'
          }}>
            <Spinner />
            <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Menghubungkan…</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Mungkin jaringan sedang lambat</div>
          </div>
        </div>
      </DelayedMount>

      <style>{`
        @keyframes spin { from{ transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </>
  );
}

function Spinner() {
  return (
    <div aria-label="Loading" role="status" style={{
      width: 28, height: 28, borderRadius: 999,
      border: '3px solid #e5e7eb', borderTopColor: '#3b82f6',
      animation: 'spin 0.9s linear infinite'
    }} />
  );
}

function DelayedMount({ when, delay = 300, children }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!when) { setShow(false); return; }
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [when, delay]);
  return show ? children : null;
}
