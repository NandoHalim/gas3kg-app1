import React, { useEffect, useRef, useState } from "react";
import { COLORS } from "../../utils/constants.js";
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
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  Divider,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import CloseIcon from "@mui/icons-material/Close";

const LOW_STOCK_THRESHOLD = 5;

/* ====== Helpers untuk rolling 7 hari ====== */
const startOfDay = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const isoDate = (d) => startOfDay(d).toISOString().slice(0,10);

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

const dayLabel = (iso) => {
  try {
    const dt = new Date(iso);
    return dt.toLocaleDateString("id-ID", { weekday: "short" }); // Kam, Jum, ...
  } catch { return "-"; }
};

/* ====== Small UI parts ====== */
function StatTile({ title, value, subtitle, color = "primary", icon }) {
  return (
    <Card sx={{ height: "100%", display: "flex" }}>
      <CardContent sx={{ flex: 1, display: "flex", alignItems: "center", py: 1.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: "100%" }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              bgcolor: `${color}.50`,
              color: `${color}.main`,
              flexShrink: 0,
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
            <Typography
              variant="caption"
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
    <Stack spacing={1}>
      <LinearProgress
        variant="determinate"
        value={pctIsi}
        sx={{ height: 10, borderRadius: 5, "& .MuiLinearProgress-bar": { borderRadius: 5 } }}
        color="success"
      />
      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
        <Chip size="small" label={`Isi: ${pctIsi}%`} color="success" variant="outlined" />
        <Chip size="small" label={`Kosong: ${pctKosong}%`} color="error" variant="outlined" />
      </Stack>
    </Stack>
  );
}

/* ====== Chart 7 Hari Terakhir ====== */
function MiniBarChartLabeled({ data = [], height = 160 }) {
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
    <Box sx={{ px: 1, py: 1 }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `repeat(${Math.max(data.length, 1)}, 1fr)`,
          alignItems: "end",
          gap: 1.5,
          height,
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

  // --- Tambahan analitik 7-hari ---
  const [weeklyGrowthPct, setWeeklyGrowthPct] = useState(null);
  const [chartOpen, setChartOpen] = useState(false);

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

  // 4) Tambahan: Hitung ulang 7 hari terakhir realtime + weekly growth
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const from = new Date();
        from.setDate(from.getDate() - 6);
        from.setHours(0,0,0,0);
        const to = new Date();

        // rows raw utk bangun series7 yang benar-benar rolling T-6..T
        const rows = await DataService.loadSalesByDateRange(
          from.toISOString(),
          to.toISOString()
        );
        if (!alive) return;
        const last7 = buildLast7DaysSeries(rows);
        setSeries7(last7);

        // growth minggu ini vs minggu lalu
        if (DataService.getWeeklyComparison) {
          const wk = await DataService.getWeeklyComparison({ onlyPaid: true }).catch(() => null);
          if (alive && wk && typeof wk.growthPct === "number") {
            setWeeklyGrowthPct(wk.growthPct);
          }
        }
      } catch (e) {
        console.warn("[series7]", e?.message || e);
      }
    })();
    return () => { alive = false; };
  }, [recent, today.qty, stocks]);

  // ---- derived
  const isi = Number(stocks?.ISI || 0);
  const kosong = Number(stocks?.KOSONG || 0);
  const total = isi + kosong;

  // ---- insight 7-hari (peak, low, avg, total)
  const total7 = series7.reduce((a,b)=>a + Number(b.qty||0), 0);
  const avg7 = series7.length ? Math.round(total7 / series7.length) : 0;
  const peak = series7.reduce((p,c)=> (c.qty > (p?.qty||-1) ? c : p), null);
  const low = series7.reduce((p,c)=> (c.qty < (p?.qty??Infinity) ? c : p), null);

  return (
    <Stack spacing={1.5}>
      {/* Header */}
      <Stack direction="row" alignItems="baseline" justifyContent="space-between" flexWrap="wrap" sx={{ gap: 1 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>
            Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Ringkasan stok & penjualan.
          </Typography>
        </Box>
        <Chip label={`Total Tabung: ${total}`} variant="outlined" color="default" sx={{ fontWeight: 700 }} />
      </Stack>

      {err && <Alert severity="error" variant="outlined">{err}</Alert>}

      {/* Ringkasan Stok & Penjualan */}
      <Grid container spacing={1.5} alignItems="stretch">
        <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
          <StatTile
            title="Stok Isi"
            value={loading ? <Skeleton width={60} /> : isi}
            subtitle={isi <= LOW_STOCK_THRESHOLD ? "⚠️ Stok menipis" : "Siap jual"}
            color="success"
            icon={<Inventory2Icon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
          <StatTile
            title="Stok Kosong"
            value={loading ? <Skeleton width={60} /> : kosong}
            subtitle={kosong <= LOW_STOCK_THRESHOLD ? "⚠️ Stok menipis" : "Tabung kembali"}
            color="error"
            icon={<Inventory2Icon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
          <StatTile
            title="Penjualan Hari Ini"
            value={loading ? <Skeleton width={60} /> : today.qty}
            subtitle={loading ? <Skeleton width={100} /> : fmtIDR(today.money)}
            color="info"
            icon={<ShoppingCartIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
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
          {loading ? <Skeleton height={24} /> : <StockProgress isi={isi} kosong={kosong} />}
        </CardContent>
      </Card>

      {/* Ringkasan Keuangan + Total Terjual */}
      <Grid container spacing={1.5}>
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
                  <RowKV k="HPP" v={`− ${fmtIDR(sum.omzet - sum.laba)}`} />
                  <RowKV k="Laba" v={fmtIDR(sum.laba)} vSx={{ color: "success.main", fontWeight: 700 }} />
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

      {/* Penjualan 7 Hari Terakhir + Insight + Expand */}
      <Card>
        <CardHeader
          title="Penjualan 7 Hari Terakhir"
          action={
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip size="small" label="Rolling" variant="outlined" />
              <Tooltip title="Perbesar grafik">
                <IconButton onClick={() => setChartOpen(true)} aria-label="expand-chart">
                  <FullscreenIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          }
        />
        <CardContent>
          {loading ? (
            <Skeleton height={120} />
          ) : (
            <>
              <MiniBarChartLabeled data={series7} />
              {/* Insight kecil di bawah chart */}
              <Divider sx={{ my: 1.25 }} />
              <Grid container spacing={1}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Total 7 hari</Typography>
                  <Typography variant="subtitle2" fontWeight={700}>{total7} tabung</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Rata-rata/Hari</Typography>
                  <Typography variant="subtitle2" fontWeight={700}>{avg7} tabung</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Peak</Typography>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {peak ? `${dayLabel(peak.date)} (${peak.qty})` : "-"}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Lowest</Typography>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {low ? `${dayLabel(low.date)} (${low.qty})` : "-"}
                  </Typography>
                </Grid>
              </Grid>
              {typeof weeklyGrowthPct === "number" && (
                <Box sx={{ mt: 1 }}>
                  <Chip
                    size="small"
                    color={weeklyGrowthPct >= 0 ? "success" : "error"}
                    label={`Δ vs minggu lalu: ${weeklyGrowthPct >= 0 ? "+" : ""}${weeklyGrowthPct.toFixed(1)}%`}
                    variant="outlined"
                  />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Transaksi Terbaru */}
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

      {/* Dialog fullscreen chart */}
      <Dialog
        fullScreen
        open={chartOpen}
        onClose={() => setChartOpen(false)}
        PaperProps={{ sx: { bgcolor: "background.default" } }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="subtitle1" fontWeight={700}>Penjualan 7 Hari Terakhir</Typography>
          <IconButton onClick={() => setChartOpen(false)} aria-label="close-chart">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Tip: putar perangkat ke <b>landscape</b> untuk tampilan lebih lebar.
          </Typography>
          <Card variant="outlined">
            <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
              <MiniBarChartLabeled data={series7} height={280} />
            </CardContent>
          </Card>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={1.5}>
              <Grid item xs={6} sm={3}>
                <RowKV k="Total 7 hari" v={`${total7} tabung`} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <RowKV k="Rata-rata/Hari" v={`${avg7} tabung`} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <RowKV k="Peak" v={peak ? `${dayLabel(peak.date)} (${peak.qty})` : "-"} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <RowKV k="Lowest" v={low ? `${dayLabel(low.date)} (${low.qty})` : "-"} />
              </Grid>
            </Grid>
            {typeof weeklyGrowthPct === "number" && (
              <Box sx={{ mt: 1 }}>
                <Chip
                  size="small"
                  color={weeklyGrowthPct >= 0 ? "success" : "error"}
                  label={`Δ vs minggu lalu: ${weeklyGrowthPct >= 0 ? "+" : ""}${weeklyGrowthPct.toFixed(1)}%`}
                  variant="outlined"
                />
              </Box>
            )}
          </Box>
        </DialogContent>
      </Dialog>
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
