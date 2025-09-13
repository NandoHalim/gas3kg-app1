import React, { useState, useEffect } from "react";
import Input from "../ui/Input.jsx";
import Button from "../ui/Button.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";

export default function LoginView() {
  const { signInAnon } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  // load email tersimpan
  useEffect(() => {
    const saved = localStorage.getItem("rememberEmail");
    if (saved) {
      setEmail(saved);
      setRemember(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 🔑 ganti sesuai kebutuhan (sementara demo pakai signInAnon)
      await signInAnon();

      if (remember) {
        localStorage.setItem("rememberEmail", email);
      } else {
        localStorage.removeItem("rememberEmail");
      }

      toast.show({ type: "success", message: "Login berhasil 🎉" });
    } catch (err) {
      toast.show({ type: "error", message: err.message || "Login gagal" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f1f5f9",
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          background: "#fff",
          padding: 24,
          borderRadius: 12,
          boxShadow: "0 6px 12px rgba(0,0,0,0.1)",
          width: "100%",
          maxWidth: 360,
          display: "grid",
          gap: 16,
        }}
      >
        <h2 style={{ margin: 0, textAlign: "center" }}>🔐 Login</h2>

        <div>
          <label>Email</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@mail.com"
            required
          />
        </div>

        <div>
          <label>Password</label>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              required
              style={{ flex: 1 }}
            />
            <Button
              type="button"
              onClick={() => setShowPass((s) => !s)}
              style={{ minWidth: 70 }}
            >
              {showPass ? "🙈 Hide" : "👁 Show"}
            </Button>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            id="remember"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          <label htmlFor="remember">Ingat saya</label>
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "Loading..." : "Login"}
        </Button>
      </form>
    </div>
  );
}
