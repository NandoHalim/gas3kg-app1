// src/components/views/RiwayatStokSection.jsx
import React from "react";
import { maxAllowedDate } from "../../utils/helpers.js";

// MUI Components - PERTAHANKAN semua imports
import {
  Box,
  Stack,
  Typography,
  Card,
  CardHeader,
  CardContent,
  Grid,
  TextField,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TableSortLabel,
  IconButton,
  CircularProgress,
  Skeleton,
  useMediaQuery,
  useTheme,
} from "@mui/material";

// Icons - PERTAHANKAN semua icons
import {
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterListIcon,
  Inventory as InventoryIcon,
  Search as SearchIcon,
  Replay as ReplayIcon,
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";

/* ========= Constants & Styles - PERTAHANKAN ========= */
const CARD_STYLES = {
  borderRadius: 3,
  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  marginBottom: 3
};

const TABLE_STYLES = {
  borderRadius: 2,
  overflow: 'hidden',
  '& .MuiTableHead-root': {
    background: 'linear-gradient(45deg, #f8fafc 30%, #f1f5f9 90%)'
  }
};

const FIELD_PROPS = { fullWidth: true, size: "medium" };
const FIELD_SX = {
  "& .MuiOutlinedInput-root": { 
    borderRadius: 2, 
    minHeight: 48,
    transition: 'all 0.2s ease',
    '&:hover': {
      boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)'
    }
  },
  "& input": { paddingTop: 1.25, paddingBottom: 1.25 },
};

const zebra = (i) => (i % 2 ? { background: "#fafafa" } : undefined);

/* ========= Komponen Shared - PERTAHANKAN ========= */

// Stok Badge Component
const StokBadge = ({ code }) => {
  const styles = {
    ISI: { bgcolor: "#e0f2fe", color: "#075985", label: "ISI" },
    KOSONG: { bgcolor: "#fff7ed", color: "#9a3412", label: "KOSONG" }
  };
  
  const style = styles[code] || { bgcolor: "#eef2ff", color: "#3730a3", label: code };
  
  return (
    <Chip
      label={style.label}
      size="small"
      sx={{ 
        bgcolor: style.bgcolor, 
        color: style.color,
        fontWeight: 600,
        fontSize: '0.75rem',
        px: 0.5
      }}
    />
  );
};

// Summary Badge Component
const SummaryBadge = ({ type, value }) => {
  const styles = {
    masuk: { bgcolor: "#dcfce7", color: "#166534", label: "Total Masuk" },
    keluar: { bgcolor: "#fee2e2", color: "#991b1b", label: "Total Keluar" }
  };
  
  const style = styles[type] || { bgcolor: "#eef2ff", color: "#3730a3", label: type };
  
  return (
    <Chip
      label={`${style.label}: ${value}`}
      variant="outlined"
      sx={{ 
        bgcolor: style.bgcolor, 
        color: style.color,
        fontWeight: 600,
        borderColor: style.color,
        borderWidth: 2
      }}
    />
  );
};

// Empty State Component
function EmptyState({ message, description, icon = "📦" }) {
  return (
    <TableRow>
      <TableCell colSpan={6}>
        <Box textAlign="center" py={6}>
          <Typography variant="h6" color="text.secondary" gutterBottom sx={{ opacity: 0.7 }}>
            {icon} {message}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.6 }}>
            {description}
          </Typography>
        </Box>
      </TableCell>
    </TableRow>
  );
}

// Pagination Component
function CustomPagination({ page, totalPages, onPageChange, pageSize, onPageSizeChange, loading }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end" flexWrap="wrap">
      <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
        Baris per halaman:
      </Typography>
      <FormControl size="small" sx={{ minWidth: 80 }}>
        <Select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          disabled={loading}
        >
          {[10, 25, 50, 100].map((n) => (
            <MenuItem key={n} value={n}>{n}</MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <Typography variant="body2" sx={{ ml: 1, minWidth: 100, textAlign: 'center' }}>
        {`Hal. ${page} dari ${totalPages}`}
      </Typography>
      
      <IconButton 
        disabled={page <= 1 || loading} 
        onClick={() => onPageChange(1)}
        size="small"
        sx={{ mx: 0.5 }}
      >
        <FirstPageIcon />
      </IconButton>
      <IconButton 
        disabled={page <= 1 || loading} 
        onClick={() => onPageChange(page - 1)}
        size="small"
        sx={{ mx: 0.5 }}
      >
        <ChevronLeftIcon />
      </IconButton>
      <IconButton 
        disabled={page >= totalPages || loading} 
        onClick={() => onPageChange(page + 1)}
        size="small"
        sx={{ mx: 0.5 }}
      >
        <ChevronRightIcon />
      </IconButton>
      <IconButton 
        disabled={page >= totalPages || loading} 
        onClick={() => onPageChange(totalPages)}
        size="small"
        sx={{ mx: 0.5 }}
      >
        <LastPageIcon />
      </IconButton>
    </Stack>
  );
}

// Filter Section Component
function FilterSection({ title, children, onReload, onReset, loading }) {
  return (
    <Card sx={CARD_STYLES}>
      <Accordion defaultExpanded sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <FilterListIcon color="primary" />
            <Typography fontWeight={600}>{title}</Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          {children}
          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2 }} flexWrap="wrap">
            <Button 
              variant="contained" 
              onClick={onReload} 
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : <ReplayIcon />}
            >
              {loading ? "Memuat…" : "Terapkan Filter"}
            </Button>
            <Button variant="outlined" onClick={onReset} disabled={loading}>
              Reset
            </Button>
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Card>
  );
}

// terjemahkan note teknis jadi "manusiawi" - PERTAHANKAN fungsi existing
function humanize(note = "") {
  const n = note.toLowerCase();
  if (n.includes("void") || n.includes("dibatalkan") || n.includes("reason"))
    return "Pembatalan (Void)";
  if (n.includes("jual") || n.includes("terjual") || n.includes("penjualan"))
    return "Penjualan";
  if (n.includes("beli") || n.includes("supplier") || n.includes("agen"))
    return "Pembelian / Dari Agen";
  if (n.includes("tukar kosong") || n.includes("restok isi"))
    return "Restok ISI (tukar kosong)";
  if (n.includes("koreksi") || n.includes("adjust"))
    return "Koreksi Stok";
  return note || "Mutasi Stok";
}

/* ========= KOMPONEN UTAMA - PRESENTATIONAL ========= */
export default function StokSection({
  // Data & State
  rows = [],
  totalRows = 0,
  loading = false,
  
  // Filter State
  filters = {
    from: "",
    to: "",
    jenis: "ALL",
    mutasi: "ALL",
    keyword: ""
  },
  
  // Pagination & Sorting
  pagination = {
    page: 1,
    pageSize: 25,
    totalPages: 1
  },
  sorting = {
    key: "tanggal",
    direction: "desc"
  },
  
  // Event Handlers
  onFilterChange = {},
  onPaginationChange = {},
  onSortChange,
  onReload,
  onExport
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Destructure handlers
  const {
    setFrom,
    setTo,
    setJenis,
    setMutasi,
    setKeyword
  } = onFilterChange;

  const {
    setPage,
    setPageSize
  } = onPaginationChange;

  // Handle sort
  const handleSort = (field) => {
    onSortChange?.(field);
  };

  // Handle reset filters
  const handleReset = () => {
    setFrom?.("");
    setTo?.("");
    setJenis?.("ALL");
    setMutasi?.("ALL");
    setKeyword?.("");
    onReload?.();
  };

  // Calculate summary totals
  const totalMasuk = rows.reduce((sum, row) => sum + (Number(row.masuk) || 0), 0);
  const totalKeluar = rows.reduce((sum, row) => sum + (Number(row.keluar) || 0), 0);

  // Apply frontend filtering for mutasi and keyword
  const filteredRows = rows.filter(row => {
    // Filter by mutasi type
    if (filters.mutasi === "MASUK" && !(row.masuk > 0)) return false;
    if (filters.mutasi === "KELUAR" && !(row.keluar > 0)) return false;
    
    // Filter by keyword
    if (filters.keyword) {
      const searchText = (row.keterangan + " " + (row.raw_note || "")).toLowerCase();
      if (!searchText.includes(filters.keyword.toLowerCase())) return false;
    }
    
    return true;
  });

  return (
    <>
      {/* Filter Section */}
      <FilterSection
        title="Filter Riwayat Stok"
        onReload={onReload}
        onReset={handleReset}
        loading={loading}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              {...FIELD_PROPS}
              sx={FIELD_SX}
              label="Dari Tanggal"
              type="date"
              value={filters.from}
              onChange={(e) => setFrom?.(e.target.value)}
              inputProps={{ min: MIN_DATE, max: maxAllowedDate() }}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              {...FIELD_PROPS}
              sx={FIELD_SX}
              label="Sampai"
              type="date"
              value={filters.to}
              onChange={(e) => setTo?.(e.target.value)}
              inputProps={{ min: MIN_DATE, max: maxAllowedDate() }}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl {...FIELD_PROPS} sx={FIELD_SX}>
              <InputLabel id="jenis-stok">Jenis Stok</InputLabel>
              <Select
                labelId="jenis-stok"
                label="Jenis Stok"
                value={filters.jenis}
                onChange={(e) => setJenis?.(e.target.value)}
              >
                <MenuItem value="ALL">Semua</MenuItem>
                <MenuItem value="ISI">Isi</MenuItem>
                <MenuItem value="KOSONG">Kosong</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl {...FIELD_PROPS} sx={FIELD_SX}>
              <InputLabel id="jenis-mutasi">Jenis Mutasi</InputLabel>
              <Select
                labelId="jenis-mutasi"
                label="Jenis Mutasi"
                value={filters.mutasi}
                onChange={(e) => setMutasi?.(e.target.value)}
              >
                <MenuItem value="ALL">Semua</MenuItem>
                <MenuItem value="MASUK">Masuk (+)</MenuItem>
                <MenuItem value="KELUAR">Keluar (−)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              {...FIELD_PROPS}
              sx={FIELD_SX}
              label="Keterangan / Kata Kunci"
              placeholder="mis: void, penjualan, agen, budi…"
              value={filters.keyword}
              onChange={(e) => setKeyword?.(e.target.value)}
            />
          </Grid>
        </Grid>
      </FilterSection>

      {/* Data Table */}
      <Card sx={CARD_STYLES}>
        <CardHeader
          title={
            <Stack direction="row" alignItems="center" spacing={1}>
              <InventoryIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>
                Riwayat Mutasi Stok
                {loading && <CircularProgress size={16} sx={{ ml: 1 }} />}
              </Typography>
            </Stack>
          }
          subheader={
            <Typography variant="body2" color="text.secondary">
              {`Menampilkan ${filteredRows.length} dari ${totalRows} data mutasi stok`}
            </Typography>
          }
          action={
            <Stack direction="row" spacing={1}>
              <SummaryBadge type="masuk" value={totalMasuk} />
              <SummaryBadge type="keluar" value={totalKeluar} />
            </Stack>
          }
        />
        <CardContent>
          <CustomPagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
            pageSize={pagination.pageSize}
            onPageSizeChange={setPageSize}
            loading={loading}
          />

          <TableContainer component={Paper} sx={TABLE_STYLES}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={sorting.key === "tanggal"}
                      direction={sorting.direction}
                      onClick={() => handleSort("tanggal")}
                    >
                      <b>📅 Tanggal & Waktu</b>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sorting.key === "code"}
                      direction={sorting.direction}
                      onClick={() => handleSort("code")}
                    >
                      <b>Jenis</b>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sorting.key === "friendly"}
                      direction={sorting.direction}
                      onClick={() => handleSort("friendly")}
                    >
                      <b>Keterangan</b>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={sorting.key === "masuk"}
                      direction={sorting.direction}
                      onClick={() => handleSort("masuk")}
                    >
                      <b>Masuk</b>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={sorting.key === "keluar"}
                      direction={sorting.direction}
                      onClick={() => handleSort("keluar")}
                    >
                      <b>Keluar</b>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={sorting.key === "sisa"}
                      direction={sorting.direction}
                      onClick={() => handleSort("sisa")}
                    >
                      <b>Sisa Stok</b>
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}>
                        <Skeleton variant="text" height={40} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : !filteredRows.length ? (
                  <EmptyState 
                    message="Tidak ada data stok" 
                    description="Tidak ada data mutasi stok yang ditemukan dengan filter saat ini"
                    icon="📦"
                  />
                ) : (
                  filteredRows.map((r, i) => (
                    <TableRow 
                      key={r.id} 
                      hover 
                      sx={{ 
                        ...zebra(i),
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: '#f8fafc',
                          transform: 'translateY(-1px)'
                        }
                      }}
                    >
                      <TableCell>{r.waktu || r.tanggal}</TableCell>
                      <TableCell>
                        <StokBadge code={r.code} />
                      </TableCell>
                      <TableCell>{humanize(r.raw_note || r.keterangan)}</TableCell>
                      <TableCell 
                        align="right" 
                        sx={{ 
                          fontWeight: r.masuk ? 600 : 'normal',
                          color: r.masuk ? "#166534" : undefined 
                        }}
                      >
                        {r.masuk || ""}
                      </TableCell>
                      <TableCell 
                        align="right" 
                        sx={{ 
                          fontWeight: r.keluar ? 600 : 'normal',
                          color: r.keluar ? "#991b1b" : undefined 
                        }}
                      >
                        {r.keluar || ""}
                      </TableCell>
                      <TableCell 
                        align="right" 
                        sx={{ fontWeight: 600 }}
                      >
                        {(r.sisa ?? "") === "" ? "-" : r.sisa}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
            *Kolom "Sisa Stok" muncul otomatis bila view <code>stock_logs_with_balance</code> tersedia.
          </Typography>
        </CardContent>
      </Card>
    </>
  );
}