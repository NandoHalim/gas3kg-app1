import React, { useState, useMemo } from "react";
import { DataService } from "../../services/DataService.js";
import { useToast } from "../../context/ToastContext.jsx";
import { DEFAULT_PRICE, PRICE_OPTIONS, PAYMENT_METHODS, MIN_DATE } from "../../utils/constants.js";
import { todayStr, maxAllowedDate, fmtIDR } from "../../utils/helpers.js";
import { isValidCustomerName } from "../../utils/validators.js";

import {
  Box, Stack, Typography, Card, CardHeader, CardContent, TextField, Button, Alert,
  Grid, FormControl, InputLabel, Select, MenuItem, IconButton, InputAdornment
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

// standar field agar konsisten tinggi/lebar
const FIELD_PROPS = { fullWidth: true, variant: "outlined", size: "medium" };
const FIELD_SX = {
  "& .MuiOutlinedInput-root": { borderRadius: 2, minHeight: 48 },
  "& input": { paddingTop: 1.25, paddingBottom: 1.25 },
};

export default function PenjualanView({ stocks = {}, onSaved, onCancel }) {
  const toast = useToast();

  const [form, setForm] = useState({
    customer: "",
    date: todayStr(),
    qty: "",
    price: DEFAULT_PRICE,
    method: "TUNAI",
  });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const stokISI = Number(stocks.ISI || 0);
  const qtyNum = Number(form.qty) || 0;
  const total = useMemo(() => qtyNum * (Number(form.price) || 0), [qtyNum, form.price]);

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
      });
      onSaved?.(snap);
      setForm({ customer: "", date: todayStr(), qty: "", price: DEFAULT_PRICE, method: "TUNAI" });
      toast?.show?.({ type: "success", message: `Penjualan tersimpan: ${qtyNum} tabung • Total ${fmtIDR(total)}` });
    } catch (e2) {
      const msg = e2.message || "Gagal menyimpan penjualan";
      setErr(msg); toast?.show?.({ type: "error", message: msg });
    } finally { setLoading(false); }
  };

  return (
    <Stack spacing={1.5}>
      {/* Satu judul saja */}
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography variant="h5" fontWeight={700}>Penjualan Baru</Typography>
        <Box sx={{ ml: "auto", px: 1.25, py: 0.5, borderRadius: 99, bgcolor: "grey.100", border: "1px solid", borderColor: "grey.300", fontSize: 12 }}>
          Stok Isi: <b>{stokISI}</b>
        </Box>
      </Stack>

      <Card>
        <CardHeader titleTypographyProps={{ fontSize: 18, fontWeight: 700 }} title="Form Penjualan" />
        <CardContent>
          {err && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErr("")}>{err}</Alert>}

          <Box component="form" onSubmit={submit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  {...FIELD_PROPS} sx={FIELD_SX}
                  label="Nama Pelanggan" placeholder="Contoh: Ayu"
                  value={form.customer}
                  onChange={(e) => setForm({ ...form, customer: e.target.value })}
                />
                {!isValidCustomerName(form.customer || "") && form.customer.trim().length > 0 && (
                  <Typography variant="caption" color="error" sx={{ display: "block", mt: 0.5 }}>
                    Nama hanya huruf & spasi
                  </Typography>
                )}
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  {...FIELD_PROPS} sx={FIELD_SX}
                  label="Tanggal" type="date" value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  inputProps={{ min: MIN_DATE, max: maxAllowedDate() }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  {...FIELD_PROPS} sx={FIELD_SX}
                  label="Jumlah (Qty)" type="number" value={form.qty}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      qty: e.target.value === "" ? "" : Math.max(0, parseInt(e.target.value, 10) || 0),
                    })
                  }
                  inputProps={{ min: 1, max: stokISI, inputMode: "numeric" }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconButton size="small" onClick={() => inc(-1)} edge="start" disabled={qtyNum <= 1}>
                          <RemoveIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => inc(+1)} edge="end" disabled={qtyNum >= stokISI}>
                          <AddIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  helperText={<span>Stok isi tersedia: <b>{stokISI}</b></span>}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl {...FIELD_PROPS} sx={FIELD_SX}>
                  <InputLabel id="price-label">Harga Satuan</InputLabel>
                  <Select
                    labelId="price-label" label="Harga Satuan"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: parseInt(e.target.value, 10) })}
                  >
                    {PRICE_OPTIONS.map((p) => (
                      <MenuItem key={p} value={p}>
                        {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(p)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl {...FIELD_PROPS} sx={FIELD_SX}>
                  <InputLabel id="method-label">Metode Pembayaran</InputLabel>
                  <Select
                    labelId="method-label" label="Metode Pembayaran"
                    value={form.method}
                    onChange={(e) => setForm({ ...form, method: e.target.value })}
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <MenuItem key={m} value={m}>{m}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ p: 2, bgcolor: "grey.50", border: "1px solid", borderColor: "grey.200", borderRadius: 2 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography fontWeight={600}>Total:</Typography>
                    <Typography variant="h6" color="success.main" fontWeight={800}>{fmtIDR(total)}</Typography>
                  </Stack>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                  <Button variant="outlined" type="button" onClick={loading ? undefined : onCancel}>Batal</Button>
                  <Button variant="contained" type="submit" disabled={loading || disabledBase}>
                    {loading ? "Menyimpan…" : "Simpan"}
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Stack>
  );
}
