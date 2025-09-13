import React, { createContext, useContext, useState, useCallback } from "react";

const Ctx = createContext(null);
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const show = useCallback(({ type = "info", message, title, duration = 3200 }) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message, title, duration }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const remove = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const STYLES = {
    success: { bg: "#ecfdf5", border: "#10b981", text: "#065f46", icon: "✅", label: "Sukses" },
    error:   { bg: "#fef2f2", border: "#ef4444", text: "#991b1b", icon: "❌", label: "Error" },
    info:    { bg: "#eff6ff", border: "#3b82f6", text: "#1e3a8a", icon: "ℹ️", label: "Info" },
    warning: { bg: "#fffbeb", border: "#f59e0b", text: "#92400e", icon: "⚠️", label: "Peringatan" },
  };

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <div style={{
        position: "fixed", right: 16, bottom: 16,
        display: "grid", gap: 12, zIndex: 9999
      }}>
        {toasts.map((t) => {
          const s = STYLES[t.type] || STYLES.info;
          return (
            <div key={t.id}
              style={{
                display: "flex", gap: 12, alignItems: "flex-start",
                background: s.bg, border: `1px solid ${s.border}`, color: s.text,
                padding: "12px 14px", borderRadius: 10,
                boxShadow: "0 6px 18px rgba(0,0,0,.12)", minWidth: 260,
                animation: "toast-in .18s ease-out"
              }}>
              <div style={{ fontSize: 20, lineHeight: "20px" }}>{s.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>
                  {t.title || s.label}
                </div>
                <div style={{ fontSize: 14 }}>{t.message}</div>
              </div>
              <button
                onClick={() => remove(t.id)}
                aria-label="Close"
                style={{
                  background: "transparent", border: 0, color: s.text,
                  fontSize: 18, lineHeight: "18px", cursor: "pointer"
                }}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      {/* Keyframes kecil untuk animasi masuk */}
      <style>{`
        @keyframes toast-in {
          from { transform: translateY(8px); opacity: .0; }
          to   { transform: translateY(0);  opacity: 1;  }
        }
      `}</style>
    </Ctx.Provider>
  );
}
