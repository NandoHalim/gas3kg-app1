import React from "react";
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Stack,
  Skeleton,
  Box,
} from "@mui/material";
import PaidIcon from "@mui/icons-material/Paid";

function fmtIDR(n = 0) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Number(n) || 0);
}

/**
 * Props:
 * - omzet, hpp, laba, margin, transactionCount, totalQty
 * - loading?: boolean
 */
export default function FinancialSummaryCard({
  omzet = 0,
  hpp = 0,
  laba = 0,
  margin = 0,
  transactionCount = 0,
  totalQty = 0,
  loading = false,
}) {
  const Row = ({ k, v }) => (
    <Stack direction="row" alignItems="baseline" sx={{ py: 0.5 }}>
      <Typography variant="body2" color="text.secondary">
        {k}
      </Typography>
      <Box sx={{ flex: 1 }} />
      <Typography
        variant="body2"
        fontWeight={800}
        sx={{ fontVariantNumeric: "tabular-nums" }}
      >
        {v}
      </Typography>
    </Stack>
  );

  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardHeader
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <PaidIcon fontSize="small" color="success" />
            <Typography variant="h6" fontWeight={800}>
              Ringkasan Keuangan (MTD)
            </Typography>
          </Stack>
        }
        sx={{ pb: 0 }}
      />
      <CardContent sx={{ pt: 2 }}>
        {loading ? (
          <Stack spacing={1}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={16} sx={{ borderRadius: 1 }} />
            ))}
          </Stack>
        ) : (
          <Stack spacing={0.5}>
            <Row k="Omzet" v={fmtIDR(omzet)} />
            <Row k="HPP" v={fmtIDR(hpp)} />
            <Row k="Laba" v={fmtIDR(laba)} />
            <Row k="Margin" v={`${Math.round(margin)}%`} />
            <Row k="Transaksi" v={transactionCount} />
            <Row k="Qty" v={totalQty} />
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
