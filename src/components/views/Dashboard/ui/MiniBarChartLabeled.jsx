import React from "react";
import { Box, Stack, Typography, Skeleton, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";

/**
 * Props:
 * - data: Array<{ date: string|Date, qty: number }>
 * - loading?: boolean
 * - height?: number (default 160)
 * - showAllLabels?: boolean (default false → hanya 1,4,7)
 */
export default function MiniBarChartLabeled({
  data = [],
  loading = false,
  height = 160,
  showAllLabels = false,
}) {
  const theme = useTheme();

  if (loading) {
    return <Skeleton variant="rounded" height={height} sx={{ borderRadius: 2 }} />;
  }

  const series = Array.isArray(data) ? data : [];
  const maxVal = Math.max(1, ...series.map((d) => Number(d.qty) || 0));

  if (!series.length) {
    return (
      <Box
        sx={{
          height,
          border: "1px dashed",
          borderColor: "divider",
          borderRadius: 2,
          display: "grid",
          placeItems: "center",
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Belum ada data 7 hari terakhir
        </Typography>
      </Box>
    );
  }

  // label tanggal (dd)
  const dayLabel = (d) => {
    try {
      const x = new Date(d);
      const dd = x.toLocaleDateString("id-ID", { day: "2-digit" });
      return dd;
    } catch {
      return String(d).slice(8, 10);
    }
  };

  const shouldShowLabel = (idx) =>
    showAllLabels ? true : [0, 3, 6].includes(idx); // 1,4,7

  return (
    <Stack spacing={1} sx={{ width: "100%" }}>
      <Box
        sx={{
          position: "relative",
          height,
          px: 1,
          pt: 1,
          pb: 3,
          borderRadius: 2,
          background: `linear-gradient(180deg, ${alpha(
            theme.palette.primary.main,
            0.04
          )} 0%, transparent 100%)`,
        }}
      >
        {/* Grid garis bantu */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            px: 1,
            pt: 1,
            pb: 3,
          }}
        >
          {[0.25, 0.5, 0.75].map((p) => (
            <Box
              key={p}
              sx={{
                position: "absolute",
                left: 8,
                right: 8,
                top: `calc(${p * 100}% - 1px)`,
                height: 1,
                bgcolor: "divider",
              }}
            />
          ))}
        </Box>

        {/* Bars */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "grid",
            gridTemplateColumns: `repeat(${series.length}, 1fr)`,
            alignItems: "end",
            gap: 8,
            px: 8 / 8,
            pt: 8 / 8,
            pb: 24 / 8,
          }}
        >
          {series.map((d, idx) => {
            const v = Number(d.qty) || 0;
            const hPct = Math.max(4, (v / maxVal) * 100); // min 4%
            return (
              <Box key={idx} sx={{ display: "grid", gridTemplateRows: "1fr auto", alignItems: "end" }}>
                <Box
                  sx={{
                    height: `${hPct}%`,
                    borderRadius: 6,
                    background: `linear-gradient(180deg, ${alpha(
                      theme.palette.info.main,
                      0.9
                    )} 0%, ${alpha(theme.palette.primary.main, 0.9)} 100%)`,
                  }}
                  title={`${v} unit`}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  align="center"
                  sx={{
                    mt: 0.5,
                    display: shouldShowLabel(idx) ? "block" : "none",
                    userSelect: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  {dayLabel(d.date)}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Stack>
  );
}
