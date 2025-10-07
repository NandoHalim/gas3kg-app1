// src/components/views/Dashboard/sections/BusinessIntelligenceCard.jsx (AI v2)
import React, { useEffect, useState } from "react";
import {
  Card, CardContent, Typography, Box, Stack, Alert, Chip, Tooltip, Divider, CircularProgress, List, ListItem, ListItemText
} from "@mui/material";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import InfoIcon from "@mui/icons-material/Info";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { DataService } from "../../../../services/DataService.js";
import { fmtIDR } from "../../../../utils/helpers.js";

function ChipLike({ label, tone = "neutral" }) {
  const bg = tone === "warn" ? "#fff4e5" : tone === "ok" ? "#eef9f1" : "#f1f5f9";
  const bd = tone === "warn" ? "#ffd8a8" : tone === "ok" ? "#b7f0c0" : "#e2e8f0";
  return <Box sx={{ px:1, py:0.5, fontSize:12, borderRadius:1, border:`1px solid ${bd}`, background:bg, whiteSpace:"nowrap" }}>{label}</Box>;
}

export default function BusinessIntelligenceCard() {
  const [state, setState] = useState({ loading: true, error: null, data: null });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await DataService.getAIInsightsV2();
        if (!alive) return;
        setState({ loading: false, error: null, data: res });
        // Simpan log di background (jika fungsi ada)
        DataService.saveAIInsightLog?.("dashboard", res);
      } catch (e) {
        if (!alive) return;
        setState({ loading: false, error: e, data: null });
      }
    })();
    return () => { alive = false; };
  }, []);

  const { loading, error, data } = state;

  if (loading) {
    return (<Card><CardContent><Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
      <Typography variant="h6">Business Intelligence (AI)</Typography>
      <Chip label="Memuat..." color="primary" size="small" icon={<CircularProgress size={16} />} />
    </Box><Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box></CardContent></Card>);
  }
  if (error) {
    return (<Card><CardContent><Typography variant="h6" gutterBottom>Business Intelligence (AI)</Typography>
      <Alert severity="error">{error?.message || "Gagal memuat AI insights"}</Alert>
    </CardContent></Card>);
  }
  if (!data) {
    return (<Card><CardContent><Typography variant="h6" gutterBottom>Business Intelligence (AI)</Typography>
      <Alert severity="info">Data AI tidak tersedia.</Alert></CardContent></Card>);
  }

  const kpi = data.kpi || {};
  const daysLeft = Number.isFinite(kpi.days_left) ? kpi.days_left : null;
  const tone = daysLeft != null ? (daysLeft <= 3 ? "warn" : "ok") : "neutral";

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography variant="h6" gutterBottom>Business Intelligence (AI)</Typography>
            <Typography variant="caption" color="text.secondary">Analisis & rekomendasi otomatis berbasis data</Typography>
          </Box>
          <Tooltip title={new Date(data.generated_at || Date.now()).toLocaleString("id-ID")}>
            <Chip label="AI Analysis" color="primary" variant="outlined" size="small" icon={<AnalyticsIcon fontSize="small" />} />
          </Tooltip>
        </Box>

        <Stack spacing={2}>
          <Alert iconMapping={{ info: <InfoIcon fontSize="small" /> }} severity="info" sx={{ '& .MuiAlert-message': { fontSize: '0.9rem', lineHeight: 1.5 } }}>
            {data.insight}
          </Alert>

          {/* KPI Chips */}
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {"omzet" in kpi && <ChipLike label={`Omzet: ${fmtIDR(kpi.omzet || 0)}`} />}
            {"laba" in kpi && kpi.laba != null && <ChipLike label={`Laba: ${fmtIDR(kpi.laba || 0)}`} />}
            {"margin" in kpi && Number.isFinite(kpi.margin) && <ChipLike label={`Margin: ${Number(kpi.margin).toFixed(1)}%`} />}
            {"days_left" in kpi && daysLeft != null && <ChipLike label={`Stok ISI: ${daysLeft} hari`} tone={tone} />}
          </Stack>

          {/* Advice */}
          {data.advice && (
            <Alert
              iconMapping={{ warning: <WarningAmberIcon fontSize="small" />, success: <CheckCircleIcon fontSize="small" /> }}
              severity={data.advice.level || "info"}
            >
              <Typography variant="body2" fontWeight={700}>{data.advice.title}</Typography>
              <Typography variant="body2">{data.advice.message}</Typography>
            </Alert>
          )}

          <Divider />

          {/* Growth vs last month */}
          {data.growth && (
            <Box>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Perbandingan vs Bulan Lalu</Typography>
              <List dense disablePadding>
                <ListItem sx={{ py: 0.25 }}><ListItemText primaryTypographyProps={{variant:"body2"}} primary={`Omzet: ${data.growth.omzet>=0?'+':''}${data.growth.omzet.toFixed(1)}%`} /></ListItem>
                <ListItem sx={{ py: 0.25 }}><ListItemText primaryTypographyProps={{variant:"body2"}} primary={`Laba: ${data.growth.laba>=0?'+':''}${data.growth.laba.toFixed(1)}%`} /></ListItem>
                <ListItem sx={{ py: 0.25 }}><ListItemText primaryTypographyProps={{variant:"body2"}} primary={`Margin: ${data.growth.margin_pt>=0?'+':''}${data.growth.margin_pt.toFixed(1)} pt`} /></ListItem>
              </List>
            </Box>
          )}

          {/* Forecast */}
          {data.forecast && (
            <Box>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Forecast 7 Hari</Typography>
              <List dense disablePadding>
                {data.forecast.sales_next_7.map((v,i)=>(
                  <ListItem key={i} sx={{ py: 0.25 }}>
                    <ListItemText
                      primaryTypographyProps={{ variant:"body2" }}
                      secondaryTypographyProps={{ variant:"caption", color:"text.secondary" }}
                      primary={`+${i+1} hari`}
                      secondary={`Prediksi penjualan: ${v} | Stok: ${data.forecast.stock_next_7?.[i] ?? '-'}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
