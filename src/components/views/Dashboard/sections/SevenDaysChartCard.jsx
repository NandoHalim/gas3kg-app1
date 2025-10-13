// SevenDaysChartCard.jsx (PATCHED) - gunakan ChartsDataService
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
import { ChartsDataService } from "../../../../services/ChartsDataService";

function SevenDaysChartCard({ loading = false }) {
  const theme = useTheme();
  const [chartType, setChartType] = useState("7_hari");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [series, setSeries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  const months = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  const chartTypes = [
    { value: "7_hari", label: "7 Hari Terakhir", icon: "📊" },
    { value: "4_minggu", label: "4 Minggu Terakhir", icon: "📅" },
    { value: "mingguan_bulan", label: "Mingguan per Bulan", icon: "📅" },
    { value: "6_bulan", label: "6 Bulan Terakhir", icon: "📈" }
  ];
  const years = [new Date().getFullYear()-1, new Date().getFullYear(), new Date().getFullYear()+1];

  useEffect(()=>{ loadChartData(); }, [chartType, selectedMonth, selectedYear]);

  const loadChartData = async () => {
    setIsLoading(true); setError(null);
    try {
      if (chartType==="7_hari") await loadLast7Days();
      else if (chartType==="4_minggu") await loadLast4Weeks();
      else if (chartType==="mingguan_bulan") await loadWeeklyMonthly();
      else if (chartType==="6_bulan") await loadLast6Months();
    } catch (e) {
      setError(`Gagal memuat data: ${e.message}`);
      setSeries([]); setSummary(null);
    } finally { setIsLoading(false); }
  };

  const loadLast7Days = async () => {
    const rows = await ChartsDataService.getSevenDaySalesRealtime();
    const formatted = rows.map((r) => ({
      label: new Date(r.date).toLocaleDateString('id-ID', { day:'numeric', month:'short' }),
      value: r.qty || 0,
      tooltip: `Tanggal: ${new Date(r.date).toLocaleDateString('id-ID', { day:'numeric', month:'short' })}\nQty: ${r.qty||0} tabung`
    }));
    setSeries(formatted); setSummary(null);
    if (formatted.length===0) setError("Tidak ada data penjualan untuk 7 hari terakhir");
  };

  const loadLast4Weeks = async () => {
    const weekly = await ChartsDataService.getLast4WeeksSales();
    let totalQty=0, totalValue=0;
    const formatted = weekly.map(w=>{
      totalQty += w.value; totalValue += w.totalValue;
      return { label:w.label, value:w.value, tooltip:`Minggu ${w.weekNumber} (${w.dateRange})\nQty: ${w.value} tabung\nTotal: Rp ${new Intl.NumberFormat('id-ID').format(w.totalValue)}` };
    });
    setSeries(formatted);
    const last = formatted[3]?.value || 0;
    const prevAvg = formatted.slice(0,3).reduce((s,x)=>s+x.value,0)/3 || 0;
    const growth = prevAvg>0 ? ((last-prevAvg)/prevAvg)*100 : 0;
    setSummary({ type:"4_minggu", totalQty, totalValue, avgWeeklyQty: totalQty/4, growth, lastWeekQty:last });
    if (totalQty===0) setError("Tidak ada data penjualan untuk 4 minggu terakhir");
  };

  const loadWeeklyMonthly = async () => {
    const weekly = await ChartsDataService.getMonthlyWeeklyBreakdown(selectedYear, selectedMonth);
    let totalQty=0, totalValue=0;
    const formatted = weekly.map(w=>{
      totalQty += w.value; totalValue += w.totalValue;
      return { label:w.label, value:w.value, tooltip:w.tooltip, weekNumber:w.weekNumber, dateRange:w.dateRange };
    });
    setSeries(formatted);
    setSummary({ type:"mingguan_bulan", totalQty, totalValue, avgWeeklyQty: formatted.length? totalQty/formatted.length : 0, weekCount: formatted.length });
    if (totalQty===0) setError("Tidak ada data penjualan pada bulan ini");
  };

  const loadLast6Months = async () => {
    const rows = await ChartsDataService.getLast6MonthsSales();
    const formatted = rows.map(m => ({ label:m.label, value:m.value, tooltip:m.tooltip, month:m.month, year:m.year }));
    setSeries(formatted);
    const total = formatted.reduce((s,x)=>s+x.value,0);
    const last = formatted[5]?.value || 0;
    const prevAvg = formatted.slice(0,5).reduce((s,x)=>s+x.value,0)/5 || 0;
    const growth = prevAvg>0 ? ((last-prevAvg)/prevAvg)*100 : 0;
    setSummary({ type:"6_bulan", totalQty: total, avgMonthlyQty: total/6, growth, lastMonthQty: last });
    if (total===0) setError("Tidak ada data penjualan untuk 6 bulan terakhir");
  };

  const getIcon = () => (chartType==="7_hari" ? <BarChartIcon color="info"/> :
                         chartType==="4_minggu" ? <CalendarMonthIcon color="warning"/> :
                         chartType==="mingguan_bulan" ? <CalendarMonthIcon color="primary"/> :
                         <TrendingUpIcon color="success"/>);

  const getGrowthChip = (growth) => {
    if (growth===undefined || growth===null) return null;
    const pos = growth > 0, neu = growth === 0;
    return <Chip label={`${pos?"+":""}${growth.toFixed(1)}%`} color={neu?"default":pos?"success":"error"} variant="outlined" size="small" sx={{ ml:1 }} />;
  };

  return (
    <Card sx={{ background: `linear-gradient(135deg, ${alpha(theme.palette.info.main,0.05)} 0%, ${alpha(theme.palette.primary.main,0.05)} 100%)`, border: `1px solid ${alpha(theme.palette.info.main,0.1)}` }}>
      <CardHeader
        title={
          <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
            {getIcon()}
            <Typography variant="h6" fontWeight={700}>
              {chartType==="7_hari" ? "7 Hari Terakhir" : chartType==="4_minggu" ? "4 Minggu Terakhir" : chartType==="mingguan_bulan" ? "Mingguan per Bulan" : "6 Bulan Terakhir"}
              {summary?.growth !== undefined && getGrowthChip(summary.growth)}
            </Typography>
          </Box>
        }
        subheader={chartType==="7_hari" ? "Trend penjualan harian 7 hari terakhir" :
                   chartType==="4_minggu" ? "Perbandingan penjualan 4 minggu terakhir" :
                   chartType==="mingguan_bulan" ? `Perbandingan mingguan bulan ${months[selectedMonth]} ${selectedYear}` :
                   "Trend penjualan 6 bulan terakhir"}
        action={
          <Box sx={{ display:'flex', gap:1, alignItems:'center' }}>
            {(chartType==="mingguan_bulan" || chartType==="6_bulan") && (
              <>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Bulan</InputLabel>
                  <Select value={selectedMonth} label="Bulan" onChange={(e)=>setSelectedMonth(e.target.value)} disabled={isLoading || chartType==="6_bulan"}>
                    {months.map((m,i)=>(<MenuItem key={i} value={i}>{m}</MenuItem>))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <InputLabel>Tahun</InputLabel>
                  <Select value={selectedYear} label="Tahun" onChange={(e)=>setSelectedYear(e.target.value)} disabled={isLoading}>
                    {years.map(y=>(<MenuItem key={y} value={y}>{y}</MenuItem>))}
                  </Select>
                </FormControl>
              </>
            )}
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Tampilan</InputLabel>
              <Select value={chartType} label="Tampilan" onChange={(e)=>setChartType(e.target.value)} disabled={isLoading}>
                <MenuItem value="7_hari">📊 7 Hari Terakhir</MenuItem>
                <MenuItem value="4_minggu">📅 4 Minggu Terakhir</MenuItem>
                <MenuItem value="mingguan_bulan">📅 Mingguan per Bulan</MenuItem>
                <MenuItem value="6_bulan">📈 6 Bulan Terakhir</MenuItem>
              </Select>
            </FormControl>
          </Box>
        }
        sx={{ pb:2, borderBottom: 1, borderColor: "divider" }}
      />
      <CardContent>
        {error && <Alert severity="warning" sx={{ mb:2 }}>{error}</Alert>}
        <MiniBarChartLabeled data={series} loading={isLoading || loading} height={chartType==="7_hari"?120:160} type={chartType} />
      </CardContent>
    </Card>
  );
}

export default SevenDaysChartCard;
