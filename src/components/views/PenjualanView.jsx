// src/components/views/PenjualanView.jsx
import React, { useState, useMemo, useEffect } from "react";
import { DataService } from "../../services/DataService.js";
import { useToast } from "../../context/ToastContext.jsx";
import {
  DEFAULT_PRICE,
  PRICE_OPTIONS,
  PAYMENT_METHODS,
  MIN_DATE,
} from "../../utils/constants.js";
import { todayStr, maxAllowedDate, fmtIDR } from "../../utils/helpers.js";
import { isValidCustomerName } from "../../utils/validators.js";

import {
  Box,
  Stack,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  InputAdornment,
  Autocomplete,
  Chip,
  Paper,
  useTheme,
  useMediaQuery,
  Fade,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import SellIcon from "@mui/icons-material/Sell";
import PersonIcon from "@mui/icons-material/Person";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PaymentIcon from "@mui/icons-material/Payment";

export default function PenjualanView({
  stocks = {},
  onSaved,
  onCancel,
  customerList = [],
  defaultPrice = DEFAULT_PRICE,
  hpp = 0,
  activeMethods = PAYMENT_METHODS,
}) {
  const toast = useToast();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isSmallMobile = useMediaQuery('(max-width: 400px)');

  const [form, setForm] = useState({
    customer: "",
    date: todayStr(),
    qty: "",
    price: defaultPrice,
    method: activeMethods?.[0] || "TUNAI",
  });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      price: defaultPrice,
      method: activeMethods?.[0] || "TUNAI",
    }));
  }, [defaultPrice, activeMethods]);

  const stokISI = Number(stocks.ISI || 0);
  const qtyNum = Number(form.qty) || 0;
  const total = useMemo(
    () => qtyNum * (Number(form.price) || 0),
    [qtyNum, form.price]
  );

  const disabledBase =
    !Number.isFinite(qtyNum) ||
    qtyNum < 1 ||
    qtyNum > stokISI ||
    !isValidCustomerName(form.customer || "");

  const inc = (d) =>
    setForm((p) => {
      if (loading) return p;
      const cur = Number(p.qty) || 0;
      const next = Math.max(0, cur + d);
      return { ...p, qty: next === 0 ? "" : next };
    });

  const submit = async (e) => {
    e?.preventDefault?.();
    if (loading || disabledBase) return;

    setLoading(true);
    setErr("");
    try {
      const snap = await DataService.createSale({
        customer: form.customer.trim() || "PUBLIC",
        qty: Number(form.qty),
        price: Number(form.price),
        method: form.method,
        date: form.date,
        note: "",
        hpp,
      });
      onSaved?.(snap);
      setForm({
        customer: "",
        date: todayStr(),
        qty: "",
        price: defaultPrice,
        method: activeMethods?.[0] || "TUNAI",
      });
      toast?.show?.({
        type: "success",
        message: `✅ Penjualan tersimpan: ${qtyNum} tabung • ${fmtIDR(total)}`,
      });
    } catch (e2) {
      const msg = e2.message || "Gagal menyimpan penjualan";
      setErr(msg);
      toast?.show?.({ type: "error", message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      width: '100%', 
      maxWidth: '100%', 
      overflow: 'hidden',
      pb: 2 
    }}>
      {/* Header - Compact untuk Mobile */}
      <Card sx={{ 
        mb: 2, 
        borderRadius: 3,
        background: `linear-gradient(135deg, ${theme.palette.primary.main}10, ${theme.palette.success.main}10)`,
        border: `1px solid ${theme.palette.divider}`
      }}>
        <CardContent sx={{ p: isMobile ? 2 : 2.5 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: isMobile ? 40 : 48,
              height: isMobile ? 40 : 48,
              borderRadius: 3,
              bgcolor: 'primary.main',
              color: 'white'
            }}>
              <SellIcon sx={{ fontSize: isMobile ? 20 : 24 }} />
            </Box>
            
            <Box sx={{ flexGrow: 1 }}>
              <Typography 
                variant={isMobile ? "h6" : "h5"} 
                fontWeight={800}
                sx={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }}
              >
                Penjualan Baru
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: isMobile ? '0.8rem' : '0.875rem' }}
              >
                Input transaksi penjualan gas
              </Typography>
            </Box>
            
            <Chip
              label={`Stok: ${stokISI}`}
              variant="filled"
              color={stokISI === 0 ? "error" : stokISI <= 5 ? "warning" : "success"}
              size={isMobile ? "small" : "medium"}
              sx={{
                fontWeight: 700,
                fontSize: isMobile ? '0.75rem' : '0.875rem'
              }}
            />
          </Stack>
        </CardContent>
      </Card>

      {/* Form - Optimized untuk Mobile */}
      <Card sx={{ 
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        overflow: 'visible'
      }}>
        <CardContent sx={{ 
          p: isMobile ? 2 : 3,
          '&:last-child': { pb: isMobile ? 2 : 3 }
        }}>
          {err && (
            <Fade in>
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3, 
                  borderRadius: 2,
                  alignItems: 'center',
                  py: isMobile ? 1 : 1.5
                }} 
                onClose={() => setErr("")}
              >
                <Typography variant={isMobile ? "body2" : "body1"}>
                  {err}
                </Typography>
              </Alert>
            </Fade>
          )}

          <Box component="form" onSubmit={submit} sx={{ width: '100%' }}>
            <Stack spacing={3}>
              {/* Nama Pelanggan */}
              <Box>
                <Typography 
                  variant="subtitle2" 
                  fontWeight={600} 
                  sx={{ 
                    mb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    fontSize: isMobile ? '0.8rem' : '0.875rem'
                  }}
                >
                  <PersonIcon fontSize="small" />
                  Nama Pelanggan
                </Typography>
                <Autocomplete
                  freeSolo
                  options={customerList}
                  openOnFocus={true}
                  getOptionLabel={(opt) => (typeof opt === "string" ? opt : "")}
                  filterOptions={(options, state) => {
                    const q = (state.inputValue || "").trim().toLowerCase();
                    if (!q) return options.slice(0, 5);
                    return options.filter((o) => 
                      String(o).toLowerCase().includes(q)
                    ).slice(0, 5);
                  }}
                  value={form.customer}
                  onInputChange={(_, newVal) =>
                    setForm((prev) => ({ ...prev, customer: newVal }))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      placeholder="Masukkan nama pelanggan..."
                      size={isMobile ? "small" : "medium"}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          fontSize: isMobile ? '0.9rem' : '1rem'
                        }
                      }}
                    />
                  )}
                />
                {!isValidCustomerName(form.customer || "") && form.customer.trim().length > 0 && (
                  <Typography 
                    variant="caption" 
                    color="error" 
                    sx={{ 
                      mt: 1, 
                      display: 'flex', 
                      alignItems: 'center',
                      gap: 0.5,
                      fontSize: isMobile ? '0.75rem' : '0.8rem'
                    }}
                  >
                    ⚠️ Hanya huruf dan spasi
                  </Typography>
                )}
              </Box>

              {/* Tanggal & Qty dalam Grid Responsive */}
              <Grid container spacing={2}>
                {/* Tanggal */}
                <Grid item xs={12} sm={6}>
                  <Typography 
                    variant="subtitle2" 
                    fontWeight={600} 
                    sx={{ 
                      mb: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      fontSize: isMobile ? '0.8rem' : '0.875rem'
                    }}
                  >
                    <CalendarTodayIcon fontSize="small" />
                    Tanggal
                  </Typography>
                  <TextField
                    fullWidth
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    inputProps={{ 
                      min: MIN_DATE, 
                      max: maxAllowedDate() 
                    }}
                    InputLabelProps={{ shrink: true }}
                    size={isMobile ? "small" : "medium"}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        fontSize: isMobile ? '0.9rem' : '1rem'
                      }
                    }}
                  />
                </Grid>

                {/* Jumlah Tabung */}
                <Grid item xs={12} sm={6}>
                  <Typography 
                    variant="subtitle2" 
                    fontWeight={600} 
                    sx={{ 
                      mb: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      fontSize: isMobile ? '0.8rem' : '0.875rem'
                    }}
                  >
                    📦 Jumlah Tabung
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    value={form.qty}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        qty: e.target.value === "" ? "" : Math.max(0, parseInt(e.target.value, 10) || 0),
                      })
                    }
                    inputProps={{ 
                      min: 1, 
                      max: stokISI, 
                      inputMode: "numeric" 
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconButton
                            size="small"
                            onClick={() => inc(-1)}
                            disabled={qtyNum <= 1 || loading}
                            sx={{ 
                              mr: -0.5,
                              color: 'primary.main'
                            }}
                          >
                            <RemoveIcon fontSize={isMobile ? "small" : "medium"} />
                          </IconButton>
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            onClick={() => inc(+1)}
                            disabled={qtyNum >= stokISI || loading}
                            sx={{ 
                              ml: -0.5,
                              color: 'primary.main'
                            }}
                          >
                            <AddIcon fontSize={isMobile ? "small" : "medium"} />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    size={isMobile ? "small" : "medium"}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        fontSize: isMobile ? '0.9rem' : '1rem'
                      }
                    }}
                  />
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ 
                      mt: 0.5,
                      display: 'block',
                      fontSize: isMobile ? '0.75rem' : '0.8rem'
                    }}
                  >
                    Stok tersedia: <strong>{stokISI}</strong> tabung
                  </Typography>
                </Grid>
              </Grid>

              {/* Harga & Metode dalam Grid Responsive */}
              <Grid container spacing={2}>
                {/* Harga Satuan */}
                <Grid item xs={12} sm={6}>
                  <Typography 
                    variant="subtitle2" 
                    fontWeight={600} 
                    sx={{ 
                      mb: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      fontSize: isMobile ? '0.8rem' : '0.875rem'
                    }}
                  >
                    <AttachMoneyIcon fontSize="small" />
                    Harga Satuan
                  </Typography>
                  <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                    <Select
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: parseInt(e.target.value, 10) })}
                      sx={{
                        borderRadius: 2,
                        fontSize: isMobile ? '0.9rem' : '1rem'
                      }}
                    >
                      {PRICE_OPTIONS.map((p) => (
                        <MenuItem 
                          key={p} 
                          value={p}
                          sx={{ fontSize: isMobile ? '0.9rem' : '1rem' }}
                        >
                          {fmtIDR(p)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Metode Pembayaran */}
                <Grid item xs={12} sm={6}>
                  <Typography 
                    variant="subtitle2" 
                    fontWeight={600} 
                    sx={{ 
                      mb: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      fontSize: isMobile ? '0.8rem' : '0.875rem'
                    }}
                  >
                    <PaymentIcon fontSize="small" />
                    Metode Bayar
                  </Typography>
                  <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                    <Select
                      value={form.method}
                      onChange={(e) => setForm({ ...form, method: e.target.value })}
                      sx={{
                        borderRadius: 2,
                        fontSize: isMobile ? '0.9rem' : '1rem'
                      }}
                    >
                      {(activeMethods || PAYMENT_METHODS).map((m) => (
                        <MenuItem 
                          key={m} 
                          value={m}
                          sx={{ fontSize: isMobile ? '0.9rem' : '1rem' }}
                        >
                          {m}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {/* Total Pembayaran */}
              <Box>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: isMobile ? 2.5 : 3, 
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${theme.palette.success.main}10, ${theme.palette.primary.main}10)`,
                    border: `2px solid ${theme.palette.success.main}20`
                  }}
                >
                  <Stack spacing={1}>
                    <Typography 
                      variant="subtitle2" 
                      fontWeight={600} 
                      color="text.secondary"
                      sx={{ fontSize: isMobile ? '0.8rem' : '0.875rem' }}
                    >
                      TOTAL PEMBAYARAN
                    </Typography>
                    
                    <Stack direction="row" alignItems="flex-end" justifyContent="space-between">
                      <Box>
                        <Typography 
                          variant={isMobile ? "body2" : "body1"} 
                          color="text.secondary"
                        >
                          {qtyNum} tabung × {fmtIDR(form.price)}
                        </Typography>
                      </Box>
                      <Typography 
                        variant={isMobile ? "h5" : "h4"} 
                        color="success.main" 
                        fontWeight={800}
                        sx={{ 
                          fontSize: isMobile ? '1.5rem' : '2rem',
                          lineHeight: 1
                        }}
                      >
                        {fmtIDR(total)}
                      </Typography>
                    </Stack>
                  </Stack>
                </Paper>
              </Box>

              {/* Actions */}
              <Stack 
                direction={isMobile ? "column" : "row"} 
                spacing={2} 
                justifyContent="flex-end"
                alignItems={isMobile ? "stretch" : "center"}
                sx={{ pt: 1 }}
              >
                <Button
                  variant="outlined"
                  onClick={onCancel}
                  disabled={loading}
                  size={isMobile ? "large" : "medium"}
                  fullWidth={isMobile}
                  sx={{ 
                    borderRadius: 2,
                    py: isMobile ? 1.25 : 1,
                    fontSize: isMobile ? '1rem' : '0.875rem',
                    fontWeight: 600
                  }}
                >
                  Batal
                </Button>
                <Button
                  variant="contained"
                  type="submit"
                  disabled={loading || disabledBase}
                  size={isMobile ? "large" : "medium"}
                  fullWidth={isMobile}
                  sx={{ 
                    borderRadius: 2,
                    py: isMobile ? 1.25 : 1,
                    fontSize: isMobile ? '1rem' : '0.875rem',
                    fontWeight: 600,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.success.main})`,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    '&:hover': {
                      boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
                    }
                  }}
                >
                  {loading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ 
                        width: 16, 
                        height: 16, 
                        border: '2px solid transparent',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        '@keyframes spin': {
                          '0%': { transform: 'rotate(0deg)' },
                          '100%': { transform: 'rotate(360deg)' }
                        }
                      }} />
                      Menyimpan...
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      💾 Simpan Transaksi
                    </Box>
                  )}
                </Button>
              </Stack>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}