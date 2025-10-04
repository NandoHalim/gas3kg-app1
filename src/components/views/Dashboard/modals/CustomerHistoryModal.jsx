import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Button,
  Typography,
  Box,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Skeleton,
  Chip
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import PeopleIcon from "@mui/icons-material/People";
import { fmtIDR } from "../../../../utils/helpers.js";
import EmptyStateRow from "../ui/EmptyStateRow.jsx";

const btnDialogSx = { textTransform: "none", minWidth: 120 };

function CustomerHistoryModal({ 
  open, 
  customerName, 
  rows, 
  totalQty, 
  loading = false, 
  onClose 
}) {
  const theme = useTheme();

  return (
    <Dialog fullWidth maxWidth="md" open={open} onClose={onClose}>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PeopleIcon color="primary" />
          Riwayat Transaksi — {customerName}
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Stack spacing={1} sx={{ py: 2 }}>
            {[...Array(5)].map((_, i) => <Skeleton key={i} height={53} />)}
          </Stack>
        ) : (
          <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2 }}>
            <Table size="medium">
              <TableHead>
                <TableRow sx={{ backgroundColor: theme.palette.background.default }}>
                  <TableCell sx={{ fontWeight: 700 }}>Tanggal</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Qty</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Metode & Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(rows || []).map((transaction) => (
                  <TableRow key={transaction.id} hover>
                    <TableCell sx={{ whiteSpace: "nowrap", fontFamily: 'monospace' }}>
                      {String(transaction.created_at || "").slice(0,10)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                      {transaction.qty}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Chip 
                          label={transaction.method} 
                          size="small" 
                          color={transaction.method === 'TUNAI' ? 'success' : 'primary'}
                          variant="outlined"
                        />
                        {transaction.method === "HUTANG" && (
                          <Chip
                            size="small"
                            label={(String(transaction.status || "").toUpperCase() === "LUNAS") ? "LUNAS" : "BELUM"}
                            color={(String(transaction.status || "").toUpperCase() === "LUNAS") ? "success" : "error"}
                            variant="filled"
                          />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                      {fmtIDR((Number(transaction.qty)||0) * (Number(transaction.price)||0))}
                    </TableCell>
                  </TableRow>
                ))}
                {!rows?.length && (
                  <EmptyStateRow colSpan={4} message="Tidak ada riwayat transaksi" />
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight={700} color="primary.main">
          Total Qty: {loading ? "…" : totalQty}
        </Typography>
        <DialogActions sx={{ px: 0 }}>
          <Button variant="contained" sx={btnDialogSx} onClick={onClose}>
            Tutup
          </Button>
        </DialogActions>
      </Stack>
    </Dialog>
  );
}

export default CustomerHistoryModal;