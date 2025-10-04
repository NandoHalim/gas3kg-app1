import React from "react";
import { TableContainer, Table, TableHead, TableBody, TableRow, TableCell, Paper, Typography, Button, Stack, Skeleton } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import PeopleIcon from "@mui/icons-material/People";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import { fmtIDR } from "../../../../utils/helpers.js";
import EmptyStateRow from "../ui/EmptyStateRow.jsx";

const btnLinkSx = { textTransform: "none", fontWeight: 500, px: 0, minWidth: 100 };

function TopCustomersTable({ rows, loading = false, onOpenCustomerHistory, isSmallMobile = false }) {
  const theme = useTheme();

  if (loading) {
    return (
      <Stack spacing={1}>
        <Skeleton height={40} />
        <Skeleton height={40} />
        <Skeleton height={40} />
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PeopleIcon fontSize="small" />
        Top Customers (Bulan Ini)
      </Typography>
      <TableContainer 
        component={Paper} 
        elevation={0}
        sx={{ 
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2
        }}
      >
        <Table size={isSmallMobile ? "small" : "medium"}>
          <TableHead>
            <TableRow sx={{ backgroundColor: theme.palette.background.default }}>
              <TableCell sx={{ fontWeight: 700 }}>Pelanggan</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Transaksi</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(rows || []).map((customer, index) => (
              <TableRow key={index} hover>
                <TableCell sx={{ whiteSpace: "nowrap" }}>
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<VisibilityOutlined fontSize="small" />}
                    sx={btnLinkSx}
                    onClick={() => onOpenCustomerHistory(customer.customer_name)}
                  >
                    {isSmallMobile ? customer.customer_name.slice(0, 12) + '...' : customer.customer_name}
                  </Button>
                </TableCell>
                <TableCell align="right">{customer.total_transaksi}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  {fmtIDR(customer.total_value)}
                </TableCell>
              </TableRow>
            ))}
            {!rows?.length && (
              <EmptyStateRow colSpan={3} message="Belum ada data" hint="Data pelanggan akan muncul setelah ada transaksi bulan ini." />
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}

export default TopCustomersTable;
