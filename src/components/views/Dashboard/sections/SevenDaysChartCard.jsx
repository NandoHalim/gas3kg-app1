// src/components/views/Dashboard/sections/WeeklyMonthlyChartCard.jsx
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
  Grid
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import BarChartIcon from "@mui/icons-material/BarChart";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import MiniBarChartLabeled from "../../../../ui/MiniBarChartLabeled.jsx";
import { DataService } from "../../../../services/DataService";

function WeeklyMonthlyChartCard({ loading = false }) {
  const theme = useTheme();
  const [chartType, setChartType] = useState("7_hari"); // 7_hari, mingguan_bulanan, bulanan_tahunan
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [series, setSeries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [monthlySummary, setMonthlySummary] = useState(null);

  const chartTypes = [
    { value: "7_hari", label: "7 Hari Terakhir", icon: "📊" },
    { value: "mingguan_bulanan", label: "Mingguan per Bulan", icon: "📅" },
    { value: "bulanan_tahunan", label: "Bulanan per Tahun", icon: "📈" }
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
    try {
      switch (chartType) {
        case "7_hari":
          await loadLast7Days();
          break;
        case "mingguan_bulanan":
          await loadWeeklyMonthly();
          break;
        case "bulanan_tahunan":
          await loadMonthlyYearly();
          break;
        default:
          await loadLast7Days();
      }
    } catch (error) {
      console.error("Error loading chart data:", error);
      setSeries([]);
      setMonthlySummary(null);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLast7Days = async () => {
    try {
      const data = await DataService.getSevenDaySales();
      const formattedData = (data || []).map((item, index) => ({
        label: formatDateLabel(item.date, "7_hari", index),
        value: item.qty || 0,
        tooltip: `Tanggal: ${formatDate(item.date)}\nQty: ${item.qty || 0} tabung`
      }));
      setSeries(formattedData);
      setMonthlySummary(null);
    } catch (error) {
      console.error("Error loading last 7 days:", error);
      setSeries([]);
    }
  };

  const loadWeeklyMonthly = async () => {
    try {
      // Dapatkan rentang tanggal untuk bulan yang dipilih
      const monthStart = new Date(selectedYear, selectedMonth, 1);
      const monthEnd = new Date(selectedYear, selectedMonth + 1, 0);
      
      // Bagi bulan menjadi minggu-minggu
      const weeks = getWeeksInMonth(selectedYear, selectedMonth);
      
      const weeklyData = [];
      let totalMonthQty = 0;
      let totalMonthValue = 0;

      for (let i = 0; i < weeks.length; i++) {
        const week = weeks[i];
        const weekSales = await getSalesForPeriod(week.start, week.end);
        
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

      setSeries(weeklyData);
      
      // Hitung rata-rata per minggu
      const avgWeeklyQty = weeklyData.length > 0 ? totalMonthQty / weeklyData.length : 0;
      
      setMonthlySummary({
        totalQty: totalMonthQty,
        totalValue: totalMonthValue,
        avgWeeklyQty: avgWeeklyQty,
        weekCount: weeks.length
      });
    } catch (error) {
      console.error("Error loading weekly monthly data:", error);
      setSeries([]);
    }
  };

  const loadMonthlyYearly = async () => {
    try {
      const monthlyData = [];
      let totalYearQty = 0;

      for (let month = 0; month < 12; month++) {
        const monthStart = new Date(selectedYear, month, 1);
        const monthEnd = new Date(selectedYear, month + 1, 0);
        
        const monthSales = await getSalesForPeriod(monthStart, monthEnd);
        const monthQty = monthSales.reduce((sum, sale) => sum + (Number(sale.qty) || 0), 0);
        
        monthlyData.push({
          label: months[month].substring(0, 3),
          value: monthQty,
          tooltip: `${months[month]} ${selectedYear}\nQty: ${monthQty} tabung`,
          month: months[month]
        });

        totalYearQty += monthQty;
      }

      setSeries(monthlyData);
      setMonthlySummary({
        totalQty: totalYearQty,
        avgMonthlyQty: totalYearQty / 12
      });
    } catch (error) {
      console.error("Error loading monthly yearly data:", error);
      setSeries([]);
    }
  };

  // Helper function untuk mendapatkan minggu dalam bulan
  const getWeeksInMonth = (year, month) => {
    const weeks = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    let currentWeekStart = new Date(firstDay);
    
    // Set ke hari Senin (1) jika bukan Senin
    const dayOfWeek = currentWeekStart.getDay();
    if (dayOfWeek !== 1) { // 1 = Senin
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      currentWeekStart.setDate(currentWeekStart.getDate() - diff);
    }
    
    while (currentWeekStart <= lastDay) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      // Pastikan tidak melebihi akhir bulan
      if (weekEnd > lastDay) {
        weekEnd.setTime(lastDay.getTime());
      }
      
      // Hanya tambahkan minggu yang memiliki hari dalam bulan yang dipilih
      if (currentWeekStart <= lastDay) {
        weeks.push({
          start: new Date(currentWeekStart),
          end: new Date(weekEnd)
        });
      }
      
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }
    
    return weeks;
  };

  // Helper function untuk mendapatkan data penjualan
  const getSalesForPeriod = async (startDate, endDate) => {
    try {
      const fromISO = DataService.toISOStringWithOffset(startDate);
      const toISO = DataService.toISOStringWithOffset(endDate);
      
      const sales = await DataService.loadSalesByDateRange(fromISO, toISO);
      return sales.filter(sale => 
        sale.status !== "DIBATALKAN" && 
        (sale.method === "TUNAI" || sale.status === "LUNAS")
      );
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

  const formatDateLabel = (dateString, type, index) => {
    if (type !== "7_hari") return dateString;
    
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
    } catch (error) {
      return `Day ${index + 1}`;
    }
  };

  const getCardTitle = () => {
    const currentType = chartTypes.find(type => type.value === chartType);
    return currentType ? `${currentType.icon} ${currentType.label}` : "Grafik Perbandingan";
  };

  const getCardSubtitle = () => {
    switch (chartType) {
      case "7_hari":
        return "Trend penjualan harian 7 hari terakhir";
      case "mingguan_bulanan":
        return `Perbandingan mingguan bulan ${months[selectedMonth]} ${selectedYear}`;
      case "bulanan_tahunan":
        return `Perbandingan bulanan tahun ${selectedYear}`;
      default:
        return "Data perbandingan penjualan";
    }
  };

  const getSummaryText = () => {
    if (!monthlySummary) return null;

    switch (chartType) {
      case "mingguan_bulanan":
        return (
          <Box sx={{ mt: 2, p: 1, bgcolor: alpha(theme.palette.info.main, 0.05), borderRadius: 1 }}>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Total Bulan:
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {monthlySummary.totalQty} tabung
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Rata-rata/Minggu:
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {Math.round(monthlySummary.avgWeeklyQty)} tabung
                </Typography>
              </Grid>
            </Grid>
          </Box>
        );
      case "bulanan_tahunan":
        return (
          <Box sx={{ mt: 2, p: 1, bgcolor: alpha(theme.palette.success.main, 0.05), borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary" align="center">
              Total Tahun: <strong>{monthlySummary.totalQty} tabung</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Rata-rata/Bulan: <strong>{Math.round(monthlySummary.avgMonthlyQty)} tabung</strong>
            </Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  const getWeekDetails = () => {
    if (chartType !== "mingguan_bulanan" || series.length === 0) return null;

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

  return (
    <Card sx={{
      background: `linear(135deg, ${alpha(theme.palette.info.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
      border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
      height: '100%'
    }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {chartType === "7_hari" ? <BarChartIcon color="info" /> : 
             chartType === "mingguan_bulanan" ? <CalendarMonthIcon color="primary" /> : 
             <CompareArrowsIcon color="secondary" />}
            <Typography variant="h6" fontWeight={700}>
              {getCardTitle()}
            </Typography>
          </Box>
        }
        subheader={getCardSubtitle()}
        action={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {(chartType === "mingguan_bulanan" || chartType === "bulanan_tahunan") && (
              <>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Bulan</InputLabel>
                  <Select
                    value={selectedMonth}
                    label="Bulan"
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    disabled={isLoading || chartType === "bulanan_tahunan"}
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

export default WeeklyMonthlyChartCard;