// src/components/views/DashboardView.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { COLORS, HPP } from "../../utils/constants.js";
import { fmtIDR, todayStr, debounce } from "../../utils/helpers.js";
import { DataService } from "../../services/DataService.js";
import { supabase } from "../../lib/supabase.js";

// MUI
import {
  Box,
  Grid,
  Stack,
  Typography,
  Card,
  CardHeader,
  CardContent,
  Chip,
  LinearProgress,
  Alert,
  Skeleton,
  Button,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";

const LOW_STOCK_THRESHOLD = 5;

// Error Boundary Component
class DashboardErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Dashboard Error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert severity="error" sx={{ m: 2 }}>
          <Typography variant="h6" gutterBottom>
            Terjadi kesalahan saat memuat dashboard
          </Typography>
          <Typography variant="body2" paragraph>
            Silakan coba muat ulang halaman.
          </Typography>
          <Button onClick={() => window.location.reload()} variant="contained">
            Muat Ulang
          </Button>
        </Alert>
      );
    }
    return this.props.children;
  }
}

/* ====== Small UI parts ====== */
function StatTile({ title, value, subtitle, color = "primary", icon }) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              bgcolor: `${color}.50`,
              color: `${color}.main`,
            }}
          >
            {icon}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h5" fontWeight={800} noWrap>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function StockProgress({ isi, kosong }) {
  const total = Math.max(isi + kosong, 1);
  const pctKosong = Math.round((kosong / total) * 100);
  const pctIsi = 100 - pctKosong;

  return (
    <Stack spacing={2}>
      <LinearProgress
        variant="determinate"
        value={pctIsi}
        sx={{
          height: 10,
          borderRadius: 5,
          "& .MuiLinearProgress-bar": {
            borderRadius: 5,
            backgroundColor: (theme) =>
              pctIsi < 20 ? theme.palette.warning.main : theme.palette.success.main,
          },
        }}
      />
      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
        <Chip
          size="small"
          label={`Isi: ${isi} tabung (${pctIsi}%)`}
          color={pctIsi < 20 ? "warning" : "success"}
          variant="outlined"
        />
        <Chip
          size="small"
          label={`Kosong: ${kosong} tabung (${pctKosong}%)`}
          color={kosong <= LOW_STOCK_THRESHOLD ? "warning" : "info"}
          variant="outlined"
        />
      </Stack>
    </Stack>
  );
}

function MiniBarChart({ data }) {
  const max = useMemo(() => Math.max(1, ...data.map((d) => d.qty)), [data]);

  return (
    <Box sx={{ display: "flex", alignItems: "end", gap: 1.5, height: 140, px: 1 }}>
      {data.map((d) => {
        const height = Math.max(8, Math.round((d.qty / max) * 120));
        return (
          <Box
            key={d.date}
            title={`${d.date} • ${d.qty} tabung`}
            role="img"
            aria-label={`Tanggal ${d.date}, ${d.qty} tabung`}
            sx={{
              width: 20,
              height: height,
              borderRadius: 1,
              bgcolor: "primary.main",
              opacity: 0.8,
              transition: "all 0.2s ease",
              "&:hover": {
                opacity: 1,
                transform: "scaleY(1.05)",
              },
            }}
          />
        );
      })}
    </Box>
  );
}

function DashboardSkeleton() {
  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Skeleton variant="text" width={200} height={40} />
          <Skeleton variant="text" width={300} height={24} />
        </Box>
        <Skeleton variant="rounded" width={150} height={32} />
      </Stack>

      <Grid container spacing={3}>
        {[1, 2, 3, 4].map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item}>
            <Skeleton variant="rounded" height={120} />
          </Grid>
        ))}
      </Grid>

      <Skeleton variant="rounded" height={120} />

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Skeleton variant="rounded" height={200} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Skeleton variant="rounded" height={200} />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Skeleton variant="rounded" height={300} />
        </Grid>
        <Grid item xs={12} md={7}>
          <Skeleton variant="rounded" height={300} />
        </Grid>
      </Grid>
    </Stack>
  );
}

/* ====== Main View ====== */
function DashboardViewContent({ stocks = {} }) {
  const isi = Number(stocks.ISI || 0);
  const kosong = Number(stocks.KOSONG || 0);
  const total = isi + kosong;

  const [sum, setSum] = useState({ qty: 0, omzet: 0, laba: 0, hpp: 0 });
  const [today, setToday] = useState({ qty: 0, money: 0 });
  const [piutang, setPiutang] = useState(0);
  const [recent, setRecent] = useState([]);
  const [series7, setSeries7] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const columns = useMemo(
    () => [
      {
        field: "created_at",
        headerName: "Tanggal",
        width: 120,
        valueGetter: (params) =>
          params.value || params.row.date || params.row.createdAt || null,
        valueFormatter: (params) =>
          params.value ? new Date(params.value).toLocaleDateString("id-ID") : "",
      },
      {
        field: "customer",
        headerName: "Pelanggan",
        width: 150,
        valueFormatter: (params) => params.value || "PUBLIC",
      },
      {
        field: "qty",
        headerName: "Qty",
        width: 80,
        align: "center",
        headerAlign: "center",
      },
      {
        field: "method",
        headerName: "Metode",
        width: 100,
      },
      {
        field: "total",
        headerName: "Total",
        width: 120,
        align: "right",
        headerAlign: "right",
        valueFormatter: (params) => fmtIDR(params.value),
      },
    ],
    []
  );

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setErr("");

      const rows = await DataService.loadSales(500);
      const notVoid = (rows || []).filter(
        (r) => String(r.status || "").toUpperCase() !== "DIBATALKAN"
      );

      const qty = notVoid.reduce((a, b) => a + Number(b.qty || 0), 0);

      const paid = notVoid.filter(
        (r) =>
          String(r.method).toUpperCase() === "TUNAI" ||
          String(r.status || "").toUpperCase() === "LUNAS"
      );

      const omzet = paid.reduce((a, b) => a + Number(b.total || 0), 0);
      const hpp = paid.reduce((a, b) => a + Number(b.qty || 0) * HPP, 0);
      const laba = omzet - hpp;

      const todaySum =
        (await DataService.getSalesSummary({
          from: todayStr(),
          to: todayStr(),
        })) || { qty: 0, money: 0 };

      const totalPiutang = await DataService.getTotalReceivables();
      const s7 = await DataService.getSevenDaySales();
      const r = await DataService.getRecentSales(5);

      setSum({ qty, omzet, laba, hpp });
      setToday(todaySum);
      setPiutang(totalPiutang ?? 0);
      setSeries7(Array.isArray(s7) ? s7 : []);
      setRecent(
        Array.isArray(r)
          ? r.map((row, idx) => ({
              id:
                row.id ??
                `${row.created_at ?? row.date ?? row.createdAt ?? "x"}-${
                  row.customer ?? "public"
                }-${row.total ?? row.qty ?? idx}`,
              ...row,
            }))
          : []
      );
    } catch (e) {
      console.error("Dashboard error:", e);
      setErr(e.message || "Gagal memuat data dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;

    const debouncedFetch = debounce(() => {
      if (alive) fetchDashboard();
    }, 500);

    fetchDashboard();

    const channel = supabase
      .channel("dashboard-rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sales" },
        debouncedFetch
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "stocks" },
        debouncedFetch
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (e) {
        console.error("Error removing channel:", e);
      }
      alive = false;
    };
  }, [fetchDashboard]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        spacing={2}
      >
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Ringkasan stok & penjualan
          </Typography>
        </Box>
        <Chip
          label={`Total Tabung: ${total}`}
          variant="outlined"
          color="primary"
          sx={{ fontWeight: 700, fontSize: "1rem", px: 2 }}
        />
      </Stack>

      {/* Error Alert */}
      {err && (
        <Alert severity="error" variant="outlined" onClose={() => setErr("")}>
          {err}
        </Alert>
      )}

      {/* Stock Alerts */}
      {isi <= LOW_STOCK_THRESHOLD && (
        <Alert severity="warning" variant="outlined">
          ⚠️ Stok Isi hampir habis! Segera lakukan pengisian.
        </Alert>
      )}
      {kosong <= LOW_STOCK_THRESHOLD && isi > LOW_STOCK_THRESHOLD && (
        <Alert severity="info" variant="outlined">
          ℹ️ Stok Kosong hampir habis! Segera terima titipan atau beli dari agen.
        </Alert>
      )}

      {/* Ringkasan Stok & Penjualan */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatTile
            title="Stok Isi"
            value={isi}
            subtitle={isi <= LOW_STOCK_THRESHOLD ? "⚠️ Stok menipis" : "Siap jual"}
            color={isi <= LOW_STOCK_THRESHOLD ? "warning" : "success"}
            icon={<Inventory2Icon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatTile
            title="Stok Kosong"
            value={kosong}
            subtitle={
              kosong <= LOW_STOCK_THRESHOLD ? "⚠️ Stok menipis" : "Tabung kembali"
            }
            color={kosong <= LOW_STOCK_THRESHOLD ? "warning" : "info"}
            icon={<Inventory2Icon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatTile
            title="Penjualan Hari Ini"
            value={today.qty}
            subtitle={fmtIDR(today.money)}
            color="primary"
            icon={<ShoppingCartIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatTile
            title="Piutang"
            value={fmtIDR(piutang)}
            subtitle="Belum lunas"
            color="warning"
            icon={<ReceiptLongIcon />}
          />
        </Grid>
      </Grid>

      {/* Kondisi Stok */}
      <Card>
        <CardHeader
          title="Kondisi Stok (Isi vs Kosong)"
          titleTypographyProps={{ variant: "h6", fontWeight: 600 }}
        />
        <CardContent>
          <StockProgress isi={isi} kosong={kosong} />
        </CardContent>
      </Card>

      {/* Ringkasan Keuangan + Total Terjual */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={5}>
          <Card sx={{ height: "100%" }}>
            <CardHeader
              title="Ringkasan Keuangan"
              titleTypographyProps={{ variant: "h6", fontWeight: 600 }}
            />
            <CardContent>
              <Stack spacing={2}>
                <RowKV k="Omzet (dibayar)" v={fmtIDR(sum.omzet)} />
                <RowKV
                  k="HPP"
                  v={`- ${fmtIDR(sum.hpp)}`}
                  vSx={{ color: "error.main" }}
                />
                <RowKV
                  k="Laba"
                  v={fmtIDR(sum.laba)}
                  vSx={{
                    color: sum.laba >= 0 ? "success.main" : "error.main",
                    fontWeight: 700,
                    fontSize: "1.1rem",
                  }}
                />
                <RowKV
                  k="Margin"
                  v={sum.omzet > 0 ? `${Math.round((sum.laba / sum.omzet) * 100)}%` : "—"}
                  vSx={{ color: "info.main" }}
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={7}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ height: "100%", display: "flex", alignItems: "center" }}>
              <Stack direction="row" spacing={3} alignItems="center">
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 2,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: "info.50",
                    color: "info.main",
                  }}
                >
                  <TrendingUpIcon fontSize="large" />
                </Box>
                <Box>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Total Terjual
                  </Typography>
                  <Typography variant="h3" fontWeight={800} color="primary">
                    {sum.qty}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Akumulasi semua transaksi
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Grafik & Transaksi Terbaru */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Card>
            <CardHeader
              title="Penjualan 7 Hari Terakhir"
              titleTypographyProps={{ variant: "h6", fontWeight: 600 }}
            />
            <CardContent>
              {series7.length > 0 ? (
                <MiniBarChart data={series7} />
              ) : (
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Belum ada data penjualan
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card>
            <CardHeader
              title="Transaksi Terbaru"
              titleTypographyProps={{ variant: "h6", fontWeight: 600 }}
            />
            <CardContent>
              <Box sx={{ height: 300, width: "100%" }}>
                <DataGrid
                  rows={recent}
                  columns={columns}
                  getRowId={(row) =>
                    row.id ??
                    `${row.created_at ?? row.date ?? row.createdAt ?? "x"}-${
                      row.customer ?? "public"
                    }-${row.total ?? row.qty ?? Math.random()}`
                  }
                  initialState={{
                    pagination: { paginationModel: { pageSize: 5, page: 0 } },
                  }}
                  pageSizeOptions={[5]}
                  disableSelectionOnClick
                  density="comfortable"
                  sx={{
                    border: "none",
                    "& .MuiDataGrid-cell": { border: "none" },
                    "& .MuiDataGrid-columnHeaders": {
                      backgroundColor: "grey.50",
                      border: "none",
                    },
                  }}
                  localeText={{
                    noRowsLabel: "Belum ada transaksi",
                    footerTotalRows: "Total:",
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}

/* Helpers */
function RowKV({ k, v, vSx }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography variant="body1" color="text.secondary" fontWeight={500}>
        {k}
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: 600, ...vSx }}>
        {v}
      </Typography>
    </Stack>
  );
}

// Export utama dengan Error Boundary
export default function DashboardView(props) {
  return (
    <DashboardErrorBoundary>
      <DashboardViewContent {...props} />
    </DashboardErrorBoundary>
  );
}
