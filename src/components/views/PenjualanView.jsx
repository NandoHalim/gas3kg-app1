// src/components/views/PenjualanView.jsx
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Stack,
  Box,
  Alert,
} from "@mui/material";
import {
  DEFAULT_PRICE,
  PRICE_OPTIONS,
  PAYMENT_METHODS,
  COLORS,
  MIN_DATE,
} from "../../utils/constants.js";
import { todayStr, maxAllowedDate, fmtIDR } from "../../utils/helpers.js";
import { isValidCustomerName } from "../../utils/validators.js";
import { DataService } from "../../services/DataService.js";
import { useToast } from "../../context/ToastContext.jsx";

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
  const total = qtyNum * (Number(form.price) || 0);

  const disabledBase =
    !Number.isFinite(qtyNum) ||
    qtyNum < 1 ||
    qtyNum > stokISI ||
    !isValidCustomerName(form.customer || "");

  const disabled = loading || disabledBase;

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
      setForm({
        customer: "",
        date: todayStr(),
        qty: "",
        price: DEFAULT_PRICE,
        method: "TUNAI",
      });

      toast?.show?.({
        type: "success",
        message: `Penjualan tersimpan: ${qtyNum} tabung • Total ${fmtIDR(total)}`,
      });
    } catch (e2) {
      setErr(e2.message || "Gagal menyimpan penjualan");
      toast?.show?.({
        type: "error",
        message: `${e2.message || "Gagal menyimpan penjualan"}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" spacing={2} alignItems="center" mb={2}>
        <Button variant="outlined" onClick={loading ? undefined : onCancel} disabled={loading}>
          ← Kembali
        </Button>
        <Typography variant="h5">Penjualan Baru</Typography>
        <Box
          sx={{
            ml: "auto",
            px: 2,
            py: 0.5,
            borderRadius: "999px",
            fontSize: 12,
            bgcolor: "grey.100",
          }}
        >
          Stok Isi: <b>{stokISI}</b>
        </Box>
      </Stack>

      {/* Card Form */}
      <Card>
        <CardHeader title="Form Penjualan" />
        <CardContent>
          {err && (
            <Alert severity="error" sx={{ mb: 2 }}>
              ⚠️ {err}
            </Alert>
          )}

          <form onSubmit={submit}>
            <Stack spacing={2}>
              {/* Nama Pelanggan */}
              <TextField
                label="Nama Pelanggan"
                placeholder="Contoh: Ayu"
                value={form.customer}
                onChange={(e) => setForm({ ...form, customer: e.target.value })}
                disabled={loading}
                error={
                  !isValidCustomerName(form.customer || "") &&
                  form.customer.trim().length > 0
                }
                helperText={
                  !isValidCustomerName(form.customer || "") &&
                  form.customer.trim().length > 0
                    ? "Nama hanya huruf & spasi"
                    : ""
                }
              />

              {/* Tanggal */}
              <TextField
                label="Tanggal"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                inputProps={{
                  min: MIN_DATE,
                  max: maxAllowedDate(),
                }}
                disabled={loading}
                InputLabelProps={{ shrink: true }}
              />

              {/* Qty */}
              <Box>
                <InputLabel>Jumlah (Qty)</InputLabel>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Button
                    variant="outlined"
                    onClick={() => inc(-1)}
                    disabled={loading || qtyNum <= 1}
                  >
                    −
                  </Button>
                  <TextField
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
                    inputProps={{ min: 1, max: stokISI }}
                    disabled={loading}
                    sx={{ flex: 1 }}
                  />
                  <Button
                    variant="outlined"
                    onClick={() => inc(+1)}
                    disabled={loading || qtyNum >= stokISI}
                  >
                    +
                  </Button>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Stok isi tersedia: <b>{stokISI}</b>
                </Typography>
              </Box>

              {/* Harga */}
              <FormControl fullWidth>
                <InputLabel id="price-label">Harga Satuan</InputLabel>
                <Select
                  labelId="price-label"
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: parseInt(e.target.value, 10) })
                  }
                  disabled={loading}
                >
                  {PRICE_OPTIONS.map((p) => (
                    <MenuItem key={p} value={p}>
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        maximumFractionDigits: 0,
                      }).format(p)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Metode Pembayaran */}
              <FormControl fullWidth>
                <InputLabel id="method-label">Metode Pembayaran</InputLabel>
                <Select
                  labelId="method-label"
                  value={form.method}
                  onChange={(e) => setForm({ ...form, method: e.target.value })}
                  disabled={loading}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <MenuItem key={m} value={m}>
                      {m}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Total */}
              <Box
                sx={{
                  p: 2,
                  bgcolor: "grey.50",
                  border: "1px solid",
                  borderColor: "grey.200",
                  borderRadius: 2,
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography fontWeight={500}>Total:</Typography>
                  <Typography fontSize={18} fontWeight="bold" color="success.main">
                    {fmtIDR(total)}
                  </Typography>
                </Stack>
              </Box>

              {/* Action */}
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={loading ? undefined : onCancel}
                  disabled={loading}
                >
                  Batal
                </Button>
                <Button variant="contained" type="submit" disabled={disabled}>
                  {loading ? "Menyimpan…" : "Simpan"}
                </Button>
              </Stack>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
