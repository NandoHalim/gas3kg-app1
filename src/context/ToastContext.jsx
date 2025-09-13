import React, { createContext, useContext, useState, useCallback } from "react";

const Ctx = createContext(null);
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const show = useCallback(({ type = "info", message, title }) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, type, title, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);

  const colors = {
    success: { bg: "#dcfce7", border: "#22c55e", icon: "✅" },
    error: { bg: "#fee2e2", border: "#ef4444", icon: "❌" },
    info: { bg: "#e0f2fe", border: "#0284c7", icon: "ℹ️" },
    warning: { bg: "#fef9c3", border: "#facc15", icon: "⚠️" },
  };

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <div
        style={{
          position: "fixed",
          right: 16,
          bottom: 16,
          display: "grid",
          gap: 8,
          zIndex: 9999,
        }}
      >
        {toasts.map((t) => {
          const style = colors[t.type] || colors.info;
          return (
            <div
              key={t.id}
              style={{
                border: `1px solid ${style.border}`,
                background: style.bg,
                padding: "12px 16px",
                borderRadius: 8,
                minWidth: 260,
                boxShadow: "0 4px 12px rgba(0,0,0,.1)",
                animation: "slideIn .3s ease-out, fadeOut .3s ease-in 2.7s forwards",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>{style.icon}</span>
                <div>
                  {t.title && (
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>{t.title}</div>
                  )}
                  <div>{t.message}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeOut {
          to { opacity: 0; transform: translateY(20px); }
        }
      `}</style>
    </Ctx.Provider>
  );
}
