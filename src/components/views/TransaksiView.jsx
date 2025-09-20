// src/components/views/TransaksiView.jsx
import React, { useEffect, useState } from "react";
import Card from "../ui/Card.jsx";
import Button from "../ui/Button.jsx";
import PenjualanView from "./PenjualanView.jsx";
import { DataService } from "../../services/DataService.js";
import { useToast } from "../../context/ToastContext.jsx";
import { fmtIDR } from "../../utils/helpers.js";
import { COLORS } from "../../utils/constants.js";

// 🔵 MUI
import {
  Box,
  Stack,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  CircularProgress,
  Skeleton,
  Paper,
  TextField, // ← pakai MUI TextField utk search
  InputAdornment,
} from "@mui/material";
import PaidIcon from "@mui/icons-material/PriceCheck";
import SearchIcon from "@mui/icons-material/Search";
import ReplayIcon from "@mui/icons-material/Replay";
import CreditScoreIcon from "@mui/icons-material/CreditScore";

export default function TransaksiView({ stocks = {}, onSaved }) {
  const toast = useToast();

  const [tab, setTab] = useState("penjualan"); // 'penjualan' | 'hutang'
  const [q, setQ] = useState("");
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Dialog bayar hutang
  const [paying, setPaying] = useState(null); // { id, customer, total, created_at }
  const payingTotal = Number(paying?.total || 0);

  // Load daftar hutang ketika tab hutang aktif / keyword berubah
  useEffect(() => {
    let on = true;
    (async () => {
      if (tab !== "hutang") return;
      try {
        setLoading(true);
        const rows = await DataService.getDebts({ query: q, limit: 200 });
        if (on) setDebts(rows);
      } catch (e) {
        toast?.show?.({ type: "error", message: `${e.message}` });
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => {
      on = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, q]);

  // Pelunasan hutang (nominal DIKUNCI == total)
  const onPaid = async () => {
    if (!paying) return;
    const amount = Number(paying.total || 0);
    if (!(amount > 0)) {
      toast?.show?.({ type: "error", message: "Nominal tidak valid" });
      return;
    }

    try {
      setLoading(true);
      await DataService.payDebt({
        sale_id: paying.id,
        amount,
        note: `pelunasan: ${paying.customer || ""}`,
      });
      toast?.show?.({
        type: "success",
        message: `Hutang lunas: ${paying.customer || "Pelanggan"}`,
      });
      setPaying(null);
      const rows = await DataService.getDebts({ query: q, limit: 200 });
      setDebts(rows);
      onSaved?.();
    } catch (e) {
      toast?.show?.({
        type: "error",
        message: `${e.message || "Gagal membayar hutang"}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={2}>
      {/* Header + Tabs */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Transaksi
        </Typography>
        <Box sx={{ ml: "auto" }} />
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab
            value="penjualan"
            icon={<CreditScoreIcon />}
            iconPosition="start"
            label="Penjualan Baru"
          />
          <Tab
            value="hutang"
            icon={<PaidIcon />}
            iconPosition="start"
            label="Bayar Hutang"
          />
        </Tabs>
      </Box>

      {/* TAB: PENJUALAN BARU */}
      {tab === "penjualan" && (
        <Card collapsible defaultExpanded title="Form Penjualan">
          <PenjualanView stocks={stocks} onSaved={onSaved} onCancel={() => {}} />
        </Card>
      )}

      {/* TAB: HUTANG */}
      {tab === "hutang" && (
        <Stack spacing={2}>
          <Card
            title="Cari Hutang"
            action={
              <Tooltip title="Muat ulang">
                <span>
                  <IconButton
                    onClick={() => setQ((s) => s)} // trigger effect dengan nilai sama
                    disabled={loading}
                  >
                    <ReplayIcon />
                  </IconButton>
                </span>
              </Tooltip>
            }
          >
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  placeholder="Cari nama pelanggan / catatan…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
              <Button
                className="secondary"
                onClick={() => setQ("")}
                disabled={loading}
                startIcon={<ReplayIcon />}
              >
                Reset
              </Button>
            </Stack>
            <Box sx={{ mt: 1, fontSize: 12, color: COLORS.secondary }}>
              Menampilkan transaksi dengan metode <b>HUTANG</b>. Pembayaran wajib{" "}
              <b>lunas</b>.
            </Box>
          </Card>

          <Card
            title="Daftar Hutang"
            collapsible
            defaultExpanded
            sx={{ overflow: "hidden" }}
          >
            {loading ? (
              <Stack spacing={1}>
                <Skeleton height={36} />
                <Skeleton height={36} />
                <Skeleton height={36} />
              </Stack>
            ) : (
              <TableContainer component={Paper} sx={{ borderRadius: 1.5 }}>
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
                    {!debts.length && (
                      <TableRow>
                        <TableCell colSpan={6} sx={{ color: "text.secondary" }}>
                          Tidak ada data hutang
                        </TableCell>
                      </TableRow>
                    )}
                    {debts.map((d) => (
                      <TableRow key={d.id} hover>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {(d.created_at || "").slice(0, 10)}
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip
                              size="small"
                              label="HUTANG"
                              color="warning"
                              variant="outlined"
                            />
                            <Typography>{d.customer || "PUBLIC"}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell align="right">{d.qty}</TableCell>
                        <TableCell align="right">{fmtIDR(d.price)}</TableCell>
                        <TableCell align="right">
                          <b>{fmtIDR(d.total)}</b>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Bayar hutang">
                            <span>
                              <Button
                                size="small"
                                onClick={() =>
                                  setPaying({
                                    id: d.id,
                                    customer: d.customer,
                                    total: d.total, // dikunci untuk pelunasan penuh
                                    created_at: d.created_at,
                                  })
                                }
                                disabled={loading || (Number(d.total) || 0) <= 0}
                              >
                                Bayar
                              </Button>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        </Stack>
      )}

      {/* DIALOG BAYAR HUTANG */}
      <Dialog
        open={!!paying}
        onClose={() => setPaying(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Bayar Hutang</DialogTitle>
        <DialogContent dividers>
          {paying ? (
            <Stack spacing={1.5}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography color="text.secondary">Pelanggan</Typography>
                <Typography fontWeight={700}>{paying.customer || "PUBLIC"}</Typography>
              </Stack>

              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography color="text.secondary">Tanggal</Typography>
                <Typography>{(paying.created_at || "").slice(0, 10)}</Typography>
              </Stack>

              <Divider />

              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography>Total Tagihan</Typography>
                <Typography variant="h6">{fmtIDR(payingTotal)}</Typography>
              </Stack>

              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  bgcolor: "#f8fafc",
                  fontSize: 12,
                  color: "text.secondary",
                }}
              >
                Nominal pembayaran <b>dikunci</b> sama dengan total tagihan.
                Transaksi akan ditandai <b>LUNAS</b>.
              </Box>
            </Stack>
          ) : (
            <Box sx={{ py: 3, display: "grid", placeItems: "center" }}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button className="secondary" onClick={() => setPaying(null)} disabled={loading}>
            Batal
          </Button>
          <Button onClick={onPaid} disabled={loading}>
            {loading ? "Menyimpan…" : "Simpan"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
