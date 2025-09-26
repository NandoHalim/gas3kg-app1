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
  CircularProgress,
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
  "& .MuiSelect-select": {
    paddingTop: { xs: 1, md: 1.25 },
    paddingBottom: { xs: 1, md: 1.25 },
    fontSize: { xs: "16px", md: "inherit" },
  }
};

// 🔧 Kartu mobile-friendly
const CARD_SX = {
  height: "100%",
  "& .MuiCardContent-root": {
    padding: { xs: 2, md: 3 },
  },
};

// 🔧 Constants untuk konsistensi
const MOBILE_CONSTANTS = {
  spacing: {
    card: { xs: 1.5, md: 2 },
    stack: { xs: 1.5, md: 2 },
    grid: { xs: 1.5, md: 2 }
  },
  typography: {
    h4: { xs: "1.5rem", sm: "1.75rem", md: "2.125rem" },
    h6: { xs: "1rem", sm: "1.1rem", md: "1.25rem" },
    body: { xs: "0.875rem", md: "1rem" }
  },
  dimensions: {
    buttonHeight: { xs: 44, sm: 40 },
    inputHeight: { xs: 48, md: 56 },
    chipHeight: { xs: 28, sm: 32 }
  }
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
      spacing={MOBILE_CONSTANTS.spacing.stack}
      sx={{
        pb: { xs: 2, md: 2 },
        minHeight: "100vh",
        overflowY: "auto",
        "&::-webkit-scrollbar": { width: "6px" },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: "divider",
          borderRadius: "3px",
        },
      }}
    >
      {/* Header responsif */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={1}
        sx={{ mb: { xs: 1, sm: 2 } }}
      >
        <Typography
          variant="h4"
          fontWeight={600}
          sx={{ 
            fontSize: MOBILE_CONSTANTS.typography.h4,
            textAlign: { xs: "center", sm: "left" }
          }}
        >
          Stok
        </Typography>

        <Stack
          direction="row"
          spacing={1}
          sx={{
            ml: { sm: "auto" },
            justifyContent: { xs: "center", sm: "flex-end" },
          }}
        >
          <Tooltip title="Stok ISI">
            <Chip
              label={`ISI: ${snap.ISI}`}
              color="success"
              variant="outlined"
              size="small"
              sx={{ 
                fontWeight: 700, 
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                height: MOBILE_CONSTANTS.dimensions.chipHeight
              }}
            />
          </Tooltip>
          <Tooltip title="Stok KOSONG">
            <Chip
              label={`KOSONG: ${snap.KOSONG}`}
              color="primary"
              variant="outlined"
              size="small"
              sx={{ 
                fontWeight: 700, 
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                height: MOBILE_CONSTANTS.dimensions.chipHeight
              }}
            />
          </Tooltip>
        </Stack>
      </Stack>

      {/* Grid responsif */}
      <Grid
        container
        spacing={MOBILE_CONSTANTS.spacing.grid}
        sx={{
          "& .MuiGrid-item": {
            padding: { xs: "8px", md: "16px" },
          },
        }}
      >
        <Grid item xs={12} sm={6} md={4}>
          <TambahKosong
            onSaved={(s) => {
              setSnap(s);
              onSaved?.(s);
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <RestokIsi
            onSaved={(s) => {
              setSnap(s);
              onSaved?.(s);
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
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
          <Typography variant="h6" fontWeight={600} sx={{ 
            fontSize: MOBILE_CONSTANTS.typography.h6,
            lineHeight: 1.2
          }}>
            Tambah Stok Kosong
          </Typography>
        }
        sx={{
          pb: { xs: 1.5, md: 2 },
          borderBottom: 1,
          borderColor: "divider",
          padding: { xs: "16px", sm: "20px", md: "24px" },
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
              py: { xs: 1, md: 1.5 },
              "& .MuiAlert-message": { 
                overflow: "hidden",
                padding: { xs: "4px 0", md: "0" } 
              },
            }}
            onClose={() => setErr("")}
          >
            {err}
          </Alert>
        )}

        <Box component="form" onSubmit={submit}>
          <Stack spacing={MOBILE_CONSTANTS.spacing.stack}>
            <TextField
              {...FIELD_PROPS}
              sx={FIELD_SX_MOBILE}
              label="Jumlah"
              type="number"
              inputProps={{ 
                min: 1, 
                inputMode: "numeric", 
                pattern: "[0-9]*",
                placeholder: "0"
              }}
              value={form.qty}
              onChange={(e) => setForm({ ...form, qty: e.target.value })}
              disabled={loading}
              placeholder="Masukkan jumlah tabung"
            />

            <TextField
              {...FIELD_PROPS}
              sx={FIELD_SX_MOBILE}
              label="Tanggal"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              inputProps={{ 
                min: MIN_DATE, 
                max: maxAllowedDate(), 
                placeholder: "DD-MM-YYYY" 
              }}
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
              direction={{ xs: "column-reverse", sm: "row" }}
              spacing={1.5}
              justifyContent="flex-end"
              sx={{ width: "100%", mt: 1 }}
            >
              <Button
                variant="outlined"
                type="button"
                onClick={() => setForm({ qty: "", date: todayStr(), note: "" })}
                disabled={loading}
                sx={{ 
                  textTransform: "none", 
                  minWidth: { xs: "100%", sm: 100 },
                  minHeight: MOBILE_CONSTANTS.dimensions.buttonHeight,
                  py: { xs: 1, sm: 0.5 }
                }}
              >
                Reset
              </Button>
              <Button
                variant="contained"
                type="submit"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={16} /> : null}
                sx={{ 
                  textTransform: "none", 
                  minWidth: { xs: "100%", sm: 100 },
                  minHeight: MOBILE_CONSTANTS.dimensions.buttonHeight,
                  py: { xs: 1, sm: 0.5 }
                }}
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
          <Typography variant="h6" fontWeight={600} sx={{ 
            fontSize: MOBILE_CONSTANTS.typography.h6,
            lineHeight: 1.2
          }}>
            Restok Isi (Tukar Kosong)
          </Typography>
        }
        sx={{
          pb: { xs: 1.5, md: 2 },
          borderBottom: 1,
          borderColor: "divider",
          padding: { xs: "16px", sm: "20px", md: "24px" },
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
              py: { xs: 1, md: 1.5 },
              "& .MuiAlert-message": { 
                overflow: "hidden",
                padding: { xs: "4px 0", md: "0" } 
              },
            }}
            onClose={() => setErr("")}
          >
            {err}
          </Alert>
        )}

        <Box component="form" onSubmit={submit}>
          <Stack spacing={MOBILE_CONSTANTS.spacing.stack}>
            <TextField
              {...FIELD_PROPS}
              sx={FIELD_SX_MOBILE}
              label="Jumlah"
              type="number"
              inputProps={{ 
                min: 1, 
                inputMode: "numeric", 
                pattern: "[0-9]*",
                placeholder: "0"
              }}
              value={form.qty}
              onChange={(e) => setForm({ ...form, qty: e.target.value })}
              disabled={loading}
              placeholder="Masukkan jumlah tabung"
            />

            <TextField
              {...FIELD_PROPS}
              sx={FIELD_SX_MOBILE}
              label="Tanggal"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              inputProps={{ 
                min: MIN_DATE, 
                max: maxAllowedDate(), 
                placeholder: "DD-MM-YYYY" 
              }}
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
              direction={{ xs: "column-reverse", sm: "row" }}
              spacing={1.5}
              justifyContent="flex-end"
              sx={{ width: "100%", mt: 1 }}
            >
              <Button
                variant="outlined"
                type="button"
                onClick={() => setForm({ qty: "", date: todayStr(), note: "" })}
                disabled={loading}
                sx={{ 
                  textTransform: "none", 
                  minWidth: { xs: "100%", sm: 100 },
                  minHeight: MOBILE_CONSTANTS.dimensions.buttonHeight,
                  py: { xs: 1, sm: 0.5 }
                }}
              >
                Reset
              </Button>
              <Button
                variant="contained"
                type="submit"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={16} /> : null}
                sx={{ 
                  textTransform: "none", 
                  minWidth: { xs: "100%", sm: 100 },
                  minHeight: MOBILE_CONSTANTS.dimensions.buttonHeight,
                  py: { xs: 1, sm: 0.5 }
                }}
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
          <Typography variant="h6" fontWeight={600} sx={{ 
            fontSize: MOBILE_CONSTANTS.typography.h6,
            lineHeight: 1.2
          }}>
            Penyesuaian Stok (Koreksi)
          </Typography>
        }
        sx={{
          pb: { xs: 1.5, md: 2 },
          borderBottom: 1,
          borderColor: "divider",
          padding: { xs: "16px", sm: "20px", md: "24px" },
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
              py: { xs: 1, md: 1.5 },
              "& .MuiAlert-message": { 
                overflow: "hidden",
                padding: { xs: "4px 0", md: "0" } 
              },
            }}
            onClose={() => setErr("")}
          >
            {err}
          </Alert>
        )}

        <Box component="form" onSubmit={submit}>
          <Stack spacing={MOBILE_CONSTANTS.spacing.stack}>
            <FormControl {...FIELD_PROPS} sx={FIELD_SX_MOBILE}>
              <InputLabel 
                id="jenis-label"
                sx={{ fontSize: { xs: "0.9rem", md: "1rem" } }}
              >
                Jenis Stok
              </InputLabel>
              <Select
                labelId="jenis-label"
                label="Jenis Stok"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                disabled={loading}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxHeight: { xs: 200, md: 300 },
                      "& .MuiMenuItem-root": {
                        fontSize: { xs: "0.9rem", md: "1rem" },
                        minHeight: { xs: 44, md: 48 }
                      }
                    }
                  }
                }}
              >
                <MenuItem value="ISI">ISI</MenuItem>
                <MenuItem value="KOSONG">KOSONG</MenuItem>
              </Select>
            </FormControl>

            <FormControl {...FIELD_PROPS} sx={FIELD_SX_MOBILE}>
              <InputLabel 
                id="arah-label"
                sx={{ fontSize: { xs: "0.9rem", md: "1rem" } }}
              >
                Arah Penyesuaian
              </InputLabel>
              <Select
                labelId="arah-label"
                label="Arah Penyesuaian"
                value={form.dir}
                onChange={(e) => setForm({ ...form, dir: e.target.value })}
                disabled={loading}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxHeight: { xs: 200, md: 300 },
                      "& .MuiMenuItem-root": {
                        fontSize: { xs: "0.9rem", md: "1rem" },
                        minHeight: { xs: 44, md: 48 }
                      }
                    }
                  }
                }}
              >
                <MenuItem value="IN">Masuk (+)</MenuItem>
                <MenuItem value="OUT">Keluar (−)</MenuItem>
              </Select>
            </FormControl>

            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.8rem", md: "0.875rem" } }}>
              *Tambah ISI tidak diperbolehkan di sini — gunakan Restok Isi.
            </Typography>

            <TextField
              {...FIELD_PROPS}
              sx={FIELD_SX_MOBILE}
              label="Jumlah"
              type="number"
              inputProps={{ 
                min: 1, 
                inputMode: "numeric", 
                pattern: "[0-9]*",
                placeholder: "0"
              }}
              value={form.qty}
              onChange={(e) => setForm({ ...form, qty: e.target.value })}
              disabled={loading}
              placeholder="Masukkan jumlah penyesuaian"
            />

            <TextField
              {...FIELD_PROPS}
              sx={FIELD_SX_MOBILE}
              label="Tanggal"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              inputProps={{ 
                min: MIN_DATE, 
                max: maxAllowedDate(), 
                placeholder: "DD-MM-YYYY" 
              }}
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
              direction={{ xs: "column-reverse", sm: "row" }}
              spacing={1.5}
              justifyContent="flex-end"
              sx={{ width: "100%", mt: 1 }}
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
                sx={{ 
                  textTransform: "none", 
                  minWidth: { xs: "100%", sm: 100 },
                  minHeight: MOBILE_CONSTANTS.dimensions.buttonHeight,
                  py: { xs: 1, sm: 0.5 }
                }}
              >
                Reset
              </Button>
              <Button
                variant="contained"
                type="submit"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={16} /> : null}
                sx={{ 
                  textTransform: "none", 
                  minWidth: { xs: "100%", sm: 100 },
                  minHeight: MOBILE_CONSTANTS.dimensions.buttonHeight,
                  py: { xs: 1, sm: 0.5 }
                }}
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