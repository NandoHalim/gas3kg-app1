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
  Divider,
} from "@mui/material";

// 🔧 Mobile-first responsive hook
const useResponsive = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  
  return { isMobile, isTablet, isDesktop };
};

// 🔧 Mobile-optimized constants
const MOBILE_CONSTANTS = {
  spacing: {
    xs: 2,
    sm: 2.5,
    md: 3,
    lg: 3
  },
  typography: {
    h4: { xs: "1.5rem", sm: "1.75rem", md: "2rem", lg: "2.25rem" },
    h5: { xs: "1.25rem", sm: "1.4rem", md: "1.5rem", lg: "1.6rem" },
    body: { xs: "0.875rem", sm: "0.9rem", md: "1rem", lg: "1rem" }
  },
  dimensions: {
    buttonHeight: { xs: 48, sm: 44, md: 40 },
    inputHeight: { xs: 56, sm: 52, md: 48 },
    chipHeight: { xs: 36, sm: 32, md: 32 }
  }
};

// 🔧 Mobile field props
const MOBILE_FIELD_PROPS = { 
  fullWidth: true, 
  variant: "outlined", 
  size: "medium" 
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

  // Untuk semua device, gunakan single column layout yang konsisten
  const getContainerPadding = () => {
    if (isMobile) return { xs: 2, sm: 3 };
    return { xs: 2, sm: 3, md: 4 };
  };

  const getContentWidth = () => {
    if (isMobile) return "100%";
    if (isTablet) return "90%";
    return "100%";
  };

  const getMaxWidth = () => {
    if (isMobile) return "100%";
    if (isTablet) return "800px";
    return "1200px";
  };

  return (
    <Box
      sx={{
        p: getContainerPadding(),
        minHeight: "100vh",
        backgroundColor: "background.default",
        maxWidth: getMaxWidth(),
        margin: "0 auto",
        width: getContentWidth(),
      }}
    >
      {/* Header yang konsisten untuk semua device */}
      <Stack
        direction={isMobile ? "column" : "row"}
        alignItems={isMobile ? "flex-start" : "center"}
        justifyContent="space-between"
        spacing={isMobile ? 2 : 3}
        sx={{ 
          mb: MOBILE_CONSTANTS.spacing.xs,
          pb: 2,
          borderBottom: 1,
          borderColor: "divider"
        }}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{ 
              fontSize: MOBILE_CONSTANTS.typography.h4,
              color: "primary.main",
              mb: 0.5
            }}
          >
            Manajemen Stok
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontSize: MOBILE_CONSTANTS.typography.body }}
          >
            Kelola stok tabung LPG dengan mudah
          </Typography>
        </Box>

        <Stack 
          direction="row" 
          spacing={2}
          sx={{
            width: isMobile ? "100%" : "auto"
          }}
        >
          <Tooltip title="Stok Tabung Isi">
            <Chip
              label={`ISI: ${snap.ISI}`}
              color="success"
              sx={{ 
                fontWeight: 700, 
                fontSize: { xs: "0.8rem", sm: "0.875rem" },
                height: MOBILE_CONSTANTS.dimensions.chipHeight.xs,
                minWidth: { xs: 80, sm: 100 }
              }}
            />
          </Tooltip>
          <Tooltip title="Stok Tabung Kosong">
            <Chip
              label={`KOSONG: ${snap.KOSONG}`}
              color="primary"
              sx={{ 
                fontWeight: 700, 
                fontSize: { xs: "0.8rem", sm: "0.875rem" },
                height: MOBILE_CONSTANTS.dimensions.chipHeight.xs,
                minWidth: { xs: 90, sm: 110 }
              }}
            />
          </Tooltip>
        </Stack>
      </Stack>

      {/* Single Column Layout untuk semua device */}
      <Stack spacing={MOBILE_CONSTANTS.spacing.xs}>
        <TambahKosong
          onSaved={(s) => {
            setSnap(s);
            onSaved?.(s);
          }}
          isMobile={isMobile}
        />
        
        <Divider sx={{ my: 1 }} />
        
        <RestokIsi
          onSaved={(s) => {
            setSnap(s);
            onSaved?.(s);
          }}
          isMobile={isMobile}
        />
        
        <Divider sx={{ my: 1 }} />
        
        <PenyesuaianStok
          onSaved={(s) => {
            setSnap(s);
            onSaved?.(s);
          }}
          isMobile={isMobile}
        />
      </Stack>
    </Box>
  );
}

/* ========== Mobile-optimized Card ========== */
function StokCard({ title, subtitle, children, isMobile }) {
  return (
    <Card 
      sx={{ 
        width: "100%",
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        boxShadow: 'none',
        backgroundColor: 'background.paper'
      }}
    >
      <CardHeader
        title={
          <Typography 
            variant="h5" 
            fontWeight={600}
            sx={{ 
              fontSize: MOBILE_CONSTANTS.typography.h5,
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
            sx={{ fontSize: MOBILE_CONSTANTS.typography.body }}
          >
            {subtitle}
          </Typography>
        }
        sx={{
          px: { xs: 2, sm: 3 },
          py: { xs: 2, sm: 2.5 },
          borderBottom: 1,
          borderColor: "divider",
          '& .MuiCardHeader-content': {
            width: '100%'
          }
        }}
      />
      <CardContent sx={{ 
        px: { xs: 2, sm: 3 }, 
        py: { xs: 2, sm: 3 },
        '&:last-child': { pb: { xs: 2, sm: 3 } }
      }}>
        {children}
      </CardContent>
    </Card>
  );
}

/* ========== Mobile-optimized Field Styles ========== */
const getFieldStyles = (isMobile) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 1,
    minHeight: isMobile ? MOBILE_CONSTANTS.dimensions.inputHeight.xs : MOBILE_CONSTANTS.dimensions.inputHeight.sm,
  },
  '& input': {
    padding: isMobile ? '14.5px 14px' : '12.5px 14px',
    fontSize: isMobile ? '16px' : 'inherit',
  },
  '& textarea': {
    padding: isMobile ? '14.5px 14px' : '12.5px 14px',
    fontSize: isMobile ? '16px' : 'inherit',
  },
  '& label': {
    fontSize: isMobile ? '0.9rem' : '1rem',
  },
  '& .MuiSelect-select': {
    padding: isMobile ? '14.5px 14px' : '12.5px 14px',
    fontSize: isMobile ? '16px' : 'inherit',
  }
});

/* ========== Tambah Stok KOSONG ========== */
function TambahKosong({ onSaved, isMobile }) {
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
      toast?.show?.({ type: "success", message: `+${qtyNum} tabung kosong ditambah` });
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

  return (
    <StokCard 
      title="Tambah Stok Kosong" 
      subtitle="Tambahkan tabung kosong ke inventory"
      isMobile={isMobile}
    >
      {err && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => setErr("")}
        >
          {err}
        </Alert>
      )}

      <Box component="form" onSubmit={submit}>
        <Stack spacing={2.5}>
          <TextField
            {...MOBILE_FIELD_PROPS}
            sx={getFieldStyles(isMobile)}
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
            placeholder="0"
          />

          <TextField
            {...MOBILE_FIELD_PROPS}
            sx={getFieldStyles(isMobile)}
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
            {...MOBILE_FIELD_PROPS}
            sx={getFieldStyles(isMobile)}
            label="Catatan (opsional)"
            multiline
            rows={2}
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            disabled={loading}
            placeholder="Titip pelanggan, pembelian baru, dll."
          />

          <Stack
            direction="row"
            spacing={2}
          >
            <Button
              variant="outlined"
              type="button"
              onClick={() => setForm({ qty: "", date: todayStr(), note: "" })}
              disabled={loading}
              size="large"
              sx={{ 
                flex: 1,
                textTransform: "none", 
                minHeight: MOBILE_CONSTANTS.dimensions.buttonHeight.xs,
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
              size="large"
              sx={{ 
                flex: 2,
                textTransform: "none", 
                minHeight: MOBILE_CONSTANTS.dimensions.buttonHeight.xs,
                fontWeight: 600
              }}
            >
              {loading ? "Menyimpan..." : "Simpan"}
            </Button>
          </Stack>
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
        message: `+${qtyNum} tabung isi (tukar kosong)`,
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
    <StokCard 
      title="Restok Isi" 
      subtitle="Tukar tabung kosong dengan tabung isi"
      isMobile={isMobile}
    >
      {err && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => setErr("")}
        >
          {err}
        </Alert>
      )}

      <Box component="form" onSubmit={submit}>
        <Stack spacing={2.5}>
          <TextField
            {...MOBILE_FIELD_PROPS}
            sx={getFieldStyles(isMobile)}
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
            placeholder="0"
          />

          <TextField
            {...MOBILE_FIELD_PROPS}
            sx={getFieldStyles(isMobile)}
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
            {...MOBILE_FIELD_PROPS}
            sx={getFieldStyles(isMobile)}
            label="Catatan (opsional)"
            multiline
            rows={2}
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            disabled={loading}
            placeholder="Tukar kosong di agen, pengisian rutin, dll."
          />

          <Stack
            direction="row"
            spacing={2}
          >
            <Button
              variant="outlined"
              type="button"
              onClick={() => setForm({ qty: "", date: todayStr(), note: "" })}
              disabled={loading}
              size="large"
              sx={{ 
                flex: 1,
                textTransform: "none", 
                minHeight: MOBILE_CONSTANTS.dimensions.buttonHeight.xs,
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
              size="large"
              sx={{ 
                flex: 2,
                textTransform: "none", 
                minHeight: MOBILE_CONSTANTS.dimensions.buttonHeight.xs,
                fontWeight: 600
              }}
            >
              {loading ? "Menyimpan..." : "Tukar"}
            </Button>
          </Stack>
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
        message: `Penyesuaian ${form.code} ${delta > 0 ? '+' : ''}${delta} berhasil`,
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

  return (
    <StokCard 
      title="Penyesuaian Stok" 
      subtitle="Koreksi stok untuk penyesuaian inventory"
      isMobile={isMobile}
    >
      {err && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => setErr("")}
        >
          {err}
        </Alert>
      )}

      <Box component="form" onSubmit={submit}>
        <Stack spacing={2.5}>
          <FormControl {...MOBILE_FIELD_PROPS} sx={getFieldStyles(isMobile)}>
            <InputLabel>Jenis Stok</InputLabel>
            <Select
              label="Jenis Stok"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              disabled={loading}
            >
              <MenuItem value="ISI">Tabung Isi</MenuItem>
              <MenuItem value="KOSONG">Tabung Kosong</MenuItem>
            </Select>
          </FormControl>

          <FormControl {...MOBILE_FIELD_PROPS} sx={getFieldStyles(isMobile)}>
            <InputLabel>Arah Penyesuaian</InputLabel>
            <Select
              label="Arah Penyesuaian"
              value={form.dir}
              onChange={(e) => setForm({ ...form, dir: e.target.value })}
              disabled={loading}
            >
              <MenuItem value="IN">Masuk (+)</MenuItem>
              <MenuItem value="OUT">Keluar (−)</MenuItem>
            </Select>
          </FormControl>

          <TextField
            {...MOBILE_FIELD_PROPS}
            sx={getFieldStyles(isMobile)}
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
            placeholder="0"
          />

          <TextField
            {...MOBILE_FIELD_PROPS}
            sx={getFieldStyles(isMobile)}
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
            {...MOBILE_FIELD_PROPS}
            sx={getFieldStyles(isMobile)}
            label="Alasan Penyesuaian"
            multiline
            rows={2}
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            disabled={loading}
            placeholder="Koreksi stok, stok hilang/rusak, dll."
            required
          />

          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ display: 'block', textAlign: 'center', fontStyle: 'italic' }}
          >
            *Tambah stok ISI tidak diperbolehkan di sini - gunakan menu "Restok Isi"
          </Typography>

          <Stack
            direction="row"
            spacing={2}
          >
            <Button
              variant="outlined"
              type="button"
              onClick={() => setForm({
                code: "KOSONG",
                dir: "OUT",
                qty: "",
                date: todayStr(),
                reason: "",
              })}
              disabled={loading}
              size="large"
              sx={{ 
                flex: 1,
                textTransform: "none", 
                minHeight: MOBILE_CONSTANTS.dimensions.buttonHeight.xs,
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
              size="large"
              sx={{ 
                flex: 2,
                textTransform: "none", 
                minHeight: MOBILE_CONSTANTS.dimensions.buttonHeight.xs,
                fontWeight: 600
              }}
            >
              {loading ? "Menyimpan..." : "Simpan"}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </StokCard>
  );
}