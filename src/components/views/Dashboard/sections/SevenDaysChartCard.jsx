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

export default function SevenDaysChartCard({ loading = false }) {
  const theme = useTheme();
  const isMobile = useMediaQuery("(max-width:600px)");

  const [mode, setMode] = useState("7_hari");
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  const [series, setSeries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const months = [
    "Januari","Februari","Maret","April","Mei","Juni",
    "Juli","Agustus","September","Oktober","November","Desember"
  ];
  const years = [
    new Date().getFullYear() - 1,
    new Date().getFullYear(),
    new Date().getFullYear() + 1
  ];

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
          return { label: w.label, value: w.value, total: w.totalValue };
        });
        setSeries(formatted);
        const last = formatted[3]?.value || 0;
        const prevAvg = formatted.slice(0,3).reduce((s,x)=>s+x.value,0)/3 || 0;
        const growth = prevAvg>0 ? ((last-prevAvg)/prevAvg)*100 : 0;
        setSummary({ totalQty, totalValue, avgWeeklyQty: totalQty/4, growth });
      } else if (mode === "mingguan_bulan") {
        const weekly = await DataService.getMonthlyWeeklyBreakdown(year, month);
        let totalQty=0, totalValue=0;
        const formatted = weekly.map(w => {
          totalQty += w.value; totalValue += w.totalValue;
          return { label:w.label, value:w.value, total:w.totalValue };
        });
        setSeries(formatted);
        setSummary({
          totalQty,
          totalValue,
          avgWeeklyQty: formatted.length ? totalQty / formatted.length : 0,
          weekCount: formatted.length
        });
      } else if (mode === "6_bulan") {
        const rows = await DataService.getLast6MonthsSales();
        const formatted = rows.map(m => ({
          label:m.label, value:m.value, total:m.totalValue
        }));
        setSeries(formatted);
        const total = formatted.reduce((s,x)=>s+x.value,0);
        const last = formatted[5]?.value || 0;
        const prevAvg = formatted.slice(0,5).reduce((s,x)=>s+x.value,0)/5 || 0;
        const growth = prevAvg>0 ? ((last-prevAvg)/prevAvg)*100 : 0;
        setSummary({ totalQty: total, avgMonthlyQty: total/6, growth });
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
    <Card
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        border: `1px solid ${alpha(theme.palette.divider,0.1)}`,
        backgroundColor: "#fff",
      }}
    >
      <CardHeader
        sx={{
          py: 1.5,
          bgcolor: "#fff",
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
                color={
                  summary.growth > 0 ? "success" :
                  summary.growth < 0 ? "error" : "default"
                }
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
              sx={{
                backgroundColor: alpha(theme.palette.primary.main, 0.04),
                borderRadius: 2
              }}
            >
              <ToggleButton value="7_hari">7h</ToggleButton>
              <ToggleButton value="4_minggu">4w</ToggleButton>
              <ToggleButton value="mingguan_bulan">Minggu/Bln</ToggleButton>
              <ToggleButton value="6_bulan">6m</ToggleButton>
            </ToggleButtonGroup>

            {(mode === "mingguan_bulan" || mode === "6_bulan") && (
              <Stack direction="row" spacing={1}>
                <FormControl
                  size="small"
                  sx={{ minWidth: 120 }}
                  disabled={isLoading || mode==="6_bulan"}
                >
                  <InputLabel>Bulan</InputLabel>
                  <Select
                    value={month}
                    label="Bulan"
                    onChange={(e)=>setMonth(e.target.value)}
                  >
                    {months.map((m,i)=>(<MenuItem key={i} value={i}>{m}</MenuItem>))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 100 }} disabled={isLoading}>
                  <InputLabel>Tahun</InputLabel>
                  <Select
                    value={year}
                    label="Tahun"
                    onChange={(e)=>setYear(e.target.value)}
                  >
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

        {/* TABEL GANTI CHART */}
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 400, border: "1px solid #eee" }}>
            <TableHead>
              <TableRow sx={{ background: "#f9fafb" }}>
                <TableCell align="center">Periode</TableCell>
                <TableCell align="center">Qty (tabung)</TableCell>
                {!isMobile && <TableCell align="center">Total (Rp)</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {series.map((row, idx) => (
                <TableRow key={idx} hover>
                  <TableCell align="center">{row.label}</TableCell>
                  <TableCell align="center">
                    <Typography fontWeight={600}>{row.value}</Typography>
                  </TableCell>
                  {!isMobile && (
                    <TableCell align="center">
                      {row.total
                        ? `Rp ${new Intl.NumberFormat("id-ID").format(row.total)}`
                        : "-"}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>

        {/* Summary */}
        {summary && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap">
              <Chip size="small" label={`Total: ${summary.totalQty || 0}`} />
              <Chip
                size="small"
                label={`Rata-rata: ${Math.round(
                  summary.avgWeeklyQty || summary.avgMonthlyQty || 0
                )}`}
              />
              <Chip
                size="small"
                color={
                  summary.growth > 0 ? "success" :
                  summary.growth < 0 ? "error" : "default"
                }
                label={`Growth: ${summary.growth?.toFixed(1) || 0}%`}
              />
            </Stack>
          </>
        )}
      </CardContent>

      <CardActions sx={{
        px: 2, pb: 2, pt: 0,
        display: "flex",
        justifyContent: "space-between",
        backgroundColor: "#fff"
      }}>
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
