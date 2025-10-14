import React from "react";
import { Card, CardHeader, CardContent, TableContainer, Table, TableHead, TableBody, TableRow, TableCell, Paper, Typography, Chip, Skeleton, Box } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { fmtIDR } from "../../../../utils/helpers.js";
import EmptyStateRow from "../ui/EmptyStateRow.jsx";

function RecentTransactionsTable({ rows, loading = false, isSmallMobile = false }) {
  const theme = useTheme();

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
            <Typography variant="h6" fontWeight={700}>Transaksi Terbaru</Typography>
          </Box>
        }
        sx={{ pb: 2, borderBottom: 1, borderColor: "divider" }}
      />
      <CardContent sx={{ p: 0 }}>
        {loading ? (
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
        ) : (
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
            <Table stickyHeader size={isSmallMobile ? "small" : "medium"}>
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
                    <TableCell sx={{ whiteSpace: "nowrap", fontFamily: 'monospace', fontSize: isSmallMobile ? '0.75rem' : 'inherit' }}>
                      {(transaction.created_at || "").slice(0, 10)}
                    </TableCell>
                    <TableCell>
                      <Typography variant={isSmallMobile ? "caption" : "body2"} fontWeight={500}>
                        {isSmallMobile && transaction.customer && transaction.customer.length > 12 
                          ? transaction.customer.slice(0, 12) + '...' 
                          : transaction.customer || "PUBLIC"}
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