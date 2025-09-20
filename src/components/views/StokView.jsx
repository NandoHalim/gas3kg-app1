// src/components/views/StokView.jsx
import React, { useEffect, useState } from "react";
import { DataService } from "../../services/DataService.js";
import { useToast } from "../../context/ToastContext.jsx";
import { MIN_DATE } from "../../utils/constants.js";
import { todayStr, maxAllowedDate } from "../../utils/helpers.js";
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
  Chip,
  Tooltip,
} from "@mui/material";

// 🔧 Standarisasi field: lebar penuh + tinggi seragam
const FIELD_PROPS = { fullWidth: true, variant: "outlined", size: "medium" };
const FIELD_SX = {
  mt: 1,
  "& .MuiOutlinedInput-root": { borderRadius: 2, minHeight: 48 },
  "& input": { paddingTop: 1.25, paddingBottom: 1.25 }, // jaga tinggi di iOS
};

export default function StokView({ stocks = {}, onSaved }) {
  const toast = useToast();
  const [snap, setSnap] = useState({
    ISI: Number(stocks.ISI || 0),
    KOSONG: Number(stocks.KOSONG || 0),
  });

  useEffect(() => {
    setSnap({ ISI: Number(stocks.ISI || 0), KOSONG: Number(stocks.KOSONG || 0) });
  }, [stocks]);

  return (
    <Stack spacing={2} sx={{ pb: { xs: 8, md: 2 } }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
        <Typography variant="h5" fontWeight={700}>
          Stok
        </Typography>
        <Stack direction="row" spacing={1} sx={{ ml: "auto" }}>
          <Tooltip title="Stok ISI">
            <Chip
              label={`ISI: ${snap.ISI}`}
              color="success"
              variant="outlined"
              sx={{ fontWeight: 700 }}
            />
          </Tooltip>
          <Tooltip title="Stok KOSONG">
            <Chip
              label={`KOSONG: ${snap.KOSONG}`}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 700 }}
            />
          </Tooltip>
        </Stack>
      </Stack>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <TambahKosong
            onSaved={(s) => {
              setSnap(s);
              onSaved?.(s);
            }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <RestokIsi
            onSaved={(s) => {
              setSnap(s);
              onSaved?.(s);
            }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <PenyesuaianStok
            onSaved={(s) => {
              setSnap(s);
              onSaved?.(s);
            }}
          />
        </Grid>
      </Grid>
    </Stack>
  );
}

/* ========== Tambah Stok KOSONG ========== */
function TambahKosong({ onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({ qty: "", date: todayStr(), note: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const qtyNum = Number(form.qty) || 0;
    if (qtyNum <= 0) return setErr("Jumlah harus > 0");

    try {
      setErr("");
      setLoading(true);
      const snap = await DataService.addKosong({
        qty: qtyNum,
        date: form.date,
        note: form.note,
      });
      toast?.show?.({ type: "success", message: `Stok KOSONG +${qtyNum}` });
      setForm({ qty: "", date: todayStr(), note: "" });
      onSaved?.(snap);
    } catch (e2) {
      const msg = e2.message || "Gagal tambah KOSONG";
      setErr(msg);
      toast?.show?.({ type: "error", message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader title="Tambah Stok Kosong" />
      <CardContent>
        {err && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErr("")}>
            {err}
          </Alert>
        )}

        <Box component="form" onSubmit={submit}>
          <Stack spacing={1.5}>
            <TextField
              {...FIELD_PROPS}
              sx={FIELD_SX}
              label="Jumlah"
              type="number"
              inputProps={{ min: 1, inputMode: "numeric", pattern: "[0-9]*" }}
              value={form.qty}
              onChange={(e) => setForm({ ...form, qty: e.target.value })}
              disabled={loading}
              placeholder="contoh: 10"
            />

            <TextField
              {...FIELD_PROPS}
              sx={FIELD_SX}
              label="Tanggal"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              inputProps={{ min: MIN_DATE, max: maxAllowedDate() }}
              disabled={loading}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              {...FIELD_PROPS}
              sx={FIELD_SX}
              label="Catatan (opsional)"
              multiline
              minRows={2}
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              disabled={loading}
              placeholder="mis: titip pelanggan"
            />

            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                variant="outlined"
                type="button"
                onClick={() => setForm({ qty: "", date: todayStr(), note: "" })}
                disabled={loading}
              >
                Reset
              </Button>
              <Button variant="contained" type="submit" disabled={loading}>
                {loading ? "Menyimpan…" : "Simpan"}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}

/* ========== Restok ISI (Tukar KOSONG) ========== */
function RestokIsi({ onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({ qty: "", date: todayStr(), note: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const qtyNum = Number(form.qty) || 0;
    if (qtyNum <= 0) return setErr("Jumlah harus > 0");

    try {
      setErr("");
      setLoading(true);
      const snap = await DataService.addIsi({
        qty: qtyNum,
        date: form.date,
        note: form.note || "restok agen (tukar kosong)",
      });
      toast?.show?.({
        type: "success",
        message: `Stok ISI +${qtyNum} (tukar kosong)`,
      });
      setForm({ qty: "", date: todayStr(), note: "" });
      onSaved?.(snap);
    } catch (e2) {
      const msg = e2.message || "Gagal restok ISI";
      setErr(msg);
      toast?.show?.({ type: "error", message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader title="Restok Isi (Tukar Kosong)" />
      <CardContent>
        {err && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErr("")}>
            {err}
          </Alert>
        )}

        <Box component="form" onSubmit={submit}>
          <Stack spacing={1.5}>
            <TextField
              {...FIELD_PROPS}
              sx={FIELD_SX}
              label="Jumlah"
              type="number"
              inputProps={{ min: 1, inputMode: "numeric", pattern: "[0-9]*" }}
              value={form.qty}
              onChange={(e) => setForm({ ...form, qty: e.target.value })}
              disabled={loading}
              placeholder="contoh: 10"
            />

            <TextField
              {...FIELD_PROPS}
              sx={FIELD_SX}
              label="Tanggal"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              inputProps={{ min: MIN_DATE, max: maxAllowedDate() }}
              disabled={loading}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              {...FIELD_PROPS}
              sx={FIELD_SX}
              label="Catatan (opsional)"
              multiline
              minRows={2}
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              disabled={loading}
              placeholder="mis: tukar kosong di agen"
            />

            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                variant="outlined"
                type="button"
                onClick={() => setForm({ qty: "", date: todayStr(), note: "" })}
                disabled={loading}
              >
                Reset
              </Button>
              <Button variant="contained" type="submit" disabled={loading}>
                {loading ? "Menyimpan…" : "Simpan"}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}

/* ========== Penyesuaian Stok (Koreksi) ========== */
function PenyesuaianStok({ onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({
    code: "KOSONG",
    dir: "OUT",
    qty: "",
    date: todayStr(),
    reason: "",
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const qtyNum = Number(form.qty) || 0;
    if (qtyNum <= 0) return setErr("Jumlah harus > 0");
    if (!form.reason.trim()) return setErr("Alasan wajib diisi");
    if (form.code === "ISI" && form.dir === "IN")
      return setErr("Tidak boleh menambah stok ISI via penyesuaian. Gunakan 'Restok Isi'.");

    const delta = form.dir === "IN" ? qtyNum : -qtyNum;

    try {
      setErr("");
      setLoading(true);
      const snap = await DataService.adjustStock({
        code: form.code,
        delta,
        date: form.date,
        reason: form.reason,
      });
      toast?.show?.({
        type: "success",
        message: `Penyesuaian ${form.code} ${
          delta > 0 ? `+${qtyNum}` : `-${qtyNum}`
        } tersimpan.`,
      });
      setForm({ code: "KOSONG", dir: "OUT", qty: "", date: todayStr(), reason: "" });
      onSaved?.(snap);
    } catch (e2) {
      const msg = e2.message || "Gagal penyesuaian stok";
      setErr(msg);
      toast?.show?.({ type: "error", message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader title="Penyesuaian Stok (Koreksi)" />
      <CardContent>
        {err && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErr("")}>
            {err}
          </Alert>
        )}

        <Box component="form" onSubmit={submit}>
          <Stack spacing={1.5}>
            <FormControl {...FIELD_PROPS} sx={FIELD_SX}>
              <InputLabel id="jenis-label">Jenis Stok</InputLabel>
              <Select
                labelId="jenis-label"
                label="Jenis Stok"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                disabled={loading}
              >
                <MenuItem value="ISI">ISI</MenuItem>
                <MenuItem value="KOSONG">KOSONG</MenuItem>
              </Select>
            </FormControl>

            <FormControl {...FIELD_PROPS} sx={FIELD_SX}>
              <InputLabel id="arah-label">Arah Penyesuaian</InputLabel>
              <Select
                labelId="arah-label"
                label="Arah Penyesuaian"
                value={form.dir}
                onChange={(e) => setForm({ ...form, dir: e.target.value })}
                disabled={loading}
              >
                <MenuItem value="IN">Masuk (+)</MenuItem>
                <MenuItem value="OUT">Keluar (−)</MenuItem>
              </Select>
            </FormControl>

            <Typography variant="caption" color="text.secondary">
              *Tambah ISI tidak diperbolehkan di sini — gunakan Restok Isi.
            </Typography>

            <TextField
              {...FIELD_PROPS}
              sx={FIELD_SX}
              label="Jumlah"
              type="number"
              inputProps={{ min: 1, inputMode: "numeric", pattern: "[0-9]*" }}
              value={form.qty}
              onChange={(e) => setForm({ ...form, qty: e.target.value })}
              disabled={loading}
              placeholder="contoh: 2"
            />

            <TextField
              {...FIELD_PROPS}
              sx={FIELD_SX}
              label="Tanggal"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              inputProps={{ min: MIN_DATE, max: maxAllowedDate() }}
              disabled={loading}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              {...FIELD_PROPS}
              sx={FIELD_SX}
              label="Alasan (wajib)"
              multiline
              minRows={2}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              disabled={loading}
              placeholder='mis: "Koreksi stok - kelebihan input" / "Stok hilang/rusak"'
            />

            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                variant="outlined"
                type="button"
                onClick={() =>
                  setForm({
                    code: "KOSONG",
                    dir: "OUT",
                    qty: "",
                    date: todayStr(),
                    reason: "",
                  })
                }
                disabled={loading}
              >
                Reset
              </Button>
              <Button variant="contained" type="submit" disabled={loading}>
                {loading ? "Menyimpan…" : "Simpan"}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}
