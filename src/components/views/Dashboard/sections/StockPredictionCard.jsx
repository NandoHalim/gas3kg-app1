import React from "react";
import {
  Card,
  CardHeader,
  CardContent,
  Skeleton,
  Typography,
  Stack,
  Box,
  Chip,
} from "@mui/material";
import InventoryIcon from "@mui/icons-material/Inventory";

function safeNum(n) {
  const v = Number(n);
  return Number.isFinite(v) ? v : null;
}

function statusByDays(days) {
  if (!Number.isFinite(days)) return { color: "default", label: "—" };
  if (days < 2) return { color: "error", label: "Segera" };
  if (days <= 4) return { color: "warning", label: "Monitor" };
  return { color: "success", label: "Aman" };
}

/**
 * Props:
 *  - data: hasil DataService.getStockPrediction(…)
 *      {
 *        prediction: { days_remaining_isi: number }
 *      }
 *  - loading: boolean
 */
export default function StockPredictionCard({ data, loading }) {
  const days = safeNum(data?.prediction?.days_remaining_isi);
  const status = statusByDays(days);

  return (
    <Card variant="outlined" sx={{ borderRadius: 2, minHeight: 120 }}>
      <CardHeader
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <InventoryIcon fontSize="small" color="warning" />
            <Typography variant="h6" fontWeight={800}>
              Prediksi Stok
            </Typography>
            <Box sx={{ flex: 1 }} />
            <Chip size="small" color={status.color} label={status.label} />
          </Stack>
        }
        sx={{ pb: 0 }}
      />
      <CardContent sx={{ pt: 2 }}>
        {loading ? (
          <Skeleton variant="rounded" height={96} />
        ) : (
          <Stack direction="row" spacing={1} alignItems="baseline">
            <Typography
              variant="h3"
              fontWeight={900}
              sx={{ typography: { xs: "h4", sm: "h3" }, fontVariantNumeric: "tabular-nums" }}
            >
              {days == null ? "–" : days.toFixed(1)}
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ typography: { xs: "subtitle1", sm: "h6" } }}>
              hari
            </Typography>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
