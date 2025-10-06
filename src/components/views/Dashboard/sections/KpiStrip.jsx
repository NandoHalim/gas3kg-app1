import React from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import InventoryIcon from "@mui/icons-material/Inventory";
import AssessmentIcon from "@mui/icons-material/Assessment";
import ShowChartIcon from "@mui/icons-material/ShowChart";

function fmtIDR(n = 0) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Number(n) || 0);
}

function pct(n) {
  if (n == null || !isFinite(n)) return "–";
  return `${Math.round(n)}%`;
}

function daysStatusColor(days) {
  if (!isFinite(days)) return { color: "default", label: "—" };
  if (days < 2) return { color: "error", label: "Segera" };
  if (days <= 4) return { color: "warning", label: "Monitor" };
  return { color: "success", label: "Aman" };
}

function KpiCard({
  icon,
  title,
  value,
  subtitle,
  progressPct,
  progressColor = "primary",
  hint,
  chip,
}) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 2, minHeight: 112 }}>
      <CardContent sx={{ p: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center" mb={1}>
          {icon}
          <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
            {title}
          </Typography>
          <Box sx={{ flex: 1 }} />
          {chip}
        </Stack>

        <Typography
          variant="h5"
          fontWeight={800}
          sx={{ fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}
        >
          {value}
        </Typography>

        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}

        {typeof progressPct === "number" && (
          <Box sx={{ mt: 1 }}>
            <LinearProgress
              variant="determinate"
              value={Math.min(Math.max(progressPct, 0), 100)}
              color={progressColor}
              sx={{ height: 8, borderRadius: 4 }}
            />
            {hint && (
              <Typography variant="caption" color="text.secondary">
                {hint}
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Props:
 * - financialData: { omzet, laba, margin, transactionCount, totalQty }
 * - stockPrediction: { prediction: { days_remaining_isi }, current_stock, sales_analysis }
 * - businessIntel: optional
 * - loading: boolean
 * - monthlyTarget: optional (angka target omzet bulan ini). Jika null/0 → tampil "Atur target".
 */
export default function KpiStrip({
  financialData,
  stockPrediction,
  businessIntel,
  loading,
  monthlyTarget = 0,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  if (loading) {
    return (
      <Grid container spacing={2}>
        {Array.from({ length: isMobile ? 2 : 4 }).map((_, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card variant="outlined" sx={{ borderRadius: 2, minHeight: 112 }}>
              <CardContent>
                <Box sx={{ height: 16, bgcolor: "action.hover", mb: 1, borderRadius: 1 }} />
                <Box sx={{ height: 28, bgcolor: "action.hover", width: "60%", borderRadius: 1 }} />
                <Box sx={{ height: 8, mt: 2, bgcolor: "action.hover", borderRadius: 4 }} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  const omzet = Number(financialData?.omzet || 0);
  const laba = Number(financialData?.laba || 0);
  const margin = Number(financialData?.margin || 0);
  const trx = Number(financialData?.transactionCount || 0);
  const atv = trx > 0 ? Math.round(omzet / trx) : 0;

  const days = Number(stockPrediction?.prediction?.days_remaining_isi ?? NaN);
  const ds = daysStatusColor(days);

  const hasTarget = Number(monthlyTarget) > 0;
  const progress = hasTarget ? Math.round((omzet / Number(monthlyTarget)) * 100) : null;
  const progressColor =
    progress == null ? "primary" : progress >= 80 ? "success" : progress >= 60 ? "warning" : "error";

  // 2 KPI utama (mobile): Target vs Realisasi, Laba
  if (isMobile) {
    return (
      <Stack spacing={2}>
        <KpiCard
          icon={<AssessmentIcon fontSize="small" color="primary" />}
          title="Target vs Realisasi (MTD)"
          value={hasTarget ? `${fmtIDR(omzet)} / ${fmtIDR(monthlyTarget)}` : fmtIDR(omzet)}
          subtitle={hasTarget ? `Progress ${pct(progress)}` : "Atur target untuk progress"}
          progressPct={hasTarget ? progress : undefined}
          progressColor={progressColor}
          hint={hasTarget ? undefined : "Buka Pengaturan untuk set target bulanan"}
          chip={
            hasTarget ? (
              <Chip size="small" label={pct(progress)} color={progressColor} variant="outlined" />
            ) : (
              <Chip size="small" label="Atur target" color="default" variant="outlined" />
            )
          }
        />

        <KpiCard
          icon={<TrendingUpIcon fontSize="small" color="success" />}
          title="Laba (MTD)"
          value={fmtIDR(laba)}
          subtitle={`Margin ${pct(margin)}`}
        />

        {/* KPI lainnya dalam accordion */}
        <Accordion elevation={0} disableGutters>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2" fontWeight={700}>
              KPI Lainnya
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <KpiCard
                icon={<ShowChartIcon fontSize="small" color="info" />}
                title="ATV (Rata2/Transaksi)"
                value={fmtIDR(atv)}
                subtitle={`${trx} transaksi`}
              />
              <KpiCard
                icon={<InventoryIcon fontSize="small" color="warning" />}
                title="Days of Stock (ISI)"
                value={isFinite(days) ? `${days.toFixed(1)} hari` : "–"}
                chip={<Chip size="small" label={ds.label} color={ds.color} />}
              />
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Stack>
    );
  }

  // Tablet/desktop: 4 KPI terlihat
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6} md={3}>
        <KpiCard
          icon={<AssessmentIcon fontSize="small" color="primary" />}
          title="Target vs Realisasi (MTD)"
          value={hasTarget ? `${fmtIDR(omzet)} / ${fmtIDR(monthlyTarget)}` : fmtIDR(omzet)}
          subtitle={hasTarget ? `Progress ${pct(progress)}` : "Atur target untuk progress"}
          progressPct={hasTarget ? progress : undefined}
          progressColor={progressColor}
          hint={hasTarget ? undefined : "Buka Pengaturan untuk set target bulanan"}
          chip={
            hasTarget ? (
              <Chip size="small" label={pct(progress)} color={progressColor} variant="outlined" />
            ) : (
              <Chip size="small" label="Atur target" color="default" variant="outlined" />
            )
          }
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <KpiCard
          icon={<TrendingUpIcon fontSize="small" color="success" />}
          title="Laba (MTD)"
          value={fmtIDR(laba)}
          subtitle={`Margin ${pct(margin)}`}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <KpiCard
          icon={<ShowChartIcon fontSize="small" color="info" />}
          title="ATV (Rata2/Transaksi)"
          value={fmtIDR(atv)}
          subtitle={`${trx} transaksi`}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <KpiCard
          icon={<InventoryIcon fontSize="small" color="warning" />}
          title="Days of Stock (ISI)"
          value={isFinite(days) ? `${days.toFixed(1)} hari` : "–"}
          chip={<Chip size="small" label={ds.label} color={ds.color} />}
        />
      </Grid>
    </Grid>
  );
}
