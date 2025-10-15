// src/components/views/TransaksiView.jsx (Hanya bagian hutang yang diupdate)
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

  return (
    <Box sx={{ 
      width: '100vw', 
      maxWidth: '100%', 
      overflow: 'hidden',
      pb: { xs: 8, md: 2 },
      px: { xs: 1, sm: 2, md: 3 }
    }}>
      {/* Header - Simplified tanpa tombol refresh */}
      <Card sx={{ 
        mb: 2, 
        borderRadius: 2,
        background: `linear-gradient(135deg, ${theme.palette.primary.main}08, ${theme.palette.secondary.main}08)`
      }}>
        <CardContent sx={{ p: isMobile ? 2 : 3 }}>
          <Stack spacing={2}>
            <Typography variant={isMobile ? "h6" : "h5"} fontWeight={800}>
              💰 Transaksi
            </Typography>
            
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
        overflow: 'hidden',
        minHeight: '60vh'
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

        {/* TAB: HUTANG - Optimized untuk viewport */}
        {tab === "hutang" && (
          <Box sx={{ 
            width: '100%', 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}>
            {/* Search Section - Compact */}
            <Card sx={{ borderRadius: 2, flexShrink: 0 }}>
              <CardContent sx={{ p: isMobile ? 2 : 2.5 }}>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SearchIcon color="primary" />
                    <Typography variant="h6" fontWeight={600} sx={{ flexGrow: 1 }}>
                      Cari Hutang
                    </Typography>
                    <Tooltip title="Reset pencarian">
                      <IconButton 
                        size="small" 
                        onClick={() => setQ("")}
                        disabled={!q}
                        color="primary"
                      >
                        <ReplayIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <TextField
                    fullWidth
                    placeholder="Nama pelanggan..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    disabled={loading}
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                  
                  <Alert severity="info" sx={{ borderRadius: 2, py: 0.5 }}>
                    <Typography variant="caption">
                      Tampilkan transaksi <strong>HUTANG</strong> yang belum lunas
                    </Typography>
                  </Alert>
                </Stack>
              </CardContent>
            </Card>

            {/* Debt List - Optimized untuk viewport */}
            <Card sx={{ borderRadius: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ 
                p: 0, 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column',
                overflow: 'hidden'
              }}>
                {/* Header */}
                <Box sx={{ 
                  p: isMobile ? 2 : 2.5, 
                  pb: 2,
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  flexShrink: 0
                }}>
                  <Typography variant="h6" fontWeight={700}>
                    📋 Daftar Hutang ({debts.length})
                  </Typography>
                </Box>

                {/* Content */}
                <Box sx={{ 
                  flex: 1, 
                  overflow: 'auto',
                  maxHeight: isMobile ? '50vh' : '60vh'
                }}>
                  {loading ? (
                    <Box sx={{ p: 3 }}>
                      <Stack spacing={2}>
                        {[...Array(6)].map((_, i) => (
                          <Skeleton 
                            key={i} 
                            height={52} 
                            variant="rounded" 
                            sx={{ borderRadius: 1 }}
                          />
                        ))}
                      </Stack>
                    </Box>
                  ) : !debts.length ? (
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      py: 8,
                      px: 2,
                      textAlign: 'center'
                    }}>
                      <PaidIcon sx={{ fontSize: 48, color: 'success.main', mb: 2, opacity: 0.5 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        Tidak Ada Hutang
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {q ? 'Tidak ditemukan hutang dengan kata kunci tersebut' : 'Semua transaksi sudah lunas'}
                      </Typography>
                    </Box>
                  ) : (
                    <TableContainer 
                      component={Paper} 
                      elevation={0}
                      sx={{ 
                        width: '100%',
                        borderRadius: 0,
                        '& .MuiTable-root': {
                          minWidth: isMobile ? 400 : 'auto'
                        }
                      }}
                    >
                      <Table 
                        size={isMobile ? "small" : "medium"}
                        stickyHeader
                        sx={{ 
                          '& .MuiTableCell-root': {
                            borderBottom: `1px solid ${theme.palette.divider}`,
                            py: isMobile ? 1 : 1.5,
                            px: isMobile ? 1 : 2
                          }
                        }}
                      >
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'grey.50' }}>
                            <TableCell sx={{ 
                              fontWeight: 700, 
                              width: isMobile ? '90px' : '110px',
                              fontSize: isMobile ? '0.75rem' : '0.875rem'
                            }}>
                              Tanggal
                            </TableCell>
                            <TableCell sx={{ 
                              fontWeight: 700,
                              fontSize: isMobile ? '0.75rem' : '0.875rem'
                            }}>
                              Pelanggan
                            </TableCell>
                            {!isMobile && (
                              <TableCell align="right" sx={{ 
                                fontWeight: 700, 
                                width: '70px',
                                fontSize: isMobile ? '0.75rem' : '0.875rem'
                              }}>
                                Qty
                              </TableCell>
                            )}
                            <TableCell align="right" sx={{ 
                              fontWeight: 700, 
                              width: isMobile ? '100px' : '120px',
                              fontSize: isMobile ? '0.75rem' : '0.875rem'
                            }}>
                              Total
                            </TableCell>
                            <TableCell align="center" sx={{ 
                              fontWeight: 700, 
                              width: isMobile ? '80px' : '90px',
                              fontSize: isMobile ? '0.75rem' : '0.875rem'
                            }}>
                              Aksi
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {debts.map((d) => {
                            const isLunas = String(d.status || "").toUpperCase() === "LUNAS";
                            return (
                              <TableRow 
                                key={d.id} 
                                hover
                                sx={{ 
                                  opacity: isLunas ? 0.6 : 1,
                                  bgcolor: isLunas ? 'success.50' : 'transparent',
                                  '&:last-child td': { borderBottom: 0 }
                                }}
                              >
                                <TableCell>
                                  <Typography variant="caption" fontWeight={500}>
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
                                      sx={{ 
                                        fontSize: isMobile ? '0.7rem' : '0.75rem',
                                        height: isMobile ? 20 : 24
                                      }}
                                    />
                                    <Typography 
                                      variant="body2" 
                                      noWrap 
                                      sx={{ 
                                        maxWidth: isMobile ? '120px' : '200px',
                                        fontSize: isMobile ? '0.8rem' : '0.875rem'
                                      }}
                                    >
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
                                  <Typography 
                                    variant="body2" 
                                    fontWeight={700} 
                                    color="primary.main"
                                    sx={{ fontSize: isMobile ? '0.8rem' : '0.875rem' }}
                                  >
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
                                      borderRadius: 1.5,
                                      minWidth: isMobile ? 60 : 70,
                                      fontSize: isMobile ? '0.7rem' : '0.75rem',
                                      py: isMobile ? 0.5 : 0.75,
                                      px: 1
                                    }}
                                    color={isLunas ? "success" : "primary"}
                                  >
                                    {isLunas ? "✅" : "Bayar"}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Box>
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
        
        {!isMobile && (
          <DialogTitle sx={{ 
            borderBottom: `1px solid ${theme.palette.divider}`,
            bgcolor: 'grey.50'
          }}>
            <Typography variant="h6" fontWeight={700}>
              💳 Bayar Hutang
            </Typography>
          </DialogTitle>
        )}
        
        <DialogContent sx={{ p: isMobile ? 3 : 3 }}>
          {paying && (
            <Stack spacing={3}>
              {!isMobile && (
                <Box sx={{ textAlign: 'center', py: 1 }}>
                  <PaidIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                </Box>
              )}
              
              <Stack spacing={2.5}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography color="text.secondary">Pelanggan</Typography>
                  <Typography fontWeight={600} variant="body1">
                    {paying.customer || "PUBLIC"}
                  </Typography>
                </Stack>
                
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography color="text.secondary">Tanggal Transaksi</Typography>
                  <Typography variant="body1">{(paying.created_at || "").slice(0, 10)}</Typography>
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
              `💳 Konfirmasi Bayar`
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}