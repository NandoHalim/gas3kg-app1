// src/components/views/RiwayatHutangView.jsx
import React, { useEffect, useMemo, useState } from "react";
import { DataService } from "../../services/DataService.js";
import { useToast } from "../../context/ToastContext.jsx";
import { fmtIDR } from "../../utils/helpers.js";

// MUI Components
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

// Icons
import {
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  Replay as ReplayIcon,
  WhatsApp as WhatsAppIcon,
  PriceCheck as PaidIcon,
  FilterList as FilterListIcon,
  CreditCard as CreditCardIcon,
} from "@mui/icons-material";

/* =========
   Constants & Styles
   ========= */
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

export default function RiwayatHutangView() {
  const toast = useToast();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("BELUM_LUNAS"); // BELUM_LUNAS | SEMUA
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // Dialog bayar hutang
  const [paying, setPaying] = useState(null);
  const payingTotal = Number(paying?.total || 0);

  // Sorting & Pagination
  const [sortKey, setSortKey] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);

  const setSort = (f) =>
    sortKey === f ? setSortDir((d) => (d === "asc" ? "desc" : "asc")) : (setSortKey(f), setSortDir("asc"));

  const load = async () => {
    try {
      setLoading(true);
      const data = await DataService.getDebts({ 
        query: q, 
        limit: 300,
        status: statusFilter === "BELUM_LUNAS" ? "BELUM_LUNAS" : undefined
      });
      setRows(data || []);
    } catch (e) {
      toast?.show?.({ type: "error", message: e.message || "Gagal memuat hutang" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtered and sorted data
  const filteredRows = useMemo(() => {
    let data = [...rows];
    
    // Apply status filter
    if (statusFilter === "BELUM_LUNAS") {
      data = data.filter(r => (r.status || "").toUpperCase() !== "LUNAS");
    }

    return data;
  }, [rows, statusFilter]);

  // Sorted data
  const sortedRows = useMemo(() => {
    const data = [...filteredRows];
    const key = sortKey;
    const dir = sortDir === "asc" ? 1 : -1;
    
    data.sort((a, b) => {
      const va = key === "total" ? Number(a.total) : 
                 key === "created_at" ? new Date(a.created_at || 0).getTime() : 
                 a[key];
      const vb = key === "total" ? Number(b.total) : 
                 key === "created_at" ? new Date(b.created_at || 0).getTime() : 
                 b[key];
      
      if (["qty", "total", "price"].includes(key)) return (Number(va) - Number(vb)) * dir;
      if (key === "created_at") return (va - vb) * dir;
      return String(va || "").localeCompare(String(vb || ""), "id") * dir;
    });
    
    return data;
  }, [filteredRows, sortKey, sortDir]);

  // Paginated data
  const pagedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));

  useEffect(() => setPage(1), [q, statusFilter, pageSize]);

  const totalHutang = useMemo(() => 
    filteredRows.reduce((sum, r) => sum + (Number(r.total) || 0), 0), 
    [filteredRows]
  );

  const onPaid = async () => {
    if (!paying) return;
    try {
      setLoading(true);
      await DataService.payDebt({
        sale_id: paying.id,
        amount: Number(paying.total || 0),
        note: `pelunasan: ${paying.customer || ""}`,
      });
      toast?.show?.({ type: "success", message: "Hutang berhasil dilunasi" });
      setPaying(null);
      await load();
    } catch (e) {
      toast?.show?.({ type: "error", message: e.message || "Gagal melunasi hutang" });
    } finally {
      setLoading(false);
    }
  };

  const waHref = (nama, total) => {
    const pesan = `Halo ${nama || "Pelanggan"},\n\nTagihan LPG 3kg Anda sebesar ${fmtIDR(
      total
    )} sudah jatuh tempo. Mohon konfirmasi pembayaran ya. Terima kasih 🙏`;
    return `https://wa.me/?text=${encodeURIComponent(pesan)}`;
  };

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Stack direction={{ xs: "column", md: "row" }} alignItems="center" spacing={2}>
        <Typography variant="h4" fontWeight={700} color="primary">
          Riwayat Hutang
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Chip 
          label={`Total Hutang: ${fmtIDR(totalHutang)}`}
          color="warning" 
          variant="filled"
          sx={{ fontWeight: 600, fontSize: '1rem', px: 2 }}
        />
      </Stack>

      {/* Filter Section */}
      <Card sx={CARD_STYLES}>
        <Accordion defaultExpanded sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <FilterListIcon color="primary" />
              <Typography fontWeight={600}>Filter & Pencarian</Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  {...FIELD_PROPS}
                  sx={FIELD_SX}
                  label="Pencarian Pelanggan / Catatan"
                  placeholder="Cari nama pelanggan atau catatan..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl {...FIELD_PROPS} sx={FIELD_SX}>
                  <InputLabel id="status-filter">Status Hutang</InputLabel>
                  <Select
                    labelId="status-filter"
                    label="Status Hutang"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="BELUM_LUNAS">Belum Lunas</MenuItem>
                    <MenuItem value="SEMUA">Semua Status</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap">
                  <Button 
                    variant="contained" 
                    onClick={load} 
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={16} /> : <ReplayIcon />}
                  >
                    {loading ? "Memuat…" : "Terapkan"}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setQ("");
                      setStatusFilter("BELUM_LUNAS");
                      load();
                    }}
                    disabled={loading}
                  >
                    Reset
                  </Button>
                </Stack>
              </Grid>
            </Grid>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
              Menampilkan transaksi dengan metode <b>HUTANG</b> & status belum lunas / tidak dibatalkan.
            </Typography>
          </AccordionDetails>
        </Accordion>
      </Card>

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
              {`Menampilkan ${pagedData.length} dari ${sortedRows.length} data hutang`}
            </Typography>
          }
        />
        <CardContent>
          <CustomPagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            loading={loading}
          />

          <TableContainer component={Paper} sx={TABLE_STYLES}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={sortKey === "created_at"}
                      direction={sortDir}
                      onClick={() => setSort("created_at")}
                    >
                      <b>📅 Tanggal</b>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortKey === "customer"}
                      direction={sortDir}
                      onClick={() => setSort("customer")}
                    >
                      <b>Pelanggan</b>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                    <TableSortLabel
                      active={sortKey === "qty"}
                      direction={sortDir}
                      onClick={() => setSort("qty")}
                    >
                      <b>Qty</b>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    <TableSortLabel
                      active={sortKey === "price"}
                      direction={sortDir}
                      onClick={() => setSort("price")}
                    >
                      <b>Harga</b>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={sortKey === "total"}
                      direction={sortDir}
                      onClick={() => setSort("total")}
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
                ) : !pagedData.length ? (
                  <EmptyState 
                    message="Tidak ada hutang" 
                    description="Tidak ada data hutang yang ditemukan dengan filter saat ini"
                    icon="💰"
                  />
                ) : (
                  pagedData.map((r, i) => (
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
                              component="a"
                              href={waHref(r.customer, r.total)}
                              target="_blank"
                              rel="noreferrer"
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
                            onClick={() =>
                              setPaying({
                                id: r.id,
                                customer: r.customer,
                                total: r.total,
                                created_at: r.created_at,
                                invoice: r.invoice || r.id,
                              })
                            }
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
      <Dialog open={!!paying} onClose={() => setPaying(null)} fullWidth maxWidth="sm">
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
                  {fmtIDR(payingTotal)}
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
          <Button variant="outlined" onClick={() => setPaying(null)} disabled={loading}>
            Batal
          </Button>
          <Button 
            variant="contained" 
            onClick={onPaid} 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <PaidIcon />}
            sx={{ minWidth: 120 }}
          >
            {loading ? "Menyimpan…" : "Bayar Hutang"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

// Import icons yang diperlukan
import {
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";