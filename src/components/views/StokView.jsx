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

// 🔧 Custom hook untuk responsive design
const useResponsive = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  
  return { isMobile, isTablet, isDesktop };
};

// 🔧 Standarisasi field (responsive)
const FIELD_PROPS = { fullWidth: true, variant: "outlined", size: "medium" };

// 🔧 Constants untuk konsistensi
const RESPONSIVE_CONSTANTS = {
  spacing: {
    mobile: 1.5,
    tablet: 2,
    desktop: 3
  },
  typography: {
    h4: { xs: "1.5rem", sm: "1.75rem", md: "2.125rem", lg: "2.25rem" },
    h6: { xs: "1rem", sm: "1.1rem", md: "1.25rem", lg: "1.3rem" },
    body: { xs: "0.875rem", sm: "0.9rem", md: "1rem", lg: "1rem" }
  },
  dimensions: {
    buttonHeight: { xs: 44, sm: 40, md: 40 },
    inputHeight: { xs: 48, sm: 48, md: 56 },
    chipHeight: { xs: 28, sm: 32, md: 32 }
  }
};

export default function StokView({ stocks = {}, onSaved }) {
  const toast = useToast();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const [snap, setSnap] = useState({
    ISI: Number(stocks.ISI || 0),
    KOSONG: Number(stocks.KOSONG || 0),
  });

  useEffect(() => {
    setSnap({ ISI: Number(stocks.ISI || 0), KOSONG: Number(stocks.KOSONG || 0) });
  }, [stocks]);

  const getSpacing = () => {
    if (isMobile) return RESPONSIVE_CONSTANTS.spacing.mobile;
    if (isTablet) return RESPONSIVE_CONSTANTS.spacing.tablet;
    return RESPONSIVE_CONSTANTS.spacing.desktop;
  };

  const getGridColumns = () => {
    if (isMobile) return 12; // 1 kolom di mobile
    if (isTablet) return 6;  // 2 kolom di tablet
    return 4;                // 3 kolom di desktop
  };

  return (
    <Stack
      spacing={getSpacing()}
      sx={{
        p: { xs: 2, sm: 2, md: 3, lg: 4 },
        minHeight: "100vh",
        backgroundColor: "background.default",
        maxWidth: { lg: "1400px", xl: "1600px" },
        margin: "0 auto",
        width: "100%",
      }}
    >
      {/* Header yang dioptimalkan untuk desktop */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={2}
        sx={{ 
          mb: { xs: 2, md: 3 },
          flexWrap: { xs: "wrap", sm: "nowrap" }
        }}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{ 
              fontSize: RESPONSIVE_CONSTANTS.typography.h4,
              color: "primary.main",
              mb: 0.5
            }}
          >
            Manajemen Stok
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontSize: RESPONSIVE_CONSTANTS.typography.body }}
          >
            Kelola stok tabung LPG dengan mudah
          </Typography>
        </Box>

        <Stack
          direction="row"
          spacing={2}
          sx={{
            flexShrink: 0,
            mt: { xs: 2, sm: 0 }
          }}
        >
          <Tooltip title="Stok Tabung Isi">
            <Chip
              label={`ISI: ${snap.ISI} tabung`}
              color="success"
              variant="filled"
              sx={{ 
                fontWeight: 700, 
                fontSize: { xs: "0.75rem", sm: "0.875rem", md: "0.9rem" },
                height: RESPONSIVE_CONSTANTS.dimensions.chipHeight,
                minWidth: { xs: "auto", md: 120 }
              }}
            />
          </Tooltip>
          <Tooltip title="Stok Tabung Kosong">
            <Chip
              label={`KOSONG: ${snap.KOSONG} tabung`}
              color="primary"
              variant="filled"
              sx={{ 
                fontWeight: 700, 
                fontSize: { xs: "0.75rem", sm: "0.875rem", md: "0.9rem" },
                height: RESPONSIVE_CONSTANTS.dimensions.chipHeight,
                minWidth: { xs: "auto", md: 140 }
              }}
            />
          </Tooltip>
        </Stack>
      </Stack>

      {/* Grid layout yang dioptimalkan untuk desktop */}
      <Grid
        container
        spacing={3}
        sx={{
          '& .MuiGrid-item': {
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        <Grid item xs={12} md={6} lg={4}>
          <TambahKosong
            onSaved={(s) => {
              setSnap(s);
              onSaved?.(s);
            }}
            isMobile={isMobile}
            isTablet={isTablet}
          />
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <RestokIsi
            onSaved={(s) => {
              setSnap(s);
              onSaved?.(s);
            }}
            isMobile={isMobile}
            isTablet={isTablet}
          />
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <PenyesuaianStok
            onSaved={(s) => {
              setSnap(s);
              onSaved?.(s);
            }}
            isMobile={isMobile}
            isTablet={isTablet}
          />
        </Grid>
      </Grid>
    </Stack>
  );
}

/* ========== Komponen Kartu yang Dioptimalkan ========== */
function StokCard({ title, subtitle, children, isMobile, isTablet }) {
  return (
    <Card 
      sx={{ 
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 2,
        boxShadow: isMobile ? 1 : 3,
        transition: "all 0.3s ease",
        '&:hover': {
          boxShadow: isMobile ? 2 : 6,
          transform: isMobile ? 'none' : 'translateY(-2px)'
        },
        minHeight: isMobile ? 400 : 450
      }}
    >
      <CardHeader
        title={
          <Typography 
            variant="h6" 
            fontWeight={600} 
            sx={{ 
              fontSize: isMobile ? "1.1rem" : "1.25rem",
              color: "primary.dark"
            }}
          >
            {title}
          </Typography>
        }
        subheader={
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ fontSize: isMobile ? "0.8rem" : "0.875rem" }}
          >
            {subtitle}
          </Typography>
        }
        sx={{
          pb: 2,
          borderBottom: 1,
          borderColor: "divider",
          padding: isMobile ? "16px 16px 12px" : "20px 24px 16px",
          backgroundColor: "background.paper"
        }}
      />
      <CardContent sx={{ 
        flex: 1, 
        padding: isMobile ? "16px" : "24px",
        display: "flex",
        flexDirection: "column"
      }}>
        {children}
      </CardContent>
    </Card>
  );
}

/* ========== Tambah Stok KOSONG ========== */
function TambahKosong({ onSaved, isMobile, isTablet }) {
  const toast = useToast();
  const [form, setForm] = useState({ qty: "", date: todayStr(), note: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const qtyNum = Number(form.qty) || 0;
    if (qtyNum <= 0) return setErr("Jumlah harus lebih dari 0");

    try {
      setErr("");
      setLoading(true);
      const snap = await DataService.addKosong({
        qty: qtyNum,
        date: form.date,
        note: form.note,
      });
      toast?.show?.({ type: "success", message: `Stok KOSONG berhasil ditambah +${qtyNum}` });
      setForm({ qty: "", date: todayStr(), note: "" });
      onSaved?.(snap);
    } catch (e2) {
      const msg = e2.message || "Gagal menambah stok KOSONG";
      setErr(msg);
      toast?.show?.({ type: "error", message: msg });
    } finally {
      setLoading(false);
    }
  };

  const fieldSx = {
    mt: 1,
    "& .MuiOutlinedInput-root": {
      borderRadius: 1,
      minHeight: isMobile ? 48 : 56,
    },
    "& input": {
      paddingTop: isMobile ? 1 : 1.25,
      paddingBottom: isMobile ? 1 : 1.25,
      fontSize: isMobile ? "16px" : "inherit",
    },
    "& label": {
      fontSize: isMobile ? "0.9rem" : "1rem",
    }
  };

  return (
    <StokCard 
      title="Tambah Stok Kosong" 
      subtitle="Tambahkan tabung kosong ke inventory"
      isMobile={isMobile}
      isTablet={isTablet}
    >
      {err && (
        <Alert
          severity="error"
          sx={{
            mb: 2,
            fontSize: isMobile ? "0.8rem" : "0.875rem",
            '& .MuiAlert-message': { overflow: "hidden" },
          }}
          onClose={() => setErr("")}
        >
          {err}
        </Alert>
      )}

      <Box component="form" onSubmit={submit} sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Stack spacing={isMobile ? 2 : 2.5} sx={{ flex: 1 }}>
          <TextField
            {...FIELD_PROPS}
            sx={fieldSx}
            label="Jumlah Tabung"
            type="number"
            inputProps={{ 
              min: 1, 
              inputMode: "numeric", 
              pattern: "[0-9]*",
            }}
            value={form.qty}
            onChange={(e) => setForm({ ...form, qty: e.target.value })}
            disabled={loading}
            placeholder="Contoh: 10"
          />

          <TextField
            {...FIELD_PROPS}
            sx={fieldSx}
            label="Tanggal Transaksi"
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

          <TextField
            {...FIELD_PROPS}
            sx={fieldSx}
            label="Catatan (opsional)"
            multiline
            minRows={isMobile ? 2 : 3}
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            disabled={loading}
            placeholder="Misal: titip pelanggan, pembelian baru, dll."
          />

          <Box sx={{ mt: "auto", pt: 2 }}>
            <Stack
              direction={isMobile ? "column-reverse" : "row"}
              spacing={isMobile ? 1.5 : 2}
              justifyContent="flex-end"
            >
              <Button
                variant="outlined"
                type="button"
                onClick={() => setForm({ qty: "", date: todayStr(), note: "" })}
                disabled={loading}
                size={isMobile ? "medium" : "large"}
                sx={{ 
                  textTransform: "none", 
                  minWidth: isMobile ? "100%" : 120,
                  minHeight: isMobile ? 44 : 48,
                  fontWeight: 600
                }}
              >
                Reset
              </Button>
              <Button
                variant="contained"
                type="submit"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
                size={isMobile ? "medium" : "large"}
                sx={{ 
                  textTransform: "none", 
                  minWidth: isMobile ? "100%" : 120,
                  minHeight: isMobile ? 44 : 48,
                  fontWeight: 600
                }}
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

/* ========== Restok ISI (Tukar KOSONG) ========== */
function RestokIsi({ onSaved, isMobile, isTablet }) {
  const toast = useToast();
  const [form, setForm] = useState({ qty: "", date: todayStr(), note: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const qtyNum = Number(form.qty) || 0;
    if (qtyNum <= 0) return setErr("Jumlah harus lebih dari 0");

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
        message: `Stok ISI berhasil ditambah +${qtyNum} (tukar kosong)`,
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

  const fieldSx = {
    mt: 1,
    "& .MuiOutlinedInput-root": {
      borderRadius: 1,
      minHeight: isMobile ? 48 : 56,
    },
    "& input": {
      paddingTop: isMobile ? 1 : 1.25,
      paddingBottom: isMobile ? 1 : 1.25,
      fontSize: isMobile ? "16px" : "inherit",
    },
    "& label": {
      fontSize: isMobile ? "0.9rem" : "1rem",
    }
  };

  return (
    <StokCard 
      title="Restok Isi (Tukar Kosong)" 
      subtitle="Tukar tabung kosong dengan tabung isi"
      isMobile={isMobile}
      isTablet={isTablet}
    >
      {err && (
        <Alert
          severity="error"
          sx={{
            mb: 2,
            fontSize: isMobile ? "0.8rem" : "0.875rem",
            '& .MuiAlert-message': { overflow: "hidden" },
          }}
          onClose={() => setErr("")}
        >
          {err}
        </Alert>
      )}

      <Box component="form" onSubmit={submit} sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Stack spacing={isMobile ? 2 : 2.5} sx={{ flex: 1 }}>
          <TextField
            {...FIELD_PROPS}
            sx={fieldSx}
            label="Jumlah Tabung"
            type="number"
            inputProps={{ 
              min: 1, 
              inputMode: "numeric", 
              pattern: "[0-9]*",
            }}
            value={form.qty}
            onChange={(e) => setForm({ ...form, qty: e.target.value })}
            disabled={loading}
            placeholder="Contoh: 10"
          />

          <TextField
            {...FIELD_PROPS}
            sx={fieldSx}
            label="Tanggal Transaksi"
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

          <TextField
            {...FIELD_PROPS}
            sx={fieldSx}
            label="Catatan (opsional)"
            multiline
            minRows={isMobile ? 2 : 3}
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            disabled={loading}
            placeholder="Misal: tukar kosong di agen, pengisian rutin, dll."
          />

          <Box sx={{ mt: "auto", pt: 2 }}>
            <Stack
              direction={isMobile ? "column-reverse" : "row"}
              spacing={isMobile ? 1.5 : 2}
              justifyContent="flex-end"
            >
              <Button
                variant="outlined"
                type="button"
                onClick={() => setForm({ qty: "", date: todayStr(), note: "" })}
                disabled={loading}
                size={isMobile ? "medium" : "large"}
                sx={{ 
                  textTransform: "none", 
                  minWidth: isMobile ? "100%" : 120,
                  minHeight: isMobile ? 44 : 48,
                  fontWeight: 600
                }}
              >
                Reset
              </Button>
              <Button
                variant="contained"
                type="submit"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
                size={isMobile ? "medium" : "large"}
                sx={{ 
                  textTransform: "none", 
                  minWidth: isMobile ? "100%" : 120,
                  minHeight: isMobile ? 44 : 48,
                  fontWeight: 600
                }}
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

/* ========== Penyesuaian Stok (Koreksi) ========== */
function PenyesuaianStok({ onSaved, isMobile, isTablet }) {
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
    if (qtyNum <= 0) return setErr("Jumlah harus lebih dari 0");
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
        message: `Penyesuaian stok ${form.code} ${delta > 0 ? `+${qtyNum}` : `-${qtyNum}`} berhasil disimpan`,
      });
      setForm({ code: "KOSONG", dir: "OUT", qty: "", date: todayStr(), reason: "" });
      onSaved?.(snap);
    } catch (e2) {
      const msg = e2.message || "Gagal melakukan penyesuaian stok";
      setErr(msg);
      toast?.show?.({ type: "error", message: msg });
    } finally {
      setLoading(false);
    }
  };

  const fieldSx = {
    mt: 1,
    "& .MuiOutlinedInput-root": {
      borderRadius: 1,
      minHeight: isMobile ? 48 : 56,
    },
    "& input": {
      paddingTop: isMobile ? 1 : 1.25,
      paddingBottom: isMobile ? 1 : 1.25,
      fontSize: isMobile ? "16px" : "inherit",
    },
    "& label": {
      fontSize: isMobile ? "0.9rem" : "1rem",
    },
    "& .MuiSelect-select": {
      paddingTop: isMobile ? 1 : 1.25,
      paddingBottom: isMobile ? 1 : 1.25,
    }
  };

  return (
    <StokCard 
      title="Penyesuaian Stok (Koreksi)" 
      subtitle="Koreksi stok untuk penyesuaian inventory"
      isMobile={isMobile}
      isTablet={isTablet}
    >
      {err && (
        <Alert
          severity="error"
          sx={{
            mb: 2,
            fontSize: isMobile ? "0.8rem" : "0.875rem",
            '& .MuiAlert-message': { overflow: "hidden" },
          }}
          onClose={() => setErr("")}
        >
          {err}
        </Alert>
      )}

      <Box component="form" onSubmit={submit} sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Stack spacing={isMobile ? 2 : 2.5} sx={{ flex: 1 }}>
          <FormControl {...FIELD_PROPS} sx={fieldSx}>
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

          <FormControl {...FIELD_PROPS} sx={fieldSx}>
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

          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              fontSize: isMobile ? "0.8rem" : "0.875rem",
              fontStyle: "italic",
              mt: -1
            }}
          >
            *Tambah stok ISI tidak diperbolehkan di sini — gunakan menu "Restok Isi"
          </Typography>

          <TextField
            {...FIELD_PROPS}
            sx={fieldSx}
            label="Jumlah Penyesuaian"
            type="number"
            inputProps={{ 
              min: 1, 
              inputMode: "numeric", 
              pattern: "[0-9]*",
            }}
            value={form.qty}
            onChange={(e) => setForm({ ...form, qty: e.target.value })}
            disabled={loading}
            placeholder="Contoh: 2"
          />

          <TextField
            {...FIELD_PROPS}
            sx={fieldSx}
            label="Tanggal Penyesuaian"
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

          <TextField
            {...FIELD_PROPS}
            sx={fieldSx}
            label="Alasan Penyesuaian (wajib)"
            multiline
            minRows={isMobile ? 2 : 3}
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            disabled={loading}
            placeholder='Contoh: "Koreksi stok - kelebihan input", "Stok hilang/rusak", dll.'
          />

          <Box sx={{ mt: "auto", pt: 2 }}>
            <Stack
              direction={isMobile ? "column-reverse" : "row"}
              spacing={isMobile ? 1.5 : 2}
              justifyContent="flex-end"
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
                size={isMobile ? "medium" : "large"}
                sx={{ 
                  textTransform: "none", 
                  minWidth: isMobile ? "100%" : 120,
                  minHeight: isMobile ? 44 : 48,
                  fontWeight: 600
                }}
              >
                Reset
              </Button>
              <Button
                variant="contained"
                type="submit"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
                size={isMobile ? "medium" : "large"}
                sx={{ 
                  textTransform: "none", 
                  minWidth: isMobile ? "100%" : 120,
                  minHeight: isMobile ? 44 : 48,
                  fontWeight: 600
                }}
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