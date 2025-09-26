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
  useTheme,
  useMediaQuery,
} from "@mui/material";

// 🔧 DEBUG: Diagnostic component
const LayoutDebugger = () => {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.only('xs'));
  const isSm = useMediaQuery(theme.breakpoints.only('sm'));
  const isMd = useMediaQuery(theme.breakpoints.only('md'));
  const isLg = useMediaQuery(theme.breakpoints.only('lg'));
  const isXl = useMediaQuery(theme.breakpoints.only('xl'));

  if (process.env.NODE_ENV === 'development') {
    return (
      <Box sx={{ 
        position: 'fixed', 
        top: 0, 
        right: 0, 
        background: 'rgba(0,0,0,0.8)', 
        color: 'white', 
        padding: 1,
        fontSize: '12px',
        zIndex: 9999 
      }}>
        Breakpoint: 
        {isXs && 'XS (mobile)'}
        {isSm && 'SM (small tablet)'}
        {isMd && 'MD (tablet)'}
        {isLg && 'LG (desktop)'}
        {isXl && 'XL (large desktop)'}
      </Box>
    );
  }
  return null;
};

// 🔧 Fix: Simple responsive constants
const getResponsiveProps = (isMobile, isTablet) => ({
  spacing: isMobile ? 2 : isTablet ? 2.5 : 3,
  cardPadding: isMobile ? 2 : 3,
  buttonDirection: isMobile ? 'column' : 'row',
  gridColumns: isMobile ? 12 : isTablet ? 6 : 4
});

export default function StokView({ stocks = {}, onSaved }) {
  const toast = useToast();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

  const [snap, setSnap] = useState({
    ISI: Number(stocks.ISI || 0),
    KOSONG: Number(stocks.KOSONG || 0),
  });

  useEffect(() => {
    setSnap({ ISI: Number(stocks.ISI || 0), KOSONG: Number(stocks.KOSONG || 0) });
  }, [stocks]);

  const responsive = getResponsiveProps(isMobile, isTablet);

  return (
    <>
      <LayoutDebugger />
      <Box sx={{ 
        width: '100%',
        minHeight: '100vh',
        backgroundColor: 'background.default',
        p: { xs: 2, md: 3, lg: 4 } // 🔧 FIX: Consistent padding
      }}>
        {/* Header - Simplified */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' },
          justifyContent: 'space-between',
          mb: 4,
          gap: 2
        }}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Manajemen Stok
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Kelola stok tabung LPG dengan mudah
            </Typography>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            gap: 2,
            justifyContent: { xs: 'space-between', md: 'flex-end' }
          }}>
            <Chip 
              label={`ISI: ${snap.ISI}`} 
              color="success" 
              variant="filled"
              sx={{ fontWeight: 700, minWidth: 100 }}
            />
            <Chip 
              label={`KOSONG: ${snap.KOSONG}`} 
              color="primary" 
              variant="filled"
              sx={{ fontWeight: 700, minWidth: 120 }}
            />
          </Box>
        </Box>

        {/* 🔧 FIX: Grid dengan container yang proper */}
        <Grid 
          container 
          spacing={3}
          sx={{ 
            width: '100%',
            margin: 0,
            '& .MuiGrid-item': {
              // 🔧 DEBUG: Border untuk melihat grid boundaries
              // border: '1px dashed red',
              display: 'flex'
            }
          }}
        >
          {/* 🔧 FIX: Grid columns yang benar */}
          <Grid item xs={12} md={6} lg={4} sx={{ display: 'flex' }}>
            <Box sx={{ width: '100%' }}>
              <TambahKosong
                onSaved={(s) => {
                  setSnap(s);
                  onSaved?.(s);
                }}
                isMobile={isMobile}
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6} lg={4} sx={{ display: 'flex' }}>
            <Box sx={{ width: '100%' }}>
              <RestokIsi
                onSaved={(s) => {
                  setSnap(s);
                  onSaved?.(s);
                }}
                isMobile={isMobile}
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6} lg={4} sx={{ display: 'flex' }}>
            <Box sx={{ width: '100%' }}>
              <PenyesuaianStok
                onSaved={(s) => {
                  setSnap(s);
                  onSaved?.(s);
                }}
                isMobile={isMobile}
              />
            </Box>
          </Grid>
        </Grid>
      </Box>
    </>
  );
}

// 🔧 FIX: Simplified card component
function StokCard({ title, children, isMobile }) {
  return (
    <Card sx={{ 
      width: '100%',
      height: '100%',
      minHeight: isMobile ? 500 : 550,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <CardHeader
        title={
          <Typography variant="h6" fontWeight={600}>
            {title}
          </Typography>
        }
        sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          backgroundColor: 'background.paper'
        }}
      />
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </CardContent>
    </Card>
  );
}

/* ========== Tambah Stok KOSONG ========== */
function TambahKosong({ onSaved, isMobile }) {
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
    <StokCard title="Tambah Stok Kosong" isMobile={isMobile}>
      {err && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErr("")}>
          {err}
        </Alert>
      )}

      <Box component="form" onSubmit={submit} sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Stack spacing={2} sx={{ flex: 1 }}>
          <TextField
            fullWidth
            label="Jumlah"
            type="number"
            value={form.qty}
            onChange={(e) => setForm({ ...form, qty: e.target.value })}
            disabled={loading}
            placeholder="Contoh: 10"
          />

          <TextField
            fullWidth
            label="Tanggal"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            disabled={loading}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            fullWidth
            label="Catatan (opsional)"
            multiline
            minRows={3}
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            disabled={loading}
            placeholder="Misal: titip pelanggan"
          />

          <Box sx={{ mt: 'auto', pt: 2 }}>
            <Stack 
              direction={isMobile ? "column" : "row"} 
              spacing={2} 
              justifyContent="flex-end"
            >
              <Button
                variant="outlined"
                onClick={() => setForm({ qty: "", date: todayStr(), note: "" })}
                disabled={loading}
                fullWidth={isMobile}
                sx={{ minWidth: isMobile ? 'auto' : 100 }}
              >
                Reset
              </Button>
              <Button
                variant="contained"
                type="submit"
                disabled={loading}
                fullWidth={isMobile}
                sx={{ minWidth: isMobile ? 'auto' : 100 }}
              >
                {loading ? "Menyimpan..." : "Simpan"}
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Box>
    </StokCard>
  );
}

/* ========== Restok ISI ========== */
function RestokIsi({ onSaved, isMobile }) {
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
    <StokCard title="Restok Isi (Tukar Kosong)" isMobile={isMobile}>
      {err && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErr("")}>
          {err}
        </Alert>
      )}

      <Box component="form" onSubmit={submit} sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Stack spacing={2} sx={{ flex: 1 }}>
          <TextField
            fullWidth
            label="Jumlah"
            type="number"
            value={form.qty}
            onChange={(e) => setForm({ ...form, qty: e.target.value })}
            disabled={loading}
            placeholder="Contoh: 10"
          />

          <TextField
            fullWidth
            label="Tanggal"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            disabled={loading}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            fullWidth
            label="Catatan (opsional)"
            multiline
            minRows={3}
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            disabled={loading}
            placeholder="Misal: tukar kosong di agen"
          />

          <Box sx={{ mt: 'auto', pt: 2 }}>
            <Stack 
              direction={isMobile ? "column" : "row"} 
              spacing={2} 
              justifyContent="flex-end"
            >
              <Button
                variant="outlined"
                onClick={() => setForm({ qty: "", date: todayStr(), note: "" })}
                disabled={loading}
                fullWidth={isMobile}
                sx={{ minWidth: isMobile ? 'auto' : 100 }}
              >
                Reset
              </Button>
              <Button
                variant="contained"
                type="submit"
                disabled={loading}
                fullWidth={isMobile}
                sx={{ minWidth: isMobile ? 'auto' : 100 }}
              >
                {loading ? "Menyimpan..." : "Simpan"}
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Box>
    </StokCard>
  );
}

/* ========== Penyesuaian Stok ========== */
function PenyesuaianStok({ onSaved, isMobile }) {
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
    <StokCard title="Penyesuaian Stok (Koreksi)" isMobile={isMobile}>
      {err && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErr("")}>
          {err}
        </Alert>
      )}

      <Box component="form" onSubmit={submit} sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Stack spacing={2} sx={{ flex: 1 }}>
          <FormControl fullWidth>
            <InputLabel>Jenis Stok</InputLabel>
            <Select
              value={form.code}
              label="Jenis Stok"
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              disabled={loading}
            >
              <MenuItem value="ISI">ISI</MenuItem>
              <MenuItem value="KOSONG">KOSONG</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Arah Penyesuaian</InputLabel>
            <Select
              value={form.dir}
              label="Arah Penyesuaian"
              onChange={(e) => setForm({ ...form, dir: e.target.value })}
              disabled={loading}
            >
              <MenuItem value="IN">Masuk (+)</MenuItem>
              <MenuItem value="OUT">Keluar (−)</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            *Tambah ISI tidak diperbolehkan di sini — gunakan Restok Isi.
          </Typography>

          <TextField
            fullWidth
            label="Jumlah"
            type="number"
            value={form.qty}
            onChange={(e) => setForm({ ...form, qty: e.target.value })}
            disabled={loading}
            placeholder="Contoh: 2"
          />

          <TextField
            fullWidth
            label="Tanggal"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            disabled={loading}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            fullWidth
            label="Alasan (wajib)"
            multiline
            minRows={3}
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            disabled={loading}
            placeholder='Misal: "Koreksi stok - kelebihan input"'
          />

          <Box sx={{ mt: 'auto', pt: 2 }}>
            <Stack 
              direction={isMobile ? "column" : "row"} 
              spacing={2} 
              justifyContent="flex-end"
            >
              <Button
                variant="outlined"
                onClick={() => setForm({ code: "KOSONG", dir: "OUT", qty: "", date: todayStr(), reason: "" })}
                disabled={loading}
                fullWidth={isMobile}
                sx={{ minWidth: isMobile ? 'auto' : 100 }}
              >
                Reset
              </Button>
              <Button
                variant="contained"
                type="submit"
                disabled={loading}
                fullWidth={isMobile}
                sx={{ minWidth: isMobile ? 'auto' : 100 }}
              >
                {loading ? "Menyimpan..." : "Simpan"}
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Box>
    </StokCard>
  );
}