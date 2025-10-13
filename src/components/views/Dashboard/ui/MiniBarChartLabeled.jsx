// src/components/ui/MiniBarChartLabeled.jsx
import React, { useMemo } from "react";
import { Box, Typography, useTheme, Tooltip, Chip, Stack } from "@mui/material";
import { alpha, darken } from "@mui/material/styles";

function MiniBarChartLabeled({
  data,
  loading = false,
  height = 160,
  type = "7_hari",
  unit = "tabung",
  valueFormatter = (n) => new Intl.NumberFormat("id-ID").format(n),
  showTotals = true,
  showPeak = true,
  compactLabels = "auto",
  animateOnMount = false,   // matikan animasi reload (default)
  scrollable = false,       // sembunyikan scrollbar (default)
}) {
  const theme = useTheme();

  if (loading) {
    return (
      <Box
        sx={{
          height,
          p: 2,
          display: "flex",
          alignItems: "flex-end",
          gap: 1.25,
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          backgroundColor: "#fff !important",
          backgroundImage: "none !important",
        }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <Box
            key={i}
            sx={{
              flex: 1,
              minWidth: 22,
              height: `${30 + (i * 7) % 60}%`,
              borderRadius: 1,
              background: `linear-gradient(180deg, ${alpha(
                theme.palette.grey[300],
                0.9
              )} 0%, ${alpha(theme.palette.grey[200], 0.6)} 100%)`,
              animation: "pulse 1.6s ease-in-out infinite",
              "@keyframes pulse": {
                "0%,100%": { opacity: 0.5 },
                "50%": { opacity: 1 },
              },
            }}
          />
        ))}
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box
        sx={{
          height,
          display: "grid",
          placeItems: "center",
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          backgroundColor: "#fff !important",
          backgroundImage: "none !important",
        }}
      >
        <Typography color="text.secondary">Tidak ada data</Typography>
      </Box>
    );
  }

  const values = data.map((d) => Number(d.value || 0));
  const maxValue = Math.max(...values, 1);
  const total = values.reduce((s, n) => s + n, 0);
  const avg = total / values.length;
  const currentIndex = data.length - 1;
  const peakIndex = useMemo(
    () => (showPeak ? values.indexOf(Math.max(...values)) : -1),
    [values, showPeak]
  );

  const getBarColor = (index) =>
    index === currentIndex
      ? theme.palette.primary.main
      : theme.palette.info.main;

  const gridLines = [0.25, 0.5, 0.75];

  return (
    <Box
      sx={{
        height,
        display: "flex",
        flexDirection: "column",
        gap: 1,
      }}
    >
      {showTotals && (
        <Stack direction="row" spacing={1} sx={{ px: 0.5 }}>
          <Chip
            size="small"
            label={`Total: ${valueFormatter(total)} ${unit}`}
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              color: theme.palette.primary.main,
            }}
          />
          <Chip
            size="small"
            label={`Rata-rata: ${valueFormatter(Math.round(avg))} ${unit}`}
            sx={{
              bgcolor: alpha(theme.palette.info.main, 0.08),
              color: theme.palette.info.main,
            }}
          />
        </Stack>
      )}

      {/* === Plot Area (dipaksa putih total) === */}
      <Box
        className="chart-area"
        style={{ backgroundColor: "#fff" }}   // inline style > CSS luar
        sx={{
          position: "relative",
          height: "100%",
          display: "flex",
          alignItems: "flex-end",
          gap: 1,
          justifyContent: "space-between",
          px: 1,
          pb: 1.5,
          backgroundColor: "#ffffff !important",
          backgroundImage: "none !important",  // potong gradien/overlay global
          mixBlendMode: "normal",
          borderRadius: 2,
          boxShadow: "inset 0 0 6px rgba(0,0,0,0.05)",
          border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,

          overflowX: scrollable ? "auto" : "hidden",
          overflowY: "hidden",
          "&::-webkit-scrollbar": { display: "none" },
          scrollbarWidth: "none",

          // Matikan pseudo-element overlay dari CSS global
          "&::before, &::after": {
            display: "none !important",
            content: '""',
          },
        }}
      >
        {gridLines.map((p) => (
          <Box
            key={p}
            sx={{
              position: "absolute",
              top: `${(1 - p) * 80 + 10}%`,
              left: 0,
              right: 0,
              height: 1,
              bgcolor: alpha(theme.palette.divider, 0.75),
            }}
          />
        ))}

        {data.map((item, index) => {
          const raw = Number(item.value || 0);
          const barHeight = maxValue > 0 ? (raw / maxValue) * 80 : 0;
          const color = getBarColor(index);
          const gradient = `linear-gradient(180deg, ${alpha(
            color,
            0.85
          )} 0%, ${alpha(darken(color, 0.05), 0.75)} 100%)`;

          return (
            <Tooltip
              key={index}
              title={item.tooltip || `${item.label}: ${valueFormatter(raw)} ${unit}`}
              arrow
              enterTouchDelay={20}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  flex: 1,
                  minWidth: 30,
                }}
              >
                <Box
                  sx={{
                    width: "100%",
                    height: `${barHeight}%`,
                    minHeight: 6,
                    background: gradient,
                    borderRadius: 6,
                    transition: animateOnMount ? "height 380ms ease" : "none",
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    mt: 1,
                    fontWeight: index === currentIndex ? 700 : 500,
                    color:
                      index === currentIndex
                        ? "primary.main"
                        : "text.secondary",
                    textAlign: "center",
                    fontSize: "0.7rem",
                  }}
                >
                  {item.label}
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
