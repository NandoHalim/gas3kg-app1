// src/components/views/Dashboard/sections/SevenDaysChartCard.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Card, CardHeader, CardContent, CardActions,
  Box, Stack, Typography, Chip, Divider,
  ToggleButtonGroup, ToggleButton,
  FormControl, Select, MenuItem, InputLabel, Tooltip, Alert
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import TimelineIcon from "@mui/icons-material/Timeline";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import BoltIcon from "@mui/icons-material/Bolt";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import MiniBarChartLabeled from "../ui/MiniBarChartLabeled.jsx";
import { DataService } from "../../../../services/DataService";

// 🔄 New, modern & responsive card with the same information content.
// Modes: 7_hari | 4_minggu | mingguan_bulan | 6_bulan
export default function SevenDaysChartCard({ loading = false }) {
  const theme = useTheme();

  const [mode, setMode] = useState("7_hari");
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear]   = useState(new Date().getFullYear());

  const [series, setSeries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const months = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  const years  = [new Date().getFullYear()-1, new Date().getFullYear(), new Date().getFullYear()+1];

  useEffect(() => { load(); }, [mode, month, year]);

  async function load() {
    setIsLoading(true); setError(null);
    try {
      if (mode === "7_hari") {
        const rows = await DataService.getSevenDaySalesRealtime();
        const formatted = rows.map(r => ({
          label: new Date(r.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
          value: r.qty || 0,
          tooltip: `Tanggal: ${new Date(r.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}\nQty: ${r.qty||0} tabung`
        }));
        setSeries(formatted);
        setSummary(null);
        if (!formatted.length) setError("Tidak ada data penjualan untuk 7 hari terakhir");
      } else if (mode === "4_minggu") {
        const weekly = await DataService.getLast4WeeksSales();
        let totalQty=0, totalValue=0;
        const formatted = weekly.map(w => {
          totalQty += w.value; totalValue += w.totalValue;
          return {
            label: w.label,
            value: w.value,
            tooltip: `Minggu ${w.weekNumber} (${w.dateRange})\nQty: ${w.value} tabung\nTotal: Rp ${new Intl.NumberFormat("id-ID").format(w.totalValue)}`
          };
        });
        setSeries(formatted);
        const last = formatted[3]?.value || 0;
        const prevAvg = formatted.slice(0,3).reduce((s,x)=>s+x.value,0)/3 || 0;
        const growth = prevAvg>0 ? ((last-prevAvg)/prevAvg)*100 : 0;
        setSummary({ type:"4_minggu", totalQty, totalValue, avgWeeklyQty: totalQty/4, growth, lastWeekQty:last });
        if (totalQty===0) setError("Tidak ada data penjualan untuk 4 minggu terakhir");
      } else if (mode === "mingguan_bulan") {
        const weekly = await DataService.getMonthlyWeeklyBreakdown(year, month);
        let totalQty=0, totalValue=0;
        const formatted = weekly.map(w => {
          totalQty += w.value; totalValue += w.totalValue;
          return { label:w.label, value:w.value, tooltip:w.tooltip, weekNumber:w.weekNumber, dateRange:w.dateRange };
        });
        setSeries(formatted);
        setSummary({ type:"mingguan_bulan", totalQty, totalValue, avgWeeklyQty: formatted.length? totalQty/formatted.length : 0, weekCount: formatted.length });
        if (totalQty===0) setError(`Tidak ada data penjualan pada ${months[month]} ${year}`);
      } else if (mode === "6_bulan") {
        const rows = await DataService.getLast6MonthsSales();
        const formatted = rows.map(m => ({ label:m.label, value:m.value, tooltip:m.tooltip, month:m.month, year:m.year }));
        setSeries(formatted);
        const total = formatted.reduce((s,x)=>s+x.value,0);
        const last = formatted[5]?.value || 0;
        const prevAvg = formatted.slice(0,5).reduce((s,x)=>s+x.value,0)/5 || 0;
        const growth = prevAvg>0 ? ((last-prevAvg)/prevAvg)*100 : 0;
        setSummary({ type:"6_bulan", totalQty: total, avgMonthlyQty: total/6, growth, lastMonthQty: last });
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
    <Card sx={{ borderRadius: 3, overflow: "hidden", border: `1px solid ${alpha(theme.palette.divider,0.1)}` }}>
      {/* Header baru: title + toggle + meta */}
      <CardHeader
        sx={{
          py: 1.5,
          bgcolor: alpha(theme.palette.background.paper, 0.9),
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
        }}
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <TimelineIcon fontSize="small" color="primary" />
            <Typography variant="subtitle1" fontWeight={700}>
              Tren Penjualan
            </Typography>
            {summary?.growth !== undefined && (
              <Chip
                size="small"
                variant="outlined"
                color={summary.growth > 0 ? "success" : summary.growth < 0 ? "error" : "default"}
                label={`${summary.growth>0?"+":""}${(summary.growth||0).toFixed(1)}%`}
              />
            )}
            <Tooltip title="Update realtime, kalkulasi mengikuti kalender.">
              <InfoOutlinedIcon fontSize="small" sx={{ color: "text.disabled" }} />
            </Tooltip>
          </Stack>
        }
        action={
          <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
            <ToggleButtonGroup
              size="small"
              color="primary"
              exclusive
              value={mode}
              onChange={(_, v) => v && setMode(v)}
              sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.04), borderRadius: 2 }}
            >
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

      <CardContent sx={{ pt: 2, pb: 1.5 }}>
        {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

        {/* KPI strip */}
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 1.5 }}>
          <Chip
            icon={<BoltIcon />}
            label={mode==="7_hari" ? "Realtime aktif" : mode==="4_minggu" ? "Rolling 28 hari" : mode==="mingguan_bulan" ? "Mulai tgl 1" : "Termasuk bulan berjalan"}
            size="small"
            sx={{ bgcolor: alpha(theme.palette.info.main, 0.08), color: theme.palette.info.main }}
          />
          <Chip
            icon={<TrendingUpIcon />}
            label={mode==="4_minggu" ? `Rata2/Minggu: ${summary ? Math.round(summary.avgWeeklyQty) : "-"}` :
                   mode==="mingguan_bulan" ? `Rata2/Minggu: ${summary ? Math.round(summary.avgWeeklyQty) : "-"}` :
                   mode==="6_bulan" ? `Rata2/Bulan: ${summary ? Math.round(summary.avgMonthlyQty) : "-"}` : " "}
            size="small"
            sx={{ bgcolor: alpha(theme.palette.success.main, 0.08), color: theme.palette.success.main }}
          />
          {summary && (mode==="4_minggu" || mode==="6_bulan") && (
            <Chip
              icon={<CalendarMonthIcon />}
              label={mode==="4_minggu" ? `Qty Minggu Terakhir: ${summary.lastWeekQty}` : `Qty Bulan Terakhir: ${summary.lastMonthQty}`}
              size="small"
              sx={{ bgcolor: alpha(theme.palette.warning.main, 0.08), color: theme.palette.warning.main }}
            />
          )}
        </Stack>

        {/* Chart */}
        <Box sx={{ overflowX: "hidden" }}>
          <MiniBarChartLabeled data={series} loading={isLoading || loading} height={mode==="7_hari" ? 140 : 170} type={mode} />
        </Box>

        {/* Footer stats row */}
        {summary && mode!=="7_hari" && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap">
              <Stat label={mode==="6_bulan" ? "Total 6 Bulan" : (mode==="4_minggu" ? "Total 4 Minggu" : "Total Bulan")}
                    value={
                      mode==="6_bulan" ? (summary.totalQty ?? 0)
                      : mode==="4_minggu" ? (summary.totalQty ?? 0)
                      : (summary.totalQty ?? 0)
                    }
              />
              <Stat label={mode==="6_bulan" ? "Rata-rata/Bulan" : "Rata-rata/Minggu"}
                    value={
                      mode==="6_bulan" ? Math.round(summary.avgMonthlyQty ?? 0)
                      : Math.round(summary.avgWeeklyQty ?? 0)
                    }
              />
              <Stat label="Growth"
                    value={`${summary.growth>0?"+":""}${(summary.growth||0).toFixed(1)}%`}
                    color={summary.growth>0 ? "success" : summary.growth<0 ? "error" : "default"}
              />
            </Stack>
          </>
        )}
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2, pt: 0, display: "flex", justifyContent: "space-between" }}>
        <Typography variant="caption" color="text.secondary">
          Data sinkron, kecuali status <b>DIBATALKAN</b>.
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {mode==="7_hari" ? "Per hari (T-6 s/d hari ini)" :
           mode==="4_minggu" ? "4 minggu bergulir" :
           mode==="mingguan_bulan" ? "M1..M5 sesuai kalender" : "6 bulan termasuk bulan ini"}
        </Typography>
      </CardActions>
    </Card>
  );
}

function Stat({ label, value, color="primary" }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Chip size="small" label={label} sx={{ bgcolor: alpha("#000", 0.04) }} />
      <Typography variant="body2" fontWeight={700} color={`${color}.main`}>
        {value}
      </Typography>
    </Stack>
  );
}
