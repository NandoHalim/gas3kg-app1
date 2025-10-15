// src/components/views/TransaksiView.jsx
import React, { useEffect, useState } from "react";
import { DataService } from "../../services/DataService.js";
import { useToast } from "../../context/ToastContext.jsx";
import { fmtIDR } from "../../utils/helpers.js";
import { COLORS } from "../../utils/constants.js";
import { useSettings } from "../../context/SettingsContext.jsx";

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
  TextField,
  InputAdornment,
  useTheme,
  useMediaQuery,
  AppBar,
  Toolbar,
  Card,
  CardHeader,
  CardContent,
  Button
} from "@mui/material";
import PaidIcon from "@mui/icons-material/PriceCheck";
import SearchIcon from "@mui/icons-material/Search";
import ReplayIcon from "@mui/icons-material/Replay";
import CreditScoreIcon from "@mui/icons-material/CreditScore";
import CloseIcon from "@mui/icons-material/Close";

// Import komponen yang diperlukan
import PenjualanView from "./PenjualanView.jsx";

export default function TransaksiView({ stocks = {}, onSaved }) {
  const toast = useToast();
  const { settings } = useSettings();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [tab, setTab] = useState("penjualan");
  const [q, setQ] = useState("");
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customerList, setCustomerList] = useState([]);
  const [paying, setPaying] = useState(null);
  const payingTotal = Number(paying?.total || 0);

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const rows = await DataService.loadSales(300);
        const uniq = Array.from(new Set((rows || []).map((r) => (r.customer || "").trim()))).filter(Boolean);
        if (on) setCustomerList(uniq);
      } catch (e) {
        console.error("Gagal memuat daftar pelanggan:", e);
      }
    })();
    return () => { on = false; };
  }, []);

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
    return () => { on = false; };
  }, [tab, q]);

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
      toast?.show?.({ type: "success", message: `Hutang lunas: ${paying.customer || "Pelanggan"}` });
      setPaying(null);
      const rows = await DataService.getDebts({ query: q, limit: 200 });
      setDebts(rows);
      onSaved?.();
    } catch (e) {
      toast?.show?.({ type: "error", message: `${e.message || "Gagal membayar hutang"}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ pb: { xs: 8, md: 2 } }}>
      {/* Header + Tabs - Mobile Optimized */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Transaksi
            </Typography>
            
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              variant={isMobile ? "fullWidth" : "standard"}
              sx={{
                minHeight: 48,
                "& .MuiTab-root": { 
                  minHeight: 48, 
                  textTransform: "none",
                  fontSize: isSmallMobile ? '0.75rem' : '0.875rem'
                },
              }}
              textColor="primary"
              indicatorColor="primary"
            >
              <Tab 
                value="penjualan" 
                icon={<CreditScoreIcon />} 
                iconPosition="start" 
                label={isSmallMobile ? "Penjualan" : "Penjualan Baru"} 
              />
              <Tab 
                value="hutang" 
                icon={<PaidIcon />} 
                iconPosition="start" 
                label={isSmallMobile ? "Hutang" : "Bayar Hutang"} 
              />
            </Tabs>
          </Stack>
        </CardContent>
      </Card>

      {/* TAB: PENJUALAN */}
      {tab === "penjualan" && (
        <PenjualanView
          stocks={stocks}
          onSaved={onSaved}
          onCancel={() => {}}
          customerList={customerList}
          defaultPrice={settings?.default_price}
          hpp={settings?.hpp}
        />
      )}

      {/* TAB: HUTANG */}
      {tab === "hutang" && (
        <Stack spacing={2}>
          {/* Search Card */}
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Stack spacing={2}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <SearchIcon color="action" />
                  <Typography variant="h6">Cari Hutang</Typography>
                  <Box sx={{ flexGrow: 1 }} />
                  <Tooltip title="Muat ulang">
                    <IconButton 
                      onClick={() => setQ((s) => s)} 
                      disabled={loading}
                      size="small"
                    >
                      <ReplayIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="flex-end">
                  <TextField
                    fullWidth
                    placeholder="Cari nama pelanggan / catatan..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    disabled={loading}
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button
                    variant="outlined"
                    onClick={() => setQ("")}
                    disabled={loading}
                    startIcon={<ReplayIcon />}
                    sx={{ textTransform: "none", minWidth: 100 }}
                    size="small"
                  >
                    Reset
                  </Button>
                </Stack>
                
                <Typography variant="caption" color="text.secondary">
                  Menampilkan transaksi dengan metode <b>HUTANG</b>. Pembayaran wajib <b>lunas</b>.
                </Typography>
              </Stack>
            </CardContent>
          </Card>

          {/* Debt List Card */}
          <Card>
            <CardHeader title="Daftar Hutang" />
            <CardContent sx={{ p: 0 }}>
              {loading ? (
                <Box sx={{ p: 2 }}>
                  <Stack spacing={1}>
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} height={48} variant="rounded" />
                    ))}
                  </Stack>
                </Box>
              ) : (
                <TableContainer 
                  component={Paper} 
                  elevation={0}
                  sx={{ 
                    borderRadius: 0,
                    maxHeight: isMobile ? 'calc(100vh - 300px)' : '500px'
                  }}
                >
                  <Table 
                    size={isMobile ? "small" : "medium"} 
                    stickyHeader
                  >
                    <TableHead>
                      <TableRow>
                        <TableCell>Tanggal</TableCell>
                        <TableCell>Pelanggan</TableCell>
                        {!isSmallMobile && <TableCell align="right">Qty</TableCell>}
                        {!isMobile && <TableCell align="right">Harga</TableCell>}
                        <TableCell align="right">Total</TableCell>
                        <TableCell align="center">Aksi</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {!debts.length && (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                            <Box sx={{ color: "text.secondary" }}>
                              <Typography variant="body2" gutterBottom>📊 Tidak ada data hutang</Typography>
                              <Typography variant="caption">
                                Data akan muncul di sini setelah ada transaksi hutang
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      )}
                      {debts.map((d) => {
                        const isLunas = String(d.status || "").toUpperCase() === "LUNAS";
                        return (
                          <TableRow key={d.id} hover>
                            <TableCell sx={{ whiteSpace: "nowrap" }}>
                              {(d.created_at || "").slice(0, 10)}
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Chip
                                  size="small"
                                  label={isLunas ? "LUNAS" : "HUTANG"}
                                  color={isLunas ? "success" : "error"}
                                  variant={isLunas ? "filled" : "outlined"}
                                />
                                <Typography variant="body2">
                                  {d.customer || "PUBLIC"}
                                </Typography>
                              </Stack>
                            </TableCell>
                            {!isSmallMobile && (
                              <TableCell align="right">{d.qty}</TableCell>
                            )}
                            {!isMobile && (
                              <TableCell align="right">{fmtIDR(d.price)}</TableCell>
                            )}
                            <TableCell align="right">
                              <Typography fontWeight={600}>
                                {fmtIDR(d.total)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="Bayar hutang">
                                <span>
                                  <Button
                                    size="small"
                                    variant={isLunas ? "outlined" : "contained"}
                                    onClick={() =>
                                      setPaying({
                                        id: d.id,
                                        customer: d.customer,
                                        total: d.total,
                                        created_at: d.created_at,
                                      })
                                    }
                                    disabled={loading || isLunas || (Number(d.total) || 0) <= 0}
                                    sx={{ textTransform: "none", minWidth: 80 }}
                                    color={isLunas ? "success" : "primary"}
                                  >
                                    {isLunas ? "Lunas" : "Bayar"}
                                  </Button>
                                </span>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Stack>
      )}

      {/* Payment Dialog */}
      <Dialog 
        open={!!paying} 
        onClose={() => setPaying(null)} 
        fullWidth 
        maxWidth="sm"
        fullScreen={isSmallMobile}
      >
        {isSmallMobile && (
          <AppBar position="static" elevation={1}>
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Bayar Hutang
              </Typography>
              <IconButton edge="end" color="inherit" onClick={() => setPaying(null)}>
                <CloseIcon />
              </IconButton>
            </Toolbar>
          </AppBar>
        )}
        {!isSmallMobile && <DialogTitle>Bayar Hutang</DialogTitle>}
        
        <DialogContent dividers sx={{ pt: isSmallMobile ? 2 : 1 }}>
          {paying ? (
            <Stack spacing={2}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography color="text.secondary">Pelanggan</Typography>
                <Typography fontWeight={600}>{paying.customer || "PUBLIC"}</Typography>
              </Stack>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography color="text.secondary">Tanggal</Typography>
                <Typography>{(paying.created_at || "").slice(0, 10)}</Typography>
              </Stack>
              <Divider />
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="h6">Total Tagihan</Typography>
                <Typography variant="h6" color="primary.main">
                  {fmtIDR(payingTotal)}
                </Typography>
              </Stack>
              <Box sx={{ 
                p: 2, 
                borderRadius: 1, 
                bgcolor: "success.light", 
                color: "success.contrastText",
                fontSize: 14 
              }}>
                Nominal <b>dikunci</b> sama dengan total. Transaksi akan ditandai <b>LUNAS</b>.
              </Box>
            </Stack>
          ) : (
            <Box sx={{ py: 3, display: "grid", placeItems: "center" }}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            variant="outlined"
            onClick={() => setPaying(null)} 
            disabled={loading}
            sx={{ textTransform: "none" }}
            size={isSmallMobile ? "large" : "medium"}
            fullWidth={isSmallMobile}
          >
            Batal
          </Button>
          <Button 
            onClick={onPaid} 
            disabled={loading}
            variant="contained"
            sx={{ textTransform: "none" }}
            size={isSmallMobile ? "large" : "medium"}
            fullWidth={isSmallMobile}
          >
            {loading ? "Menyimpan..." : "Bayar Hutang"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}