// src/components/views/Dashboard/sections/SevenDaysChartCard.jsx
import React from "react";
import { Card, CardHeader, CardContent, Box, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import BarChartIcon from "@mui/icons-material/BarChart";
import MiniBarChartLabeled from "../ui/MiniBarChartLabeled.jsx";

/**
 * Props:
 * - series: [{ date, qty }]
 * - loading?: boolean
 */
function SevenDaysChartCard({ series = [], loading = false }) {
  const theme = useTheme();

  return (
    <Card
      sx={{
        borderRadius: 2,
        background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.05)} 0%, ${alpha(
          theme.palette.primary.main,
          0.05
        )} 100%)`, // fix: linear → linear-gradient
        border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
        minHeight: 180,
      }}
    >
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <BarChartIcon color="info" />
            <Typography variant="h6" fontWeight={700}>
              Penjualan 7 Hari Terakhir
            </Typography>
          </Box>
        }
        subheader="Trend penjualan harian"
        sx={{ pb: 2, borderBottom: 1, borderColor: "divider" }}
      />
      <CardContent sx={{ pt: 2 }}>
        <MiniBarChartLabeled data={series} loading={loading} />
      </CardContent>
    </Card>
  );
}

export default SevenDaysChartCard;
