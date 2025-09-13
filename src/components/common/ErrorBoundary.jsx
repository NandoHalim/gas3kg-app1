// src/components/common/ErrorBoundary.jsx
import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, fontFamily: "sans-serif" }}>
          <h2 style={{ color: "#b91c1c" }}>
            Terjadi kesalahan saat memuat halaman
          </h2>
          <pre
            style={{
              color: "#b91c1c",
              background: "#fee2e2",
              padding: 12,
              borderRadius: 8,
              whiteSpace: "pre-wrap",
              maxHeight: 300,
              overflowY: "auto",
            }}
          >
            {String(this.state.error?.message || this.state.error)}
            {"\n\n"}
            {String(this.state.error?.stack || "")}
          </pre>
          <button
            onClick={() => location.reload()}
            style={{
              marginTop: 16,
              padding: "8px 16px",
              background: "#dc2626",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            🔄 Muat Ulang
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
