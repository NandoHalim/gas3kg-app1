// src/components/ui/MiniBarChartLabeled.jsx
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
  const isWeeklyMonthly = type === "mingguan_bulan";
  const isFourWeeks = type === "4_minggu";
  const isSixMonths = type === "6_bulan";

  return (
    <Box sx={{ height }}>
      <Box sx={{ 
        height: height - 40, 
        display: 'flex', 
        alignItems: 'flex-end', 
        gap: isWeeklyMonthly || isFourWeeks ? 2 : isSixMonths ? 1 : 1,
        justifyContent: isWeeklyMonthly || isFourWeeks ? 'center' : 'space-between',
        px: isWeeklyMonthly || isFourWeeks ? 2 : 0,
        overflowX: 'auto'
      }}>
        {data.map((item, index) => {
          const barHeight = maxValue > 0 ? (item.value / maxValue) * 80 : 0;
          const isCurrent = isCurrentItem(item, type, index, data.length);
          
          return (
            <Tooltip key={index} title={item.tooltip || `${item.label}: ${item.value} tabung`} arrow>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: isWeeklyMonthly || isFourWeeks ? '0 0 auto' : isSixMonths ? 1 : 1,
                  minWidth: isWeeklyMonthly || isFourWeeks ? 50 : isSixMonths ? 40 : 30
                }}
              >
                <Box
                  sx={{
                    width: isWeeklyMonthly || isFourWeeks ? 40 : isSixMonths ? 35 : '100%',
                    minWidth: 24,
                    height: `${barHeight}%`,
                    minHeight: 4,
                    bgcolor: getBarColor(theme, isCurrent, index, type),
                    borderRadius: 1,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      opacity: 0.8,
                      transform: 'translateY(-2px)',
                      boxShadow: 2
                    },
                    position: 'relative'
                  }}
                />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    mt: 1, 
                    fontWeight: isCurrent ? 600 : 400,
                    color: isCurrent ? 'primary.main' : 'text.secondary',
                    textAlign: 'center',
                    fontSize: isWeeklyMonthly || isFourWeeks ? '0.75rem' : '0.7rem'
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
  
  if (type === "mingguan_bulan" || type === "4_minggu" || type === "6_bulan") {
    return colors[index % colors.length];
  }
  
  return theme.palette.info.main;
};

// Helper function untuk menentukan item saat ini
const isCurrentItem = (item, type, index, totalLength) => {
  const now = new Date();
  
  if (type === "mingguan_bulan" || type === "4_minggu") {
    // Untuk mingguan, anggap minggu terakhir adalah current
    return index === totalLength - 1;
  }
  
  if (type === "6_bulan") {
    // Untuk 6 bulan, bulan terakhir adalah current
    return index === totalLength - 1;
  }
  
  return false;
};

export default MiniBarChartLabeled;