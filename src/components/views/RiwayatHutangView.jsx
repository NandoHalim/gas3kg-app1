// src/components/views/RiwayatHutangView.jsx
import React, { useState } from "react";
import { fmtIDR } from "../../utils/helpers.js";

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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TableSortLabel,
  IconButton,
  CircularProgress,
  Skeleton,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";

// Icons - PERTAHANKAN semua icons
import {
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  Replay as ReplayIcon,
  WhatsApp as WhatsAppIcon,
  PriceCheck as PaidIcon,
  FilterList as FilterListIcon,
  CreditCard as CreditCardIcon,
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  FileDownload as FileDownloadIcon,
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

// Status Chip Component
function StatusChip({ status }) {
  const styles = {
    HUTANG: { bgcolor: "#fef3c7", color: "#92400e", label: "HUTANG" },
  };
  
  const style = styles[status] || { bgcolor: "#eef2ff", color: "#3730a3", label: status };
  
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
}

// Empty State Component
function EmptyState({ message, description, icon = "💰" }) {
  return (
    <TableRow>
      <TableCell colSpan={7}>
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

// Detail Row Component
function Row({ label, value }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" py={0.5}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body1" fontWeight={600}>{value}</Typography>
    </Stack>
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
          onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
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
        onClick={() => onPageChange?.(1)}
        size="small"
        sx={{ mx: 0.5 }}
      >
        <FirstPageIcon />
      </IconButton>
      <IconButton 
        disabled={page <= 1 || loading} 
        onClick={() => onPageChange?.(page - 1)}
        size="small"
        sx={{ mx: 0.5 }}
      >
        <ChevronLeftIcon />
      </IconButton>
      <IconButton 
        disabled={page >= totalPages || loading} 
        onClick={() => onPageChange?.(page + 1)}
        size="small"
        sx={{ mx: 0.5 }}
      >
        <ChevronRightIcon />
      </IconButton>
      <IconButton 
        disabled={page >= totalPages || loading} 
        onClick={() => onPageChange?.(totalPages)}
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

/* ========= KOMPONEN UTAMA - PRESENTATIONAL ========= */
export default function HutangSection({
  // Data & State
  rows = [],
  totalRows = 0,
  totalHutang = 0,
  loading = false,
  
  // Filter State - PERBAHI: ganti nama prop jadi filterValues
  filterValues = {
    query: "",
    status: "BELUM_LUNAS"
  },
  
  // Pagination & Sorting
  pagination = {
    page: 1,
    pageSize: 25,
    totalPages: 1
  },
  sorting = {
    key: "created_at", 
    direction: "desc"
  },
  
  // Event Handlers - PERBAHI: struktur handler
  onFilterChange = {},
  onPaginationChange = {},
  onSortChange,
  onReload,
  onExport,
  onPayOpen,
  onWhatsApp
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Local state untuk dialog bayar hutang
  const [paying, setPaying] = useState(null);
  const [payLoading, setPayLoading] = useState(false);

  // Handle sort
  const handleSort = (field) => {
    onSortChange?.(field);
  };

  // Handle reset filters - PERBAHI: panggil handler yang benar
  const handleReset = () => {
    onFilterChange?.onQueryChange?.("");
    onFilterChange?.onStatusChange?.("BELUM_LUNAS");
    // Tunggu sebentar lalu reload
    setTimeout(() => {
      onReload?.();
    }, 100);
  };

  // Handle bayar hutang - PERBAHI: panggil handler dari parent
  const handlePay = async () => {
    if (!paying) return;
    
    setPayLoading(true);
    try {
      // Panggil handler dari parent dengan data yang diperlukan
      await onPayOpen?.({
        id: paying.id,
        customer: paying.customer,
        total: paying.total,
        created_at: paying.created_at,
        invoice: paying.invoice,
      });
      setPaying(null);
    } catch (error) {
      console.error("Gagal membayar hutang:", error);
    } finally {
      setPayLoading(false);
    }
  };

  // Handle WhatsApp - PERBAHI: panggil handler dari parent
  const handleWhatsApp = (customer, total) => {
    const waUrl = onWhatsApp?.(customer, total);
    if (waUrl) {
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      {/* Filter Section */}
      <FilterSection
        title="Filter Hutang"
        onReload={onReload}
        onReset={handleReset}
        loading={loading}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <TextField
              {...FIELD_PROPS}
              sx={FIELD_SX}
              label="Pencarian Pelanggan / Invoice"
              placeholder="Nama pelanggan atau nomor invoice"
              value={filterValues.query}
              onChange={(e) => onFilterChange?.onQueryChange?.(e.target.value)}               InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl {...FIELD_PROPS} sx={FIELD_SX}>
              <InputLabel id="status-filter">Status Hutang</InputLabel>
              <Select
                labelId="status-filter"
                label="Status Hutang"
                value={filterValues.status}
                onChange={(e) => onFilterChange?.onStatusChange?.(e.target.value)}              >
                <MenuItem value="BELUM_LUNAS">Belum Lunas</MenuItem>
                <MenuItem value="SEMUA">Semua Status</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
          Menampilkan transaksi dengan metode <b>HUTANG</b> & status belum lunas / tidak dibatalkan.
        </Typography>
      </FilterSection>

      {/* Data Table */}
      <Card sx={CARD_STYLES}>
        <CardHeader
          title={
            <Stack direction="row" alignItems="center" spacing={1}>
              <CreditCardIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>
                Daftar Hutang
                {loading && <CircularProgress size={16} sx={{ ml: 1 }} />}
              </Typography>
            </Stack>
          }
          subheader={
            <Typography variant="body2" color="text.secondary">
              {`Menampilkan ${rows.length} dari ${totalRows} data hutang`}
            </Typography>
          }
          action={
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                variant="outlined"
                onClick={onExport}
                startIcon={<FileDownloadIcon />}
                disabled={loading}
                size="small"
              >
                Ekspor
              </Button>
              <Chip 
                label={`Total: ${fmtIDR(totalHutang)}`}
                color="warning" 
                variant="filled"
                sx={{ fontWeight: 600, fontSize: '0.875rem', px: 2 }}
              />
            </Stack>
          }
        />
        <CardContent>
          <CustomPagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={onPaginationChange?.onPageChange} 
            pageSize={pagination.pageSize}
            onPageSizeChange={onPaginationChange?.onPageSizeChange} 
            loading={loading}
          />

          <TableContainer component={Paper} sx={TABLE_STYLES}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={sorting.key === "created_at"}
                      direction={sorting.direction}
                      onClick={() => handleSort("created_at")}
                    >
                      <b>📅 Tanggal</b>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sorting.key === "customer"}
                      direction={sorting.direction}
                      onClick={() => handleSort("customer")}
                    >
                      <b>Pelanggan</b>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                    <TableSortLabel
                      active={sorting.key === "qty"}
                      direction={sorting.direction}
                      onClick={() => handleSort("qty")}
                    >
                      <b>Qty</b>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    <TableSortLabel
                      active={sorting.key === "price"}
                      direction={sorting.direction}
                      onClick={() => handleSort("price")}
                    >
                      <b>Harga</b>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={sorting.key === "total"}
                      direction={sorting.direction}
                      onClick={() => handleSort("total")}
                    >
                      <b>Total Hutang</b>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="center"><b>Aksi</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7}>
                        <Skeleton variant="text" height={40} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : !rows.length ? (
                  <EmptyState 
                    message="Tidak ada hutang" 
                    description="Tidak ada data hutang yang ditemukan dengan filter saat ini"
                    icon="💰"
                  />
                ) : (
                  rows.map((r, i) => (
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
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        {(r.created_at || "").slice(0, 10)}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <StatusChip status="HUTANG" />
                          <Typography fontWeight={600}>{r.customer || "PUBLIC"}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                        {r.qty}
                      </TableCell>
                      <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        {fmtIDR(r.price)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: 'error.main' }}>
                        {fmtIDR(r.total)}
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                          <Tooltip title="Ingatkan via WhatsApp">
                            <IconButton
                              color="success"
                              onClick={() => handleWhatsApp(r.customer, r.total)} 
                              size="small"
                              sx={{ 
                                bgcolor: '#25D366', 
                                color: 'white',
                                '&:hover': { bgcolor: '#128C7E' }
                              }}
                            >
                              <WhatsAppIcon />
                            </IconButton>
                          </Tooltip>
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<PaidIcon />}
                            onClick={() => setPaying({ /* PERBAHI: set local state dulu */
                              id: r.id,
                              customer: r.customer,
                              total: r.total,
                              created_at: r.created_at,
                              invoice: r.invoice || r.id,
                            })}
                            sx={{ minWidth: 100 }}
                          >
                            Bayar
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Dialog Bayar Hutang */}
      <Dialog open={!!paying} onClose={() => !payLoading && setPaying(null)} fullWidth maxWidth="sm">
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <PaidIcon color="primary" />
            <span>Bayar Hutang</span>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {paying ? (
            <Stack spacing={2}>
              <Row label="No. Invoice" value={paying.invoice || paying.id} />
              <Row label="Pelanggan" value={paying.customer || "PUBLIC"} />
              <Row label="Tanggal Transaksi" value={(paying.created_at || "").slice(0, 10)} />
              <Divider />
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1 }}>
                <Typography variant="h6">Total Tagihan</Typography>
                <Typography variant="h5" color="error.main" fontWeight={700}>
                  {fmtIDR(paying.total)}
                </Typography>
              </Stack>
              <Alert severity="info" sx={{ mt: 1 }}>
                Nominal pembayaran <b>dikunci</b> sama dengan total tagihan. Transaksi akan
                ditandai <b>LUNAS</b> setelah pembayaran.
              </Alert>
            </Stack>
          ) : (
            <Box sx={{ py: 3, display: "grid", placeItems: "center" }}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            variant="outlined" 
            onClick={() => setPaying(null)} 
            disabled={payLoading}
          >
            Batal
          </Button>
          <Button 
            variant="contained" 
            onClick={handlePay} 
            disabled={payLoading}
            startIcon={payLoading ? <CircularProgress size={16} /> : <PaidIcon />}
            sx={{ minWidth: 120 }}
          >
            {payLoading ? "Menyimpan…" : "Bayar Hutang"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}