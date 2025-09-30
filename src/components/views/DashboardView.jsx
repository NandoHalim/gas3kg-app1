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
  useTheme,
  useMediaQuery,
  alpha,
  Divider,
} from "@mui/material";

import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ReportProblemOutlined from "@mui/icons-material/ReportProblemOutlined";
import InsightsOutlined from "@mui/icons-material/InsightsOutlined";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import BarChartIcon from "@mui/icons-material/BarChart";
import PeopleIcon from "@mui/icons-material/People";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

const LOW_STOCK_THRESHOLD = 5;

/* =========================
   Reusable styles & helpers
   ========================= */
const btnLinkSx = { textTransform: "none", fontWeight: 500, px: 0, minWidth: 100 };
const btnDialogSx = { textTransform: "none", minWidth: 120 };
const startOfDay = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const isoDate = (d) => startOfDay(d).toISOString().slice(0,10);
const fmtPct = (n) => (n === null || n === undefined) ? "–" : `${(Number(n)).toFixed(1)}%`;

/* Error banner + Empty state */
function ErrorBanner({ message, detail }) {
  const theme = useTheme();
  return (
    <Alert
      severity="error"
      icon={<ReportProblemOutlined />}
      variant="outlined"
      sx={{ 
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
        background: `${alpha(theme.palette.error.main, 0.05)}`
      }}
    >
      <Typography variant="subtitle1" fontWeight={600}>Terjadi kesalahan</Typography>
      <Typography variant="body2" sx={{ mt: 0.5 }}>{message}</Typography>
      {detail ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
          {detail}
        </Typography>
      ) : null}
    </Alert>
  );
}

function EmptyStateRow({ colSpan = 5, message = "Tidak ada data", hint }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} align="center" sx={{ py: 6 }}>
        <Box sx={{ color: "text.secondary" }}>
          <InsightsOutlined sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
          <Typography variant="body1" gutterBottom fontWeight={600}>
            {message}
          </Typography>
          {hint && <Typography variant="body2">{hint}</Typography>}
        </Box>
      </TableCell>
    </TableRow>
  );
}

/* ====== Helpers untuk rolling 7 hari ====== */
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
function StatTile({ title, value, subtitle, color = "primary", icon, loading = false }) {
  const theme = useTheme();
  
  return (
    <Card sx={{ 
      height: "100%", 
      display: "flex",
      background: `linear(135deg, ${alpha(theme.palette[color].main, 0.1)} 0%, ${alpha(theme.palette[color].main, 0.05)} 100%)`,
      border: `1px solid ${alpha(theme.palette[color].main, 0.2)}`,
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: theme.shadows[4],
      }
    }}>
      <CardContent sx={{ flex: 1, display: "flex", alignItems: "center", py: 3, px: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ width: "100%" }}>
          <Box
            sx={(theme) => ({
              width: 56,
              height: 56,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              bgcolor: alpha(theme.palette[color].main, 0.15),
              color: `${color}.main`,
              flexShrink: 0,
            })}
          >
            {icon}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h4"
              fontWeight={700}
              noWrap
              sx={{ 
                typography: { xs: "h5", sm: "h4" },
                color: `${color}.main`
              }}
            >
              {loading ? <Skeleton variant="text" width={80} /> : value}
            </Typography>
            <Typography
              color="text.secondary"
              sx={{ 
                typography: { xs: "body2", sm: "subtitle1" }, 
                display: "block", 
                minHeight: 24,
                fontWeight: 600 
              }}
              noWrap
            >
              {loading ? <Skeleton variant="text" width={120} /> : subtitle}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ 
                display: { xs: "none", sm: "block" },
                fontWeight: 500
              }}
            >
              {title}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function StockProgress({ isi, kosong, loading = false }) {
  const total = Math.max(isi + kosong, 1);
  const pctKosong = Math.round((kosong / total) * 100);
  const pctIsi = 100 - pctKosong;
  
  if (loading) return <Skeleton height={60} />;
  
  return (
    <Stack spacing={2}>
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="body2" fontWeight={600} color="success.main">
            Stok Isi ({isi})
          </Typography>
          <Typography variant="body2" fontWeight={600} color="text.secondary">
            {pctIsi}%
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={pctIsi}
          sx={{ 
            height: 12, 
            borderRadius: 6, 
            bgcolor: 'error.50',
            '& .MuiLinearProgress-bar': { 
              borderRadius: 6,
              background: `linear(90deg, #4CAF50, #66BB6A)`
            } 
          }}
        />
      </Box>
      
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="body2" fontWeight={600} color="error.main">
            Stok Kosong ({kosong})
          </Typography>
          <Typography variant="body2" fontWeight={600} color="text.secondary">
            {pctKosong}%
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={pctKosong}
          sx={{ 
            height: 12, 
            borderRadius: 6, 
            bgcolor: 'success.50',
            '& .MuiLinearProgress-bar': { 
              borderRadius: 6,
              background: `linear(90deg, #F44336, #EF5350)`
            } 
          }}
          color="error"
        />
      </Box>
      
      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ mt: 1 }}>
        <Chip 
          size="small" 
          label={`Total: ${isi + kosong} tabung`} 
          color="primary" 
          variant="outlined" 
        />
        {isi <= LOW_STOCK_THRESHOLD && (
          <Chip size="small" label="Stok Isi Menipis" color="warning" variant="filled" />
        )}
        {kosong <= LOW_STOCK_THRESHOLD && (
          <Chip size="small" label="Stok Kosong Menipis" color="warning" variant="filled" />
        )}
      </Stack>
    </Stack>
  );
}

/* ====== Chart 7 Hari Terakhir ====== */
function MiniBarChartLabeled({ data = [], loading = false }) {
  const theme = useTheme();
  const max = Math.max(1, ...data.map((d) => Number(d.qty || 0)));
  const labelOf = (iso) => {
    try {
      const dt = new Date(iso);
      const wk = dt.toLocaleDateString("id-ID", { weekday: "narrow" });
      const dd = String(dt.getDate());
      return `${wk} ${dd}`;
    } catch {
      return iso || "-";
    }
  };

  if (loading) return <Skeleton height={160} />;

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
          const isToday = isoDate(new Date()) === isoDate(new Date(d.date));
          return (
            <Stack key={i} alignItems="center" spacing={1}>
              <Typography 
                variant="caption" 
                sx={{ 
                  fontWeight: 700, 
                  lineHeight: 1.1,
                  color: isToday ? theme.palette.primary.main : 'text.primary'
                }}
              >
                {d.qty}
              </Typography>
              <Box
                title={`${d.date} • ${d.qty} tabung`}
                sx={{
                  width: "75%",
                  height: h,
                  borderRadius: 1,
                  background: isToday 
                    ? `linear(0deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`
                    : `linear(0deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.light})`,
                  opacity: isToday ? 1 : 0.8,
                  transition: "all 0.3s ease",
                  "&:hover": { 
                    opacity: 1, 
                    transform: "translateY(-4px)",
                    boxShadow: theme.shadows[2]
                  },
                }}
              />
              <Typography 
                variant="caption" 
                color={isToday ? "primary.main" : "text.secondary"} 
                sx={{ 
                  textAlign: "center", 
                  lineHeight: 1.2,
                  fontWeight: isToday ? 700 : 400,
                }}
              >
                {labelOf(d.date)}
              </Typography>
            </Stack>
          );
        })}
        {!data.length && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              gridColumn: "1 / -1", 
              textAlign: "center",
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%'
            }}
          >
            <BarChartIcon sx={{ mr: 1, opacity: 0.5 }} />
            Belum ada data penjualan 7 hari terakhir
          </Typography>
        )}
      </Box>
    </Box>
  );
}

/* ====== Comparison Components ====== */
function ComparisonCard({ title, current, previous, growth, type = "qty" }) {
  const isPositive = growth > 0;
  const theme = useTheme();
  
  return (
    <Card variant="outlined" sx={{ 
      p: 2, 
      background: alpha(isPositive ? theme.palette.success.main : theme.palette.error.main, 0.05),
      border: `1px solid ${alpha(isPositive ? theme.palette.success.main : theme.palette.error.main, 0.2)}`
    }}>
      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
        {title}
      </Typography>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
        <Box>
          <Typography variant="h6" fontWeight={700}>
            {type === 'currency' ? fmtIDR(current) : current}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            vs {type === 'currency' ? fmtIDR(previous) : previous} sebelumnya
          </Typography>
        </Box>
        <Chip
          label={`${isPositive ? '+' : ''}${fmtPct(growth)}`}
          color={isPositive ? 'success' : 'error'}
          variant="filled"
          size="small"
        />
      </Stack>
    </Card>
  );
}

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

/* ====== Main View ====== */
export default function DashboardView({ stocks: stocksFromApp = {} }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { settings } = useSettings();

  const [stocks, setStocks] = useState(stocksFromApp);
  const [series7, setSeries7] = useState([]);
  const [piutang, setPiutang] = useState(0);
  const [recent, setRecent] = useState([]);
  const [financialSummary, setFinancialSummary] = useState({ 
    omzet: 0, 
    hpp: 0, 
    laba: 0,
    margin: 0,
    totalQty: 0,
    transactionCount: 0
  });
  const [today, setToday] = useState({ qty: 0, money: 0 });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [financialLoading, setFinancialLoading] = useState(true);

  // ANALITIK (RPC) - MEMPERTAHANKAN LOGIC LAMA
  const [analytics, setAnalytics] = useState({
    topCustomers: [],
    weekly: null,
    monthly: null,
    yoy: null,
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Modal Top Customer
  const [openHist, setOpenHist] = useState(false);
  const [histName, setHistName] = useState("");
  const [histRows, setHistRows] = useState([]);
  const [histLoading, setHistLoading] = useState(false);
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
        setSeries7(snap.sevenDays || []);
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

  // 2) Ringkasan Keuangan dengan FUNGSI BARU - TERINTEGRASI PENUH
  useEffect(() => {
    let alive = true;
    const calculateFinancialSummary = async () => {
      try {
        setFinancialLoading(true);
        
        // ✅ GUNAKAN FUNGSI BARU getFinancialSummary
        const summary = await DataService.getFinancialSummary({
          from: '2000-01-01', // Semua data historis
          to: todayStr(),
          hppPerUnit: Number(settings.hpp || 0)
        });

        if (!alive) return;
        
        setFinancialSummary(summary);
        
      } catch (error) {
        console.error('Error calculating financial summary:', error);
        
        // ✅ FALLBACK: Jika fungsi baru belum ada, gunakan perhitungan manual
        try {
          console.warn('Falling back to manual calculation...');
          const salesData = await DataService.getSalesHistory({
            from: '2000-01-01',
            to: todayStr(),
            method: "ALL",
            status: "ALL",
            limit: 10000
          });

          if (!alive) return;

          // Logika manual yang sama dengan getFinancialSummary
          const paid = salesData.filter(sale => {
   const method = String(sale.method || '').toUpperCase();
   const status = String(sale.status || '').toUpperCase();

   // 🚫 abaikan transaksi dibatalkan
   if (status === 'DIBATALKAN') return false;

   // ✅ hanya hitung tunai atau lunas
   if (method === 'TUNAI') return true;
   if (status === 'LUNAS') return true;

   return false;
});

          const omzet = paid.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0);
          const totalQty = paid.reduce((sum, sale) => sum + (Number(sale.qty) || 0), 0);
          const hpp = totalQty * Number(settings.hpp || 0);
          const laba = omzet - hpp;
          const margin = omzet > 0 ? Math.round((laba / omzet) * 100) : 0;

          setFinancialSummary({ 
            omzet, 
            hpp, 
            laba, 
            margin, 
            totalQty, 
            transactionCount: paid.length 
          });
          
        } catch (fallbackError) {
          console.error('Fallback calculation also failed:', fallbackError);
          // Tetap set state kosong agar UI tidak broken
          setFinancialSummary({ 
            omzet: 0, hpp: 0, laba: 0, margin: 0, totalQty: 0, transactionCount: 0 
          });
        }
      } finally {
        if (alive) {
          setFinancialLoading(false);
        }
      }
    };

    calculateFinancialSummary();
    
    return () => {
      alive = false;
    };
  }, [settings.hpp]);

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

  // 4) Recompute 7 hari rolling (realtime)
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
  }, [recent, today, stocks]);

  // 5) Analytics via RPC-only (Top, Weekly, Monthly, YoY) - MEMPERTAHANKAN LOGIC LAMA
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

        // Hitung growth dari aggregate - LOGIC LAMA TETAP DIJAGA
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
  }, []);

  // 6) Penjualan Hari Ini - Tetap menggunakan fungsi lama untuk konsistensi
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const todaySum = await DataService.getSalesSummary({ 
          from: todayStr(), 
          to: todayStr() 
        });
        if (!alive) return;
        setToday(todaySum || { qty: 0, money: 0 });
      } catch (error) {
        console.error('Error getting today sales:', error);
      }
    })();
  }, []);

  // Modal handler: riwayat pelanggan (periode: bulan ini, mulai tgl 1)
  const openCustomerHistory = async (name) => {
    setHistName(name);
    setOpenHist(true);
    setHistLoading(true);
    try {
      const now = new Date();
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      s.setHours(0,0,0,0);
      const e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      e.setHours(23,59,59,999);

      const rows = await DataService.getSalesHistory({
        from: s.toISOString(),
        to: e.toISOString(),
        q: name,
        limit: 500,
      });

      const filtered = (rows || []).filter(r => (r.customer || "").toLowerCase().includes((name || "").toLowerCase()));
      setHistRows(filtered);
      const totalQty = filtered.reduce((a,b)=> a + Number(b.qty || 0), 0);
      setHistTotalQty(totalQty);
    } catch (e) {
      setHistRows([]);
      setHistTotalQty(0);
    } finally {
      setHistLoading(false);
    }
  };
  const closeCustomerHistory = () => setOpenHist(false);

  // ---- derived
  const isi = Number(stocks?.ISI || 0);
  const kosong = Number(stocks?.KOSONG || 0);
  const total = isi + kosong;

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Box>
        <Typography 
          variant="h3" 
          fontWeight={800} 
          gutterBottom
          sx={{ 
            typography: { xs: "h4", sm: "h3" },
            background: `linear(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
          }}
        >
          Dashboard
        </Typography>
        <Typography 
          color="text.secondary" 
          variant="h6"
          sx={{ typography: { xs: "body1", sm: "h6" } }}
        >
          Ringkasan performa bisnis dan analitik penjualan
        </Typography>
      </Box>

      {err && <ErrorBanner message={err} />}

      {/* Ringkasan Stok & Penjualan */}
      <Grid container spacing={3} alignItems="stretch">
        <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
          <StatTile
            title="Stok Isi"
            value={isi}
            subtitle={isi <= LOW_STOCK_THRESHOLD ? "⚠️ Stok menipis" : "Siap jual"}
            color="success"
            icon={<Inventory2Icon />}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
          <StatTile
            title="Stok Kosong"
            value={kosong}
            subtitle={kosong <= LOW_STOCK_THRESHOLD ? "⚠️ Stok menipis" : "Tabung kembali"}
            color="error"
            icon={<Inventory2Icon />}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
          <StatTile
            title="Penjualan Hari Ini"
            value={today.qty}
            subtitle={fmtIDR(today.money)}
            color="info"
            icon={<ShoppingCartIcon />}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
          <StatTile
            title="Piutang"
            value={fmtIDR(piutang)}
            subtitle="Belum lunas"
            color="warning"
            icon={<ReceiptLongIcon />}
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Kondisi Stok */}
      <Card sx={{
        background: `linear(135deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, ${alpha(theme.palette.secondary.main, 0.03)} 100%)`,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
      }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Inventory2Icon color="primary" />
              <Typography variant="h6" fontWeight={700}>Kondisi Stok</Typography>
            </Box>
          }
          subheader="Perbandingan stok isi vs kosong"
          sx={{ pb: 2, borderBottom: 1, borderColor: "divider" }}
        />
        <CardContent>
          <StockProgress isi={isi} kosong={kosong} loading={loading} />
        </CardContent>
      </Card>

      {/* Ringkasan Keuangan + Chart */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{
            background: `linear(135deg, ${alpha(theme.palette.success.main, 0.05)} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
            border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`
          }}>
            <CardHeader
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccountBalanceWalletIcon color="success" />
                  <Typography variant="h6" fontWeight={700}>Ringkasan Keuangan</Typography>
                </Box>
              }
              subheader="Akumulasi semua transaksi dibayar"
              sx={{ pb: 2, borderBottom: 1, borderColor: "divider" }}
            />
            <CardContent>
              {financialLoading ? (
                <Stack spacing={2}>
                  <Skeleton height={32} />
                  <Skeleton height={32} />
                  <Skeleton height={32} />
                  <Skeleton height={32} />
                </Stack>
              ) : (
                <Stack spacing={2}>
                  <RowKV 
                    k="Omzet (Tunai + LUNAS)" 
                    v={fmtIDR(financialSummary.omzet)} 
                    vSx={{ fontWeight: 700, color: 'success.main' }}
                  />
                  <RowKV 
                    k="Harga Pokok Penjualan" 
                    v={`- ${fmtIDR(financialSummary.hpp)}`} 
                    vSx={{ fontWeight: 600, color: 'error.main' }}
                  />
                  <Divider />
                  <RowKV 
                    k="Laba Kotor" 
                    v={fmtIDR(financialSummary.laba)} 
                    vSx={{ 
                      fontWeight: 800, 
                      fontSize: '1.2rem',
                      color: financialSummary.laba >= 0 ? 'success.main' : 'error.main' 
                    }}
                  />
                  <RowKV 
                    k="Margin Laba" 
                    v={`${financialSummary.margin}%`}
                    vSx={{ 
                      fontWeight: 700, 
                      color: financialSummary.margin >= 0 ? 'info.main' : 'error.main' 
                    }}
                  />
                  <Box sx={{ mt: 1, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {financialSummary.transactionCount} transaksi • {financialSummary.totalQty} tabung
                    </Typography>
                  </Box>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{
            background: `linear(135deg, ${alpha(theme.palette.info.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
            border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`
          }}>
            <CardHeader
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BarChartIcon color="info" />
                  <Typography variant="h6" fontWeight={700}>Penjualan 7 Hari Terakhir</Typography>
                </Box>
              }
              subheader="Trend penjualan harian"
              sx={{ pb: 2, borderBottom: 1, borderColor: "divider" }}
            />
            <CardContent>
              <MiniBarChartLabeled data={series7} loading={loading} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Analitik Penjualan - MEMPERTAHANKAN LOGIC LAMA */}
      <Card sx={{
        background: `linear(135deg, ${alpha(theme.palette.warning.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
        border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`
      }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InsightsOutlined color="warning" />
              <Typography variant="h6" fontWeight={700}>Analitik Penjualan</Typography>
            </Box>
          }
          sx={{ pb: 2, borderBottom: 1, borderColor: "divider" }}
        />
        <CardContent>
          {analyticsLoading ? (
            <Stack spacing={2}>
              <Skeleton height={40} />
              <Skeleton height={40} />
              <Skeleton height={40} />
            </Stack>
          ) : (
            <Grid container spacing={3}>
              {/* Top Customers - LOGIC LAMA */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PeopleIcon fontSize="small" />
                  Top Customers (Bulan Ini)
                </Typography>
                <TableContainer 
                  component={Paper} 
                  elevation={0}
                  sx={{ 
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2
                  }}
                >
                  <Table size={isSmallMobile ? "small" : "medium"}>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: theme.palette.background.default }}>
                        <TableCell sx={{ fontWeight: 700 }}>Pelanggan</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Transaksi</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(analytics.topCustomers || []).map((c, i) => (
                        <TableRow key={i} hover>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>
                            <Button
                              size="small"
                              variant="text"
                              startIcon={<VisibilityOutlined fontSize="small" />}
                              sx={btnLinkSx}
                              onClick={() => openCustomerHistory(c.customer_name)}
                            >
                              {isSmallMobile ? c.customer_name.slice(0, 12) + '...' : c.customer_name}
                            </Button>
                          </TableCell>
                          <TableCell align="right">{c.total_transaksi}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            {fmtIDR(c.total_value)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {!analytics.topCustomers?.length && (
                        <EmptyStateRow colSpan={3} message="Belum ada data" hint="Data pelanggan akan muncul setelah ada transaksi bulan ini." />
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              {/* Perbandingan - LOGIC LAMA TETAP DIJAGA */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CompareArrowsIcon fontSize="small" />
                  Perbandingan Kinerja
                </Typography>
                <Stack spacing={2}>
                  {analytics.weekly && (
                    <ComparisonCard 
                      title="Minggu Ini vs Minggu Lalu"
                      current={analytics.weekly.this_week_qty}
                      previous={analytics.weekly.last_week_qty}
                      growth={analytics.weekly.growthPct}
                      type="qty"
                    />
                  )}
                  {analytics.monthly && (
                    <>
                      <ComparisonCard 
                        title="Bulan Ini vs Bulan Lalu (Qty)"
                        current={analytics.monthly.this_month_qty}
                        previous={analytics.monthly.last_month_qty}
                        growth={analytics.monthly.growthPctQty}
                        type="qty"
                      />
                      <ComparisonCard 
                        title="Bulan Ini vs Bulan Lalu (Omzet)"
                        current={analytics.monthly.this_month_value}
                        previous={analytics.monthly.last_month_value}
                        growth={analytics.monthly.growthPctOmzet}
                        type="currency"
                      />
                    </>
                  )}
                  {!analytics.weekly && !analytics.monthly && (
                    <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                      <CompareArrowsIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                      <Typography>Data perbandingan belum tersedia</Typography>
                    </Box>
                  )}
                </Stack>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Transaksi Terbaru */}
      <Card sx={{
        background: `linear(135deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, ${alpha(theme.palette.info.main, 0.03)} 100%)`,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
      }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ReceiptLongIcon color="primary" />
              <Typography variant="h6" fontWeight={700}>Transaksi Terbaru</Typography>
            </Box>
          }
          sx={{ pb: 2, borderBottom: 1, borderColor: "divider" }}
        />
        <CardContent>
          {loading ? (
            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2 }}>
              <Table>
                <TableBody>
                  {[...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(5)].map((_, j) => (
                        <TableCell key={j}><Skeleton variant="text" height={40} /></TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <TableContainer 
              component={Paper} 
              elevation={0}
              sx={{ 
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                maxHeight: 400
              }}
            >
              <Table stickyHeader size={isSmallMobile ? "small" : "medium"}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: theme.palette.background.default }}>
                    <TableCell sx={{ fontWeight: 700 }}>Tanggal</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Pelanggan</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Qty</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Metode</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recent.map((x) => (
                    <TableRow key={x.id} hover>
                      <TableCell sx={{ whiteSpace: "nowrap", fontFamily: 'monospace', fontSize: isSmallMobile ? '0.75rem' : 'inherit' }}>
                        {(x.created_at || "").slice(0, 10)}
                      </TableCell>
                      <TableCell>
                        <Typography variant={isSmallMobile ? "caption" : "body2"} fontWeight={500}>
                          {isSmallMobile && x.customer && x.customer.length > 12 
                            ? x.customer.slice(0, 12) + '...' 
                            : x.customer || "PUBLIC"}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        {x.qty}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={x.method} 
                          size="small" 
                          color={x.method === 'TUNAI' ? 'success' : 'primary'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                        {fmtIDR((Number(x.qty) || 0) * (Number(x.price) || 0))}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!recent.length && (
                    <EmptyStateRow
                      colSpan={5}
                      message="Belum ada transaksi"
                      hint="Transaksi terbaru akan muncul di sini setelah ada penjualan."
                    />
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

{/* Modal: Riwayat Pelanggan */}
<Dialog fullWidth maxWidth="md" open={openHist} onClose={closeCustomerHistory}>
  <DialogTitle>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <PeopleIcon color="primary" />
      Riwayat Transaksi — {histName}
    </Box>
  </DialogTitle>
  <DialogContent dividers>
    {histLoading ? (
      <Stack spacing={1} sx={{ py: 2 }}>
        {[...Array(5)].map((_, i) => <Skeleton key={i} height={53} />)}
      </Stack>
    ) : (
      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2 }}>
        <Table size="medium">
          <TableHead>
            <TableRow sx={{ backgroundColor: theme.palette.background.default }}>
              <TableCell sx={{ fontWeight: 700 }}>Tanggal</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Qty</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Metode & Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Total</TableCell>
            </TableRow>
          </TableHead> {/* ← HAPUS salah satu </TableHead> yang berlebih */}
          <TableBody>
            {(histRows || []).map((r) => (
              <TableRow key={r.id} hover>
                <TableCell sx={{ whiteSpace: "nowrap", fontFamily: 'monospace' }}>
                  {String(r.created_at || "").slice(0,10)}
                </TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                  {r.qty}
                </TableCell>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Chip 
                      label={r.method} 
                      size="small" 
                      color={r.method === 'TUNAI' ? 'success' : 'primary'}
                      variant="outlined"
                    />
                    {r.method === "HUTANG" && (
                      <Chip
                        size="small"
                        label={(String(r.status || "").toUpperCase() === "LUNAS") ? "LUNAS" : "BELUM"}
                        color={(String(r.status || "").toUpperCase() === "LUNAS") ? "success" : "error"}
                        variant="filled"
                      />
                    )}
                  </Stack>
                </TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                  {fmtIDR((Number(r.qty)||0) * (Number(r.price)||0))}
                </TableCell>
              </TableRow>
            ))}
            {!histRows?.length && (
              <EmptyStateRow colSpan={4} message="Tidak ada riwayat transaksi" />
            )}
          </TableBody>
        </Table>
      </TableContainer>
    )}
  </DialogContent>
  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
    <Typography variant="h6" fontWeight={700} color="primary.main">
      Total Qty: {histLoading ? "…" : histTotalQty}
    </Typography>
    <DialogActions sx={{ px: 0 }}>
      <Button variant="contained" sx={btnDialogSx} onClick={closeCustomerHistory}>
        Tutup
      </Button>
    </DialogActions>
  </Stack>
</Dialog>
    </Stack>
  );
}