import React, { useEffect, useState } from "react";
import Card from "../ui/Card.jsx";
import Input from "../ui/Input.jsx";
import Button from "../ui/Button.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { useNavigate } from "react-router-dom";

export default function LoginView() {
  const { user, signInWithPassword } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);

  // kalau user sudah login → redirect dashboard
  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  // load saved credential dari localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("rememberMe") || "{}");
    if (saved?.email) setEmail(saved.email);
    if (saved?.password) setPassword(saved.password);
    if (saved?.remember) setRemember(true);
  }, []);

  const onSubmit = async (e) => {
    e?.preventDefault?.();
    setLoading(true);
    try {
      await signInWithPassword(email, password);

      if (remember) {
        localStorage.setItem(
          "rememberMe",
          JSON.stringify({ email, password, remember: true })
        );
      } else {
        localStorage.removeItem("rememberMe");
      }

      toast?.show?.({ type: "success", message: "Login berhasil" });
      navigate("/", { replace: true });
    } catch (err) {
      toast?.show?.({
        type: "error",
        message: err?.message || "Login gagal",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6" style={{ maxWidth: 420, margin: "40px auto" }}>
      <h1 style={{ marginBottom: 12 }}>Halaman Login</h1>
      <Card>
        <form onSubmit={onSubmit} className="grid" style={{ gap: 12 }}>
          <label>Email</label>
          <Input
            type="email"
            placeholder="you@mail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />

          <label>Password</label>
          <div style={{ display: "flex", gap: 8 }}>
            <Input
              type={showPass ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              style={{ flex: 1 }}
            />
            <Button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              style={{ minWidth: 60 }}
            >
              {showPass ? "Hide" : "Show"}
            </Button>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              disabled={loading}
            />
            Ingat saya
          </label>

          <div style={{ display: "flex", gap: 12 }}>
            <Button type="submit" disabled={loading}>
              Login
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
