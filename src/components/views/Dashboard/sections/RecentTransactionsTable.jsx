import React from "react";
import { Card, CardHeader, CardContent, TableContainer, Table, TableHead, TableBody, TableRow, TableCell, Paper, Typography, Chip, Skeleton, Box } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { fmtIDR } from "../../../../utils/helpers.js";
import EmptyStateRow from "../ui/EmptyStateRow.jsx";

function RecentTransactionsTable({ rows, loading = false, isSmallMobile = false }) {
  const theme = useTheme();

  // Mobile-optimized data display
  const MobileTransactionRow = ({ transaction }) => (
    <Box sx={{ 
      p: 1.5, 
      borderBottom: `1px solid ${theme.palette.divider}`,
      '&:last-child': { borderBottom: 'none' }
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="body2" fontWeight="600" noWrap sx={{ maxWidth: '60%' }}>
          {transaction.customer || "PUBLIC"}
        </Typography>
        <Chip 
          label={transaction.method} 
          size="small" 
          color={transaction.method === 'TUNAI' ? 'success' : 'primary'}
          variant="outlined"
          sx={{ height: 20, fontSize: '0.6rem' }}
        />
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          {(transaction.created_at || "").slice(0, 10)}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" fontWeight="600" sx={{ fontFamily: 'monospace' }}>
            {transaction.qty}x
          </Typography>
          <Typography variant="body2" fontWeight="700" sx={{ fontFamily: 'monospace', color: theme.palette.primary.main }}>
            {fmtIDR((Number(transaction.qty) || 0) * (Number(transaction.price) || 0))}
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  const MobileSkeleton = () => (
    <Box sx={{ p: 1.5 }}>
      {[...Array(5)].map((_, i) => (
        <Box key={i} sx={{ mb: 2, pb: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Skeleton variant="text" width="60%" height={20} sx={{ mb: 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Skeleton variant="text" width="30%" height={16} />
            <Skeleton variant="text" width="40%" height={16} />
          </Box>
        </Box>
      ))}
    </Box>
  );

  return (
    <Card sx={{
      background: `linear(135deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, ${alpha(theme.palette.info.main, 0.03)} 100%)`,
      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
      width: '100%',
      maxWidth: '100%',
      overflow: 'hidden'
    }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptLongIcon color="primary" />
            <Typography variant={isSmallMobile ? "subtitle1" : "h6"} fontWeight={700}>
              Transaksi Terbaru
            </Typography>
          </Box>
        }
        sx={{ 
          pb: 2, 
          borderBottom: 1, 
          borderColor: "divider",
          px: isSmallMobile ? 1.5 : 2,
          pt: isSmallMobile ? 1.5 : 2
        }}
      />
      <CardContent sx={{ p: 0 }}>
        {loading ? (
          isSmallMobile ? (
            <MobileSkeleton />
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, width: '100%' }}>
              <Table>
                <TableBody>
                  {[...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(5)].map((_, j) => (
                        <TableCell key={j}><Skeleton variant="text" height={40} /></TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )
        ) : isSmallMobile ? (
          // Mobile List View
          <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
            {(rows || []).map((transaction) => (
              <MobileTransactionRow key={transaction.id} transaction={transaction} />
            ))}
            {!rows?.length && (
              <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                <Typography variant="body2" gutterBottom>
                  Belum ada transaksi
                </Typography>
                <Typography variant="caption">
                  Transaksi terbaru akan muncul di sini setelah ada penjualan.
                </Typography>
              </Box>
            )}
          </Box>
        ) : (
          // Desktop Table View
          <TableContainer 
            component={Paper} 
            elevation={0}
            sx={{ 
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              maxHeight: 400,
              width: '100%',
              overflowX: 'auto',
              '& .MuiTable-root': {
                minWidth: 650,
              }
            }}
          >
            <Table stickyHeader size="medium">
              <TableHead>
                <TableRow sx={{ backgroundColor: theme.palette.background.default }}>
                  <TableCell sx={{ fontWeight: 700 }}>Tanggal</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Pelanggan</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Qty</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Metode</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(rows || []).map((transaction) => (
                  <TableRow key={transaction.id} hover>
                    <TableCell sx={{ whiteSpace: "nowrap", fontFamily: 'monospace' }}>
                      {(transaction.created_at || "").slice(0, 10)}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {transaction.customer || "PUBLIC"}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                      {transaction.qty}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={transaction.method} 
                        size="small" 
                        color={transaction.method === 'TUNAI' ? 'success' : 'primary'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                      {fmtIDR((Number(transaction.qty) || 0) * (Number(transaction.price) || 0))}
                    </TableCell>
                  </TableRow>
                ))}
                {!rows?.length && (
                  <EmptyStateRow
                    colSpan={5}
                    message="Belum ada transaksi"
                    hint="Transaksi terbaru akan muncul di sini setelah ada penjualan."
                  />
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
}

export default RecentTransactionsTable;