// src/views/DashboardView.jsx
import React, { useEffect, useMemo, useState } from "react";
import { COLORS, HPP } from "../../utils/constants.js";
import { fmtIDR, todayStr } from "../../utils/helpers.js";
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Skeleton,
  Button,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";

const LOW_STOCK_THRESHOLD = 5;

/* ====== Error Boundary ====== */
class DashboardErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Dashboard Error:", error, errorInfo);
    this.setState({ errorInfo, error });
  }
  render() {
    if (this.state.hasError) {
      return (
        <Alert severity="error" sx={{ m: 2 }}>
          <Typography variant="h6" gutterBottom>
            Terjadi kesalahan saat memuat dashboard
          </Typography>
          {this.state.error?.message && (
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Detail:</strong> {String(this.state.error.message)}
            </Typography>
          )}
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
    <Card>
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
    <Stack spacing={1}>
      <LinearProgress
        variant="determinate"
        value={pctIsi}
        sx={{
          height: 10,
          borderRadius: 5,
          "& .MuiLinearProgress-bar": { borderRadius: 5 },
        }}
        color="success"
      />
      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
        <Chip
          size="small"
          label={`Isi: ${pctIsi}%`}
          color="success"
          variant="outlined"
        />
        <Chip
          size="small"
          label={`Kosong: ${pctKosong}%`}
          color="error"
          variant="outlined"
        />
      </Stack>
    </Stack>
  );
}

function MiniBarChart({ data }) {
  const max = useMemo(() => Math.max(1, ...data.map((d) => d.qty)), [data]);
  return (
    <Box sx={{ display: "flex", alignItems: "end", gap: 1, height: 140 }}>
      {data.map((d) => {
        const h = Math.max(8, Math.round((d.qty / max) * 120));
        return (
          <Box
            key={d.date}
            title={`${d.date} • ${d.qty} tabung`}
            sx={{
              width: 18,
              height: h,
              borderRadius: 0.75,
              bgcolor: "primary.main",
              opacity: 0.9,
            }}
          />
        );
      })}
    </Box>
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

  const fetchDashboard = async () => {
    try {
      setLoading(true);

      const rows = await DataService.loadSales(500);
      const notVoid = (rows || []).filter(
        (r) => String(r.status || "").toUpperCase() !== "DIBATALKAN"
      );

      const qty = notVoid.reduce((a, b) => a + Number(b.qty || 0), 0);
      const paid = notVoid.filter(
        (r) =>
          String(r.method || "").toUpperCase() === "TUNAI" ||
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
              _rowId:
                row.id ??
                `${row.created_at ?? "x"}-${row.customer ?? "public"}-${idx}`,
              ...row,
            }))
          : []
      );
      setErr("");
    } catch (e) {
      console.error("Dashboard error:", e);
      setErr(e.message || "Gagal memuat dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let alive = true;
    fetchDashboard();

    const ch = supabase
      .channel("dashboard-rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sales" },
        () => alive && fetchDashboard()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "stocks" },
        () => alive && fetchDashboard()
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(ch);
      } catch {}
      alive = false;
    };
  }, []);

  return (
    <Stack spacing={2}>
      {/* Header */}
      <Stack
        direction="row"
        alignItems="baseline"
        justifyContent="space-between"
        flexWrap="wrap"
        sx={{ gap: 1 }}
      >
        <Box>
          <Typography variant="h5" fontWeight={800}>
            Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Ringkasan stok & penjualan.
          </Typography>
        </Box>
        <Chip
          label={`Total Tabung: ${total}`}
          variant="outlined"
          color="default"
          sx={{ fontWeight: 700 }}
        />
      </Stack>

      {err && (
        <Alert severity="error" variant="outlined">
          {err}
        </Alert>
      )}

      {/* Ringkasan Stok & Penjualan */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <StatTile
            title="Stok Isi"
            value={loading ? <Skeleton width={60} /> : isi}
            subtitle={isi <= LOW_STOCK_THRESHOLD ? "⚠️ Stok menipis" : "Siap jual"}
            color="success"
            icon={<Inventory2Icon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatTile
            title="Stok Kosong"
            value={loading ? <Skeleton width={60} /> : kosong}
            subtitle={kosong <= LOW_STOCK_THRESHOLD ? "⚠️ Stok menipis" : "Tabung kembali"}
            color="error"
            icon={<Inventory2Icon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatTile
            title="Penjualan Hari Ini"
            value={loading ? <Skeleton width={60} /> : today.qty}
            subtitle={loading ? <Skeleton width={100} /> : fmtIDR(today.money)}
            color="info"
            icon={<ShoppingCartIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatTile
            title="Piutang"
            value={loading ? <Skeleton width={100} /> : fmtIDR(piutang)}
            subtitle="Belum lunas"
            color="warning"
            icon={<ReceiptLongIcon />}
          />
        </Grid>
      </Grid>

      {/* Kondisi Stok */}
      <Card>
        <CardHeader title="Kondisi Stok (Isi vs Kosong)" />
        <CardContent>
          {loading ? (
            <Skeleton height={24} />
          ) : (
            <StockProgress isi={isi} kosong={kosong} />
          )}
        </CardContent>
      </Card>

      {/* Ringkasan Keuangan + Total Terjual */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6} lg={5}>
          <Card>
            <CardHeader title="Ringkasan Keuangan" />
            <CardContent>
              {loading ? (
                <Stack spacing={1}>
                  <Skeleton height={24} />
                  <Skeleton height={24} />
                  <Skeleton height={24} />
                </Stack>
              ) : (
                <Stack spacing={1}>
                  <RowKV k="Omzet (dibayar)" v={fmtIDR(sum.omzet)} />
                  <RowKV k="HPP" v={`− ${fmtIDR(sum.hpp)}`} />
                  <RowKV
                    k="Laba"
                    v={fmtIDR(sum.laba)}
                    vSx={{ color: sum.laba >= 0 ? "success.main" : "error.main", fontWeight: 700 }}
                  />
                  <RowKV
                    k="Margin"
                    v={sum.omzet > 0 ? `${Math.round((sum.laba / sum.omzet) * 100)}%` : "—"}
                    vSx={{ color: "info.main" }}
                  />
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={7}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: 2,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: "info.50",
                    color: "info.main",
                  }}
                >
                  <TrendingUpIcon />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Terjual (riwayat)
                  </Typography>
                  <Typography variant="h5" fontWeight={800}>
                    {loading ? <Skeleton width={80} /> : sum.qty}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Akumulasi data
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Grafik & Transaksi Terbaru */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={5}>
          <Card>
            <CardHeader title="Penjualan 7 Hari Terakhir" />
            <CardContent>
              {loading ? (
                <Stack spacing={1}>
                  <Skeleton height={120} />
                </Stack>
              ) : series7.length ? (
                <MiniBarChart data={series7} />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Belum ada data penjualan
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card>
            <CardHeader title="Transaksi Terbaru" />
            <CardContent>
              {loading ? (
                <Stack spacing={1}>
                  <Skeleton height={36} />
                  <Skeleton height={36} />
                  <Skeleton height={36} />
                </Stack>
              ) : (
                <TableContainer component={Paper} sx={{ borderRadius: 1.5 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Tanggal</TableCell>
                        <TableCell>Pelanggan</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell>Metode</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recent.map((x, idx) => (
                        <TableRow key={x._rowId || idx} hover>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>
                            {x.created_at ? new Date(x.created_at).toLocaleDateString("id-ID") : "-"}
                          </TableCell>
                          <TableCell>{x.customer || "PUBLIC"}</TableCell>
                          <TableCell align="right">{x.qty ?? 0}</TableCell>
                          <TableCell>{x.method || "-"}</TableCell>
                          <TableCell align="right">
                            {fmtIDR(
                              x.total ??
                                ((Number(x.qty) || 0) * (Number(x.price) || 0))
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {!recent.length && (
                        <TableRow>
                          <TableCell colSpan={5} sx={{ color: "text.secondary" }}>
                            Belum ada transaksi
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
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
      <Typography variant="body2" color="text.secondary">
        {k}
      </Typography>
      <Typography variant="body2" sx={vSx}>
        {v}
      </Typography>
    </Stack>
  );
}

/* ====== Export utama pakai Error Boundary ====== */
export default function DashboardView(props) {
  return (
    <DashboardErrorBoundary>
      <DashboardViewContent {...props} />
    </DashboardErrorBoundary>
  );
}
