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
  Paper,
  BottomNavigation,
  BottomNavigationAction,
  AppBar,
  Toolbar,
} from "@mui/material";
import {
  Inventory as InventoryIcon,
  SwapHoriz as SwapIcon,
  Adjust as AdjustIcon,
} from "@mui/icons-material";

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
    xs: 1.5,
    sm: 2,
    md: 2.5,
    lg: 3
  },
  typography: {
    h4: { xs: "1.4rem", sm: "1.6rem", md: "1.8rem", lg: "2rem" },
    h6: { xs: "1.1rem", sm: "1.2rem", md: "1.3rem", lg: "1.4rem" },
    body: { xs: "0.875rem", sm: "0.9rem", md: "0.95rem", lg: "1rem" }
  },
  dimensions: {
    buttonHeight: { xs: 48, sm: 44, md: 40 },
    inputHeight: { xs: 56, sm: 52, md: 48 },
    chipHeight: { xs: 32, sm: 32, md: 32 }
  }
};

// 🔧 Mobile field props
const MOBILE_FIELD_PROPS = { 
  fullWidth: true, 
  variant: "outlined", 
  size: "medium" 
};

// 🔧 Mobile tabs configuration - DIPINDAHKAN KE LEVEL ATAS
const MOBILE_TABS = [
  { 
    label: "Tambah Kosong", 
    icon: <InventoryIcon />, 
    component: TambahKosong,
    value: "tambah-kosong"
  },
  { 
    label: "Restok Isi", 
    icon: <SwapIcon />, 
    component: RestokIsi,
    value: "restok-isi"
  },
  { 
    label: "Penyesuaian", 
    icon: <AdjustIcon />, 
    component: PenyesuaianStok,
    value: "penyesuaian"
  },
];

export default function StokView({ stocks = {}, onSaved }) {
  const toast = useToast();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const [snap, setSnap] = useState({
    ISI: Number(stocks.ISI || 0),
    KOSONG: Number(stocks.KOSONG || 0),
  });
  
  // 🔧 FIX: Gunakan string value untuk activeTab agar lebih reliable
  const [activeTab, setActiveTab] = useState("tambah-kosong");

  useEffect(() => {
    setSnap({ ISI: Number(stocks.ISI || 0), KOSONG: Number(stocks.KOSONG || 0) });
  }, [stocks]);

  // 🔧 FIX: Cari komponen aktif berdasarkan value, bukan index
  const getActiveComponent = () => {
    const activeTabConfig = MOBILE_TABS.find(tab => tab.value === activeTab);
    return activeTabConfig ? activeTabConfig.component : TambahKosong;
  };

  const ActiveComponent = getActiveComponent();

  // Mobile header dengan stats yang lebih compact
  const MobileHeader = () => (
    <AppBar 
      position="static" 
      color="transparent" 
      elevation={0}
      sx={{ 
        backgroundColor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider'
      }}
    >
      <Toolbar sx={{ 
        minHeight: { xs: 56, sm: 64 },
        px: { xs: 2, sm: 3 } 
      }}>
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="h6"
            fontWeight={600}
            sx={{ 
              fontSize: MOBILE_CONSTANTS.typography.h4,
              color: "primary.main",
            }}
          >
            Stok
          </Typography>
        </Box>
        
        <Stack direction="row" spacing={1}>
          <Tooltip title="Tabung Isi">
            <Chip
              label={snap.ISI}
              color="success"
              size="small"
              sx={{ 
                fontWeight: 700, 
                fontSize: "0.75rem",
                minWidth: 40,
              }}
            />
          </Tooltip>
          <Tooltip title="Tabung Kosong">
            <Chip
              label={snap.KOSONG}
              color="primary"
              size="small"
              sx={{ 
                fontWeight: 700, 
                fontSize: "0.75rem",
                minWidth: 40,
              }}
            />
          </Tooltip>
        </Stack>
      </Toolbar>
    </AppBar>
  );

  // Desktop layout
  if (!isMobile) {
    return (
      <Box
        sx={{
          p: { xs: 2, sm: 3, md: 4 },
          minHeight: "100vh",
          backgroundColor: "background.default",
          maxWidth: { lg: "1400px", xl: "1600px" },
          margin: "0 auto",
        }}
      >
        {/* Desktop Header */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
          sx={{ mb: 3 }}
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

          <Stack direction="row" spacing={2}>
            <Tooltip title="Stok Tabung Isi">
              <Chip
                label={`ISI: ${snap.ISI}`}
                color="success"
                sx={{ 
                  fontWeight: 700, 
                  fontSize: "0.875rem",
                  height: MOBILE_CONSTANTS.dimensions.chipHeight,
                }}
              />
            </Tooltip>
            <Tooltip title="Stok Tabung Kosong">
              <Chip
                label={`KOSONG: ${snap.KOSONG}`}
                color="primary"
                sx={{ 
                  fontWeight: 700, 
                  fontSize: "0.875rem",
                  height: MOBILE_CONSTANTS.dimensions.chipHeight,
                }}
              />
            </Tooltip>
          </Stack>
        </Stack>

        {/* Desktop Grid */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6} lg={4}>
            <TambahKosong
              onSaved={(s) => {
                setSnap(s);
                onSaved?.(s);
              }}
              isMobile={isMobile}
            />
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <RestokIsi
              onSaved={(s) => {
                setSnap(s);
                onSaved?.(s);
              }}
              isMobile={isMobile}
            />
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <PenyesuaianStok
              onSaved={(s) => {
                setSnap(s);
                onSaved?.(s);
              }}
              isMobile={isMobile}
            />
          </Grid>
        </Grid>
      </Box>
    );
  }

  // Mobile Layout
  return (
    <Box sx={{ 
      pb: 7, // Space for bottom navigation
      minHeight: '100vh',
      backgroundColor: 'background.default'
    }}>
      <MobileHeader />
      
      {/* Main Content */}
      <Box sx={{ p: 2 }}>
        <ActiveComponent
          onSaved={(s) => {
            setSnap(s);
            onSaved?.(s);
          }}
          isMobile={isMobile}
        />
      </Box>

      {/* Bottom Navigation - FIXED: Gunakan value string */}
      <Paper 
        sx={{ 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          zIndex: 1000 
        }} 
        elevation={3}
      >
        <BottomNavigation
          value={activeTab}
          onChange={(event, newValue) => {
            console.log('Tab changed to:', newValue); // Debug log
            setActiveTab(newValue);
          }}
          showLabels
        >
          {MOBILE_TABS.map((tab) => (
            <BottomNavigationAction
              key={tab.value}
              label={tab.label}
              icon={tab.icon}
              value={tab.value}
              sx={{
                minWidth: 'auto',
                '& .MuiBottomNavigationAction-label': {
                  fontSize: '0.75rem',
                  mt: 0.5
                }
              }}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
}

/* ========== Mobile-optimized Card ========== */
function StokCard({ title, subtitle, children, isMobile }) {
  return (
    <Card 
      sx={{ 
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        boxShadow: 'none',
        mb: 2
      }}
    >
      <CardHeader
        title={
          <Typography 
            variant="h6" 
            fontWeight={600}
            sx={{ fontSize: MOBILE_CONSTANTS.typography.h6 }}
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
          px: 3,
          py: 2,
          borderBottom: 1,
          borderColor: "divider",
          backgroundColor: "background.paper"
        }}
      />
      <CardContent sx={{ 
        px: 3, 
        py: 2,
        '&:last-child': { pb: 2 }
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
    minHeight: isMobile ? MOBILE_CONSTANTS.dimensions.inputHeight.xs : MOBILE_CONSTANTS.dimensions.inputHeight.md,
    fontSize: isMobile ? '16px' : 'inherit', // Prevent zoom on iOS
  },
  '& input': {
    padding: isMobile ? '16.5px 14px' : '12px 14px',
  },
  '& textarea': {
    padding: isMobile ? '16.5px 14px' : '12px 14px',
  },
  '& label': {
    fontSize: isMobile ? MOBILE_CONSTANTS.typography.body.xs : MOBILE_CONSTANTS.typography.body.md,
  },
  '& .MuiSelect-select': {
    padding: isMobile ? '16.5px 14px' : '12px 14px',
  }
});

/* ========== Tambah Stok KOSONG - Mobile Optimized ========== */
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

/* ========== Restok ISI - Mobile Optimized ========== */
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

/* ========== Penyesuaian Stok - Mobile Optimized ========== */
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
            sx={{ display: 'block', textAlign: 'center' }}
          >
            *Tambah stok ISI tidak diperbolehkan di sini
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