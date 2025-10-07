// src/components/views/Dashboard/sections/BusinessIntelligenceCard.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Card, CardContent, Typography, Box, Stack, Alert, Chip, Tooltip, CircularProgress } from "@mui/material";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import InfoIcon from "@mui/icons-material/Info";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { DataService } from "../../../../services/DataService.js";

function formatDatePlus(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
}

export default function BusinessIntelligenceCard() {
  const [state, setState] = useState({ loading: true, error: null, data: null });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await DataService.getAIInsightsV2?.() || await DataService.getAIInsights?.();
        if (!alive) return;
        setState({ loading: false, error: null, data: res });
        DataService.saveAIInsightLog?.("dashboard", res);
      } catch (e) {
        if (!alive) return;
        setState({ loading: false, error: e, data: null });
      }
    })();
    return () => { alive = false; };
  }, []);

  const { loading, error, data } = state;

  // === Forecast summary (ringkas) ===
  const forecastSummary = useMemo(() => {
    if (!data?.forecast) return null;
    const sales = Array.isArray(data.forecast.sales_next_7) ? data.forecast.sales_next_7 : [];
    const stock = Array.isArray(data.forecast.stock_next_7) ? data.forecast.stock_next_7 : [];
    const avgSales = sales.length ? Math.round(sales.reduce((a,b)=>a+b,0) / sales.length) : null;

    // Perkirakan tanggal stok 0 berdasarkan array stock_next_7
    let safeDays = null;
    for (let i = 0; i < stock.length; i++) {
      if (stock[i] <= 0) { safeDays = i; break; }
    }
    if (safeDays === null && stock.length) safeDays = stock.length; // aman setidaknya 7 hari

    return {
      avgSales,
      safeUntil: safeDays != null ? formatDatePlus(safeDays) : null,
      safeDays
    };
  }, [data]);

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Business Intelligence (AI)</Typography>
            <Chip label="Memuat..." color="primary" size="small" icon={<CircularProgress size={16} />} />
          </Box>
          <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Business Intelligence (AI)</Typography>
          <Alert severity="error">{error?.message || "Gagal memuat AI insights"}</Alert>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Business Intelligence (AI)</Typography>
          <Alert severity="info">Data AI tidak tersedia.</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography variant="h6" gutterBottom>Business Intelligence (AI)</Typography>
            <Typography variant="caption" color="text.secondary">Ringkasan & saran otomatis dari data kamu</Typography>
          </Box>
          <Tooltip title={new Date(data.generated_at || Date.now()).toLocaleString("id-ID")}>
            <Chip label="AI Analysis" color="primary" variant="outlined" size="small" icon={<AnalyticsIcon fontSize="small" />} />
          </Tooltip>
        </Box>

        <Stack spacing={2}>
          {/* 1) Insight utama (kalimat) */}
          <Alert iconMapping={{ info: <InfoIcon fontSize="small" /> }} severity="info" sx={{ '& .MuiAlert-message': { fontSize: '0.9rem', lineHeight: 1.5 } }}>
            {data.insight}
          </Alert>

          {/* 2) AI Advice (jika ada) */}
          {data.advice && (
            <Alert
              iconMapping={{ warning: <WarningAmberIcon fontSize="small" />, success: <CheckCircleIcon fontSize="small" /> }}
              severity={data.advice.level || "info"}
            >
              <Typography variant="body2" fontWeight={700}>{data.advice.title}</Typography>
              <Typography variant="body2">{data.advice.message}</Typography>
            </Alert>
          )}

          {/* 3) Forecast 7 Hari (ringkas) */}
          {forecastSummary && (
            <Box>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Forecast 7 Hari</Typography>
              <Typography variant="body2">
                Penjualan harian: {forecastSummary.avgSales ?? "-"} tabung ·
                {" "}
                {forecastSummary.safeDays != null
                  ? `Stok aman hingga ${forecastSummary.safeUntil}`
                  : "Status stok: -"
                }
              </Typography>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
