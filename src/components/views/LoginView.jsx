import React, { useState } from "react";
import { supabase } from "../../lib/supabase.js";

export default function LoginView({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      // biarkan App.jsx yang munculkan notifikasi role-based
      onLogin?.(data.user);
    }

    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 360, margin: "40px auto", padding: 24 }}>
      <h1 style={{ marginBottom: 16 }}>Login</h1>

      {error && (
        <div
          style={{
            background: "#fee2e2",
            color: "#b91c1c",
            padding: "8px 12px",
            borderRadius: 6,
            marginBottom: 12,
          }}
        >
          ⚠️ {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
          style={{
            padding: "10px 12px",
            border: "1px solid #cbd5e1",
            borderRadius: 6,
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          required
          style={{
            padding: "10px 12px",
            border: "1px solid #cbd5e1",
            borderRadius: 6,
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            background: "#2563eb",
            color: "#fff",
            border: "none",
            padding: "10px 12px",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          {loading ? "Memproses..." : "Login"}
        </button>
      </form>
    </div>
  );
}
