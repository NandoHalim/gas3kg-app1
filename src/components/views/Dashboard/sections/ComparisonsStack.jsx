import React from "react";
import { Stack, Typography, Box, Skeleton } from "@mui/material";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import ComparisonCard from "../ui/ComparisonCard.jsx";

function ComparisonsStack({ weekly, monthly, loading = false }) {
  if (loading) {
    return (
      <Stack spacing={1}>
        <Skeleton height={80} />
        <Skeleton height={80} />
        <Skeleton height={80} />
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CompareArrowsIcon fontSize="small" />
        Perbandingan Kinerja
      </Typography>
      <Stack spacing={2}>
        {weekly && (
          <ComparisonCard 
            title="Minggu Ini vs Minggu Lalu"
            current={weekly.this_week_qty}
            previous={weekly.last_week_qty}
            growth={weekly.growthPct}
            type="qty"
          />
        )}
        {monthly && (
          <>
            <ComparisonCard 
              title="Bulan Ini vs Bulan Lalu (Qty)"
              current={monthly.this_month_qty}
              previous={monthly.last_month_qty}
              growth={monthly.growthPctQty}
              type="qty"
            />
            <ComparisonCard 
              title="Bulan Ini vs Bulan Lalu (Omzet)"
              current={monthly.this_month_value}
              previous={monthly.last_month_value}
              growth={monthly.growthPctOmzet}
              type="currency"
            />
          </>
        )}
        {!weekly && !monthly && (
          <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
            <CompareArrowsIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
            <Typography>Data perbandingan belum tersedia</Typography>
          </Box>
        )}
      </Stack>
    </Stack>
  );
}

export default ComparisonsStack;
