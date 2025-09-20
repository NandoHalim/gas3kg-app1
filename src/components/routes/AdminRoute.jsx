// src/components/routes/AdminRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

/**
 * Hanya izinkan admin masuk.
 * - Kalau belum login → redirect ke /login
 * - Kalau login tapi bukan admin → redirect ke /login juga
 */
export default function AdminRoute({ children }) {
  const { user, role, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <div className="p-4">Loading…</div>;

  if (!user || role !== "admin") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
