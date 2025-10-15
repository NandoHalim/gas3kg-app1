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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

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
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

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
        message: `Penjualan tersimpan: ${qtyNum} tabung • Total ${fmtIDR(total)}`,
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
      {/* Header */}
      <Card sx={{ mb: 2, borderRadius: 2 }}>
        <CardContent sx={{ p: isMobile ? 2 : 3 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant={isMobile ? "h6" : "h5"} fontWeight={700}>
              🛒 Penjualan Baru
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Chip
              label={`Stok: ${stokISI}`}
              variant="filled"
              color={stokISI === 0 ? "error" : stokISI <= 5 ? "warning" : "success"}
              size={isMobile ? "small" : "medium"}
            />
          </Stack>
        </CardContent>
      </Card>

      {/* Form */}
      <Card sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: isMobile ? 2 : 3 }}>
          {err && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setErr("")}>
              {err}
            </Alert>
          )}

          <Box component="form" onSubmit={submit} sx={{ width: '100%' }}>
            <Grid container spacing={3}>
              {/* Nama Pelanggan */}
              <Grid item xs={12}>
                <Autocomplete
                  freeSolo
                  options={customerList}
                  openOnFocus={false}
                  getOptionLabel={(opt) => (typeof opt === "string" ? opt : "")}
                  filterOptions={(options, state) => {
                    const q = (state.inputValue || "").trim().toLowerCase();
                    if (!q) return [];
                    return options.filter((o) => String(o).toLowerCase().includes(q));
                  }}
                  value={form.customer}
                  onInputChange={(_, newVal) =>
                    setForm((prev) => ({ ...prev, customer: newVal }))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      label="Nama Pelanggan"
                      placeholder="Masukkan nama pelanggan..."
                      size={isMobile ? "small" : "medium"}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        }
                      }}
                    />
                  )}
                />
                {!isValidCustomerName(form.customer || "") && form.customer.trim().length > 0 && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                    ⚠️ Nama hanya boleh huruf dan spasi
                  </Typography>
                )}
              </Grid>

              {/* Tanggal & Qty */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Tanggal"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  inputProps={{ min: MIN_DATE, max: maxAllowedDate() }}
                  InputLabelProps={{ shrink: true }}
                  size={isMobile ? "small" : "medium"}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Jumlah Tabung"
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
                          sx={{ mr: -0.5 }}
                        >
                          <RemoveIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => inc(+1)}
                          disabled={qtyNum >= stokISI || loading}
                          sx={{ ml: -0.5 }}
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  helperText={`Maksimal: ${stokISI} tabung`}
                  size={isMobile ? "small" : "medium"}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    }
                  }}
                />
              </Grid>

              {/* Harga & Metode */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                  <InputLabel>Harga Satuan</InputLabel>
                  <Select
                    value={form.price}
                    label="Harga Satuan"
                    onChange={(e) => setForm({ ...form, price: parseInt(e.target.value, 10) })}
                    sx={{
                      borderRadius: 2,
                    }}
                  >
                    {PRICE_OPTIONS.map((p) => (
                      <MenuItem key={p} value={p}>
                        {fmtIDR(p)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                  <InputLabel>Metode Bayar</InputLabel>
                  <Select
                    value={form.method}
                    label="Metode Bayar"
                    onChange={(e) => setForm({ ...form, method: e.target.value })}
                    sx={{
                      borderRadius: 2,
                    }}
                  >
                    {(activeMethods || PAYMENT_METHODS).map((m) => (
                      <MenuItem key={m} value={m}>
                        {m}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Total */}
              <Grid item xs={12}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 3, 
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.success.main}15)`,
                    border: `1px solid ${theme.palette.divider}`
                  }}
                >
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" fontWeight={700} gutterBottom>
                        Total Pembayaran
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {qtyNum} tabung × {fmtIDR(form.price)}
                      </Typography>
                    </Box>
                    <Typography 
                      variant="h4" 
                      color="success.main" 
                      fontWeight={800}
                      sx={{ fontSize: isMobile ? '1.75rem' : '2rem' }}
                    >
                      {fmtIDR(total)}
                    </Typography>
                  </Stack>
                </Paper>
              </Grid>

              {/* Actions */}
              <Grid item xs={12}>
                <Stack 
                  direction={isMobile ? "column" : "row"} 
                  spacing={2} 
                  justifyContent="flex-end"
                  alignItems={isMobile ? "stretch" : "center"}
                >
                  <Button
                    variant="outlined"
                    onClick={onCancel}
                    disabled={loading}
                    size={isMobile ? "large" : "medium"}
                    fullWidth={isMobile}
                    sx={{ 
                      borderRadius: 2,
                      py: isMobile ? 1.5 : 1
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
                      py: isMobile ? 1.5 : 1
                    }}
                  >
                    {loading ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                      `💾 Simpan Penjualan`
                    )}
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}