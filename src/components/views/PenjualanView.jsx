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
  CardHeader,
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

// Standar field agar konsisten tinggi/lebar (MUI standard)
const FIELD_PROPS = { fullWidth: true, variant: "outlined", size: "medium" };
const FIELD_SX = {
  "& .MuiOutlinedInput-root": { borderRadius: 1, minHeight: 56 },
  "& input": { paddingTop: 1.5, paddingBottom: 1.5 },
};

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

  const [form, setForm] = useState({
    customer: "",
    date: todayStr(),
    qty: "",
    price: defaultPrice,
    method: activeMethods?.[0] || "TUNAI",
  });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // Update form saat settings berubah (harga/metode)
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
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant={isMobile ? "h6" : "h5"} fontWeight={600}>
              Penjualan Baru
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Chip
              label={`Stok Isi: ${stokISI}`}
              variant="outlined"
              color={stokISI <= 5 ? "warning" : "success"}
              size={isMobile ? "small" : "medium"}
            />
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title={<Typography variant="h6" fontWeight={600}>Form Penjualan</Typography>}
          sx={{ 
            pb: 2, 
            borderBottom: 1, 
            borderColor: "divider",
            px: isMobile ? 2 : 3,
            pt: isMobile ? 2 : 3
          }}
        />
        <CardContent sx={{ px: isMobile ? 2 : 3, pb: isMobile ? 2 : 3 }}>
          {err && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErr("")}>
              {err}
            </Alert>
          )}

          <Box component="form" onSubmit={submit}>
            <Grid container spacing={2}>
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
                      {...FIELD_PROPS}
                      sx={FIELD_SX}
                      label="Nama Pelanggan"
                      placeholder="Contoh: Ayu"
                      value={form.customer}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, customer: e.target.value }))
                      }
                      size={isMobile ? "small" : "medium"}
                    />
                  )}
                />
                {!isValidCustomerName(form.customer || "") && form.customer.trim().length > 0 && (
                  <Typography variant="body2" color="error" sx={{ mt: 0.5 }}>
                    Nama hanya huruf &amp; spasi
                  </Typography>
                )}
              </Grid>

              {/* Tanggal */}
              <Grid item xs={12} sm={6}>
                <TextField
                  {...FIELD_PROPS}
                  sx={FIELD_SX}
                  label="Tanggal"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  inputProps={{ min: MIN_DATE, max: maxAllowedDate() }}
                  InputLabelProps={{ shrink: true }}
                  size={isMobile ? "small" : "medium"}
                />
              </Grid>

              {/* Qty */}
              <Grid item xs={12} sm={6}>
                <TextField
                  {...FIELD_PROPS}
                  sx={FIELD_SX}
                  label="Jumlah (Qty)"
                  type="number"
                  value={form.qty}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      qty:
                        e.target.value === ""
                          ? ""
                          : Math.max(0, parseInt(e.target.value, 10) || 0),
                    })
                  }
                  inputProps={{ min: 1, max: stokISI, inputMode: "numeric" }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconButton
                          size="small"
                          onClick={() => inc(-1)}
                          edge="start"
                          disabled={qtyNum <= 1}
                        >
                          <RemoveIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => inc(+1)}
                          edge="end"
                          disabled={qtyNum >= stokISI}
                        >
                          <AddIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  helperText={<span>Stok isi tersedia: <b>{stokISI}</b></span>}
                  size={isMobile ? "small" : "medium"}
                />
              </Grid>

              {/* Harga */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth variant="outlined" sx={FIELD_SX} size={isMobile ? "small" : "medium"}>
                  <InputLabel id="price-label">Harga Satuan</InputLabel>
                  <Select
                    labelId="price-label"
                    label="Harga Satuan"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: parseInt(e.target.value, 10) })}
                  >
                    {PRICE_OPTIONS.map((p) => (
                      <MenuItem key={p} value={p}>
                        {fmtIDR(p)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Metode Pembayaran */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth variant="outlined" sx={FIELD_SX} size={isMobile ? "small" : "medium"}>
                  <InputLabel id="method-label">Metode Pembayaran</InputLabel>
                  <Select
                    labelId="method-label"
                    label="Metode Pembayaran"
                    value={form.method}
                    onChange={(e) => setForm({ ...form, method: e.target.value })}
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
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography fontWeight={600}>Total:</Typography>
                    <Typography variant="h6" color="success.main" fontWeight={800}>
                      {fmtIDR(total)}
                    </Typography>
                  </Stack>
                </Paper>
              </Grid>

              {/* Tombol */}
              <Grid item xs={12}>
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    type="button"
                    onClick={loading ? undefined : onCancel}
                    sx={{ textTransform: "none", minWidth: 100 }}
                    size={isMobile ? "medium" : "large"}
                  >
                    Batal
                  </Button>
                  <Button
                    variant="contained"
                    type="submit"
                    disabled={loading || disabledBase}
                    sx={{ textTransform: "none", minWidth: 100 }}
                    size={isMobile ? "medium" : "large"}
                  >
                    {loading ? "Menyimpan…" : "Simpan"}
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