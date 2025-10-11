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
import MiniBarChartLabeled from "../ui/MiniBarChartLabeled.jsx";
import { DataService } from "../../../../services/DataService"; // PATH DIPERBAIKI

function SevenDaysChartCard({ loading = false }) {
  const theme = useTheme();
  const [chartType, setChartType] = useState("7_hari");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [series, setSeries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState(null);

  const chartTypes = [
    { value: "7_hari", label: "7 Hari Terakhir", icon: "📊" },
    { value: "mingguan", label: "Perbandingan Mingguan", icon: "📅" },
    { value: "bulanan", label: "Perbandingan Bulanan", icon: "📈" }
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
        case "mingguan":
          await loadWeeklyComparison();
          break;
        case "bulanan":
          await loadMonthlyComparison();
          break;
        default:
          await loadLast7Days();
      }
    } catch (error) {
      console.error("Error loading chart data:", error);
      setSeries([]);
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLast7Days = async () => {
    try {
      const data = await DataService.getSevenDaySales();
      const formattedData = (data || []).map((item, index) => ({
        label: formatDateLabel(item.date, index),
        value: item.qty || 0,
        tooltip: `Tanggal: ${formatDate(item.date)}\nQty: ${item.qty || 0} tabung`
      }));
      setSeries(formattedData);
      setSummary(null);
    } catch (error) {
      console.error("Error loading last 7 days:", error);
      setSeries([]);
    }
  };

  const loadWeeklyComparison = async () => {
    try {
      const comparison = await DataService.getWeeklyComparison({ 
        weekDate: new Date(), 
        onlyPaid: true 
      });

      const weeklyData = [
        {
          label: "Minggu Ini",
          value: comparison.this_week_qty || 0,
          tooltip: `Minggu Ini: ${comparison.this_week_qty || 0} tabung\nTotal: Rp ${(comparison.this_week_value || 0).toLocaleString('id-ID')}`
        },
        {
          label: "Minggu Lalu",
          value: comparison.last_week_qty || 0,
          tooltip: `Minggu Lalu: ${comparison.last_week_qty || 0} tabung\nTotal: Rp ${(comparison.last_week_value || 0).toLocaleString('id-ID')}`
        }
      ];

      setSeries(weeklyData);
      
      // Hitung growth percentage
      const lastWeekQty = comparison.last_week_qty || 1;
      const growth = ((comparison.this_week_qty - lastWeekQty) / lastWeekQty) * 100;
      
      setSummary({
        growth: growth,
        currentValue: comparison.this_week_qty || 0,
        previousValue: comparison.last_week_qty || 0,
        type: "mingguan"
      });
    } catch (error) {
      console.error("Error loading weekly comparison:", error);
      setSeries([]);
    }
  };

  const loadMonthlyComparison = async () => {
    try {
      const comparison = await DataService.getMonthlyComparison({ 
        monthDate: new Date(), 
        onlyPaid: true 
      });

      const monthlyData = [
        {
          label: "Bulan Ini",
          value: comparison.this_month_qty || 0,
          tooltip: `Bulan Ini: ${comparison.this_month_qty || 0} tabung\nTotal: Rp ${(comparison.this_month_value || 0).toLocaleString('id-ID')}\nLaba: Rp ${(comparison.this_month_laba || 0).toLocaleString('id-ID')}`
        },
        {
          label: "Bulan Lalu",
          value: comparison.last_month_qty || 0,
          tooltip: `Bulan Lalu: ${comparison.last_month_qty || 0} tabung\nTotal: Rp ${(comparison.last_month_value || 0).toLocaleString('id-ID')}\nLaba: Rp ${(comparison.last_month_laba || 0).toLocaleString('id-ID')}`
        }
      ];

      setSeries(monthlyData);
      
      // Hitung growth percentage
      const lastMonthQty = comparison.last_month_qty || 1;
      const growth = ((comparison.this_month_qty - lastMonthQty) / lastMonthQty) * 100;
      
      setSummary({
        growth: growth,
        currentValue: comparison.this_month_qty || 0,
        previousValue: comparison.last_month_qty || 0,
        laba: comparison.this_month_laba || 0,
        type: "bulanan"
      });
    } catch (error) {
      console.error("Error loading monthly comparison:", error);
      setSeries([]);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short'
      });
    } catch {
      return String(dateString);
    }
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
      case "mingguan":
        return "Perbandingan penjualan minggu ini vs minggu lalu";
      case "bulanan":
        return "Perbandingan penjualan bulan ini vs bulan lalu";
      default:
        return "Data perbandingan penjualan";
    }
  };

  const getSummaryText = () => {
    if (!summary) return null;

    const { growth, currentValue, previousValue, laba, type } = summary;
    const isPositive = growth > 0;
    
    if (type === "mingguan") {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {isPositive ? "📈 Meningkat" : "📉 Menurun"} {Math.abs(growth).toFixed(1)}% 
          dari {previousValue} tabung minggu lalu
        </Typography>
      );
    } else if (type === "bulanan") {
      return (
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {isPositive ? "📈 Meningkat" : "📉 Menurun"} {Math.abs(growth).toFixed(1)}% 
            dari {previousValue} tabung bulan lalu
          </Typography>
          {laba && (
            <Typography variant="body2" color="success.main" sx={{ fontWeight: 500 }}>
              Laba: Rp {laba.toLocaleString('id-ID')}
            </Typography>
          )}
        </Box>
      );
    }
    
    return null;
  };

  const getIcon = () => {
    switch (chartType) {
      case "7_hari":
        return <BarChartIcon color="info" />;
      case "mingguan":
        return <CompareArrowsIcon color="primary" />;
      case "bulanan":
        return <CalendarMonthIcon color="secondary" />;
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
              {summary && getGrowthChip(summary.growth)}
            </Typography>
          </Box>
        }
        subheader={getCardSubtitle()}
        action={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {(chartType === "mingguan" || chartType === "bulanan") && (
              <>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Bulan</InputLabel>
                  <Select
                    value={selectedMonth}
                    label="Bulan"
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    disabled={isLoading}
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
          height={chartType === "7_hari" ? 120 : 140}
          type={chartType}
        />
        {getSummaryText()}
      </CardContent>
    </Card>
  );
}

export default SevenDaysChartCard;