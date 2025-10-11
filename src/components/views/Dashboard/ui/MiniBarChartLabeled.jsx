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
  const isComparison = type === "mingguan" || type === "bulanan";

  return (
    <Box sx={{ height }}>
      <Box sx={{ 
        height: height - 40, 
        display: 'flex', 
        alignItems: 'flex-end', 
        gap: isComparison ? 4 : 1,
        justifyContent: isComparison ? 'center' : 'space-between',
        px: isComparison ? 4 : 0
      }}>
        {data.map((item, index) => {
          const barHeight = maxValue > 0 ? (item.value / maxValue) * 80 : 0;
          const isCurrent = item.label.includes('Ini') || item.label.includes('Sekarang');
          
          return (
            <Tooltip key={index} title={item.tooltip || `${item.label}: ${item.value} tabung`} arrow>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: isComparison ? 0 : 1
                }}
              >
                <Box
                  sx={{
                    width: isComparison ? 60 : '100%',
                    minWidth: 24,
                    height: `${barHeight}%`,
                    minHeight: 4,
                    bgcolor: isCurrent 
                      ? alpha(theme.palette.primary.main, 0.8)
                      : alpha(theme.palette.info.main, 0.6),
                    borderRadius: 1,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: isCurrent 
                        ? theme.palette.primary.main
                        : theme.palette.info.main,
                      transform: 'translateY(-2px)'
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
                    fontSize: isComparison ? '0.75rem' : '0.7rem'
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

export default MiniBarChartLabeled;