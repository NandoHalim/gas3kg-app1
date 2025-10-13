// src/components/views/Dashboard/sections/SevenDaysChartCard.jsx
import React, { useState, useEffect } from "react";
import {
  Card, CardHeader, CardContent, Box, Typography, FormControl,
  InputLabel, Select, MenuItem, Chip, Grid, Alert
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import BarChartIcon from "@mui/icons-material/BarChart";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import MiniBarChartLabeled from "../ui/MiniBarChartLabeled.jsx";

// ✅ gunakan DataService dengan fungsi baru (sudah kamu patch)
import { DataService } from "../../../../services/DataService";

function SevenDaysChartCard({ loading = false }) {
  const theme = useTheme();

  const [chartType, setChartType] = useState("7_hari");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [series, setSeries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  const months = [
    "Januari","Februari","Maret","April","Mei","Juni",
    "Juli","Agustus","September","Oktober","November","Desember"
  ];
  const years = [new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1];

  const chartTypes = [
    { value: "7_hari", label: "7 Hari Terakhir", icon: "📊" },
    { value: "4_minggu", label: "4 Minggu Terakhir", icon: "📅" },
    { value: "mingguan_bulan", label: "Mingguan per Bulan", icon: "📅" },
    { value: "6_bulan", label: "6 Bulan Terakhir", icon: "📈" }
  ];

  useEffect(() => { loadChartData(); }, [chartType, selectedMonth, selectedYear]);

  const loadChartData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (chartType === "7_hari")       await loadLast7Days();
      else if (chartType === "4_minggu") await loadLast4Weeks();
      else if (chartType === "mingguan_bulan") await loadWeeklyMonthly();
      else if (chartType === "6_bulan") await loadLast6Months();
      else                               await loadLast7Days();
    } catch (e) {
      setError(`Gagal memuat data: ${e?.message || e}`);
      setSeries([]); setSummary(null);
    } finally {
      setIsLoading(false);
    }
  };

  // === 7 Hari Terakhir (realtime) ===
  const loadLast7Days = async () => {
    const rows = await DataService.getSevenDaySalesRealtime();
    const formatted = rows.map(r => ({
      label: new Date(r.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
      value: r.qty || 0,
      tooltip: `Tanggal: ${
        new Date(r.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })
      }\nQty: ${r.qty || 0} tabung`
    }));
    setSeries(formatted);
    setSummary(null);
    if (formatted.length === 0) setError("Tidak ada data penjualan untuk 7 hari terakhir");
  };

  // === 4 Minggu Terakhir (rolling) ===
  const loadLast4Weeks = async () => {
    const weekly = await DataService.getLast4WeeksSales();
    let totalQty = 0, totalValue = 0;
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
    const prevAvg = formatted.slice(0, 3).reduce((s, x) => s + x.value, 0) / 3 || 0;
    const growth = prevAvg > 0 ? ((last - prevAvg) / prevAvg) * 100 : 0;
    setSummary({
      type: "4_minggu",
      totalQty,
      totalValue,
      avgWeeklyQty: totalQty / 4,
      growth,
      lastWeekQty: last
    });
    if (totalQty === 0) setError("Tidak ada data penjualan untuk 4 minggu terakhir");
  };

  // === Mingguan per Bulan (mulai tgl 1, berakhir sesuai kalender) ===
  const loadWeeklyMonthly = async () => {
    const weekly = await DataService.getMonthlyWeeklyBreakdown(selectedYear, selectedMonth);
    let totalQty = 0, totalValue = 0;
    const formatted = weekly.map(w => {
      totalQty += w.value; totalValue += w.totalValue;
      return {
        label: w.label,
        value: w.value,
        tooltip: w.tooltip,
        weekNumber: w.weekNumber,
        dateRange: w.dateRange
      };
    });
    setSeries(formatted);
    setSummary({
      type: "mingguan_bulan",
      totalQty,
      totalValue,
      avgWeeklyQty: formatted.length ? totalQty / formatted.length : 0,
      weekCount: formatted.length
    });
    if (totalQty === 0) setError(`Tidak ada data penjualan pada ${months[selectedMonth]} ${selectedYear}`);
  };

  // === 6 Bulan Terakhir (termasuk bulan berjalan) ===
  const loadLast6Months = async () => {
    const rows = await DataService.getLast6MonthsSales();
    const formatted = rows.map(m => ({
      label: m.label,
      value: m.value,
      tooltip: m.tooltip,
      month: m.month,
      year: m.year
    }));
    setSeries(formatted);
    const total = formatted.reduce((s, x) => s + x.value, 0);
    const last = formatted[5]?.value || 0;
    const prevAvg = formatted.slice(0, 5).reduce((s, x) => s + x.value, 0) / 5 || 0;
    const growth = prevAvg > 0 ? ((last - prevAvg) / prevAvg) * 100 : 0;
    setSummary({
      type: "6_bulan",
      totalQty: total,
      avgMonthlyQty: total / 6,
      growth,
      lastMonthQty: last
    });
    if (total === 0) setError("Tidak ada data penjualan untuk 6 bulan terakhir");
  };

  const getIcon = () => {
    switch (chartType) {
      case "7_hari": return <BarChartIcon color="info" />;
      case "4_minggu": return <CalendarMonthIcon color="warning" />;
      case "mingguan_bulan": return <CalendarMonthIcon color="primary" />;
      case "6_bulan": return <TrendingUpIcon color="success" />;
      default: return <BarChartIcon color="info" />;
    }
  };

  const getGrowthChip = (growth) => {
    if (growth === undefined || growth === null) return null;
    const pos = growth > 0, neu = growth === 0;
    return (
      <Chip
        label={`${pos ? "+" : ""}${growth.toFixed(1)}%`}
        color={neu ? "default" : pos ? "success" : "error"}
        variant="outlined"
        size="small"
        sx={{ ml: 1 }}
      />
    );
  };

  return (
    <Card
      sx={{
        background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
        border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`
      }}
    >
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {getIcon()}
            <Typography variant="h6" fontWeight={700}>
              {chartType === "7_hari"
                ? "7 Hari Terakhir"
                : chartType === "4_minggu"
                ? "4 Minggu Terakhir"
                : chartType === "mingguan_bulan"
                ? "Mingguan per Bulan"
                : "6 Bulan Terakhir"}
              {summary?.growth !== undefined && getGrowthChip(summary.growth)}
            </Typography>
          </Box>
        }
        subheader={
          chartType === "7_hari"
            ? "Trend penjualan harian 7 hari terakhir"
            : chartType === "4_minggu"
            ? "Perbandingan penjualan 4 minggu terakhir"
            : chartType === "mingguan_bulan"
            ? `Perbandingan mingguan bulan ${months[selectedMonth]} ${selectedYear}`
            : "Trend penjualan 6 bulan terakhir"
        }
        action={
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            {(chartType === "mingguan_bulan" || chartType === "6_bulan") && (
              <>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Bulan</InputLabel>
                  <Select
                    value={selectedMonth}
                    label="Bulan"
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    disabled={isLoading || chartType === "6_bulan"}
                  >
                    {months.map((m, i) => (
                      <MenuItem key={i} value={i}>{m}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <InputLabel>Tahun</InputLabel>
                  <Select
                    value={selectedYear}
                    label="Tahun"
                    onChange={(e) => setSelectedYear(e.target.value)}
                    disabled={isLoading}
                  >
                    {years.map((y) => (
                      <MenuItem key={y} value={y}>{y}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            )}
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Tampilan</InputLabel>
              <Select
                value={chartType}
                label="Tampilan"
                onChange={(e) => setChartType(e.target.value)}
                disabled={isLoading}
              >
                <MenuItem value="7_hari">📊 7 Hari Terakhir</MenuItem>
                <MenuItem value="4_minggu">📅 4 Minggu Terakhir</MenuItem>
                <MenuItem value="mingguan_bulan">📅 Mingguan per Bulan</MenuItem>
                <MenuItem value="6_bulan">📈 6 Bulan Terakhir</MenuItem>
              </Select>
            </FormControl>
          </Box>
        }
        sx={{ pb: 2, borderBottom: 1, borderColor: "divider" }}
      />
      <CardContent>
        {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}
        <MiniBarChartLabeled
          data={series}
          loading={isLoading || loading}
          height={chartType === "7_hari" ? 120 : 160}
          type={chartType}
        />
        {/* Ringkasan non-7hari */}
        {summary && chartType !== "7_hari" && (
          <Box sx={{ mt: 2, p: 1, bgcolor: alpha(theme.palette.info.main, 0.04), borderRadius: 1 }}>
            {chartType === "4_minggu" && (
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Total 4 Minggu:</Typography>
                  <Typography fontWeight={600}>{summary.totalQty} tabung</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Rata-rata/Minggu:</Typography>
                  <Typography fontWeight={600}>{Math.round(summary.avgWeeklyQty)} tabung</Typography>
                </Grid>
              </Grid>
            )}
            {chartType === "mingguan_bulan" && (
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Total Bulan:</Typography>
                  <Typography fontWeight={600}>{summary.totalQty} tabung</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Rata-rata/Minggu:</Typography>
                  <Typography fontWeight={600}>{Math.round(summary.avgWeeklyQty)} tabung</Typography>
                </Grid>
              </Grid>
            )}
            {chartType === "6_bulan" && (
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Total 6 Bulan:</Typography>
                  <Typography fontWeight={600}>{summary.totalQty} tabung</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Rata-rata/Bulan:</Typography>
                  <Typography fontWeight={600}>{Math.round(summary.avgMonthlyQty)} tabung</Typography>
                </Grid>
              </Grid>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default SevenDaysChartCard;
