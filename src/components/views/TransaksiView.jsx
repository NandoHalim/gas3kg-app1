// src/components/views/TransaksiView.jsx
import React, { useEffect, useState } from "react";
import { DataService } from "../../services/DataService.js";
import { useToast } from "../../context/ToastContext.jsx";
import { fmtIDR } from "../../utils/helpers.js";
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
  CardContent,
  Button,
  Alert
} from "@mui/material";
import PaidIcon from "@mui/icons-material/PriceCheck";
import SearchIcon from "@mui/icons-material/Search";
import ReplayIcon from "@mui/icons-material/Replay";
import CreditScoreIcon from "@mui/icons-material/CreditScore";
import CloseIcon from "@mui/icons-material/Close";
import RefreshIcon from "@mui/icons-material/Refresh";

import PenjualanView from "./PenjualanView.jsx";

export default function TransaksiView({ stocks = {}, onSaved }) {
  const toast = useToast();
  const { settings } = useSettings();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const [tab, setTab] = useState("penjualan");
  const [q, setQ] = useState("");
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customerList, setCustomerList] = useState([]);
  const [paying, setPaying] = useState(null);

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
      toast?.show?.({ type: "success", message: `✅ Hutang lunas: ${paying.customer || "Pelanggan"}` });
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

  const refreshData = () => {
    if (tab === "hutang") {
      setQ(prev => prev); // Trigger useEffect
    }
  };

  return (
    <Box sx={{ 
      width: '100vw', 
      maxWidth: '100%', 
      overflow: 'hidden',
      pb: { xs: 8, md: 2 },
      px: { xs: 1, sm: 2, md: 3 }
    }}>
      {/* Header */}
      <Card sx={{ 
        mb: 2, 
        borderRadius: 2,
        background: `linear-gradient(135deg, ${theme.palette.primary.main}08, ${theme.palette.secondary.main}08)`
      }}>
        <CardContent sx={{ p: isMobile ? 2 : 3 }}>
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography variant={isMobile ? "h6" : "h5"} fontWeight={800}>
                💰 Transaksi
              </Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Tooltip title="Refresh Data">
                <IconButton 
                  onClick={refreshData}
                  disabled={loading}
                  size="small"
                  sx={{ 
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' }
                  }}
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
            
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              variant={isMobile ? "fullWidth" : "standard"}
              sx={{
                minHeight: 48,
                '& .MuiTabs-flexContainer': {
                  gap: isMobile ? 1 : 2,
                },
                '& .MuiTab-root': { 
                  minHeight: 48, 
                  textTransform: 'none',
                  fontSize: isMobile ? '0.8rem' : '0.9rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  minWidth: 'auto',
                  px: isMobile ? 2 : 3,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'white',
                  }
                },
              }}
              textColor="inherit"
              indicatorColor="primary"
            >
              <Tab 
                value="penjualan" 
                icon={<CreditScoreIcon sx={{ fontSize: isMobile ? 20 : 24 }} />}
                iconPosition="start"
                label={isMobile ? "Jual" : "Penjualan"} 
              />
              <Tab 
                value="hutang" 
                icon={<PaidIcon sx={{ fontSize: isMobile ? 20 : 24 }} />}
                iconPosition="start"
                label={isMobile ? "Hutang" : "Bayar Hutang"} 
              />
            </Tabs>
          </Stack>
        </CardContent>
      </Card>

      {/* Content Area */}
      <Box sx={{ 
        width: '100%', 
        maxWidth: '100%', 
        overflow: 'hidden'
      }}>
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
          <Stack spacing={2} sx={{ width: '100%' }}>
            {/* Search Card */}
            <Card sx={{ borderRadius: 2 }}>
              <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                <Stack spacing={2}>
                  <Typography variant="h6" fontWeight={700}>
                    🔍 Cari Hutang
                  </Typography>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="flex-end">
                    <TextField
                      fullWidth
                      placeholder="Cari nama pelanggan..."
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      disabled={loading}
                      size="small"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        }
                      }}
                    />
                    <Button
                      variant="outlined"
                      onClick={() => setQ("")}
                      disabled={loading}
                      startIcon={<ReplayIcon />}
                      sx={{ 
                        textTransform: 'none', 
                        borderRadius: 2,
                        minWidth: 100 
                      }}
                      size="small"
                    >
                      Reset
                    </Button>
                  </Stack>
                  
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    Menampilkan transaksi dengan status <strong>HUTANG</strong>. Klik "Bayar" untuk melunasi.
                  </Alert>
                </Stack>
              </CardContent>
            </Card>

            {/* Debt List */}
            <Card sx={{ borderRadius: 2 }}>
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ p: isMobile ? 2 : 3, pb: 2 }}>
                  <Typography variant="h6" fontWeight={700}>
                    📋 Daftar Hutang
                  </Typography>
                </Box>

                {loading ? (
                  <Box sx={{ p: 3 }}>
                    <Stack spacing={2}>
                      {[...Array(5)].map((_, i) => (
                        <Skeleton 
                          key={i} 
                          height={60} 
                          variant="rounded" 
                          sx={{ borderRadius: 2 }}
                        />
                      ))}
                    </Stack>
                  </Box>
                ) : (
                  <TableContainer 
                    component={Paper} 
                    elevation={0}
                    sx={{ 
                      width: '100%',
                      maxWidth: '100%',
                      overflow: 'hidden'
                    }}
                  >
                    <Table 
                      size={isMobile ? "small" : "medium"}
                      sx={{ 
                        minWidth: isMobile ? 400 : 600,
                        '& .MuiTableCell-root': {
                          borderBottom: `1px solid ${theme.palette.divider}`,
                          py: isMobile ? 1 : 2
                        }
                      }}
                    >
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.50' }}>
                          <TableCell sx={{ fontWeight: 700, width: isMobile ? '90px' : '110px' }}>Tanggal</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Pelanggan</TableCell>
                          {!isMobile && <TableCell align="right" sx={{ fontWeight: 700, width: '80px' }}>Qty</TableCell>}
                          <TableCell align="right" sx={{ fontWeight: 700, width: isMobile ? '100px' : '120px' }}>Total</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700, width: isMobile ? '90px' : '100px' }}>Aksi</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {!debts.length ? (
                          <TableRow>
                            <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                              <Box sx={{ color: "text.secondary" }}>
                                <Typography variant="h6" gutterBottom>📭 Tidak ada hutang</Typography>
                                <Typography variant="body2">
                                  Semua transaksi sudah lunas
                                </Typography>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ) : (
                          debts.map((d) => {
                            const isLunas = String(d.status || "").toUpperCase() === "LUNAS";
                            return (
                              <TableRow 
                                key={d.id} 
                                hover
                                sx={{ 
                                  opacity: isLunas ? 0.6 : 1,
                                  bgcolor: isLunas ? 'success.50' : 'transparent'
                                }}
                              >
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                  <Typography variant="body2" fontWeight={500}>
                                    {(d.created_at || "").slice(0, 10)}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <Chip
                                      size="small"
                                      label={isLunas ? "LUNAS" : "HUTANG"}
                                      color={isLunas ? "success" : "error"}
                                      variant={isLunas ? "filled" : "outlined"}
                                    />
                                    <Typography variant="body2" noWrap>
                                      {d.customer || "PUBLIC"}
                                    </Typography>
                                  </Stack>
                                </TableCell>
                                {!isMobile && (
                                  <TableCell align="right">
                                    <Typography variant="body2" fontWeight={500}>
                                      {d.qty}
                                    </Typography>
                                  </TableCell>
                                )}
                                <TableCell align="right">
                                  <Typography variant="body2" fontWeight={700} color="primary.main">
                                    {fmtIDR(d.total)}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Button
                                    size="small"
                                    variant={isLunas ? "outlined" : "contained"}
                                    onClick={() => setPaying(d)}
                                    disabled={isLunas || loading}
                                    sx={{ 
                                      textTransform: 'none', 
                                      borderRadius: 2,
                                      minWidth: isMobile ? 70 : 80,
                                      fontSize: '0.8rem'
                                    }}
                                    color={isLunas ? "success" : "primary"}
                                  >
                                    {isLunas ? "✅ Lunas" : "💳 Bayar"}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Stack>
        )}
      </Box>

      {/* Payment Dialog */}
      <Dialog 
        open={!!paying} 
        onClose={() => setPaying(null)} 
        fullWidth 
        maxWidth="sm"
        fullScreen={isMobile}
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: isMobile ? 0 : 2
          }
        }}
      >
        {isMobile && (
          <AppBar position="static" elevation={0}>
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
        
        <DialogContent sx={{ p: isMobile ? 2 : 3 }}>
          {paying && (
            <Stack spacing={3}>
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <PaidIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                <Typography variant="h5" fontWeight={800} gutterBottom>
                  Konfirmasi Pembayaran
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Lunasi hutang pelanggan
                </Typography>
              </Box>

              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography color="text.secondary">Pelanggan</Typography>
                  <Typography fontWeight={600}>{paying.customer || "PUBLIC"}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography color="text.secondary">Tanggal Transaksi</Typography>
                  <Typography>{(paying.created_at || "").slice(0, 10)}</Typography>
                </Stack>
                <Divider />
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">Total Hutang</Typography>
                  <Typography variant="h5" color="primary.main" fontWeight={800}>
                    {fmtIDR(paying.total)}
                  </Typography>
                </Stack>
              </Stack>

              <Alert severity="success" sx={{ borderRadius: 2 }}>
                Transaksi akan ditandai <strong>LUNAS</strong> setelah pembayaran
              </Alert>
            </Stack>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: isMobile ? 2 : 3, gap: 1 }}>
          <Button 
            variant="outlined"
            onClick={() => setPaying(null)} 
            disabled={loading}
            fullWidth={isMobile}
            sx={{ borderRadius: 2 }}
            size={isMobile ? "large" : "medium"}
          >
            Batal
          </Button>
          <Button 
            onClick={onPaid} 
            disabled={loading}
            variant="contained"
            fullWidth={isMobile}
            sx={{ borderRadius: 2 }}
            size={isMobile ? "large" : "medium"}
          >
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} color="inherit" />
                Memproses...
              </Box>
            ) : (
              `💳 Bayar Hutang`
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}