// src/components/views/DashboardView.jsx
import React, { useEffect, useState } from "react";
import { COLORS } from "../../utils/constants.js";
import { fmtIDR, todayStr } from "../../utils/helpers.js";
import { DataService } from "../../services/DataService.js";
import { supabase } from "../../lib/supabase.js";
import { useSettings } from "../../context/SettingsContext.jsx";

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
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";

const LOW_STOCK_THRESHOLD = 5;

/* ====== Small UI parts ====== */
function StatTile({ title, value, subtitle, color = "primary", icon }) {
  return (
    <Card sx={{ height: "100%", display: "flex" }}>
      <CardContent
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          py: 1.5,
        }}
      >
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
        sx={{
          height: 10,
          borderRadius: 5,
          "& .MuiLinearProgress-bar": { borderRadius: 5 },
        }}
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
    <Box sx={{ px: 1, py: 1 }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `repeat(${Math.max(data.length, 1)}, 1fr)`,
          alignItems: "end",
          gap: 1.5,
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
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ gridColumn: "1 / -1", textAlign: "center" }}
          >
            Belum ada data penjualan
          </Typography>
        )}
      </Box>
    </Box>
  );
}

/* ====== Main View ====== */
export default function DashboardView({ stocks = {} }) {
  const isi = Number(stocks.ISI || 0);
  const kosong = Number(stocks.KOSONG || 0);
  const total = isi + kosong;

  const { settings } = useSettings();
  const hppSetting = Number(settings?.hpp || 0); // ambil HPP dari pengaturan

  const [sum, setSum] = useState({ qty: 0, omzet: 0, laba: 0 });
  const [today, setToday] = useState({ qty: 0, money: 0 });
  const [piutang, setPiutang] = useState(0);
  const [recent, setRecent] = useState([]);
  const [series7, setSeries7] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  // === FAST PATH: tampilkan snapshot instan dari cache, lalu revalidate di belakang layar
  useEffect(() => {
    let alive = true;

    (async () => {
      // 1) ambil snapshot cepat (bisa dari cache localStorage)
      const snap = await DataService.getDashboardSnapshot({ revalidate: true });
      if (!alive) return;

      setPiutang(snap.receivables ?? 0);
      setSeries7(Array.isArray(snap.sevenDays) ? snap.sevenDays : []);
      setRecent(Array.isArray(snap.recentSales) ? snap.recentSales : []);

      // tampilkan UI terlebih dahulu
      setLoading(false);

      // 2) heavy compute untuk ringkasan keuangan + penjualan hari ini (non-blocking)
      fetchHeavy();
    })();

    // dengarkan broadcast hasil revalidate snapshot
    const onSnap = (e) => {
      if (!alive) return;
      const s = e.detail || {};
      setPiutang(s.receivables ?? 0);
      setSeries7(Array.isArray(s.sevenDays) ? s.sevenDays : []);
      setRecent(Array.isArray(s.recentSales) ? s.recentSales : []);
    };
    window.addEventListener("dashboard:snapshot", onSnap, { passive: true });

    // realtime supabase → revalidate ringan
    const ch = supabase
      .channel("dashboard-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "sales" }, () => {
        DataService.getDashboardSnapshot({ revalidate: true });
        fetchHeavy(); // agar ringkasan keuangan ikut ter-update
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "stocks" }, () => {
        DataService.getDashboardSnapshot({ revalidate: true });
      })
      .subscribe();

    return () => {
      alive = false;
      window.removeEventListener("dashboard:snapshot", onSnap);
      try { supabase.removeChannel(ch); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // bila HPP berubah → hitung ulang laba
  useEffect(() => {
    fetchHeavy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hppSetting]);

  // ===== heavy fetch (jalan di background, tidak blokir render awal)
  const fetchHeavy = async () => {
    try {
      // Ambil data sekali secara paralel
      const [rows, todaySum] = await Promise.all([
        DataService.loadSales(500),
        DataService.getSalesSummary({ from: todayStr(), to: todayStr() }).catch(() => ({ qty: 0, money: 0 })),
      ]);

      const notVoid = (rows || []).filter(
        (r) => String(r.status || "").toUpperCase() !== "DIBATALKAN"
      );

      const qty = notVoid.reduce((a, b) => a + Number(b.qty || 0), 0);
      const paid = notVoid.filter(
        (r) =>
          String(r.method).toUpperCase() === "TUNAI" ||
          String(r.status || "").toUpperCase() === "LUNAS"
      );

      // gunakan r.total bila ada (lebih akurat), fallback ke qty*price
      const getTotal = (r) =>
        Number.isFinite(Number(r.total)) && Number(r.total) > 0
          ? Number(r.total)
          : (Number(r.qty) || 0) * (Number(r.price) || 0);

      const omzet = paid.reduce((a, b) => a + getTotal(b), 0);
      const hpp = paid.reduce((a, b) => a + Number(b.qty || 0) * hppSetting, 0);
      const laba = omzet - hpp;

      setSum({ qty, omzet, laba });
      setToday(todaySum || { qty: 0, money: 0 });
      setErr("");
    } catch (e) {
      setErr(e.message || "Gagal memuat dashboard");
    }
  };

  return (
    <Stack spacing={1.5}>
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
      <Grid container spacing={1.5} alignItems="stretch">
        <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
          <StatTile
            title="Stok Isi"
            value={loading ? <Skeleton width={60} /> : Number(stocks.ISI || 0)}
            subtitle={Number(stocks.ISI || 0) <= LOW_STOCK_THRESHOLD ? "⚠️ Stok menipis" : "Siap jual"}
            color="success"
            icon={<Inventory2Icon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
          <StatTile
            title="Stok Kosong"
            value={loading ? <Skeleton width={60} /> : Number(stocks.KOSONG || 0)}
            subtitle={Number(stocks.KOSONG || 0) <= LOW_STOCK_THRESHOLD ? "⚠️ Stok menipis" : "Tabung kembali"}
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
          {loading ? (
            <Skeleton height={24} />
          ) : (
            <StockProgress isi={Number(stocks.ISI || 0)} kosong={Number(stocks.KOSONG || 0)} />
          )}
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
                  <RowKV
                    k="Laba"
                    v={fmtIDR(sum.laba)}
                    vSx={{ color: "success.main", fontWeight: 700 }}
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

      {/* Penjualan 7 Hari Terakhir */}
      <Card>
        <CardHeader title="Penjualan 7 Hari Terakhir" />
        <CardContent>
          {loading ? <Skeleton height={120} /> : <MiniBarChartLabeled data={series7} />}
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
                        {fmtIDR(
                          Number.isFinite(Number(x.total)) && Number(x.total) > 0
                            ? Number(x.total)
                            : (Number(x.qty) || 0) * (Number(x.price) || 0)
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
