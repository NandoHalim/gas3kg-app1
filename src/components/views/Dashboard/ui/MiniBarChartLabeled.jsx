import React from "react";
import { Box, Typography, Skeleton, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import BarChartIcon from "@mui/icons-material/BarChart";

const startOfDay = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const isoDate = (d) => startOfDay(d).toISOString().slice(0,10);

function MiniBarChartLabeled({ data = [], loading = false }) {
  const theme = useTheme();
  const max = Math.max(1, ...data.map((d) => Number(d.qty || 0)));
  
  const labelOf = (iso) => {
    try {
      const dt = new Date(iso);
      const wk = dt.toLocaleDateString("id-ID", { weekday: "narrow" });
      const dd = String(dt.getDate());
      return `${wk} ${dd}`;
    } catch {
      return iso || "-";
    }
  };

  if (loading) return <Skeleton height={160} />;

  return (
    <Box sx={{ px: 1, py: 2 }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `repeat(${Math.max(data.length, 1)}, 1fr)`,
          alignItems: "end",
          gap: 2,
          height: 160,
        }}
      >
        {data.map((d, i) => {
          const h = Math.max(8, Math.round((Number(d.qty || 0) / max) * 100));
          const isToday = isoDate(new Date()) === isoDate(new Date(d.date));
          return (
            <Stack key={i} alignItems="center" spacing={1}>
              <Typography 
                variant="caption" 
                sx={{ 
                  fontWeight: 700, 
                  lineHeight: 1.1,
                  color: isToday ? theme.palette.primary.main : 'text.primary'
                }}
              >
                {d.qty}
              </Typography>
              <Box
                title={`${d.date} • ${d.qty} tabung`}
                sx={{
                  width: "75%",
                  height: h,
                  borderRadius: 1,
                  background: isToday 
                    ? `linear(0deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`
                    : `linear(0deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.light})`,
                  opacity: isToday ? 1 : 0.8,
                  transition: "all 0.3s ease",
                  "&:hover": { 
                    opacity: 1, 
                    transform: "translateY(-4px)",
                    boxShadow: theme.shadows[2]
                  },
                }}
              />
              <Typography 
                variant="caption" 
                color={isToday ? "primary.main" : "text.secondary"} 
                sx={{ 
                  textAlign: "center", 
                  lineHeight: 1.2,
                  fontWeight: isToday ? 700 : 400,
                }}
              >
                {labelOf(d.date)}
              </Typography>
            </Stack>
          );
        })}
        {!data.length && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              gridColumn: "1 / -1", 
              textAlign: "center",
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%'
            }}
          >
            <BarChartIcon sx={{ mr: 1, opacity: 0.5 }} />
            Belum ada data penjualan 7 hari terakhir
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export default MiniBarChartLabeled;