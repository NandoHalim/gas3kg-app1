import React from "react";
import {
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
  Avatar,
  Skeleton,
  useTheme,
} from "@mui/material";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import SavingsIcon from "@mui/icons-material/Savings";
import PercentIcon from "@mui/icons-material/Percent";
import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";

/**
 * Props (dari DashboardContainer):
 * - financialData: { omzet, laba, margin, ... }   // hasil DataService.getFinancialSummary / getCurrentMonthFinancialSummary
 * - stockPrediction: {
 *     prediction?: { days_remaining_isi?: number, estimated_depletion_date?: string }
 *   } // hasil DataService.getStockPrediction
 * - businessIntel?: { atv?: number }              // (opsional) hasil DataService.getBusinessIntelligence
 * - loading?: boolean
 */
export default function KpiStrip({
  financialData = {},
  stockPrediction = {},
  businessIntel = {},
  loading = false,
}) {
  const theme = useTheme();

  const fmtIDR = (n = 0) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(Number(n) || 0);

  // Ambil nilai aman
  const omzet = Number(financialData.omzet || 0);
  const laba = Number(financialData.laba || 0);
  const margin = Math.round(Number(financialData.margin || 0));

  const daysLeftRaw = Number(stockPrediction?.prediction?.days_remaining_isi ?? NaN);
  const daysLeft =
    Number.isFinite(daysLeftRaw) && daysLeftRaw >= 0 ? Math.floor(daysLeftRaw) : null;
  const depletionDate = stockPrediction?.prediction?.estimated_depletion_date || null;

  // Warna status sisa hari
  const daysColor =
    daysLeft == null
      ? "default"
      : daysLeft >= 7
      ? "success"
      : daysLeft >= 3
      ? "warning"
      : "error";

  const Tile = ({ icon, label, value, hint, color = "primary" }) => (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        height: "100%",
        display: "flex",
      }}
    >
      <CardContent sx={{ p: 2, display: "flex", alignItems: "center", width: "100%" }}>
        {loading ? (
          <Stack spacing={1} sx={{ width: "100%" }}>
            <Skeleton variant="rounded" width={48} height={48} sx={{ borderRadius: 2 }} />
            <Skeleton variant="text" width="40%" />
            <Skeleton variant="text" width="70%" />
          </Stack>
        ) : (
          <Stack direction="row" alignItems="center" spacing={2} sx={{ width: "100%" }}>
            <Avatar
              variant="rounded"
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor:
                  color === "default"
                    ? theme.palette.action.hover
                    : theme.palette[color]?.light || theme.palette.primary.light,
                color:
                  color === "default"
                    ? theme.palette.text.primary
                    : theme.palette[color]?.main || theme.palette.primary.main,
              }}
            >
              {icon}
            </Avatar>
            <Stack spacing={0.25} sx={{ minWidth: 0 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ textTransform: "uppercase", letterSpacing: 0.4 }}
              >
                {label}
              </Typography>
              <Typography
                variant="h6"
                fontWeight={900}
                sx={{ fontVariantNumeric: "tabular-nums" }}
                noWrap
                title={String(value ?? "")}
              >
                {value ?? "—"}
              </Typography>
              {hint ? (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  noWrap
                  title={hint}
                >
                  {hint}
                </Typography>
              ) : null}
            </Stack>
          </Stack>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Grid container spacing={{ xs: 2, md: 3 }} alignItems="stretch">
      <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
        <Tile
          icon={<AttachMoneyIcon />}
          label="Omzet (MTD)"
          value={fmtIDR(omzet)}
          hint="Total nilai transaksi bulan ini"
          color="info"
        />
      </Grid>

      <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
        <Tile
          icon={<SavingsIcon />}
          label="Laba (MTD)"
          value={fmtIDR(laba)}
          hint="Omzet dikurangi HPP bulan ini"
          color="success"
        />
      </Grid>

      <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
        <Tile
          icon={<PercentIcon />}
          label="Margin (MTD)"
          value={`${margin}%`}
          hint="Persentase laba terhadap omzet"
          color="primary"
        />
      </Grid>

      <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
        <Tile
          icon={<HourglassBottomIcon />}
          label="Sisa Stok ISI"
          value={
            loading
              ? "…"
              : daysLeft == null
              ? "—"
              : daysLeft === 0
              ? "Habis Hari Ini"
              : `≈ ${daysLeft} hari`
          }
          hint={
            depletionDate
              ? `Estimasi habis: ${new Date(depletionDate).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}`
              : "Prediksi berdasarkan tren 30 hari"
          }
          color={daysColor}
        />
      </Grid>
    </Grid>
  );
}
