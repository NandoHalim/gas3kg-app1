// src/components/ui/MiniBarChartLabeled.jsx
import React, { useMemo } from "react";
import { Box, Typography, useTheme, Tooltip, Chip, Stack } from "@mui/material";
import { alpha, darken } from "@mui/material/styles";

/**
 * MiniBarChartLabeled (modern)
 * - Backward compatible props: data, loading, height, type
 * - Extra props (optional):
 *   - unit = "tabung"
 *   - valueFormatter = (n) => new Intl.NumberFormat('id-ID').format(n)
 *   - showTotals = true (tampilkan total & rata2)
 *   - showPeak = true (tandai bar tertinggi)
 *   - compactLabels = auto (auto/true/false)
 */
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
}) {
  const theme = useTheme();

  // ====== Loading skeleton ======
  if (loading) {
    return (
      <Box
        sx={{
          height,
          p: 2,
          display: "flex",
          alignItems: "flex-end",
          gap: 1.25,
          overflow: "hidden",
        }}
        aria-busy
        aria-live="polite"
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <Box
            key={i}
            sx={{
              flex: 1,
              minWidth: 22,
              height: `${30 + (i * 7) % 60}%`,
              borderRadius: 1,
              background: `linear-gradient(180deg, ${alpha(theme.palette.grey[300], 0.7)} 0%, ${alpha(
                theme.palette.grey[200],
                0.5
              )} 100%)`,
              animation: "pulse 1.6s ease-in-out infinite",
              "@keyframes pulse": {
                "0%, 100%": { opacity: 0.4 },
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
      <Box sx={{ height, display: "grid", placeItems: "center", p: 2 }}>
        <Typography color="text.secondary">Tidak ada data</Typography>
      </Box>
    );
  }

  // ====== Computations ======
  const values = data.map((d) => Number(d.value || 0));
  const maxValue = Math.max(...values, 1);
  const total = values.reduce((s, n) => s + n, 0);
  const avg = total / values.length;

  const isWeeklyMonthly = type === "mingguan_bulan";
  const isFourWeeks = type === "4_minggu";
  const isSixMonths = type === "6_bulan";
  const isDaily = type === "7_hari";
  const currentIndex = data.length - 1;
  const peakIndex = useMemo(
    () => (showPeak ? values.indexOf(Math.max(...values)) : -1),
    [values, showPeak]
  );

  const wantCompactLabels =
    compactLabels === "auto"
      ? (isSixMonths && data.length > 6) || (!isSixMonths && data.length > 8)
      : !!compactLabels;

  // ====== Colors ======
  const paletteSet = [
    theme.palette.primary.main,
    theme.palette.info.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.secondary.main,
  ];

  const getBarColor = (index) => {
    if (index === currentIndex) {
      // current period bar (today / last week / last month)
      return theme.palette.primary.main;
    }
    if (!isDaily && (isWeeklyMonthly || isFourWeeks || isSixMonths)) {
      return paletteSet[index % paletteSet.length];
    }
    return theme.palette.info.main;
  };

  // ====== Grid lines (25/50/75%) ======
  const gridLines = [0.25, 0.5, 0.75];

  // ====== Render ======
  return (
    <Box role="img" aria-label="Grafik batang ringkas" sx={{ height, display: "flex", flexDirection: "column", gap: 1 }}>
      {/* Totals header */}
      {showTotals && (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 0.5 }}>
          <Chip
            size="small"
            label={`Total: ${valueFormatter(total)} ${unit}`}
            sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08), color: theme.palette.primary.main }}
          />
          <Chip
            size="small"
            label={`Rata-rata: ${valueFormatter(Math.round(avg))} ${unit}`}
            sx={{ bgcolor: alpha(theme.palette.info.main, 0.08), color: theme.palette.info.main }}
          />
          {showPeak && peakIndex >= 0 && (
            <Chip
              size="small"
              label={`Puncak: ${data[peakIndex]?.label ?? "–"} (${valueFormatter(values[peakIndex])} ${unit})`}
              sx={{ bgcolor: alpha(theme.palette.success.main, 0.08), color: theme.palette.success.main }}
            />
          )}
        </Stack>
      )}

      <Box
        sx={{
          position: "relative",
          height: "100%",
          minHeight: Math.max(120, height - 40),
          display: "flex",
          alignItems: "flex-end",
          gap: isWeeklyMonthly || isFourWeeks ? 2 : isSixMonths ? 1.25 : 1,
          justifyContent: isWeeklyMonthly || isFourWeeks ? "center" : "space-between",
          px: isWeeklyMonthly || isFourWeeks ? 1.5 : 0,
          overflowX: "auto",
          overflowY: "hidden",
          // smooth scroll for mobile
          scrollBehavior: "smooth",
          borderRadius: 1,
        }}
      >
        {/* Horizontal grid */}
        {gridLines.map((p) => (
          <Box
            key={p}
            aria-hidden
            sx={{
              position: "absolute",
              inset: 0,
              top: `${(1 - p) * 80 + 10}%`, // bars occupy ~80% of height, keep 10% headroom
              height: 1,
              bgcolor: alpha(theme.palette.divider, 0.6),
            }}
          />
        ))}

        {/* Bars */}
        {data.map((item, index) => {
          const raw = Number(item.value || 0);
          const barHeight = maxValue > 0 ? (raw / maxValue) * 80 : 0; // use 80% area for bars
          const isCurrent = index === currentIndex;
          const isPeak = index === peakIndex;

          const color = getBarColor(index);
          const gradient = `linear-gradient(180deg, ${alpha(color, 0.95)} 0%, ${alpha(
            darken(color, 0.08),
            0.95
          )} 100%)`;

          const labelText = item.label;
          const displayLabel = wantCompactLabels ? compactifyLabel(labelText) : labelText;

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
                  flex: isWeeklyMonthly || isFourWeeks ? "0 0 auto" : isSixMonths ? 1 : 1,
                  minWidth: isWeeklyMonthly || isFourWeeks ? 54 : isSixMonths ? 42 : 30,
                  px: 0.25,
                }}
              >
                {/* Bar */}
                <Box
                  sx={{
                    width: isWeeklyMonthly || isFourWeeks ? 44 : isSixMonths ? 36 : "100%",
                    minWidth: 24,
                    height: `${barHeight}%`,
                    minHeight: 6,
                    background: gradient,
                    borderRadius: 8,
                    transition: "height 380ms ease, transform 180ms ease, box-shadow 180ms ease",
                    cursor: "pointer",
                    transform: isCurrent ? "translateY(-1px)" : "translateY(0)",
                    boxShadow: isCurrent ? 3 : 1,
                    "&:hover": {
                      opacity: 0.9,
                      transform: "translateY(-3px)",
                      boxShadow: 4,
                    },
                    position: "relative",
                    outline: isPeak && showPeak ? `2px dashed ${alpha(theme.palette.success.main, 0.9)}` : "none",
                    outlineOffset: 2,
                  }}
                  aria-label={`${item.label} ${valueFormatter(raw)} ${unit}${isCurrent ? " (terkini)" : ""}${isPeak ? " (tertinggi)" : ""}`}
                />

                {/* Label bawah */}
                <Typography
                  variant="caption"
                  sx={{
                    mt: 1,
                    fontWeight: isCurrent ? 700 : 500,
                    color: isCurrent ? "primary.main" : "text.secondary",
                    textAlign: "center",
                    lineHeight: 1.1,
                    fontSize: isWeeklyMonthly || isFourWeeks ? "0.75rem" : "0.7rem",
                    whiteSpace: "nowrap",
                  }}
                >
                  {displayLabel}
                </Typography>

                {/* Value bawah */}
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    color: "text.primary",
                    fontSize: "0.7rem",
                    lineHeight: 1.1,
                  }}
                >
                  {valueFormatter(raw)}
                </Typography>
              </Box>
            </Tooltip>
          );
        })}
      </Box>

      {/* Legend kecil untuk mode berwarna */}
      {!isDaily && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.5, px: 0.5, gap: 1 }}>
          <Legend swatch={theme.palette.primary.main} label="Periode terkini" />
          {showPeak && <Legend swatch={theme.palette.success.main} dashed label="Nilai tertinggi" />}
        </Box>
      )}
    </Box>
  );
}

function Legend({ swatch, label, dashed = false }) {
  return (
    <Stack direction="row" spacing={0.75} alignItems="center">
      <Box
        sx={{
          width: 14,
          height: 8,
          borderRadius: 999,
          bgcolor: dashed ? "transparent" : swatch,
          border: dashed ? `2px dashed ${alpha(swatch, 0.9)}` : "none",
        }}
      />
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Stack>
  );
}

function compactifyLabel(text) {
  if (!text) return text;
  // ex: "Minggu 1 (1–7 Okt)" -> "M1", "Okt/25" tetap
  const m = text.match(/^M(inggu)?\s?(\d+)/i);
  if (m) return `M${m[2]}`;
  if (text.includes("/")) return text; // e.g., "Okt/25"
  // ambil 4-5 karakter pertama biar rapih
  return text.length > 5 ? `${text.slice(0, 5)}…` : text;
}

export default MiniBarChartLabeled;
