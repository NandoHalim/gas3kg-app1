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

// 🔧 Standarisasi field (mobile friendly)
const FIELD_PROPS = { fullWidth: true, variant: "outlined", size: "medium" };
const FIELD_SX_MOBILE = {
  mt: 1,
  "& .MuiOutlinedInput-root": {
    borderRadius: 1,
    minHeight: { xs: 48, md: 56 },
  },
  "& input": {
    paddingTop: { xs: 1, md: 1.25 },
    paddingBottom: { xs: 1, md: 1.25 },
    fontSize: { xs: "16px", md: "inherit" }, // hindari zoom iOS
  },
  "& label": {
    fontSize: { xs: "0.9rem", md: "1rem" },
  },
};

// 🔧 Kartu mobile-friendly
const CARD_SX = {
  height: "100%",
  "& .MuiCardContent-root": {
    padding: { xs: 2, md: 3 },
  },
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
    <Stack
      spacing={2}
      sx={{
        pb: { xs: 8, md: 2 },
        height: "100vh",
        overflowY: "auto",
        "&::-webkit-scrollbar": { width: "8px" },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: "divider",
          borderRadius: "4px",
        },
      }}
    >
      {/* Header responsif */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
        sx={{ mb: 2 }}
      >
        <Typography
          variant="h4"
          fontWeight={600}
          sx={{ fontSize: { xs: "1.75rem", sm: "2.125rem" } }}
        >
          Stok
        </Typography>

        <Stack
          direction="row"
          spacing={1}
          sx={{
            ml: { sm: "auto" },
            mt: { xs: 1, sm: 0 },
            width: { xs: "100%", sm: "auto" },
            justifyContent: { xs: "space-between", sm: "flex-end" },
          }}
        >
          <Tooltip title="Stok ISI">
            <Chip
              label={`ISI: ${snap.ISI}`}
              color="success"
              variant="outlined"
              sx={{ fontWeight: 700, fontSize: { xs: "0.8rem", sm: "0.875rem" } }}
            />
          </Tooltip>
          <Tooltip title="Stok KOSONG">
            <Chip
              label={`KOSONG: ${snap.KOSONG}`}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 700, fontSize: { xs: "0.8rem", sm: "0.875rem" } }}
            />
          </Tooltip>
        </Stack>
      </Stack>

      {/* Grid responsif + padding adaptif */}
      <Grid
        container
        spacing={2}
        sx={{
          "& .MuiGrid-item": {
            p: { xs: 1, md: 2 },
          },
        }}
      >
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
    <Card sx={CARD_SX}>
      <CardHeader
        title={
          <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: "1.1rem", md: "1.25rem" } }}>
            Tambah Stok Kosong
          </Typography>
        }
        sx={{
          pb: 2,
          borderBottom: 1,
          borderColor: "divider",
          p: { xs: 2, md: 3 },
          "& .MuiCardHeader-content": { overflow: "hidden" },
        }}
      />
      <CardContent>
        {err && (
          <Alert
            severity="error"
            sx={{
              mb: 2,
              fontSize: { xs: "0.8rem", md: "0.875rem" },
              "& .MuiAlert-message": { overflow: "hidden" },
            }}
            onClose={() => setErr("")}
          >
            {err}
          </Alert>
        )}

        <Box component="form" onSubmit={submit}>
          <Stack spacing={2}>
            <TextField
              {...FIELD_PROPS}
              sx={FIELD_SX_MOBILE}
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
              sx={FIELD_SX_MOBILE}
              label="Tanggal"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              inputProps={{ min: MIN_DATE, max: maxAllowedDate(), placeholder: "DD-MM-YYYY" }}
              disabled={loading}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              {...FIELD_PROPS}
              sx={FIELD_SX_MOBILE}
              label="Catatan (opsional)"
              multiline
              minRows={2}
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              disabled={loading}
              placeholder="mis: titip pelanggan"
            />

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              justifyContent="flex-end"
              sx={{ width: "100%" }}
            >
              <Button
                variant="outlined"
                type="button"
                onClick={() => setForm({ qty: "", date: todayStr(), note: "" })}
                disabled={loading}
                sx={{ textTransform: "none", minWidth: { xs: "100%", sm: 100 }, order: { xs: 2, sm: 1 } }}
              >
                Reset
              </Button>
              <Button
                variant="contained"
                type="submit"
                disabled={loading}
                sx={{ textTransform: "none", minWidth: { xs: "100%", sm: 100 }, order: { xs: 1, sm: 2 } }}
              >
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
    <Card sx={CARD_SX}>
      <CardHeader
        title={
          <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: "1.1rem", md: "1.25rem" } }}>
            Restok Isi (Tukar Kosong)
          </Typography>
        }
        sx={{
          pb: 2,
          borderBottom: 1,
          borderColor: "divider",
          p: { xs: 2, md: 3 },
          "& .MuiCardHeader-content": { overflow: "hidden" },
        }}
      />
      <CardContent>
        {err && (
          <Alert
            severity="error"
            sx={{
              mb: 2,
              fontSize: { xs: "0.8rem", md: "0.875rem" },
              "& .MuiAlert-message": { overflow: "hidden" },
            }}
            onClose={() => setErr("")}
          >
            {err}
          </Alert>
        )}

        <Box component="form" onSubmit={submit}>
          <Stack spacing={2}>
            <TextField
              {...FIELD_PROPS}
              sx={FIELD_SX_MOBILE}
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
              sx={FIELD_SX_MOBILE}
              label="Tanggal"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              inputProps={{ min: MIN_DATE, max: maxAllowedDate(), placeholder: "DD-MM-YYYY" }}
              disabled={loading}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              {...FIELD_PROPS}
              sx={FIELD_SX_MOBILE}
              label="Catatan (opsional)"
              multiline
              minRows={2}
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              disabled={loading}
              placeholder="mis: tukar kosong di agen"
            />

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              justifyContent="flex-end"
              sx={{ width: "100%" }}
            >
              <Button
                variant="outlined"
                type="button"
                onClick={() => setForm({ qty: "", date: todayStr(), note: "" })}
                disabled={loading}
                sx={{ textTransform: "none", minWidth: { xs: "100%", sm: 100 }, order: { xs: 2, sm: 1 } }}
              >
                Reset
              </Button>
              <Button
                variant="contained"
                type="submit"
                disabled={loading}
                sx={{ textTransform: "none", minWidth: { xs: "100%", sm: 100 }, order: { xs: 1, sm: 2 } }}
              >
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
        message: `Penyesuaian ${form.code} ${delta > 0 ? `+${qtyNum}` : `-${qtyNum}`} tersimpan.`,
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
    <Card sx={CARD_SX}>
      <CardHeader
        title={
          <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: "1.1rem", md: "1.25rem" } }}>
            Penyesuaian Stok (Koreksi)
          </Typography>
        }
        sx={{
          pb: 2,
          borderBottom: 1,
          borderColor: "divider",
          p: { xs: 2, md: 3 },
          "& .MuiCardHeader-content": { overflow: "hidden" },
        }}
      />
      <CardContent>
        {err && (
          <Alert
            severity="error"
            sx={{
              mb: 2,
              fontSize: { xs: "0.8rem", md: "0.875rem" },
              "& .MuiAlert-message": { overflow: "hidden" },
            }}
            onClose={() => setErr("")}
          >
            {err}
          </Alert>
        )}

        <Box component="form" onSubmit={submit}>
          <Stack spacing={2}>
            <FormControl {...FIELD_PROPS} sx={FIELD_SX_MOBILE}>
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

            <FormControl {...FIELD_PROPS} sx={FIELD_SX_MOBILE}>
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

            <Typography variant="body2" color="text.secondary">
              *Tambah ISI tidak diperbolehkan di sini — gunakan Restok Isi.
            </Typography>

            <TextField
              {...FIELD_PROPS}
              sx={FIELD_SX_MOBILE}
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
              sx={FIELD_SX_MOBILE}
              label="Tanggal"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              inputProps={{ min: MIN_DATE, max: maxAllowedDate(), placeholder: "DD-MM-YYYY" }}
              disabled={loading}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              {...FIELD_PROPS}
              sx={FIELD_SX_MOBILE}
              label="Alasan (wajib)"
              multiline
              minRows={2}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              disabled={loading}
              placeholder='mis: "Koreksi stok - kelebihan input" / "Stok hilang/rusak"'
            />

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              justifyContent="flex-end"
              sx={{ width: "100%" }}
            >
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
                sx={{ textTransform: "none", minWidth: { xs: "100%", sm: 100 }, order: { xs: 2, sm: 1 } }}
              >
                Reset
              </Button>
              <Button
                variant="contained"
                type="submit"
                disabled={loading}
                sx={{ textTransform: "none", minWidth: { xs: "100%", sm: 100 }, order: { xs: 1, sm: 2 } }}
              >
                {loading ? "Menyimpan…" : "Simpan"}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}
