import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  Alert
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import BarChartIcon from "@mui/icons-material/BarChart";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import MiniBarChartLabeled from "../ui/MiniBarChartLabeled.jsx";
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

  const chartTypes = [
    { value: "7_hari", label: "7 Hari Terakhir", icon: "📊" },
    { value: "mingguan_bulan", label: "Mingguan per Bulan", icon: "📅" },
    { value: "6_bulan", label: "6 Bulan Terakhir", icon: "📈" }
  ];

  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  // Load data berdasarkan tipe chart
  useEffect(() => {
    loadChartData();
  }, [chartType, selectedMonth, selectedYear]);

  const loadChartData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      switch (chartType) {
        case "7_hari":
          await loadLast7Days();
          break;
        case "mingguan_bulan":
          await loadWeeklyMonthly();
          break;
        case "6_bulan":
          await loadLast6Months();
          break;
        default:
          await loadLast7Days();
      }
    } catch (error) {
      console.error("Error loading chart data:", error);
      setError(`Gagal memuat data: ${error.message}`);
      setSeries([]);
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLast7Days = async () => {
    try {
      console.log("Loading 7 hari terakhir...");
      const data = await DataService.getSevenDaySales();
      console.log("Data 7 hari:", data);
      
      const formattedData = (data || []).map((item, index) => ({
        label: formatDateLabel(item.date, index),
        value: item.qty || 0,
        tooltip: `Tanggal: ${formatDate(item.date)}\nQty: ${item.qty || 0} tabung`
      }));
      
      setSeries(formattedData);
      setSummary(null);
      
      if (formattedData.length === 0) {
        setError("Tidak ada data penjualan untuk 7 hari terakhir");
      }
    } catch (error) {
      console.error("Error loading last 7 days:", error);
      setError(`Gagal memuat data 7 hari: ${error.message}`);
      setSeries([]);
    }
  };

  const loadWeeklyMonthly = async () => {
    try {
      console.log(`Loading mingguan untuk bulan ${selectedMonth + 1}/${selectedYear}...`);
      
      // Dapatkan rentang tanggal untuk bulan yang dipilih
      const monthStart = new Date(selectedYear, selectedMonth, 1);
      const monthEnd = new Date(selectedYear, selectedMonth + 1, 0);
      
      console.log("Rentang bulan:", monthStart, "sampai", monthEnd);
      
      // Bagi bulan menjadi minggu-minggu
      const weeks = getWeeksInMonth(selectedYear, selectedMonth);
      console.log("Minggu-minggu:", weeks);
      
      const weeklyData = [];
      let totalMonthQty = 0;
      let totalMonthValue = 0;

      for (let i = 0; i < weeks.length; i++) {
        const week = weeks[i];
        const weekSales = await getSalesForPeriod(week.start, week.end);
        console.log(`Minggu ${i + 1} sales:`, weekSales);
        
        const weekQty = weekSales.reduce((sum, sale) => sum + (Number(sale.qty) || 0), 0);
        const weekValue = weekSales.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0);
        
        weeklyData.push({
          label: `M${i + 1}`,
          value: weekQty,
          tooltip: `Minggu ${i + 1} (${formatDate(week.start)} - ${formatDate(week.end)})\nQty: ${weekQty} tabung\nTotal: Rp ${weekValue.toLocaleString('id-ID')}`,
          weekNumber: i + 1,
          dateRange: `${formatDate(week.start)} - ${formatDate(week.end)}`
        });

        totalMonthQty += weekQty;
        totalMonthValue += weekValue;
      }

      console.log("Weekly data final:", weeklyData);
      setSeries(weeklyData);
      
      // Hitung rata-rata per minggu
      const avgWeeklyQty = weeklyData.length > 0 ? totalMonthQty / weeklyData.length : 0;
      
      setSummary({
        totalQty: totalMonthQty,
        totalValue: totalMonthValue,
        avgWeeklyQty: avgWeeklyQty,
        weekCount: weeks.length,
        type: "mingguan_bulan"
      });
      
      if (weeklyData.length === 0 || totalMonthQty === 0) {
        setError(`Tidak ada data penjualan untuk bulan ${months[selectedMonth]} ${selectedYear}`);
      }
    } catch (error) {
      console.error("Error loading weekly monthly data:", error);
      setError(`Gagal memuat data mingguan: ${error.message}`);
      setSeries([]);
    }
  };

  const loadLast6Months = async () => {
    try {
      console.log("Loading 6 bulan terakhir...");
      const monthlyData = [];
      let total6MonthsQty = 0;
      const currentDate = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
        const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
        
        console.log(`Loading bulan ${targetDate.getMonth() + 1}/${targetDate.getFullYear()}...`);
        const monthSales = await getSalesForPeriod(monthStart, monthEnd);
        console.log(`Bulan ${targetDate.getMonth() + 1} sales:`, monthSales);
        
        const monthQty = monthSales.reduce((sum, sale) => sum + (Number(sale.qty) || 0), 0);
        const monthValue = monthSales.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0);
        
        monthlyData.push({
          label: `${months[targetDate.getMonth()].substring(0, 3)}/${targetDate.getFullYear().toString().slice(-2)}`,
          value: monthQty,
          tooltip: `${months[targetDate.getMonth()]} ${targetDate.getFullYear()}\nQty: ${monthQty} tabung\nTotal: Rp ${monthValue.toLocaleString('id-ID')}`,
          month: months[targetDate.getMonth()],
          year: targetDate.getFullYear()
        });

        total6MonthsQty += monthQty;
      }

      console.log("6 bulan data final:", monthlyData);
      setSeries(monthlyData);
      
      // Hitung trend (bulan terakhir vs rata-rata 5 bulan sebelumnya)
      const lastMonthQty = monthlyData[5]?.value || 0;
      const previousMonthsAvg = monthlyData.slice(0, 5).reduce((sum, month) => sum + month.value, 0) / 5;
      const growth = previousMonthsAvg > 0 ? ((lastMonthQty - previousMonthsAvg) / previousMonthsAvg) * 100 : 0;
      
      setSummary({
        totalQty: total6MonthsQty,
        avgMonthlyQty: total6MonthsQty / 6,
        growth: growth,
        lastMonthQty: lastMonthQty,
        type: "6_bulan"
      });
      
      if (monthlyData.length === 0 || total6MonthsQty === 0) {
        setError("Tidak ada data penjualan untuk 6 bulan terakhir");
      }
    } catch (error) {
      console.error("Error loading last 6 months data:", error);
      setError(`Gagal memuat data 6 bulan: ${error.message}`);
      setSeries([]);
    }
  };

  // Helper function untuk mendapatkan minggu dalam bulan (versi sederhana)
  const getWeeksInMonth = (year, month) => {
    const weeks = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    let currentDate = new Date(firstDay);
    
    while (currentDate <= lastDay) {
      const weekStart = new Date(currentDate);
      const weekEnd = new Date(currentDate);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      if (weekEnd > lastDay) {
        weekEnd.setTime(lastDay.getTime());
      }
      
      weeks.push({
        start: new Date(weekStart),
        end: new Date(weekEnd)
      });
      
      currentDate.setDate(currentDate.getDate() + 7);
    }
    
    return weeks;
  };

  // Helper function untuk mendapatkan data penjualan menggunakan fungsi yang ada di DataService
  const getSalesForPeriod = async (startDate, endDate) => {
    try {
      // Gunakan fungsi getSalesHistory yang sudah tersedia di DataService
      const fromISO = DataService.toISOStringWithOffset(startDate);
      const toISO = DataService.toISOStringWithOffset(endDate);
      
      console.log("Mengambil data dari", fromISO, "sampai", toISO);
      const sales = await DataService.getSalesHistory({
        from: fromISO,
        to: toISO,
        method: "ALL",
        status: "ALL",
        limit: 10000
      });
      console.log("Data penjualan:", sales);
      
      // Filter hanya penjualan yang sudah dibayar (TUNAI atau LUNAS)
      const paidSales = sales.filter(sale => {
        const method = String(sale.method || '').toUpperCase();
        const status = String(sale.status || '').toUpperCase();
        
        if (status === "DIBATALKAN") return false;
        if (method === "TUNAI") return true;
        if (status === "LUNAS") return true;
        return false;
      });
      
      console.log("Paid sales:", paidSales);
      return paidSales;
    } catch (error) {
      console.error("Error getting sales data:", error);
      return [];
    }
  };

  const formatDate = (date) => {
    if (date instanceof Date) {
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short'
      });
    }
    return String(date);
  };

  const formatDateLabel = (dateString, index) => {
    try {
      const date = new Date(dateString);
      const today = new Date();
      const diffDays = Math.floor((today - date) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return "Hari Ini";
      if (diffDays === 1) return "Kemarin";
      
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short'
      });
    } catch {
      return `Day ${index + 1}`;
    }
  };

  const getGrowthChip = (growth) => {
    if (!growth && growth !== 0) return null;
    
    const isPositive = growth > 0;
    const isNeutral = growth === 0;
    
    return (
      <Chip
        label={`${isPositive ? '+' : ''}${growth.toFixed(1)}%`}
        color={isNeutral ? "default" : isPositive ? "success" : "error"}
        variant="outlined"
        size="small"
        sx={{ ml: 1 }}
      />
    );
  };

  const getCardTitle = () => {
    const currentType = chartTypes.find(type => type.value === chartType);
    return currentType ? currentType.label : "Grafik Perbandingan";
  };

  const getCardSubtitle = () => {
    switch (chartType) {
      case "7_hari":
        return "Trend penjualan harian 7 hari terakhir";
      case "mingguan_bulan":
        return `Perbandingan mingguan bulan ${months[selectedMonth]} ${selectedYear}`;
      case "6_bulan":
        return "Trend penjualan 6 bulan terakhir";
      default:
        return "Data perbandingan penjualan";
    }
  };

  const getSummaryText = () => {
    if (!summary) return null;

    switch (summary.type) {
      case "mingguan_bulan":
        return (
          <Box sx={{ mt: 2, p: 1, bgcolor: alpha(theme.palette.info.main, 0.05), borderRadius: 1 }}>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Total Bulan:
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {summary.totalQty} tabung
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Rata-rata/Minggu:
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {Math.round(summary.avgWeeklyQty)} tabung
                </Typography>
              </Grid>
            </Grid>
          </Box>
        );
      case "6_bulan":
        return (
          <Box sx={{ mt: 2, p: 1, bgcolor: alpha(theme.palette.success.main, 0.05), borderRadius: 1 }}>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Total 6 Bulan:
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {summary.totalQty} tabung
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Rata-rata/Bulan:
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {Math.round(summary.avgMonthlyQty)} tabung
                </Typography>
              </Grid>
              {summary.growth !== undefined && (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUpIcon 
                      color={summary.growth > 0 ? "success" : summary.growth < 0 ? "error" : "disabled"} 
                      fontSize="small" 
                    />
                    <Typography variant="body2" color={summary.growth > 0 ? "success.main" : summary.growth < 0 ? "error.main" : "text.secondary"}>
                      {summary.growth > 0 ? "📈 Naik" : summary.growth < 0 ? "📉 Turun" : "➡️ Stabil"} {Math.abs(summary.growth).toFixed(1)}% vs rata-rata 5 bulan sebelumnya
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
        );
      default:
        return null;
    }
  };

  const getWeekDetails = () => {
    if (chartType !== "mingguan_bulan" || series.length === 0) return null;

    return (
      <Box sx={{ mt: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Keterangan Minggu:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
          {series.map((week, index) => (
            <Chip
              key={index}
              label={`M${week.weekNumber}: ${week.dateRange}`}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.6rem' }}
            />
          ))}
        </Box>
      </Box>
    );
  };

  const getIcon = () => {
    switch (chartType) {
      case "7_hari":
        return <BarChartIcon color="info" />;
      case "mingguan_bulan":
        return <CalendarMonthIcon color="primary" />;
      case "6_bulan":
        return <TrendingUpIcon color="success" />;
      default:
        return <BarChartIcon color="info" />;
    }
  };

  return (
    <Card sx={{
      background: `linear(135deg, ${alpha(theme.palette.info.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
      border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`
    }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getIcon()}
            <Typography variant="h6" fontWeight={700}>
              {getCardTitle()}
              {summary?.growth !== undefined && getGrowthChip(summary.growth)}
            </Typography>
          </Box>
        }
        subheader={getCardSubtitle()}
        action={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
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
                    {months.map((month, index) => (
                      <MenuItem key={index} value={index}>
                        {month}
                      </MenuItem>
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
                    {years.map((year) => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
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
                {chartTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        }
        sx={{ pb: 2, borderBottom: 1, borderColor: "divider" }}
      />
      <CardContent>
        {error && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <MiniBarChartLabeled 
          data={series} 
          loading={isLoading || loading}
          height={chartType === "7_hari" ? 120 : 160}
          type={chartType}
        />
        {getWeekDetails()}
        {getSummaryText()}
      </CardContent>
    </Card>
  );
}

export default SevenDaysChartCard;