// ui/MiniBarChartLabeled.jsx - Enhanced Version
import React from "react";
import { Box, Typography, useTheme, Tooltip } from "@mui/material";
import { alpha } from "@mui/material/styles";

function MiniBarChartLabeled({ data, loading = false, height = 120, type = "7_hari" }) {
  const theme = useTheme();

  if (loading) {
    return (
      <Box sx={{ height, display: 'flex', alignItems: 'flex-end', gap: 1, p: 1 }}>
        {[1, 2, 3, 4, 5, 6, 7].map((_, index) => (
          <Box
            key={index}
            sx={{
              flex: 1,
              bgcolor: alpha(theme.palette.grey[300], 0.5),
              borderRadius: 1,
              animation: "pulse 1.5s ease-in-out infinite",
              height: `${Math.random() * 80 + 20}%`
            }}
          />
        ))}
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="text.secondary">
          Tidak ada data
        </Typography>
      </Box>
    );
  }

  const values = data.map(item => item.value);
  const maxValue = Math.max(...values, 1);
  const isWeeklyMonthly = type === "mingguan_bulanan";
  const isMonthlyYearly = type === "bulanan_tahunan";

  return (
    <Box sx={{ height }}>
      <Box sx={{ 
        height: height - 40, 
        display: 'flex', 
        alignItems: 'flex-end', 
        gap: isWeeklyMonthly || isMonthlyYearly ? 2 : 1,
        justifyContent: isWeeklyMonthly || isMonthlyYearly ? 'center' : 'space-between',
        px: isWeeklyMonthly || isMonthlyYearly ? 2 : 0,
        overflowX: 'auto'
      }}>
        {data.map((item, index) => {
          const barHeight = maxValue > 0 ? (item.value / maxValue) * 80 : 0;
          const isCurrentPeriod = isCurrentItem(item, type);
          
          return (
            <Tooltip key={index} title={item.tooltip || `${item.label}: ${item.value} tabung`} arrow>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: isWeeklyMonthly || isMonthlyYearly ? '0 0 auto' : 1,
                  minWidth: isWeeklyMonthly ? 50 : isMonthlyYearly ? 40 : 30
                }}
              >
                <Box
                  sx={{
                    width: isWeeklyMonthly ? 40 : isMonthlyYearly ? 35 : '100%',
                    minWidth: 24,
                    height: `${barHeight}%`,
                    minHeight: 4,
                    bgcolor: getBarColor(theme, isCurrentPeriod, index, type),
                    borderRadius: 1,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      opacity: 0.8,
                      transform: 'translateY(-2px)'
                    },
                    position: 'relative'
                  }}
                />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    mt: 1, 
                    fontWeight: isCurrentPeriod ? 600 : 400,
                    color: isCurrentPeriod ? 'primary.main' : 'text.secondary',
                    textAlign: 'center',
                    fontSize: isWeeklyMonthly ? '0.75rem' : '0.7rem'
                  }}
                >
                  {item.label}
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontWeight: 600,
                    color: 'text.primary',
                    fontSize: '0.7rem'
                  }}
                >
                  {item.value}
                </Typography>
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
}

// Helper function untuk menentukan warna bar
const getBarColor = (theme, isCurrent, index, type) => {
  const colors = [
    theme.palette.primary.main,
    theme.palette.info.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.secondary.main
  ];
  
  if (isCurrent) return theme.palette.primary.main;
  
  if (type === "mingguan_bulanan" || type === "bulanan_tahunan") {
    return colors[index % colors.length];
  }
  
  return theme.palette.info.main;
};

// Helper function untuk menentukan item saat ini
const isCurrentItem = (item, type) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  if (type === "mingguan_bulanan") {
    // Untuk mingguan, anggap minggu terakhir adalah current
    return item.weekNumber === 4; // Atau logika yang lebih kompleks
  }
  
  if (type === "bulanan_tahunan") {
    return item.month && item.month.toLowerCase() === 
      new Date().toLocaleString('id-ID', { month: 'long' }).toLowerCase();
  }
  
  return false;
};

export default MiniBarChartLabeled;