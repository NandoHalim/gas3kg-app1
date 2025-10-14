// src/components/views/Dashboard/sections/SevenDaysChartCard.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Card, CardHeader, CardContent, CardActions,
  Box, Stack, Typography, Chip, Divider,
  ToggleButtonGroup, ToggleButton,
  FormControl, Select, MenuItem, InputLabel, Tooltip, Alert,
  Table, TableHead, TableRow, TableCell, TableBody, useMediaQuery
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import TimelineIcon from "@mui/icons-material/Timeline";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import BoltIcon from "@mui/icons-material/Bolt";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { DataService } from "../../../../services/DataService";

// ---------- Helpers ----------
const fmt = new Intl.NumberFormat("id-ID");
const fmtRp = (n) => (n || n === 0 ? `Rp ${fmt.format(Math.round(n))}` : "-");
const pct = (v) => `${v > 0 ? "+" : ""}${(v || 0).toFixed(1)}%`;
const deltaPct = (cur, prev) => (prev > 0 ? ((cur - prev) / prev) * 100 : 0);

// Sparkline bar kecil (pure SVG, tanpa lib)
function Spark({ values = [] }) {
  const max = Math.max(...values, 1);
  const w = 56, h = 20, gap = 2;
  const bw = (w - gap * (values.length - 1)) / Math.max(values.length, 1);
  return (
    <svg width={w} height={h} aria-hidden focusable="false">
      {values.map((v, i) => {
        const bh = Math.max(2, (v / max) * (h - 2));
        return (
          <rect
            key={i}
            x={i * (bw + gap)}
            y={h - bh}
            width={bw}
            height={bh}
            rx="2"
            fill="#2f7eea"
            opacity={i === values.length - 1 ? 1 : 0.6}
          />
        );
      })}
    </svg>
  );
}

// Tabel data utama
function DataTable({ rows }) {
  const isMobile = useMediaQuery("(max-width:600px)");
  return (
    <Box sx={{ overflowX: "auto" }}>
      <Table size="small" sx={{ minWidth: 560, border: "1px solid #eee", borderRadius: 1 }}>
        <TableHead>
          <TableRow sx={{ bgcolor: "#f9fafb" }}>
            <TableCell>Periode</TableCell>
            <TableCell align="right">Qty</TableCell>
            {!isMobile && <TableCell align="right">Omzet</TableCell>}
            {!isMobile && <TableCell align="center">Δ% (prev)</TableCell>}
            {!isMobile && <TableCell align="center">Tren</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r, i) => {
            const prev = rows[i - 1]?.value ?? 0;
            const d = deltaPct(r.value, prev);
            const trendSlice = rows.slice(Math.max(0, i - 5), i + 1).map(x => x.value);
            return (
              <TableRow key={i} hover>
                <TableCell>{r.label}</TableCell>
                <TableCell align="right"><strong>{fmt.format(r.value)}</strong></TableCell>
                {!isMobile && <TableCell align="right">{fmtRp(r.total)}</TableCell>}
                {!isMobile && (
                  <TableCell align="center">
                    <Chip
                      size="small"
                      color={d > 0 ? "success" : d < 0 ? "error" : "default"}
                      variant="outlined"
                      label={pct(d)}
                    />
                  </TableCell>
                )}
                {!isMobile && (
                  <TableCell align="center">
                    <Tooltip title={`Tren: ${trendSlice.join(", ")}`} enterTouchDelay={20}>
                      <span><Spark values={trendSlice} /></span>
                    </Tooltip>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
}

// ---------- Main Card ----------
export default function SevenDaysChartCard({ loading = false }) {
  const theme = useTheme();
  const [mode, setMode] = useState("7_hari");
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [series, setSeries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const months = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  const years  = [year - 1, year, year + 1];

  useEffect(() => { load(); }, [mode, month, year]);

  async function load() {
    setIsLoading(true); setError(null);
    try {
      if (mode === "7_hari") {
        const rows = await DataService.getSevenDaySalesRealtime();
        const formatted = rows.map(r => ({
          label: new Date(r.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
          value: r.qty || 0,
          total: r.totalValue || null
        }));
        setSeries(formatted);
        setSummary(null);
        if (!formatted.length) setError("Tidak ada data penjualan untuk 7 hari terakhir");
      } else if (mode === "4_minggu") {
        const weekly = await DataService.getLast4WeeksSales();
        let totalQty=0, totalValue=0;
        const formatted = weekly.map(w => {
          totalQty += w.value; totalValue += w.totalValue;
          return { label: w.label, value: w.value, total: w.totalValue };
        });
        setSeries(formatted);
        const last = formatted[3]?.value || 0;
        const prevAvg = formatted.slice(0,3).reduce((s,x)=>s+x.value,0)/3 || 0;
        const growth = prevAvg>0 ? ((last-prevAvg)/prevAvg)*100 : 0;
        setSummary({ totalQty, totalValue, avgWeeklyQty: totalQty/4, growth });
        if (totalQty===0) setError("Tidak ada data penjualan untuk 4 minggu terakhir");
      } else if (mode === "mingguan_bulan") {
        const weekly = await DataService.getMonthlyWeeklyBreakdown(year, month);
        let totalQty=0, totalValue=0;
        const formatted = weekly.map(w => {
          totalQty += w.value; totalValue += w.totalValue;
          return { label:w.label, value:w.value, total:w.totalValue };
        });
        setSeries(formatted);
        setSummary({
          totalQty, totalValue,
          avgWeeklyQty: formatted.length ? totalQty / formatted.length : 0,
          weekCount: formatted.length
        });
        if (totalQty===0) setError(`Tidak ada data penjualan pada ${months[month]} ${year}`);
      } else if (mode === "6_bulan") {
        const rows = await DataService.getLast6MonthsSales();
        const formatted = rows.map(m => ({ label:m.label, value:m.value, total:m.totalValue }));
        setSeries(formatted);
        const total = formatted.reduce((s,x)=>s+x.value,0);
        const last = formatted[5]?.value || 0;
        const prevAvg = formatted.slice(0,5).reduce((s,x)=>s+x.value,0)/5 || 0;
        const growth = prevAvg>0 ? ((last-prevAvg)/prevAvg)*100 : 0;
        setSummary({ totalQty: total, avgMonthlyQty: total/6, growth });
        if (total===0) setError("Tidak ada data penjualan untuk 6 bulan terakhir");
      }
    } catch (e) {
      setError(`Gagal memuat data: ${e?.message || e}`);
      setSeries([]); setSummary(null);
    } finally {
      setIsLoading(false);
    }
  }

  const headline = useMemo(() => {
    switch (mode) {
      case "7_hari": return "7 Hari Terakhir";
      case "4_minggu": return "4 Minggu Terakhir";
      case "mingguan_bulan": return `Mingguan • ${months[month]} ${year}`;
      case "6_bulan": return "6 Bulan Terakhir";
      default: return "Penjualan";
    }
  }, [mode, month, year]);

  return (
    <Card sx={{ borderRadius: 3, overflow: "hidden", border: `1px solid ${alpha(theme.palette.divider,0.1)}`, backgroundColor: "#fff" }}>
      <CardHeader
        sx={{ py: 1.5, bgcolor: "#fff", borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}` }}
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <TimelineIcon fontSize="small" color="primary" />
            <Typography variant="subtitle1" fontWeight={700}>Tren Penjualan</Typography>
            {summary?.growth !== undefined && (
              <Chip size="small" variant="outlined"
                color={summary.growth > 0 ? "success" : summary.growth < 0 ? "error" : "default"}
                label={pct(summary.growth)} />
            )}
            <Tooltip title="Update realtime, kalkulasi mengikuti kalender.">
              <InfoOutlinedIcon fontSize="small" sx={{ color: "text.secondary" }} />
            </Tooltip>
          </Stack>
        }
        action={
          <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
            <ToggleButtonGroup size="small" color="primary" exclusive value={mode} onChange={(_, v) => v && setMode(v)}
              sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.04), borderRadius: 2 }}>
              <ToggleButton value="7_hari">7h</ToggleButton>
              <ToggleButton value="4_minggu">4w</ToggleButton>
              <ToggleButton value="mingguan_bulan">Minggu/Bln</ToggleButton>
              <ToggleButton value="6_bulan">6m</ToggleButton>
            </ToggleButtonGroup>

            {(mode === "mingguan_bulan" || mode === "6_bulan") && (
              <Stack direction="row" spacing={1}>
                <FormControl size="small" sx={{ minWidth: 120 }} disabled={isLoading || mode==="6_bulan"}>
                  <InputLabel>Bulan</InputLabel>
                  <Select value={month} label="Bulan" onChange={(e)=>setMonth(e.target.value)}>
                    {months.map((m,i)=>(<MenuItem key={i} value={i}>{m}</MenuItem>))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 100 }} disabled={isLoading}>
                  <InputLabel>Tahun</InputLabel>
                  <Select value={year} label="Tahun" onChange={(e)=>setYear(e.target.value)}>
                    {years.map(y=>(<MenuItem key={y} value={y}>{y}</MenuItem>))}
                  </Select>
                </FormControl>
              </Stack>
            )}
          </Stack>
        }
        subheader={headline}
      />

      <CardContent sx={{ backgroundColor: "#fff", pt: 2 }}>
        {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

        {/* KPI strip */}
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 1.5 }}>
          <Chip icon={<BoltIcon />} size="small"
            label={mode==="7_hari" ? "Realtime aktif" : mode==="4_minggu" ? "Rolling 28 hari" : mode==="mingguan_bulan" ? "Mulai tgl 1" : "Termasuk bulan berjalan"}
            sx={{ bgcolor: alpha(theme.palette.info.main, 0.08), color: theme.palette.info.main }} />
          <Chip icon={<TrendingUpIcon />} size="small"
            label={mode==="6_bulan"
              ? `Rata2/Bulan: ${summary ? fmt.format(Math.round(summary.avgMonthlyQty||0)) : "-"}`
              : `Rata2/Minggu: ${summary ? fmt.format(Math.round(summary.avgWeeklyQty||0)) : "-"}`}
            sx={{ bgcolor: alpha(theme.palette.success.main, 0.08), color: theme.palette.success.main }} />
          {summary && (mode==="4_minggu" || mode==="6_bulan") && (
            <Chip icon={<CalendarMonthIcon />} size="small"
              label={mode==="4_minggu" ? `Total 4 Minggu: ${fmt.format(summary.totalQty)}` : `Total 6 Bulan: ${fmt.format(summary.totalQty)}`}
              sx={{ bgcolor: alpha(theme.palette.warning.main, 0.08), color: theme.palette.warning.main }} />
          )}
        </Stack>

        {/* TABEL */}
        <DataTable rows={series} />

        {/* Summary footer */}
        {summary && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap">
              <Chip size="small" label={`Total: ${fmt.format(summary.totalQty || 0)}`} />
              <Chip size="small" label={`Rata-rata: ${fmt.format(Math.round(summary.avgWeeklyQty || summary.avgMonthlyQty || 0))}`} />
              <Chip size="small" color={summary.growth>0 ? "success" : summary.growth<0 ? "error" : "default"} label={`Growth: ${pct(summary.growth || 0)}`} />
            </Stack>
          </>
        )}
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2, pt: 0, display: "flex", justifyContent: "space-between", backgroundColor: "#fff" }}>
        <Typography variant="caption" color="text.secondary">
          Data sinkron, kecuali status <b>DIBATALKAN</b>.
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {mode==="7_hari" ? "Per hari (T-6 s/d hari ini)" :
           mode==="4_minggu" ? "4 minggu bergulir" :
           mode==="mingguan_bulan" ? "M1..M5 sesuai kalender" :
           "6 bulan termasuk bulan ini"}
        </Typography>
      </CardActions>
    </Card>
  );
}
