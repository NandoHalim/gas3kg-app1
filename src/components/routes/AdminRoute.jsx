// src/components/routes/AdminRoute.jsx
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { DataService } from "../../services/DataService";

export default function AdminRoute({ children }) {
  const [ok, setOk] = useState(null);

  useEffect(() => {
    let on = true;
    (async () => {
      const isAdmin = await DataService.isAdmin().catch(() => false);
      if (on) setOk(isAdmin);
    })();
    return () => { on = false; };
  }, []);

  if (ok === null) return null; // atau spinner sederhana
  return ok ? children : <Navigate to="/" replace />;
}
