import React from "react";
import { Card, CardHeader, CardContent, Stack, Box, Typography, Divider, Skeleton } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import { fmtIDR } from "../../../../utils/helpers.js";
import RowKV from "../ui/RowKV.jsx";

function FinancialSummaryCard({ omzet, hpp, laba, margin, transactionCount, totalQty, loading = false }) {
  const theme = useTheme();

  return (
    <Card sx={{
      background: `linear(135deg, ${alpha(theme.palette.success.main, 0.05)} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
      border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`
    }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBalanceWalletIcon color="success" />
            <Typography variant="h6" fontWeight={700}>Ringkasan Keuangan</Typography>
          </Box>
        }
        subheader="Akumulasi semua transaksi dibayar"
        sx={{ pb: 2, borderBottom: 1, borderColor: "divider" }}
      />
      <CardContent>
        {loading ? (
          <Stack spacing={2}>
            <Skeleton height={32} />
            <Skeleton height={32} />
            <Skeleton height={32} />
            <Skeleton height={32} />
          </Stack>
        ) : (
          <Stack spacing={2}>
            <RowKV 
              k="Omzet (Tunai + LUNAS)" 
              v={fmtIDR(omzet)} 
              vSx={{ fontWeight: 700, color: 'success.main' }}
            />
            <RowKV 
              k="Harga Pokok Penjualan" 
              v={`- ${fmtIDR(hpp)}`} 
              vSx={{ fontWeight: 600, color: 'error.main' }}
            />
            <Divider />
            <RowKV 
              k="Laba Kotor" 
              v={fmtIDR(laba)} 
              vSx={{ 
                fontWeight: 800, 
                fontSize: '1.2rem',
                color: laba >= 0 ? 'success.main' : 'error.main' 
              }}
            />
            <RowKV 
              k="Margin Laba" 
              v={`${margin}%`}
              vSx={{ 
                fontWeight: 700, 
                color: margin >= 0 ? 'info.main' : 'error.main' 
              }}
            />
            <Box sx={{ mt: 1, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                {transactionCount} transaksi • {totalQty} tabung
              </Typography>
            </Box>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

export default FinancialSummaryCard;