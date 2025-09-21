// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { ToastProvider } from "./context/ToastContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { SettingsProvider } from "./context/SettingsContext.jsx"; // ✅ tambahkan

// Logger global (membantu debugging di prod)
if (typeof window !== "undefined") {
  window.addEventListener("error", (e) => {
    console.error("[window.onerror]", e?.error || e?.message || e);
  });
  window.addEventListener("unhandledrejection", (e) => {
    console.error("[unhandledrejection]", e?.reason || e);
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <ToastProvider>
        <SettingsProvider> {/* ✅ bungkus App */}
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </SettingsProvider>
      </ToastProvider>
    </AuthProvider>
  </React.StrictMode>
);
