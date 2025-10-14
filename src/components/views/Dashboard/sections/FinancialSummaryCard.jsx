import React from "react";
import { Card, CardHeader, CardContent, Stack, Box, Typography, Divider, Skeleton } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import { fmtIDR } from "../../../../utils/helpers.js";
import RowKV from "../ui/RowKV.jsx";
import { useMediaQuery } from "@mui/material";

function FinancialSummaryCard({ omzet, hpp, laba, margin, transactionCount, totalQty, loading = false }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Mobile-optimized row component
  const MobileRow = ({ label, value, color = 'text.primary', isTotal = false }) => (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      py: 1,
      borderBottom: isTotal ? 'none' : `1px solid ${theme.palette.divider}`
    }}>
      <Typography 
        variant={isTotal ? "body1" : "body2"} 
        fontWeight={isTotal ? 600 : 400}
        color="text.secondary"
        sx={{ fontSize: isMobile ? '0.8rem' : '0.9rem' }}
      >
        {label}
      </Typography>
      <Typography 
        variant={isTotal ? "h6" : "body2"} 
        fontWeight={isTotal ? 700 : 600}
        color={color}
        sx={{ 
          fontSize: isMobile ? '0.8rem' : isTotal ? '1.1rem' : '0.9rem',
          textAlign: 'right'
        }}
      >
        {value}
      </Typography>
    </Box>
  );

  const MobileSkeleton = () => (
    <Stack spacing={1.5}>
      {[...Array(5)].map((_, i) => (
        <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="30%" height={20} />
        </Box>
      ))}
    </Stack>
  );

  return (
    <Card sx={{
      background: `linear(135deg, ${alpha(theme.palette.success.main, 0.05)} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
      border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
      width: '100%',
      maxWidth: '100%',
      overflow: 'hidden'
    }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBalanceWalletIcon 
              color="success" 
              sx={{ fontSize: isMobile ? '1.2rem' : '1.5rem' }} 
            />
            <Typography 
              variant={isMobile ? "subtitle1" : "h6"} 
              fontWeight={700}
              sx={{ fontSize: isMobile ? '1rem' : 'inherit' }}
            >
              Ringkasan Keuangan
            </Typography>
          </Box>
        }
        subheader={
          <Typography variant="caption" sx={{ fontSize: isMobile ? '0.7rem' : '0.8rem' }}>
            Akumulasi semua transaksi dibayar
          </Typography>
        }
        sx={{ 
          pb: 2, 
          borderBottom: 1, 
          borderColor: "divider",
          px: isMobile ? 1.5 : 2,
          pt: isMobile ? 1.5 : 2,
          '& .MuiCardHeader-content': {
            width: '100%'
          }
        }}
      />
      <CardContent sx={{ px: isMobile ? 1.5 : 2, pb: isMobile ? 1.5 : 2 }}>
        {loading ? (
          isMobile ? <MobileSkeleton /> : (
            <Stack spacing={2}>
              <Skeleton height={32} />
              <Skeleton height={32} />
              <Skeleton height={32} />
              <Skeleton height={32} />
            </Stack>
          )
        ) : isMobile ? (
          // Mobile View
          <Stack spacing={0.5}>
            <MobileRow label="Omzet (Tunai + LUNAS)" value={fmtIDR(omzet)} color="success.main" />
            <MobileRow label="Harga Pokok Penjualan" value={`- ${fmtIDR(hpp)}`} color="error.main" />
            
            <Box sx={{ py: 1 }}>
              <Divider />
            </Box>
            
            <MobileRow label="Laba Kotor" value={fmtIDR(laba)} 
                      color={laba >= 0 ? 'success.main' : 'error.main'} 
                      isTotal={true} />
            
            <MobileRow label="Margin Laba" value={`${margin}%`} 
                      color={margin >= 0 ? 'info.main' : 'error.main'} />
            
            <Box sx={{ 
              mt: 1, 
              p: 1.5, 
              bgcolor: alpha(theme.palette.primary.main, 0.05), 
              borderRadius: 1,
              textAlign: 'center'
            }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                {transactionCount} transaksi • {totalQty} tabung
              </Typography>
            </Box>
          </Stack>
        ) : (
          // Desktop View
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