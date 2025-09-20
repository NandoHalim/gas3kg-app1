import React, { useEffect, useState } from "react";
import { DataService } from "../../services/DataService.js";
import { useToast } from "../../context/ToastContext.jsx";
import { fmtIDR } from "../../utils/helpers.js";

import {
  Box,
  Stack,
  Typography,
  Card,
  CardHeader,
  CardContent,
  TextField,
  IconButton,
  Button,
  Tooltip,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  CircularProgress,
  Skeleton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ReplayIcon from "@mui/icons-material/Replay";
import PaidIcon from "@mui/icons-material/PriceCheck";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";

export default function RiwayatHutangView() {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // Dialog bayar hutang
  const [paying, setPaying] = useState(null); // { id, customer, total, created_at }
  const payingTotal = Number(paying?.total || 0);

  const load = async () => {
    try {
      setLoading(true);
      const data = await DataService.getDebts({ query: q, limit: 300 });
      setRows(data || []);
    } catch (e) {
      toast?.show?.({ type: "error", message: e.message || "Gagal memuat hutang" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPaid = async () => {
    if (!paying) return;
    try {
      setLoading(true);
      await DataService.payDebt({
        sale_id: paying.id,
        amount: Number(paying.total || 0),
        note: `pelunasan: ${paying.customer || ""}`,
      });
      toast?.show?.({ type: "success", message: "Hutang berhasil dilunasi" });
      setPaying(null);
      await load();
    } catch (e) {
      toast?.show?.({ type: "error", message: e.message || "Gagal melunasi hutang" });
    } finally {
      setLoading(false);
    }
  };

  const waHref = (nama, total) => {
    const pesan = `Halo ${nama || "Pelanggan"},\n\nTagihan LPG 3kg Anda sebesar ${fmtIDR(
      total
    )} sudah jatuh tempo. Mohon konfirmasi pembayaran ya. Terima kasih 🙏`;
    return `https://wa.me/?text=${encodeURIComponent(pesan)}`;
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={700}>
        Riwayat Hutang (Belum Lunas)
      </Typography>

      <Card>
        <CardHeader
          title="Pencarian"
          action={
            <Tooltip title="Muat ulang">
              <span>
                <IconButton onClick={load} disabled={loading}>
                  <ReplayIcon />
                </IconButton>
              </span>
            </Tooltip>
          }
        />
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <TextField
              placeholder="Cari nama pelanggan / catatan…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              disabled={loading}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />,
              }}
              fullWidth
            />
            <Button
              variant="outlined"
              onClick={() => setQ("")}
              disabled={loading}
              startIcon={<ReplayIcon />}
            >
              Reset
            </Button>
            <Button variant="contained" onClick={load} disabled={loading}>
              {loading ? "Memuat…" : "Cari"}
            </Button>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
            Menampilkan transaksi dengan metode <b>HUTANG</b> & status belum lunas / tidak dibatalkan.
          </Typography>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Daftar Hutang" />
        <CardContent>
          {loading ? (
            <Stack spacing={1}>
              <Skeleton height={36} />
              <Skeleton height={36} />
              <Skeleton height={36} />
            </Stack>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Tanggal</TableCell>
                    <TableCell>Pelanggan</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Harga</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="center">Aksi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {!rows.length && (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ color: "text.secondary" }}>
                        Tidak ada data
                      </TableCell>
                    </TableRow>
                  )}
                  {rows.map((r) => (
                    <TableRow key={r.id} hover>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        {(r.created_at || "").slice(0, 10)}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip size="small" color="warning" variant="outlined" label="HUTANG" />
                          <Typography>{r.customer || "PUBLIC"}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="right">{r.qty}</TableCell>
                      <TableCell align="right">{fmtIDR(r.price)}</TableCell>
                      <TableCell align="right">
                        <b>{fmtIDR(r.total)}</b>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Tooltip title="Ingatkan via WhatsApp">
                            <IconButton
                              color="success"
                              component="a"
                              href={waHref(r.customer, r.total)}
                              target="_blank"
                              rel="noreferrer"
                              size="small"
                            >
                              <WhatsAppIcon />
                            </IconButton>
                          </Tooltip>
                          <Button
                            size="small"
                            onClick={() =>
                              setPaying({
                                id: r.id,
                                customer: r.customer,
                                total: r.total,
                                created_at: r.created_at,
                              })
                            }
                          >
                            Bayar
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Dialog Bayar */}
      <Dialog open={!!paying} onClose={() => setPaying(null)} fullWidth maxWidth="sm">
        <DialogTitle>Bayar Hutang</DialogTitle>
        <DialogContent dividers>
          {paying ? (
            <Stack spacing={1.5}>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">Pelanggan</Typography>
                <Typography fontWeight={700}>{paying.customer || "PUBLIC"}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">Tanggal</Typography>
                <Typography>{(paying.created_at || "").slice(0, 10)}</Typography>
              </Stack>
              <Divider />
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography>Total Tagihan</Typography>
                <Typography variant="h6">{fmtIDR(payingTotal)}</Typography>
              </Stack>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  bgcolor: "grey.50",
                  color: "text.secondary",
                  fontSize: 12,
                }}
              >
                Nominal pembayaran <b>dikunci</b> sama dengan total tagihan. Transaksi akan
                ditandai <b>LUNAS</b>.
              </Box>
            </Stack>
          ) : (
            <Box sx={{ py: 3, display: "grid", placeItems: "center" }}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setPaying(null)} disabled={loading}>
            Batal
          </Button>
          <Button variant="contained" onClick={onPaid} disabled={loading}>
            {loading ? "Menyimpan…" : "Simpan"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
