import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { useNavigate } from "react-router-dom";

export default function LoginView() {
  const { signInEmailPassword } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("rememberEmail");
      if (saved) {
        setEmail(saved);
        setRemember(true);
      }
    } catch {}
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      await signInEmailPassword(email, password);

      if (remember) {
        localStorage.setItem("rememberEmail", email);
      } else {
        localStorage.removeItem("rememberEmail");
      }

      toast.show({ type: "success", message: "Login berhasil 🎉" });
      navigate("/", { replace: true });
    } catch (err) {
      toast.show({ type: "error", message: err?.message || "Login gagal" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 16,
        backgroundImage: "url('/login-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: 380,
          background: "rgba(255,255,255,0.9)",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 24,
          display: "grid",
          gap: 14,
          boxShadow: "0 8px 20px rgba(0,0,0,.15)",
          backdropFilter: "blur(6px)",
        }}
      >
        <h2 style={{ margin: 0, textAlign: "center" }}>🔐 Login</h2>

        <div style={{ display: "grid", gap: 6 }}>
          <label htmlFor="email" style={{ fontWeight: 600 }}>Email</label>
          <input
            id="email"
            type="email"
            placeholder="admin@mail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label htmlFor="password" style={{ fontWeight: 600 }}>Password</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              id="password"
              type={showPass ? "text" : "password"}
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                outline: "none",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPass((s) => !s)}
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                background: "#f8fafc",
                cursor: "pointer",
                minWidth: 72,
              }}
            >
              {showPass ? "🙈 Hide" : "👁 Show"}
            </button>
          </div>
        </div>

        <label
          htmlFor="remember"
          style={{ display: "flex", alignItems: "center", gap: 8, userSelect: "none" }}
        >
          <input
            id="remember"
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          Ingat saya
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: 6,
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #2563eb",
            background: loading ? "#93c5fd" : "#3b82f6",
            color: "#fff",
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Loading..." : "Login"}
        </button>
      </form>
    </div>
  );
}
