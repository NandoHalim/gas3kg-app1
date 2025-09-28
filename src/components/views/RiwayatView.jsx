// src/components/views/RiwayatView.jsx
import React, { useEffect, useMemo, useState } from "react";
import { COLORS, MIN_DATE } from "../../utils/constants.js";
import { fmtIDR, maxAllowedDate } from "../../utils/helpers.js";
import { DataService } from "../../services/DataService.js";
import { useToast } from "../../context/ToastContext.jsx";

// MUI
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
  Tabs,
  Tab,
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
  useMediaQuery,
  useTheme,
} from "@mui/material";

// Icons
import {
  ExpandMore as ExpandMoreIcon,
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ReceiptLong as ReceiptLongIcon,
  Inventory as InventoryIcon,
  CreditCard as CreditCardIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
} from "@mui/icons-material";

/* ============
   XLSX helper
   ============ */
async function exportXlsx(filename, rows, columns) {
  const data = rows.map((r) => {
    const o = {};
    columns.forEach((c) => {
      o[c.header] = typeof c.key === "function" ? c.key(r) : r[c.key];
    });
    return o;
  });
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  XLSX.writeFile(wb, filename);
}

/* =========
   Utilities & Constants
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

const statusStyle = (s) => {
  const v = String(s || "").toUpperCase();
  if (v === "LUNAS") return { bg: "#dcfce7", fg: "#166534", icon: "✅" };
  if (v === "DIBATALKAN") return { bg: "#f3f4f6", fg: "#374151", icon: "⚫" };
  if (v === "BELUM") return { bg: "#fef3c7", fg: "#92400e", icon: "⏳" };
  return { bg: "#fee2e2", fg: "#991b1b", icon: "❌" };
};

/* ===============
   Custom Components
   =============== */

// Status Chip Component
function StatusChip({ status }) {
  const style = statusStyle(status);
  
  return (
    <Chip
      label={status || "-"}
      size="small"
      sx={{ 
        bgcolor: style.bg, 
        color: style.fg, 
        fontWeight: 600,
        fontSize: '0.75rem',
        px: 0.5,
        minWidth: 80
      }}
    />
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

// Empty State Component
function EmptyState({ message, description, icon = "📊" }) {
  return (
    <TableRow>
      <TableCell colSpan={8}>
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

/* ==================
   Main Riwayat View
   ================== */
export default function RiwayatView() {
  const toast = useToast();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [tab, setTab] = useState("trx"); // trx | stok | hutang

  /* ------------------- TRANSAKSI ------------------- */
  const [fFrom, setFFrom] = useState("");
  const [fTo, setFTo] = useState("");
  const [fMethod, setFMethod] = useState("ALL");
  const [fStatus, setFStatus] = useState("ALL");
  const [q, setQ] = useState("");
  const [trxRows, setTrxRows] = useState([]);
  const [trxLoading, setTrxLoading] = useState(false);

  const [detailSale, setDetailSale] = useState(null);
  const [voidSale, setVoidSale] = useState(null);
  const [voidReason, setVoidReason] = useState("");
  const VOID_REASONS = ["Salah Input Data", "Batal oleh Pelanggan", "Barang Rusak", "Lainnya"];

  const loadTrx = async () => {
    try {
      setTrxLoading(true);
      const rows = await DataService.getSalesHistory({
        from: fFrom || undefined,
        to: fTo || undefined,
        method: fMethod,
        status: fStatus,
        q: q || undefined,
        limit: 800,
      });
      setTrxRows(rows);
    } catch (e) {
      toast?.show?.({ type: "error", message: `${e.message}` });
    } finally {
      setTrxLoading(false);
    }
  };

  // sorting & paging transaksi
  const [sortKeyTrx, setSortKeyTrx] = useState("created_at");
  const [sortDirTrx, setSortDirTrx] = useState("desc");
  const [pageSizeTrx, setPageSizeTrx] = useState(25);
  const [pageTrx, setPageTrx] = useState(1);
  const setSortTrx = (f) =>
    sortKeyTrx === f ? setSortDirTrx((d) => (d === "asc" ? "desc" : "asc")) : (setSortKeyTrx(f), setSortDirTrx("asc"));

  const sortedTrx = useMemo(() => {
    const rows = [...trxRows];
    const key = sortKeyTrx;
    const dir = sortDirTrx === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      const tA = Number(a.total ?? (a.qty || 0) * (a.price || 0));
      const tB = Number(b.total ?? (b.qty || 0) * (b.price || 0));
      const va = key === "total" ? tA : key === "created_at" ? new Date(a.created_at || 0).getTime() : a[key];
      const vb = key === "total" ? tB : key === "created_at" ? new Date(b.created_at || 0).getTime() : b[key];
      if (["qty", "price", "total"].includes(key)) return (Number(va) - Number(vb)) * dir;
      if (key === "created_at") return (va - vb) * dir;
      return String(va || "").localeCompare(String(vb || ""), "id") * dir;
    });
    return rows;
  }, [trxRows, sortKeyTrx, sortDirTrx]);

  const pagedTrx = useMemo(() => {
    const start = (pageTrx - 1) * pageSizeTrx;
    return sortedTrx.slice(start, start + pageSizeTrx);
  }, [sortedTrx, pageTrx, pageSizeTrx]);
  const totalPagesTrx = Math.max(1, Math.ceil(sortedTrx.length / pageSizeTrx));

  useEffect(() => setPageTrx(1), [fFrom, fTo, fMethod, fStatus, q, pageSizeTrx]);

  /* ------------------- STOK ------------------- */
  const [sFrom, setSFrom] = useState("");
  const [sTo, setSTo] = useState("");
  const [sJenis, setSJenis] = useState("ALL");
  const [stokRows, setStokRows] = useState([]);
  const [stokLoading, setStokLoading] = useState(false);

  const loadStok = async () => {
    try {
      setStokLoading(true);
      const rows = await DataService.getStockHistory({
        from: sFrom || undefined,
        to: sTo || undefined,
        jenis: sJenis,
        limit: 500,
      });
      setStokRows(rows);
    } catch (e) {
      toast?.show?.({ type: "error", message: `${e.message}` });
    } finally {
      setStokLoading(false);
    }
  };

  const [sortKeyStok, setSortKeyStok] = useState("tanggal");
  const [sortDirStok, setSortDirStok] = useState("desc");
  const [pageSizeStok, setPageSizeStok] = useState(25);
  const [pageStok, setPageStok] = useState(1);
  const setSortStok = (f) =>
    sortKeyStok === f ? setSortDirStok((d) => (d === "asc" ? "desc" : "asc")) : (setSortKeyStok(f), setSortDirStok("asc"));

  const sortedStok = useMemo(() => {
    const rows = [...stokRows];
    const key = sortKeyStok;
    const dir = sortDirStok === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      let va = a[key];
      let vb = b[key];
      if (key === "tanggal") {
        va = new Date(a.tanggal || "1970-01-01").getTime();
        vb = new Date(b.tanggal || "1970-01-01").getTime();
        return (va - vb) * dir;
      }
      if (["masuk", "keluar", "sisa"].includes(key)) return (Number(va || 0) - Number(vb || 0)) * dir;
      return String(va || "").localeCompare(String(vb || ""), "id") * dir;
    });
    return rows;
  }, [stokRows, sortKeyStok, sortDirStok]);

  const pagedStok = useMemo(() => {
    const start = (pageStok - 1) * pageSizeStok;
    return sortedStok.slice(start, start + pageSizeStok);
  }, [sortedStok, pageStok, pageSizeStok]);
  const totalPagesStok = Math.max(1, Math.ceil(sortedStok.length / pageSizeStok));
  useEffect(() => setPageStok(1), [sFrom, sTo, sJenis, pageSizeStok]);

  /* ------------------- HUTANG ------------------- */
  const [hNama, setHNama] = useState("");
  const [hQ, setHQ] = useState("");
  const [debts, setDebts] = useState([]);
  const [debtLoading, setDebtLoading] = useState(false);
  const totalHutang = useMemo(() => debts.reduce((a, b) => a + (Number(b.total) || 0), 0), [debts]);

  const loadDebts = async () => {
    try {
      setDebtLoading(true);
      const keyword = [hNama, hQ].filter(Boolean).join(" ").trim();
      const rows = await DataService.getDebts({ query: keyword, limit: 500 });
      setDebts(rows);
    } catch (e) {
      toast?.show?.({ type: "error", message: `${e.message}` });
    } finally {
      setDebtLoading(false);
    }
  };

  const [sortKeyHut, setSortKeyHut] = useState("created_at");
  const [sortDirHut, setSortDirHut] = useState("desc");
  const [pageSizeHut, setPageSizeHut] = useState(25);
  const [pageHut, setPageHut] = useState(1);
  const setSortHut = (f) =>
    sortKeyHut === f ? setSortDirHut((d) => (d === "asc" ? "desc" : "asc")) : (setSortKeyHut(f), setSortDirHut("asc"));

  const sortedHut = useMemo(() => {
    const rows = [...debts];
    const key = sortKeyHut;
    const dir = sortDirHut === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      const va = key === "total" ? Number(a.total) : key === "created_at" ? new Date(a.created_at || 0).getTime() : a[key];
      const vb = key === "total" ? Number(b.total) : key === "created_at" ? new Date(b.created_at || 0).getTime() : b[key];
      if (["qty", "total"].includes(key)) return (Number(va) - Number(vb)) * dir;
      if (key === "created_at") return (va - vb) * dir;
      return String(va || "").localeCompare(String(vb || ""), "id") * dir;
    });
    return rows;
  }, [debts, sortKeyHut, sortDirHut]);

  const pagedHut = useMemo(() => {
    const start = (pageHut - 1) * pageSizeHut;
    return sortedHut.slice(start, start + pageSizeHut);
  }, [sortedHut, pageHut, pageSizeHut]);
  const totalPagesHut = Math.max(1, Math.ceil(sortedHut.length / pageSizeHut));
  useEffect(() => setPageHut(1), [hNama, hQ, pageSizeHut]);

  /* ------------------- Load per Tab ------------------- */
  useEffect(() => {
    if (tab === "trx") loadTrx();
    if (tab === "stok") loadStok();
    if (tab === "hutang") loadDebts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  /* ------------------- Void ------------------- */
  const submitVoid = async () => {
    if (!voidSale) return;
    if (!voidReason) {
      toast?.show?.({ type: "error", message: "Pilih/isi alasan dulu." });
      return;
    }
    try {
      await DataService.voidSale({ sale_id: voidSale.id, reason: voidReason });
      toast?.show?.({ type: "success", message: "Transaksi dibatalkan (void)." });
      setVoidSale(null);
      setVoidReason("");
      loadTrx();
    } catch (e) {
      toast?.show?.({ type: "error", message: `${e.message}` });
    }
  };

  return (
    <Stack spacing={3} sx={{ pb: { xs: 8, md: 2 } }}>
      {/* Header */}
      <Stack direction={{ xs: "column", md: "row" }} alignItems="center" spacing={2}>
        <Typography variant="h4" fontWeight={700} color="primary">
          Riwayat
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Tabs 
          value={tab} 
          onChange={(_, v) => setTab(v)} 
          textColor="primary" 
          indicatorColor="primary"
          sx={{ 
            minHeight: 48,
            '& .MuiTab-root': { 
              minHeight: 48,
              fontWeight: 600 
            }
          }}
        >
          <Tab value="trx" label="Transaksi" icon={<ReceiptLongIcon />} iconPosition="start" />
          <Tab value="stok" label="Stok" icon={<InventoryIcon />} iconPosition="start" />
          <Tab value="hutang" label="Hutang" icon={<CreditCardIcon />} iconPosition="start" />
        </Tabs>
      </Stack>

      {/* =============== TRANSAKSI =============== */}
      {tab === "trx" && (
        <>
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
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      {...FIELD_PROPS}
                      sx={FIELD_SX}
                      label="Dari Tanggal"
                      type="date"
                      value={fFrom}
                      onChange={(e) => setFFrom(e.target.value)}
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
                      value={fTo}
                      onChange={(e) => setFTo(e.target.value)}
                      inputProps={{ min: MIN_DATE, max: maxAllowedDate() }}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl {...FIELD_PROPS} sx={FIELD_SX}>
                      <InputLabel id="mtd">Metode Bayar</InputLabel>
                      <Select labelId="mtd" label="Metode Bayar" value={fMethod} onChange={(e) => setFMethod(e.target.value)}>
                        <MenuItem value="ALL">Semua</MenuItem>
                        <MenuItem value="TUNAI">Tunai</MenuItem>
                        <MenuItem value="HUTANG">Hutang</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl {...FIELD_PROPS} sx={FIELD_SX}>
                      <InputLabel id="sts">Status Bayar</InputLabel>
                      <Select labelId="sts" label="Status Bayar" value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
                        <MenuItem value="ALL">Semua</MenuItem>
                        <MenuItem value="LUNAS">Lunas</MenuItem>
                        <MenuItem value="BELUM">Belum Lunas</MenuItem>
                        <MenuItem value="DIBATALKAN">Dibatalkan</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      {...FIELD_PROPS}
                      sx={FIELD_SX}
                      label="Pencarian (Invoice/Nama)"
                      placeholder="INV-001 / Ayu"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      InputProps={{
                        startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Stack direction="row" spacing={1} justifyContent={{ xs: "stretch", md: "flex-end" }} flexWrap="wrap">
                      <Button variant="contained" onClick={loadTrx} disabled={trxLoading} startIcon={trxLoading ? <CircularProgress size={16} /> : null}>
                        {trxLoading ? "Memuat…" : "Terapkan Filter"}
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setFFrom("");
                          setFTo("");
                          setFMethod("ALL");
                          setFStatus("ALL");
                          setQ("");
                          loadTrx();
                        }}
                        disabled={trxLoading}
                      >
                        Reset
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() =>
                          exportXlsx("riwayat-transaksi.xlsx", sortedTrx, [
                            { header: "Tanggal", key: (r) => String(r.created_at || "").slice(0, 19).replace("T", " ") },
                            { header: "Invoice", key: (r) => r.invoice || r.id },
                            { header: "Pelanggan", key: "customer" },
                            { header: "Qty", key: "qty" },
                            { header: "Harga Satuan", key: "price" },
                            { header: "Total", key: (r) => r.total ?? (Number(r.qty || 0) * Number(r.price || 0)) },
                            { header: "Metode", key: "method" },
                            { header: "Status", key: "status" },
                            { header: "Catatan", key: "note" },
                          ])
                        }
                      >
                        📄 Ekspor
                      </Button>
                    </Stack>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Card>

          {/* Data Table */}
          <Card sx={CARD_STYLES}>
            <CardHeader
              title={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <ReceiptLongIcon color="primary" />
                  <Typography variant="h6" fontWeight={600}>
                    Riwayat Transaksi
                    {trxLoading && <CircularProgress size={16} sx={{ ml: 1 }} />}
                  </Typography>
                </Stack>
              }
              subheader={
                <Typography variant="body2" color="text.secondary">
                  {`Menampilkan ${pagedTrx.length} dari ${sortedTrx.length} transaksi`}
                </Typography>
              }
              action={
                <Chip 
                  label={`Total: ${fmtIDR(trxRows.reduce((sum, r) => sum + (r.total || 0), 0))}`}
                  color="primary" 
                  variant="outlined"
                />
              }
            />
            <CardContent>
              {/* Pagination Controls */}
              <CustomPagination
                page={pageTrx}
                totalPages={totalPagesTrx}
                onPageChange={setPageTrx}
                pageSize={pageSizeTrx}
                onPageSizeChange={setPageSizeTrx}
                loading={trxLoading}
              />

              <TableContainer component={Paper} sx={TABLE_STYLES}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <TableSortLabel
                          active={sortKeyTrx === "created_at"}
                          direction={sortDirTrx}
                          onClick={() => setSortTrx("created_at")}
                        >
                          <b>📅 Tanggal</b>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortKeyTrx === "id"}
                          direction={sortDirTrx}
                          onClick={() => setSortTrx("id")}
                        >
                          <b>No. Invoice</b>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <TableSortLabel
                          active={sortKeyTrx === "customer"}
                          direction={sortDirTrx}
                          onClick={() => setSortTrx("customer")}
                        >
                          <b>Pelanggan</b>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="right" sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                        <TableSortLabel
                          active={sortKeyTrx === "qty"}
                          direction={sortDirTrx}
                          onClick={() => setSortTrx("qty")}
                        >
                          <b>Qty</b>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="right">
                        <TableSortLabel
                          active={sortKeyTrx === "total"}
                          direction={sortDirTrx}
                          onClick={() => setSortTrx("total")}
                        >
                          <b>Total</b>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                        <TableSortLabel
                          active={sortKeyTrx === "method"}
                          direction={sortDirTrx}
                          onClick={() => setSortTrx("method")}
                        >
                          <b>Metode</b>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <b>Status</b>
                      </TableCell>
                      <TableCell align="center"><b>Aksi</b></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {trxLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={8}>
                            <Skeleton variant="text" height={40} />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : !pagedTrx.length ? (
                      <EmptyState 
                        message="Tidak ada transaksi" 
                        description="Tidak ada data yang ditemukan dengan filter saat ini"
                        icon="📊"
                      />
                    ) : (
                      pagedTrx.map((r, i) => {
                        const canVoid = DataService.canVoidOnClient?.(r, 2);
                        const dim = (r.status || "").toUpperCase() === "DIBATALKAN" ? 0.75 : 1;
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
                            <TableCell sx={{ fontWeight: 600 }}>{r.invoice || r.id}</TableCell>
                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                              {r.customer || "PUBLIC"}
                            </TableCell>
                            <TableCell align="right" sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                              {r.qty}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>
                              {fmtIDR(r.total ?? (Number(r.qty || 0) * Number(r.price || 0)))}
                            </TableCell>
                            <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                              {r.method}
                            </TableCell>
                            <TableCell>
                              <StatusChip status={r.status} />
                            </TableCell>
                            <TableCell align="center">
                              <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                                <Button size="small" variant="outlined" onClick={() => setDetailSale(r)}>
                                  Detail
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  disabled={!canVoid}
                                  onClick={() => setVoidSale(r)}
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
      )}

      {/* =============== STOK =============== */}
      {tab === "stok" && (
        <>
          <Card sx={CARD_STYLES}>
            <Accordion defaultExpanded sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <FilterListIcon color="primary" />
                  <Typography fontWeight={600}>Filter Riwayat Stok</Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      {...FIELD_PROPS}
                      sx={FIELD_SX}
                      label="Dari Tanggal"
                      type="date"
                      value={sFrom}
                      onChange={(e) => setSFrom(e.target.value)}
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
                      value={sTo}
                      onChange={(e) => setSTo(e.target.value)}
                      inputProps={{ min: MIN_DATE, max: maxAllowedDate() }}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl {...FIELD_PROPS} sx={FIELD_SX}>
                      <InputLabel id="jenis">Jenis Stok</InputLabel>
                      <Select labelId="jenis" label="Jenis Stok" value={sJenis} onChange={(e) => setSJenis(e.target.value)}>
                        <MenuItem value="ALL">Semua</MenuItem>
                        <MenuItem value="ISI">Isi</MenuItem>
                        <MenuItem value="KOSONG">Kosong</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Stack direction="row" spacing={1} justifyContent={{ xs: "stretch", md: "flex-end" }} flexWrap="wrap">
                      <Button variant="contained" onClick={loadStok} disabled={stokLoading} startIcon={stokLoading ? <CircularProgress size={16} /> : null}>
                        {stokLoading ? "Memuat…" : "Terapkan Filter"}
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setSFrom("");
                          setSTo("");
                          setSJenis("ALL");
                          loadStok();
                        }}
                        disabled={stokLoading}
                      >
                        Reset
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() =>
                          exportXlsx("riwayat-stok.xlsx", sortedStok, [
                            { header: "Tanggal", key: "tanggal" },
                            { header: "Jenis Stok", key: "code" },
                            { header: "Keterangan", key: "keterangan" },
                            { header: "Masuk", key: "masuk" },
                            { header: "Keluar", key: "keluar" },
                            { header: "Sisa", key: "sisa" },
                          ])
                        }
                      >
                        📄 Ekspor
                      </Button>
                    </Stack>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Card>

          <Card sx={CARD_STYLES}>
            <CardHeader
              title={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <InventoryIcon color="primary" />
                  <Typography variant="h6" fontWeight={600}>
                    Riwayat Stok
                    {stokLoading && <CircularProgress size={16} sx={{ ml: 1 }} />}
                  </Typography>
                </Stack>
              }
              subheader={
                <Typography variant="body2" color="text.secondary">
                  {`Menampilkan ${pagedStok.length} dari ${sortedStok.length} data`}
                </Typography>
              }
            />
            <CardContent>
              <CustomPagination
                page={pageStok}
                totalPages={totalPagesStok}
                onPageChange={setPageStok}
                pageSize={pageSizeStok}
                onPageSizeChange={setPageSizeStok}
                loading={stokLoading}
              />

              <TableContainer component={Paper} sx={TABLE_STYLES}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <TableSortLabel
                          active={sortKeyStok === "tanggal"}
                          direction={sortDirStok}
                          onClick={() => setSortStok("tanggal")}
                        >
                          <b>📅 Tanggal & Waktu</b>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortKeyStok === "code"}
                          direction={sortDirStok}
                          onClick={() => setSortStok("code")}
                        >
                          <b>Jenis Stok</b>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell><b>Keterangan</b></TableCell>
                      <TableCell align="right">
                        <TableSortLabel
                          active={sortKeyStok === "masuk"}
                          direction={sortDirStok}
                          onClick={() => setSortStok("masuk")}
                        >
                          <b>Masuk</b>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="right">
                        <TableSortLabel
                          active={sortKeyStok === "keluar"}
                          direction={sortDirStok}
                          onClick={() => setSortStok("keluar")}
                        >
                          <b>Keluar</b>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="right">
                        <TableSortLabel
                          active={sortKeyStok === "sisa"}
                          direction={sortDirStok}
                          onClick={() => setSortStok("sisa")}
                        >
                          <b>Stok Akhir</b>
                        </TableSortLabel>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stokLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={6}>
                            <Skeleton variant="text" height={40} />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : !pagedStok.length ? (
                      <EmptyState 
                        message="Tidak ada data stok" 
                        description="Tidak ada data yang ditemukan dengan filter saat ini"
                        icon="📦"
                      />
                    ) : (
                      pagedStok.map((r, i) => (
                        <TableRow key={r.id} hover sx={{ 
                          ...zebra(i),
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: '#f8fafc',
                            transform: 'translateY(-1px)'
                          }
                        }}>
                          <TableCell>{r.tanggal}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={r.code}
                              sx={{
                                bgcolor: r.code === "ISI" ? "#e0f2fe" : "#fff7ed",
                                color: r.code === "ISI" ? "#075985" : "#9a3412",
                                fontWeight: 600,
                              }}
                            />
                          </TableCell>
                          <TableCell>{r.keterangan}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: r.masuk ? 600 : 'normal' }}>
                            {r.masuk || ""}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: r.keluar ? 600 : 'normal' }}>
                            {r.keluar || ""}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            {(r.sisa ?? "") === "" ? "-" : r.sisa}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                *Kolom "Stok Akhir" muncul otomatis bila view <code>stock_logs_with_balance</code> tersedia.
              </Typography>
            </CardContent>
          </Card>
        </>
      )}

      {/* =============== HUTANG =============== */}
      {tab === "hutang" && (
        <>
          <Card sx={CARD_STYLES}>
            <Accordion defaultExpanded sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <FilterListIcon color="primary" />
                  <Typography fontWeight={600}>Filter Hutang</Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      {...FIELD_PROPS}
                      sx={FIELD_SX}
                      label="Nama Pelanggan"
                      placeholder="Cari nama pelanggan"
                      value={hNama}
                      onChange={(e) => setHNama(e.target.value)}
                      InputProps={{
                        startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      {...FIELD_PROPS}
                      sx={FIELD_SX}
                      label="Pencarian (Invoice/Nama)"
                      placeholder="INV-001 / Ayu"
                      value={hQ}
                      onChange={(e) => setHQ(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Stack direction="row" spacing={1} justifyContent={{ xs: "stretch", md: "flex-end" }} flexWrap="wrap">
                      <Button variant="contained" onClick={loadDebts} disabled={debtLoading} startIcon={debtLoading ? <CircularProgress size={16} /> : null}>
                        {debtLoading ? "Memuat…" : "Terapkan Filter"}
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setHNama("");
                          setHQ("");
                          loadDebts();
                        }}
                        disabled={debtLoading}
                      >
                        Reset
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() =>
                          exportXlsx("riwayat-hutang.xlsx", sortedHut, [
                            { header: "Tanggal", key: (r) => String(r.created_at || "").slice(0, 10) },
                            { header: "Invoice", key: (r) => r.invoice || r.id },
                            { header: "Pelanggan", key: "customer" },
                            { header: "Qty", key: "qty" },
                            { header: "Total Hutang", key: "total" },
                            { header: "Catatan", key: "note" },
                          ])
                        }
                      >
                        📄 Ekspor
                      </Button>
                    </Stack>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Card>

          <Card sx={CARD_STYLES}>
            <CardHeader
              title={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CreditCardIcon color="primary" />
                  <Typography variant="h6" fontWeight={600}>
                    Riwayat Hutang
                    {debtLoading && <CircularProgress size={16} sx={{ ml: 1 }} />}
                  </Typography>
                </Stack>
              }
              subheader={
                <Typography variant="body2" color="text.secondary">
                  {`Total Belum Lunas: ${fmtIDR(totalHutang)} — Menampilkan ${pagedHut.length} dari ${sortedHut.length} data`}
                </Typography>
              }
              action={
                <Chip 
                  label={`Total: ${fmtIDR(totalHutang)}`}
                  color="primary" 
                  variant="outlined"
                />
              }
            />
            <CardContent>
              <CustomPagination
                page={pageHut}
                totalPages={totalPagesHut}
                onPageChange={setPageHut}
                pageSize={pageSizeHut}
                onPageSizeChange={setPageSizeHut}
                loading={debtLoading}
              />

              <TableContainer component={Paper} sx={TABLE_STYLES}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <TableSortLabel
                          active={sortKeyHut === "created_at"}
                          direction={sortDirHut}
                          onClick={() => setSortHut("created_at")}
                        >
                          <b>📅 Tanggal</b>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortKeyHut === "id"}
                          direction={sortDirHut}
                          onClick={() => setSortHut("id")}
                        >
                          <b>No. Invoice</b>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortKeyHut === "customer"}
                          direction={sortDirHut}
                          onClick={() => setSortHut("customer")}
                        >
                          <b>Pelanggan</b>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                        <TableSortLabel
                          active={sortKeyHut === "qty"}
                          direction={sortDirHut}
                          onClick={() => setSortHut("qty")}
                        >
                          <b>Qty</b>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="right">
                        <TableSortLabel
                          active={sortKeyHut === "total"}
                          direction={sortDirHut}
                          onClick={() => setSortHut("total")}
                        >
                          <b>Total Hutang</b>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="center"><b>Aksi</b></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {debtLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={6}>
                            <Skeleton variant="text" height={40} />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : !pagedHut.length ? (
                      <EmptyState 
                        message="Tidak ada hutang" 
                        description="Tidak ada data hutang yang ditemukan"
                        icon="💰"
                      />
                    ) : (
                      pagedHut.map((d, i) => (
                        <TableRow key={d.id} hover sx={{ 
                          ...zebra(i),
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: '#f8fafc',
                            transform: 'translateY(-1px)'
                          }
                        }}>
                          <TableCell>{String(d.created_at || "").slice(0, 10)}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{d.invoice || d.id}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{d.customer}</TableCell>
                          <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                            {d.qty}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: 'error.main' }}>
                            {fmtIDR(d.total)}
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              onClick={() =>
                                toast?.show?.({
                                  type: "info",
                                  message: "Buka menu Transaksi > Bayar Hutang untuk melunasi.",
                                })
                              }
                            >
                              Bayar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}

      {/* ======= DIALOG DETAIL ======= */}
      <Dialog open={!!detailSale} onClose={() => setDetailSale(null)} fullWidth maxWidth="sm">
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <ReceiptLongIcon color="primary" />
            <span>Detail Transaksi — {detailSale?.invoice || detailSale?.id || ""}</span>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {detailSale ? (
            <Stack spacing={2}>
              <Row label="Tanggal" value={String(detailSale.created_at || "").slice(0, 16).replace("T", " ")} />
              <Row label="Pelanggan" value={detailSale.customer || "PUBLIC"} />
              <Row label="Qty" value={detailSale.qty} />
              <Row label="Total" value={fmtIDR(detailSale.total || (detailSale.qty || 0) * (detailSale.price || 0))} />
              <Row label="Metode" value={detailSale.method} />
              <Row label="Status" value={<StatusChip status={detailSale.status} />} />
              {detailSale.note && (
                <>
                  <Divider />
                  <Typography variant="subtitle2" fontWeight={600}>Catatan</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", p: 1, bgcolor: '#f8fafc', borderRadius: 1 }}>
                    {detailSale.note}
                  </Typography>
                </>
              )}
            </Stack>
          ) : (
            <Alert severity="info">Memuat…</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setDetailSale(null)}>
            Tutup
          </Button>
        </DialogActions>
      </Dialog>

      {/* ======= DIALOG VOID ======= */}
      <Dialog
        open={!!voidSale}
        onClose={() => {
          setVoidSale(null);
          setVoidReason("");
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle color="error">
          ⚠️ Batalkan (Void) — {voidSale?.invoice || voidSale?.id || ""}
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Pembatalan akan <b>mengembalikan stok</b> & menandai transaksi asli sebagai <b>DIBATALKAN</b>.
          </Alert>
          <FormControl {...FIELD_PROPS}>
            <InputLabel id="void-reason">Alasan Pembatalan</InputLabel>
            <Select
              labelId="void-reason"
              label="Alasan Pembatalan"
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
            >
              <MenuItem value="">— Pilih alasan —</MenuItem>
              {VOID_REASONS.map((r) => (
                <MenuItem key={r} value={r}>
                  {r}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            onClick={() => {
              setVoidSale(null);
              setVoidReason("");
            }}
          >
            Batal
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={!voidReason}
            onClick={() => {
              if (window.confirm("Apakah Anda yakin ingin membatalkan transaksi ini?")) {
                submitVoid();
              }
            }}
          >
            Void Sekarang
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}