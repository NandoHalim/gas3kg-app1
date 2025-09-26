import React, { useEffect, useRef, useState } from "react";
import { fmtIDR, todayStr } from "../../utils/helpers.js";
import { DataService } from "../../services/DataService.js";
import { supabase } from "../../lib/supabase.js";
import { useSettings } from "../../context/SettingsContext.jsx";

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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";

const LOW_STOCK_THRESHOLD = 5;

/* ====== Helpers untuk rolling 7 hari ====== */
const startOfDay = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const isoDate = (d) => startOfDay(d).toISOString().slice(0,10);
const fmtPct = (n) => (n === null || n === undefined) ? "–" : `${(Number(n)).toFixed(1)}%`;

function buildLast7DaysSeries(rows = []) {
  const buckets = new Map();
  rows.forEach(r => {
    const dt = startOfDay(new Date(r.created_at || r.date || Date.now()));
    const key = isoDate(dt);
    const qty = Number(r.qty || 0);
    if (String(r.status || "").toUpperCase() === "DIBATALKAN") return;
    buckets.set(key, (buckets.get(key) || 0) + qty);
  });

  const today = startOfDay(new Date());
  const series = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = isoDate(d);
    series.push({ date: d.toISOString(), qty: buckets.get(key) || 0 });
  }
  return series;
}

/* ====== Small UI parts ====== */
function StatTile({ title, value, subtitle, color = "primary", icon }) {
  return (
    <Card sx={{ height: "100%", display: "flex" }}>
      <CardContent sx={{ flex: 1, display: "flex", alignItems: "center", py: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ width: "100%" }}>
          <Box
            sx={(t) => ({
              width: 42,
              height: 42,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              bgcolor: `${t.palette[color]?.light}20`, // 20% opacity
              color: t.palette[color]?.main,
              flexShrink: 0,
            })}
          >
            {icon}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={600} noWrap>
              {value}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              noWrap
              sx={{ display: "block", minHeight: 20 }}
            >
              {subtitle || ""}
            </Typography>
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
        sx={{ height: 10, borderRadius: 5, "& .MuiLinearProgress-bar": { borderRadius: 5 } }}
        color="success"
      />
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
        <Chip size="small" label={`Isi: ${pctIsi}%`} color="success" variant="outlined" />
        <Chip size="small" label={`Kosong: ${pctKosong}%`} color="error" variant="outlined" />
      </Stack>
    </Stack>
  );
}

/* ====== Chart 7 Hari Terakhir ====== */
function MiniBarChartLabeled({ data = [] }) {
  const max = Math.max(1, ...data.map((d) => Number(d.qty || 0)));
  const labelOf = (iso) => {
    try {
      const dt = new Date(iso);
      const wk = dt.toLocaleDateString("id-ID", { weekday: "short" });
      const dd = String(dt.getDate());
      return `${wk} ${dd}`;
    } catch {
      return iso || "-";
    }
  };

  return (
    <Box sx={{ px: 1, py: 2 }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `repeat(${Math.max(data.length, 1)}, 1fr)`,
          alignItems: "end",
          gap: 2,
          height: 160,
        }}
      >
        {data.map((d, i) => {
          const h = Math.max(8, Math.round((Number(d.qty || 0) / max) * 100));
          return (
            <Stack key={i} alignItems="center" spacing={0.5}>
              <Typography variant="caption" sx={{ fontWeight: 600, lineHeight: 1.1 }}>
                {d.qty}
              </Typography>
              <Box
                title={`${d.date} • ${d.qty} tabung`}
                sx={{
                  width: "70%",
                  height: h,
                  borderRadius: 0.75,
                  bgcolor: "primary.main",
                  opacity: 0.9,
                  transition: "opacity .15s, transform .15s",
                  "&:hover": { opacity: 1, transform: "translateY(-2px)" },
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center", lineHeight: 1.1 }}>
                {labelOf(d.date)}
              </Typography>
            </Stack>
          );
        })}
        {!data.length && (
          <Typography variant="body2" color="text.secondary" sx={{ gridColumn: "1 / -1", textAlign: "center" }}>
            Belum ada data penjualan
          </Typography>
        )}
      </Box>
    </Box>
  );
}

/* ====== Empty state row helper ====== */
function EmptyStateRow({ colSpan = 5, message = "Tidak ada data", hint }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} align="center" sx={{ py: 4 }}>
        <Box sx={{ color: "text.secondary" }}>
          <Typography variant="body2" gutterBottom>📊 {message}</Typography>
          {hint ? <Typography variant="caption">{hint}</Typography> : null}
        </Box>
      </TableCell>
    </TableRow>
  );
}

/* ====== Main View ====== */
export default function DashboardView({ stocks: stocksFromApp = {} }) {
  // --- Settings (untuk HPP) ---
  const { settings } = useSettings();
  const hppSetting = Number(settings?.hpp || 0);

  // --- STATE UTAMA ---
  const [stocks, setStocks] = useState(stocksFromApp);
  const [series7, setSeries7] = useState([]);
  const [piutang, setPiutang] = useState(0);
  const [recent, setRecent] = useState([]);

  const [sum, setSum] = useState({ qty: 0, omzet: 0, laba: 0 });
  const [today, setToday] = useState({ qty: 0, money: 0 });

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  // --- STATE ANALITIK (baru) ---
  const [analytics, setAnalytics] = useState({
    topCustomers: [],
    weekly: null,
    monthly: null,
    yoy: null,
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Customer history modal
  const [histOpen, setHistOpen] = useState(false);
  const [histTitle, setHistTitle] = useState("");
  const [histRows, setHistRows] = useState([]);
  const [histTotalQty, setHistTotalQty] = useState(0);

  const busyRef = useRef(false);
  const idleTimer = useRef(null);

  // 1) Snapshot cepat
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const snap = await DataService.getDashboardSnapshot({ revalidate: true });
        if (!alive) return;

        setStocks(snap.stocks || { ISI: 0, KOSONG: 0 });
        setSeries7(snap.sevenDays || []); // fallback awal
        setPiutang(snap.receivables || 0);
        setRecent(snap.recentSales || []);
        setLoading(false);
      } catch (e) {
        if (!alive) return;
        setErr(e.message || "Gagal memuat dashboard");
        setLoading(false);
      }
    })();

    const onSnap = (e) => {
      const d = e?.detail || {};
      setStocks(d.stocks || { ISI: 0, KOSONG: 0 });
      setSeries7(Array.isArray(d.sevenDays) ? d.sevenDays : []);
      setPiutang(Number.isFinite(d.receivables) ? d.receivables : 0);
      setRecent(Array.isArray(d.recentSales) ? d.recentSales : []);
    };
    window.addEventListener("dashboard:snapshot", onSnap);

    return () => {
      alive = false;
      window.removeEventListener("dashboard:snapshot", onSnap);
    };
  }, []);

  // 2) Hitung berat (omzet, laba, today)
  useEffect(() => {
    let alive = true;
    const doHeavy = async () => {
      try {
        await new Promise((r) => setTimeout(r, 50));
        const rows = await DataService.loadSales(500);
        if (!alive) return;

        const notVoid = rows.filter((r) => String(r.status || "").toUpperCase() !== "DIBATALKAN");
        const qty = notVoid.reduce((a, b) => a + Number(b.qty || 0), 0);

        const paid = notVoid.filter(
          (r) =>
            String(r.method).toUpperCase() === "TUNAI" ||
            String(r.status || "").toUpperCase() === "LUNAS"
        );
        const omzet = paid.reduce((a, b) => a + Number(b.total || 0), 0);
        const hpp = paid.reduce((a, b) => a + Number(b.qty || 0) * (Number(hppSetting) || 0), 0);
        const laba = omzet - hpp;

        const todaySum =
          (await DataService.getSalesSummary({ from: todayStr(), to: todayStr() })) ||
          { qty: 0, money: 0 };

        setSum({ qty, omzet, laba });
        setToday(todaySum);
      } catch (e) {
        if (!alive) return;
        console.warn("[Dashboard heavy]", e?.message || e);
      }
    };

    const ric =
      "requestIdleCallback" in window
        ? window.requestIdleCallback
        : (cb) => setTimeout(() => cb({ timeRemaining: () => 50 }), 150);
    const cancel =
      "cancelIdleCallback" in window ? window.cancelIdleCallback : (id) => clearTimeout(id);

    const id = ric(doHeavy);
    return () => {
      alive = false;
      cancel(id);
    };
  }, [hppSetting]);

  // 3) Realtime revalidate snapshot
  useEffect(() => {
    const askRevalidate = () => {
      if (busyRef.current) return;
      busyRef.current = true;
      DataService.getDashboardSnapshot({ revalidate: true });

      clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => (busyRef.current = false), 1200);
    };

    const ch = supabase
      .channel("dashboard-rt-lite")
      .on("postgres_changes", { event: "*", schema: "public", table: "sales" }, askRevalidate)
      .on("postgres_changes", { event: "*", schema: "public", table: "stocks" }, askRevalidate)
      .subscribe();

    return () => {
      try { supabase.removeChannel(ch); } catch {}
      clearTimeout(idleTimer.current);
    };
  }, []);

  // 4) Tambahan: Hitung ulang 7 hari terakhir realtime
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const from = new Date();
        from.setDate(from.getDate() - 6);
        from.setHours(0,0,0,0);
        const to = new Date();

        const rows = await DataService.loadSalesByDateRange?.(
          from.toISOString(),
          to.toISOString()
        ).catch(() => []);

        if (!alive) return;
        const last7 = buildLast7DaysSeries(rows || []);
        setSeries7(last7);
      } catch (e) {
        console.warn("[series7]", e?.message || e);
      }
    })();
    return () => { alive = false; };
  }, [recent, today.qty, stocks]);

  // 5) Muat ANALITIK via RPC-only (Top Customers + Weekly + Monthly + YoY)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setAnalyticsLoading(true);
        const [tops, comps] = await Promise.all([
          DataService.getTopCustomersPeriod?.({ period: "this_month", limit: 5, onlyPaid: true }).catch(() => []),
          DataService.getComparisonsSummary?.({ onlyPaid: true }).catch(() => ({})),
        ]);

        if (!alive) return;

        const wk = comps?.weekly || null;
        const weeklyGrowthPct = wk && wk.last_week_qty
          ? ((Number(wk.this_week_qty || 0) - Number(wk.last_week_qty || 0)) / Number(wk.last_week_qty)) * 100
          : null;

        const mo = comps?.monthly || null;
        const monthlyGrowthQty = mo && mo.last_month_qty
          ? ((Number(mo.this_month_qty || 0) - Number(mo.last_month_qty || 0)) / Number(mo.last_month_qty)) * 100
          : null;
        const monthlyGrowthOmzet = mo && mo.last_month_value
          ? ((Number(mo.this_month_value || 0) - Number(mo.last_month_value || 0)) / Number(mo.last_month_value)) * 100
          : null;
        const monthlyGrowthLaba = mo && mo.last_month_laba
          ? ((Number(mo.this_month_laba || 0) - Number(mo.last_month_laba || 0)) / Number(mo.last_month_laba)) * 100
          : null;

        const yy = comps?.yoy || null;
        const yoyGrowthQty = yy && yy.last_year_qty
          ? ((Number(yy.this_year_qty || 0) - Number(yy.last_year_qty || 0)) / Number(yy.last_year_qty)) * 100
          : null;
        const yoyGrowthOmzet = yy && yy.last_year_value
          ? ((Number(yy.this_year_value || 0) - Number(yy.last_year_value || 0)) / Number(yy.last_year_value)) * 100
          : null;
        const yoyGrowthLaba = yy && yy.last_year_laba
          ? ((Number(yy.this_year_laba || 0) - Number(yy.last_year_laba || 0)) / Number(yy.last_year_laba)) * 100
          : null;

        setAnalytics({
          topCustomers: tops || [],
          weekly: wk ? { ...wk, growthPct: weeklyGrowthPct } : null,
          monthly: mo ? {
            ...mo,
            growthPctQty: monthlyGrowthQty,
            growthPctOmzet: monthlyGrowthOmzet,
            growthPctLaba: monthlyGrowthLaba,
          } : null,
          yoy: yy ? {
            ...yy,
            growthPctQty: yoyGrowthQty,
            growthPctOmzet: yoyGrowthOmzet,
            growthPctLaba: yoyGrowthLaba,
          } : null,
        });
      } catch (e) {
        console.warn("[Analytics]", e?.message || e);
      } finally {
        setAnalyticsLoading(false);
      }
    })();

    return () => { alive = false; };
  }, []); // load sekali saat mount

  // ---- derived
  const isi = Number(stocks?.ISI || 0);
  const kosong = Number(stocks?.KOSONG || 0);
  const total = isi + kosong;

  // ===== Customer history modal ops
  const openCustomerHistory = async (name) => {
    try {
      const r = DataService.getPeriodRange?.("this_month");
      const from = r?.from;
      const to = r?.to;
      const { rows, totalQty } = await DataService.getCustomerHistory?.({ customer: name, from, to });
      setHistTitle(name);
      setHistRows(rows || []);
      setHistTotalQty(Number(totalQty || 0));
      setHistOpen(true);
    } catch (e) {
      setHistTitle(name);
      setHistRows([]);
      setHistTotalQty(0);
      setHistOpen(true);
      console.warn("[history]", e?.message || e);
    }
  };
  const closeCustomerHistory = () => setHistOpen(false);

  return (
    <Stack spacing={2}>
      {/* Header */}
      <Stack direction="row" alignItems="baseline" justifyContent="space-between" flexWrap="wrap" sx={{ gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={600}>Dashboard</Typography>
          <Typography variant="subtitle1" color="text.secondary">Ringkasan stok & penjualan</Typography>
        </Box>
        <Chip label={`Total Tabung: ${total}`} variant="outlined" color="default" sx={{ fontWeight: 700 }} />
      </Stack>

      {err && <Alert severity="error" variant="outlined">{err}</Alert>}

      {/* Ringkasan Stok & Penjualan */}
      <Grid container spacing={2} alignItems="stretch">
        <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
          <StatTile
            title="Stok Isi"
            value={loading ? <Skeleton variant="text" width={60} sx={{ fontSize: "2rem" }} /> : isi}
            subtitle={isi <= LOW_STOCK_THRESHOLD ? "⚠️ Stok menipis" : "Siap jual"}
            color="success"
            icon={<Inventory2Icon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
          <StatTile
            title="Stok Kosong"
            value={loading ? <Skeleton variant="text" width={60} sx={{ fontSize: "2rem" }} /> : kosong}
            subtitle={kosong <= LOW_STOCK_THRESHOLD ? "⚠️ Stok menipis" : "Tabung kembali"}
            color="error"
            icon={<Inventory2Icon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
          <StatTile
            title="Penjualan Hari Ini"
            value={loading ? <Skeleton variant="text" width={60} sx={{ fontSize: "2rem" }} /> : today.qty}
            subtitle={loading ? <Skeleton variant="text" width={100} /> : fmtIDR(today.money)}
            color="info"
            icon={<ShoppingCartIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
          <StatTile
            title="Piutang"
            value={loading ? <Skeleton variant="text" width={100} sx={{ fontSize: "2rem" }} /> : fmtIDR(piutang)}
            subtitle="Belum lunas"
            color="warning"
            icon={<ReceiptLongIcon />}
          />
        </Grid>
      </Grid>

      {/* Kondisi Stok */}
      <Card>
        <CardHeader
          title={<Typography variant="h6" fontWeight={600}>Kondisi Stok</Typography>}
          subheader="Perbandingan stok isi vs kosong"
          sx={{ pb: 2 }}
        />
        <Divider />
        <CardContent sx={{ pt: 2 }}>
          {loading ? <Skeleton height={24} /> : <StockProgress isi={isi} kosong={kosong} />}
        </CardContent>
      </Card>

      {/* Ringkasan Keuangan + Total Terjual */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6} lg={5}>
          <Card>
            <CardHeader
              title={<Typography variant="h6" fontWeight={600}>Ringkasan Keuangan</Typography>}
              sx={{ pb: 2 }}
            />
            <Divider />
            <CardContent sx={{ pt: 2 }}>
              {loading ? (
                <Stack spacing={2}>
                  <Skeleton height={24} />
                  <Skeleton height={24} />
                  <Skeleton height={24} />
                </Stack>
              ) : (
                <Stack spacing={2}>
                  <RowKV k="Omzet (dibayar)" v={fmtIDR(sum.omzet)} />
                  <RowKV k="HPP" v={`− ${fmtIDR(sum.omzet - sum.laba)}`} />
                  <RowKV k="Laba" v={fmtIDR(sum.laba)} vSx={{ color: "success.main", fontWeight: 700 }} />
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={7}>
          <Card>
            <CardHeader
              title={<Typography variant="h6" fontWeight={600}>Total Terjual</Typography>}
              subheader="Akumulasi data"
              sx={{ pb: 2 }}
            />
            <Divider />
            <CardContent sx={{ pt: 2 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: 2,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: (t) => `${t.palette.info.light}20`,
                    color: "info.main",
                  }}
                >
                  <TrendingUpIcon />
                </Box>
                <Typography variant="h4" fontWeight={600}>
                  {loading ? <Skeleton variant="text" width={80} sx={{ fontSize: "2rem" }} /> : sum.qty}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Penjualan 7 Hari Terakhir */}
      <Card>
        <CardHeader
          title={<Typography variant="h6" fontWeight={600}>Penjualan 7 Hari Terakhir</Typography>}
          sx={{ pb: 2 }}
        />
        <Divider />
        <CardContent sx={{ pt: 2 }}>
          {loading ? <Skeleton height={120} /> : <MiniBarChartLabeled data={series7} />}
        </CardContent>
      </Card>

      {/* ====== Analitik Penjualan (BARU) ====== */}
      <Card>
        <CardHeader
          title={<Typography variant="h6" fontWeight={600}>Analitik Penjualan</Typography>}
          sx={{ pb: 2 }}
        />
        <Divider />
        <CardContent sx={{ pt: 2 }}>
          {analyticsLoading ? (
            <Stack spacing={2}>
              <Skeleton height={28} />
              <Skeleton height={28} />
              <Skeleton height={28} />
            </Stack>
          ) : (
            <Grid container spacing={2}>
              {/* Top Customers */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Top Customers (bulan ini)
                </Typography>
                <TableContainer component={Paper} sx={{ borderRadius: 1.5 }}>
                  <Table size="medium" sx={{ minWidth: 650 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Pelanggan</TableCell>
                        <TableCell align="right">Transaksi</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell align="right">Aksi</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(analytics.topCustomers || []).map((c, i) => (
                        <TableRow key={i} hover>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>{c.customer_name}</TableCell>
                          <TableCell align="right">{c.total_transaksi}</TableCell>
                          <TableCell align="right">{fmtIDR(c.total_value)}</TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              variant="text"
                              onClick={() => openCustomerHistory(c.customer_name)}
                              sx={{ textTransform: "none", fontWeight: 500, px: 0 }}
                            >
                              Lihat riwayat
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {!analytics.topCustomers?.length && (
                        <EmptyStateRow colSpan={4} message="Belum ada data" hint="Data akan muncul setelah ada transaksi pada bulan ini" />
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              {/* Perbandingan Weekly / Monthly / YoY */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Perbandingan
                </Typography>
                <Stack spacing={1.25}>
                  <RowKV
                    k="Weekly (Qty)"
                    v={
                      analytics.weekly
                        ? `${analytics.weekly.this_week_qty} vs ${analytics.weekly.last_week_qty} (${fmtPct(analytics.weekly.growthPct)})`
                        : "-"
                    }
                  />
                  <RowKV
                    k="Monthly (Qty)"
                    v={
                      analytics.monthly
                        ? `${analytics.monthly.this_month_qty} vs ${analytics.monthly.last_month_qty} (${fmtPct(analytics.monthly.growthPctQty)})`
                        : "-"
                    }
                  />
                  <RowKV
                    k="Monthly (Omzet)"
                    v={
                      analytics.monthly
                        ? `${fmtIDR(analytics.monthly.this_month_value)} vs ${fmtIDR(analytics.monthly.last_month_value)} (${fmtPct(analytics.monthly.growthPctOmzet)})`
                        : "-"
                    }
                  />
                  <RowKV
                    k="Monthly (Laba)"
                    v={
                      analytics.monthly
                        ? `${fmtIDR(analytics.monthly.this_month_laba)} vs ${fmtIDR(analytics.monthly.last_month_laba)} (${fmtPct(analytics.monthly.growthPctLaba)})`
                        : "-"
                    }
                  />
                  <RowKV
                    k="YoY (Qty)"
                    v={
                      analytics.yoy
                        ? `${analytics.yoy.this_year_qty} vs ${analytics.yoy.last_year_qty} (${fmtPct(analytics.yoy.growthPctQty)})`
                        : "-"
                    }
                  />
                  <RowKV
                    k="YoY (Omzet)"
                    v={
                      analytics.yoy
                        ? `${fmtIDR(analytics.yoy.this_year_value)} vs ${fmtIDR(analytics.yoy.last_year_value)} (${fmtPct(analytics.yoy.growthPctOmzet)})`
                        : "-"
                    }
                  />
                  <RowKV
                    k="YoY (Laba)"
                    v={
                      analytics.yoy
                        ? `${fmtIDR(analytics.yoy.this_year_laba)} vs ${fmtIDR(analytics.yoy.last_year_laba)} (${fmtPct(analytics.yoy.growthPctLaba)})`
                        : "-"
                    }
                  />
                </Stack>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Transaksi Terbaru */}
      <Card>
        <CardHeader
          title={<Typography variant="h6" fontWeight={600}>Transaksi Terbaru</Typography>}
          sx={{ pb: 2 }}
        />
        <Divider />
        <CardContent sx={{ pt: 2 }}>
          {loading ? (
            <Table size="medium" sx={{ minWidth: 650 }}>
              <TableBody>
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton variant="text" /></TableCell>
                    <TableCell><Skeleton variant="text" /></TableCell>
                    <TableCell><Skeleton variant="text" /></TableCell>
                    <TableCell><Skeleton variant="text" /></TableCell>
                    <TableCell><Skeleton variant="text" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: 1.5 }}>
              <Table size="medium" sx={{ minWidth: 650 }}>
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
                  {recent.map((x) => (
                    <TableRow key={x.id} hover>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        {(x.created_at || "").slice(0, 10)}
                      </TableCell>
                      <TableCell>{x.customer || "PUBLIC"}</TableCell>
                      <TableCell align="right">{x.qty}</TableCell>
                      <TableCell>{x.method}</TableCell>
                      <TableCell align="right">
                        {fmtIDR((Number(x.qty) || 0) * (Number(x.price) || 0))}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!recent.length && (
                    <EmptyStateRow message="Belum ada transaksi" hint="Transaksi terbaru akan tampil di sini" />
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* ===== Modal: Riwayat Customer ===== */}
      <Dialog fullWidth maxWidth="sm" open={histOpen} onClose={closeCustomerHistory}>
        <DialogTitle>
          <Typography variant="h6" fontWeight={600}>Riwayat Transaksi — {histTitle || "-"}</Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Table size="medium" sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>Tanggal</TableCell>
                <TableCell align="right">Qty</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Metode</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(histRows || []).map((r) => (
                <TableRow key={r.id}>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{String(r.created_at || "").slice(0,10)}</TableCell>
                  <TableCell align="right">{r.qty}</TableCell>
                  <TableCell align="right">{fmtIDR(r.total || (Number(r.qty||0)*Number(r.price||0)))}</TableCell>
                  <TableCell>
                    {String(r.method).toUpperCase() === "HUTANG" ? (
                      <Chip
                        size="small"
                        label="HUTANG"
                        color={String(r.status).toUpperCase() === "LUNAS" ? "success" : "error"}
                        variant="outlined"
                      />
                    ) : r.method}
                  </TableCell>
                </TableRow>
              ))}
              {!histRows?.length && (
                <EmptyStateRow colSpan={4} message="Tidak ada transaksi" />
              )}
            </TableBody>
          </Table>
          <Box sx={{ pt: 2 }}>
            <Typography variant="subtitle1" fontWeight={600}>Total Qty: {histTotalQty}</Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" onClick={closeCustomerHistory} sx={{ textTransform: "none" }}>
            Tutup
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

/* Helpers */
function RowKV({ k, v, vSx }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography variant="subtitle1" color="text.secondary">{k}</Typography>
      <Typography variant="subtitle1" sx={vSx}>{v}</Typography>
    </Stack>
  );
}
