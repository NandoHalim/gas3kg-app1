// src/components/views/Dashboard/sections/BusinessIntelligenceCard.jsx
import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Alert,
  Chip,
  Tooltip,
  Divider,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import InfoIcon from "@mui/icons-material/Info";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import { DataService } from "../../../../services/DataService.js";
import { fmtIDR } from "../../../../utils/helpers.js";

function ChipLike({ label, tone = "neutral" }) {
  const bg =
    tone === "warn" ? "#fff4e5" :
    tone === "ok"   ? "#eef9f1" :
                      "#f1f5f9";
  const bd =
    tone === "warn" ? "#ffd8a8" :
    tone === "ok"   ? "#b7f0c0" :
                      "#e2e8f0";
  return (
    <Box sx={{
      px: 1, py: 0.5,
      fontSize: 12,
      borderRadius: 1,
      border: `1px solid ${bd}`,
      background: bg,
      whiteSpace: "nowrap",
    }}>
      {label}
    </Box>
  );
}

export default function BusinessIntelligenceCard() {
  const [state, setState] = useState({ loading: true, error: null, data: null });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await DataService.getAIInsights();
        if (!alive) return;
        setState({ loading: false, error: null, data: res });
      } catch (e) {
        if (!alive) return;
        setState({ loading: false, error: e, data: null });
      }
    })();
    return () => { alive = false; };
  }, []);

  const { loading, error, data } = state;

  if (loading) {
    return (
      <Card sx={{ minWidth: 275, height: "100%" }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" component="h2">
              Business Intelligence (AI)
            </Typography>
            <Chip 
              label="Memuat..." 
              color="primary" 
              size="small" 
              icon={<CircularProgress size={16} />}
            />
          </Box>
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ minWidth: 275, height: "100%" }}>
        <CardContent>
          <Typography variant="h6" component="h2" gutterBottom>
            Business Intelligence (AI)
          </Typography>
          <Alert severity="error">
            {error?.message || "Gagal memuat AI insights"}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card sx={{ minWidth: 275, height: "100%" }}>
        <CardContent>
          <Typography variant="h6" component="h2" gutterBottom>
            Business Intelligence (AI)
          </Typography>
          <Alert severity="info">Data AI tidak tersedia.</Alert>
        </CardContent>
      </Card>
    );
  }

  const kpi = data.kpi || {};
  const daysLeft = Number.isFinite(kpi.days_left) ? kpi.days_left : null;
  const tone = daysLeft != null ? (daysLeft <= 3 ? "warn" : "ok") : "neutral";

  return (
    <Card sx={{ minWidth: 275, height: "100%" }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography variant="h6" component="h2" gutterBottom>
              Business Intelligence (AI)
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Semua metrik & insight dianalisis otomatis oleh AI dari data kamu
            </Typography>
          </Box>
          <Tooltip title={new Date(data.generated_at || Date.now()).toLocaleString("id-ID")}>
            <Chip 
              label="AI Analysis"
              color="primary"
              variant="outlined"
              size="small"
              icon={<AnalyticsIcon fontSize="small" />}
            />
          </Tooltip>
        </Box>

        <Stack spacing={2}>
          {/* Insight utama */}
          <Alert
            iconMapping={{
              info: <InfoIcon fontSize="small" />,
            }}
            severity="info"
            sx={{ '& .MuiAlert-message': { fontSize: '0.9rem', lineHeight: 1.5 } }}
          >
            {data.insight}
          </Alert>

          {/* KPI Chips */}
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {"omzet" in kpi && <ChipLike label={`Omzet: ${fmtIDR(kpi.omzet || 0)}`} />}
            {"laba" in kpi && kpi.laba != null && <ChipLike label={`Laba: ${fmtIDR(kpi.laba || 0)}`} />}
            {"margin" in kpi && Number.isFinite(kpi.margin) && <ChipLike label={`Margin: ${Number(kpi.margin).toFixed(1)}%`} />}
            {"days_left" in kpi && daysLeft != null && <ChipLike label={`Stok ISI: ${daysLeft} hari`} tone={tone} />}
          </Stack>

          <Divider />

          {/* Tren 7 hari (ringkas) */}
          {Array.isArray(data.trend7) && data.trend7.length > 0 && (
            <Box>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Tren 7 Hari Terakhir
              </Typography>
              <List dense disablePadding>
                {data.trend7.slice(-7).map((r, idx) => (
                  <ListItem key={idx} sx={{ py: 0.25 }}>
                    <ListItemText
                      primaryTypographyProps={{ variant: "body2" }}
                      secondaryTypographyProps={{ variant: "caption", color: "text.secondary" }}
                      primary={`${r.date ?? r.day ?? '—'}`}
                      secondary={`Qty: ${r.qty ?? r.net ?? 0}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* Top Customers (opsional) */}
          {Array.isArray(data.topCustomers) && data.topCustomers.length > 0 && (
            <Box>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Top Pelanggan (MTD)
              </Typography>
              <List dense disablePadding>
                {data.topCustomers.slice(0, 5).map((c, i) => {
                  const name = c.customer_name || c.customer || c.name || `Pelanggan ${i+1}`;
                  const val = c.total_value ?? c.revenue ?? 0;
                  return (
                    <ListItem key={i} sx={{ py: 0.25 }}>
                      <ListItemText
                        primaryTypographyProps={{ variant: "body2" }}
                        secondaryTypographyProps={{ variant: "caption", color: "text.secondary" }}
                        primary={`${i + 1}. ${name}`}
                        secondary={`Omzet: ${fmtIDR(val)}`}
                      />
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          )}

          {/* Health Indicator sederhana berbasis stok days_left */}
          {daysLeft != null && (
            <Alert
              iconMapping={{
                warning: <WarningAmberIcon fontSize="small" />,
                success: <CheckCircleIcon fontSize="small" />,
              }}
              severity={daysLeft <= 3 ? "warning" : "success"}
              sx={{ mt: 1 }}
            >
              {daysLeft <= 3
                ? "Stok ISI hampir habis — pertimbangkan restock segera."
                : "Stok ISI aman untuk beberapa hari ke depan."}
            </Alert>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
