// src/components/views/RiwayatSections.jsx
import React from "react";
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TableSortLabel,
  IconButton,
  CircularProgress,
  Skeleton,
  Tooltip,
  Divider,
  useMediaQuery,
  useTheme,
} from "@mui/material";

// Icons - PERTAHANKAN semua icons
import {
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterListIcon,
  ReceiptLong as ReceiptLongIcon,
  Search as SearchIcon,
  Replay as ReplayIcon,
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
    LUNAS: { bgcolor: "#dcfce7", color: "#166534", label: "LUNAS" },
    BELUM: { bgcolor: "#fef3c7", color: "#92400e", label: "BELUM" },
    DIBATALKAN: { bgcolor: "#f3f4f6", color: "#374151", label: "DIBATALKAN" },
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
        px: 0.5,
        minWidth: 80
      }}
    />
  );
}

// Empty State Component
function EmptyState({ message, description, icon = "📊" }) {
  return (
    <TableRow>
      <TableCell colSpan={9}>
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
export default function TransaksiSection({
  // Data & State
  rows = [],
  totalRows = 0,
  loading = false,
  
  // Filter State - PERBAHI: ganti nama prop jadi filterValues
  filterValues = {
    from: "",
    to: "",
    method: "ALL",
    status: "ALL", 
    cashier: "",
    query: ""
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
  onDetailOpen,
  onVoidOpen
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Handle sort
  const handleSort = (field) => {
    onSortChange?.(field);
  };

  // Handle reset filters - PERBAHI: panggil handler yang benar
  const handleReset = () => {
    onFilterChange?.onFromChange?.("");
    onFilterChange?.onToChange?.("");
    onFilterChange?.onMethodChange?.("ALL");
    onFilterChange?.onStatusChange?.("ALL");
    onFilterChange?.onCashierChange?.("");
    onFilterChange?.onQueryChange?.("");
    // Tunggu sebentar lalu reload
    setTimeout(() => {
      onReload?.();
    }, 100);
  };

   // Can void logic - PERBAIKAN: izinkan void untuk semua transaksi kecuali yang sudah DIBATALKAN
const canVoid = (row) => {
  return (row.status || "").toUpperCase() !== "DIBATALKAN";
};

  return (
    <>
      {/* Filter Section */}
      <FilterSection
        title="Filter Transaksi"
        onReload={onReload}
        onReset={handleReset}
        loading={loading}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <TextField
              {...FIELD_PROPS}
              sx={FIELD_SX}
              label="Dari Tanggal"
              type="date"
              value={filterValues.from}
              onChange={(e) => onFilterChange?.onFromChange?.(e.target.value)}              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <TextField
              {...FIELD_PROPS}
              sx={FIELD_SX}
              label="Sampai"
              type="date"
              value={filterValues.to}
              onChange={(e) => onFilterChange?.onToChange?.(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <FormControl {...FIELD_PROPS} sx={FIELD_SX}>
              <InputLabel id="method">Metode Bayar</InputLabel>
              <Select 
                labelId="method" 
                label="Metode Bayar" 
                value={filterValues.method} 
                onChange={(e) => onFilterChange?.onMethodChange?.(e.target.value)} 
              >
                <MenuItem value="ALL">Semua</MenuItem>
                <MenuItem value="TUNAI">TUNAI</MenuItem>
                <MenuItem value="HUTANG">HUTANG</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <FormControl {...FIELD_PROPS} sx={FIELD_SX}>
              <InputLabel id="status">Status Bayar</InputLabel>
              <Select 
                labelId="status" 
                label="Status Bayar" 
                value={filterValues.status} 
                onChange={(e) => onFilterChange?.onStatusChange?.(e.target.value)} 
              >
                <MenuItem value="ALL">Semua</MenuItem>
                <MenuItem value="LUNAS">LUNAS</MenuItem>
                <MenuItem value="BELUM">BELUM</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <TextField
              {...FIELD_PROPS}
              sx={FIELD_SX}
              label="Kasir"
              placeholder="Nama kasir"
              value={filterValues.cashier}
              onChange={(e) => onFilterChange?.onCashierChange?.(e.target.value)} 
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <TextField
              {...FIELD_PROPS}
              sx={FIELD_SX}
              label="Pencarian"
              placeholder="Invoice/Nama"
              value={filterValues.query}
              onChange={(e) => onFilterChange?.onQueryChange?.(e.target.value)} 
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />,
              }}
            />
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
              <ReceiptLongIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>
                Riwayat Transaksi
                {loading && <CircularProgress size={16} sx={{ ml: 1 }} />}
              </Typography>
            </Stack>
          }
          subheader={
            <Typography variant="body2" color="text.secondary">
              {`Menampilkan ${rows.length} dari ${totalRows} transaksi`}
            </Typography>
          }
          action={
            <Button
              variant="outlined"
              onClick={onExport}
              startIcon={<FileDownloadIcon />}
              disabled={loading}
            >
              Ekspor Excel
            </Button>
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
                      active={sorting.key === "id"}
                      direction={sorting.direction}
                      onClick={() => handleSort("id")}
                    >
                      <b>No. Invoice</b>
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
                  <TableCell align="right">
                    <TableSortLabel
                      active={sorting.key === "qty"}
                      direction={sorting.direction}
                      onClick={() => handleSort("qty")}
                    >
                      <b>Qty</b>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={sorting.key === "total"}
                      direction={sorting.direction}
                      onClick={() => handleSort("total")}
                    >
                      <b>Total</b>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sorting.key === "method"}
                      direction={sorting.direction}
                      onClick={() => handleSort("method")}
                    >
                      <b>Metode</b>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <b>Status</b>
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                    <b>Kasir</b>
                  </TableCell>
                  <TableCell align="center"><b>Aksi</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={9}>
                        <Skeleton variant="text" height={40} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : !rows.length ? (
                  <EmptyState 
                    message="Tidak ada transaksi" 
                    description="Tidak ada data transaksi yang ditemukan dengan filter saat ini"
                    icon="📊"
                  />
                ) : (
                  rows.map((r, i) => {
                    const dim = (r.status || "").toUpperCase() === "DIBATALKAN" ? 0.75 : 1;
                    const invoiceDisplay = r.invoice_display || `PLP/${String(r.created_at || "").slice(0,4)}/${String(r.created_at || "").slice(5,7)}/${String(r.id).padStart(3,"0")}`;
                    
                    return (
                      <TableRow 
                        key={r.id} 
                        hover 
                        sx={{ 
                          ...zebra(i),
                          opacity: dim,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: '#f8fafc',
                            transform: 'translateY(-1px)'
                          }
                        }}
                      >
                        <TableCell>{String(r.created_at || "").slice(0, 10)}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{invoiceDisplay}</TableCell>
                        <TableCell>{r.customer || "PUBLIC"}</TableCell>
                        <TableCell align="right">{r.qty}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          {fmtIDR((Number(r.qty) || 0) * (Number(r.price) || 0))}
                        </TableCell>
                        <TableCell>{r.method}</TableCell>
                        <TableCell>
                          <StatusChip status={r.status} />
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                          {r.kasir || r.cashier || "-"}
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                            <Button 
                              size="small" 
                              variant="outlined" 
                              onClick={() => onDetailOpen?.(r)} 
                            >
                              Detail
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              disabled={!canVoid(r)}
                              onClick={() => onVoidOpen?.(r)} 
                            >
                              Void
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </>
  );
}