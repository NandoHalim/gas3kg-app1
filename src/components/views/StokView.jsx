// src/components/views/NamaMenuView.jsx
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";

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

export default function NamaMenuView({ initialData = {}, onSaved }) {
  const toast = useToast();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const getSpacing = () => {
    if (isMobile) return RESPONSIVE_CONSTANTS.spacing.mobile;
    if (isTablet) return RESPONSIVE_CONSTANTS.spacing.tablet;
    return RESPONSIVE_CONSTANTS.spacing.desktop;
  };

  const getGridColumns = () => {
    if (isMobile) return 12;
    if (isTablet) return 6;
    return 4;
  };

  // Contoh function untuk handle actions
  const handleAction = async (action, itemId) => {
    try {
      setLoading(true);
      // Implementasi action sesuai kebutuhan
      toast?.show?.({ type: "success", message: "Aksi berhasil dilakukan" });
    } catch (error) {
      toast?.show?.({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
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
      {/* Header */}
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
            Nama Menu
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontSize: RESPONSIVE_CONSTANTS.typography.body }}
          >
            Deskripsi singkat tentang menu ini
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
          <Tooltip title="Statistik 1">
            <Chip
              label="Stat: 100"
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
          <Tooltip title="Statistik 2">
            <Chip
              label="Stat: 50"
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

      {/* Grid Layout untuk Form dan Data */}
      <Grid container spacing={3}>
        {/* Form Section */}
        <Grid item xs={12} lg={6}>
          <FormSection
            onSaved={(newData) => {
              setData(newData);
              onSaved?.(newData);
            }}
            isMobile={isMobile}
            isTablet={isTablet}
            loading={loading}
          />
        </Grid>

        {/* Data List Section */}
        <Grid item xs={12} lg={6}>
          <DataListSection
            data={data}
            onAction={handleAction}
            isMobile={isMobile}
            loading={loading}
          />
        </Grid>
      </Grid>
    </Stack>
  );
}

/* ========== Komponen Form ========== */
function FormSection({ onSaved, isMobile, isTablet, loading }) {
  const toast = useToast();
  const [form, setForm] = useState({
    field1: "",
    field2: "",
    date: todayStr(),
    note: ""
  });
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    
    // Validasi form
    if (!form.field1.trim()) return setErr("Field 1 wajib diisi");

    try {
      setErr("");
      // Panggil service yang sesuai
      // const result = await DataService.namaFunction(form);
      toast?.show?.({ type: "success", message: "Data berhasil disimpan" });
      setForm({ field1: "", field2: "", date: todayStr(), note: "" });
      onSaved?.(/* data baru */);
    } catch (error) {
      const msg = error.message || "Gagal menyimpan data";
      setErr(msg);
      toast?.show?.({ type: "error", message: msg });
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
      title="Tambah Data Baru" 
      subtitle="Form untuk menambah data baru"
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
            label="Field 1"
            value={form.field1}
            onChange={(e) => setForm({ ...form, field1: e.target.value })}
            disabled={loading}
            placeholder="Contoh: Value 1"
          />

          <FormControl {...FIELD_PROPS} sx={fieldSx}>
            <InputLabel id="field2-label">Field 2</InputLabel>
            <Select
              labelId="field2-label"
              label="Field 2"
              value={form.field2}
              onChange={(e) => setForm({ ...form, field2: e.target.value })}
              disabled={loading}
            >
              <MenuItem value="option1">Option 1</MenuItem>
              <MenuItem value="option2">Option 2</MenuItem>
              <MenuItem value="option3">Option 3</MenuItem>
            </Select>
          </FormControl>

          <TextField
            {...FIELD_PROPS}
            sx={fieldSx}
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

          <TextField
            {...FIELD_PROPS}
            sx={fieldSx}
            label="Catatan"
            multiline
            minRows={isMobile ? 2 : 3}
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            disabled={loading}
            placeholder="Masukkan catatan..."
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
                onClick={() => setForm({ field1: "", field2: "", date: todayStr(), note: "" })}
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

/* ========== Komponen Data List ========== */
function DataListSection({ data, onAction, isMobile, loading }) {
  return (
    <StokCard 
      title="Daftar Data" 
      subtitle="List data yang telah tersimpan"
      isMobile={isMobile}
      isTablet={isMobile}
    >
      <TableContainer 
        component={Paper} 
        sx={{ 
          maxHeight: isMobile ? 400 : 500,
          borderRadius: 1
        }}
      >
        <Table stickyHeader size={isMobile ? "small" : "medium"}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, fontSize: isMobile ? "0.8rem" : "0.875rem" }}>
                Field 1
              </TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: isMobile ? "0.8rem" : "0.875rem" }}>
                Field 2
              </TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: isMobile ? "0.8rem" : "0.875rem" }}>
                Aksi
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Contoh data */}
            <TableRow>
              <TableCell sx={{ fontSize: isMobile ? "0.8rem" : "0.875rem" }}>
                Data 1
              </TableCell>
              <TableCell sx={{ fontSize: isMobile ? "0.8rem" : "0.875rem" }}>
                Option 1
              </TableCell>
              <TableCell>
                <Stack direction="row" spacing={1}>
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => onAction("edit", 1)}>
                      <EditIcon fontSize={isMobile ? "small" : "medium"} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Hapus">
                    <IconButton size="small" onClick={() => onAction("delete", 1)}>
                      <DeleteIcon fontSize={isMobile ? "small" : "medium"} />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* Empty State */}
      {(!data || data.length === 0) && (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            Belum ada data
          </Typography>
        </Box>
      )}
    </StokCard>
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