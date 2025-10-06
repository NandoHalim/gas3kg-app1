import React from "react";
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Stack,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
  Divider,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import ShowChartIcon from "@mui/icons-material/ShowChart";

function fmtIDR(n = 0) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Number(n) || 0);
}

function GrowthChip({ label, value }) {
  if (value == null || !isFinite(value)) {
    return <Chip size="small" label={`${label}: —`} variant="outlined" />;
  }
  const color = value > 0 ? "success" : value < 0 ? "error" : "default";
  const Icon = value >= 0 ? TrendingUpIcon : TrendingDownIcon;
  const pct = Math.abs(value) < 0.1 ? value.toFixed(2) : value.toFixed(1);
  return (
    <Chip
      size="small"
      color={color}
      icon={<Icon fontSize="small" />}
      label={`${label} ${value > 0 ? "↑" : value < 0 ? "↓" : ""}${pct}%`}
      variant={color === "default" ? "outlined" : "filled"}
      sx={{ fontWeight: 600 }}
    />
  );
}

/**
 * Props:
 * - topCustomers: [{ customer_name, total_value, total_transaksi, ... }]
 * - weekly: { growthPct?: number }
 * - monthly: { growthPctOmzet?: number, growthPctQty?: number }
 * - yoy?: { this_year_value, last_year_value, growthPctOmzet?: number } (opsional)
 * - loading: boolean
 * - onOpenCustomerHistory?: (name) => void
 * - isSmallMobile?: boolean
 */
export default function AnalyticsSection({
  topCustomers = [],
  weekly = null,
  monthly = null,
  yoy = null,
  loading = false,
  onOpenCustomerHistory,
  isSmallMobile,
}) {
  const theme = useTheme();
  const isTabletUp = useMediaQuery(theme.breakpoints.up("sm"));

  const yoyPct =
    yoy?.growthPctOmzet ??
    (yoy && isFinite(yoy.last_year_value) && Number(yoy.last_year_value) !== 0
      ? ((Number(yoy.this_year_value || 0) - Number(yoy.last_year_value || 0)) /
          Number(yoy.last_year_value || 1)) *
        100
      : null);

  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardHeader
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <ShowChartIcon fontSize="small" color="primary" />
            <Typography variant="h6" fontWeight={800}>
              Analitik
            </Typography>
            <Box sx={{ flex: 1 }} />
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
              <GrowthChip label="WTD" value={weekly?.growthPct ?? null} />
              <GrowthChip label="MTD" value={monthly?.growthPctOmzet ?? null} />
              <GrowthChip label="YoY" value={yoyPct} />
            </Stack>
          </Stack>
        }
        sx={{ pb: 0 }}
      />
      <CardContent sx={{ pt: 2 }}>
        {loading ? (
          <Stack spacing={1.5}>
            <Box sx={{ height: 16, bgcolor: "action.hover", borderRadius: 1 }} />
            <Box sx={{ height: 16, bgcolor: "action.hover", borderRadius: 1, width: "80%" }} />
            <Box sx={{ height: 16, bgcolor: "action.hover", borderRadius: 1, width: "70%" }} />
            <Box sx={{ height: 16, bgcolor: "action.hover", borderRadius: 1, width: "60%" }} />
          </Stack>
        ) : (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            {/* Top Customers */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Top Customers
              </Typography>
              {(!topCustomers || topCustomers.length === 0) ? (
                <Typography variant="body2" color="text.secondary">
                  Belum ada data pelanggan teratas.
                </Typography>
              ) : (
                <List dense disablePadding>
                  {topCustomers.slice(0, 5).map((c, idx) => {
                    const name = c.customer_name || c.name || c.customer || `Pelanggan #${idx + 1}`;
                    const value =
                      c.total_value != null
                        ? Number(c.total_value)
                        : Number(c.total || (Number(c.qty || 0) * Number(c.price || 0)));
                    const subtitle =
                      c.total_transaksi != null
                        ? `${c.total_transaksi} transaksi`
                        : c.total_qty != null
                        ? `${c.total_qty} tabung`
                        : "";
                    return (
                      <React.Fragment key={`${name}-${idx}`}>
                        {idx > 0 && <Divider component="li" />}
                        <ListItem
                          secondaryAction={
                            onOpenCustomerHistory ? (
                              <Tooltip title="Lihat histori">
                                <IconButton edge="end" onClick={() => onOpenCustomerHistory(name)} size="small">
                                  <ArrowOutwardIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            ) : null
                          }
                          sx={{ py: 0.75 }}
                        >
                          <ListItemText
                            primary={
                              <Stack direction="row" alignItems="baseline" spacing={1}>
                                <Typography variant="body2" fontWeight={700} noWrap title={name}>
                                  {idx + 1}. {name}
                                </Typography>
                                {subtitle && (
                                  <Typography variant="caption" color="text.secondary">
                                    · {subtitle}
                                  </Typography>
                                )}
                                <Box sx={{ flex: 1 }} />
                                <Typography
                                  variant="body2"
                                  fontWeight={800}
                                  sx={{ fontVariantNumeric: "tabular-nums" }}
                                >
                                  {fmtIDR(value)}
                                </Typography>
                              </Stack>
                            }
                          />
                        </ListItem>
                      </React.Fragment>
                    );
                  })}
                </List>
              )}
            </Box>

            {/* Divider kolom pada tablet ke atas */}
            {isTabletUp && <Divider orientation="vertical" flexItem />}

            {/* Comparison (chips + ringkas) */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Perbandingan
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <GrowthChip label="WTD" value={weekly?.growthPct ?? null} />
                <GrowthChip label="MTD (Omzet)" value={monthly?.growthPctOmzet ?? null} />
                <GrowthChip label="MTD (Qty)" value={monthly?.growthPctQty ?? null} />
                <GrowthChip label="YoY" value={yoyPct} />
              </Stack>
              {/* Hint kecil */}
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: "block" }}>
                Hijau = naik · Merah = turun · Angka menunjukkan perubahan terhadap periode pembanding.
              </Typography>
            </Box>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
