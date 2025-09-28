// src/components/views/RiwayatSections.jsx
import React, { useEffect, useMemo, useState } from "react";
import { COLORS, MIN_DATE } from "../../utils/constants.js";
import { fmtIDR, maxAllowedDate } from "../../utils/helpers.js";
import { DataService } from "../../services/DataService.js";
import { useToast } from "../../context/ToastContext.jsx";

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
  Tabs,
  Tab,
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

// Icons
import {
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterListIcon,
  ReceiptLong as ReceiptLongIcon,
  CreditCard as CreditCardIcon,
  Inventory as InventoryIcon,
  Search as SearchIcon,
  Replay as ReplayIcon,
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
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

export default function RiwayatSections() {
  const toast = useToast();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [tab, setTab] = useState("transaksi"); // transaksi | hutang | stok

  // ====== State: Transaksi
  const [tFrom, setTFrom] = useState("");
  const [tTo, setTTo] = useState("");
  const [tMethod, setTMethod] = useState("ALL");
  const [tStatus, setTStatus] = useState("ALL");
  const [tCashier, setTCashier] = useState("");
  const [tQ, setTQ] = useState("");
  const [rowsTx, setRowsTx] = useState([]);
  const [loadingTx, setLoadingTx] = useState(false);

  // Sorting & Pagination Transaksi
  const [sortKeyTx, setSortKeyTx] = useState("created_at");
  const [sortDirTx, setSortDirTx] = useState("desc");
  const [pageSizeTx, setPageSizeTx] = useState(25);
  const [pageTx, setPageTx] = useState(1);

  // ====== State: Hutang
  const [qDebt, setQDebt] = useState("");
  const [rowsDebt, setRowsDebt] = useState([]);
  const [loadingDebt, setLoadingDebt] = useState(false);

  // Sorting & Pagination Hutang
  const [sortKeyDebt, setSortKeyDebt] = useState("created_at");
  const [sortDirDebt, setSortDirDebt] = useState("desc");
  const [pageSizeDebt, setPageSizeDebt] = useState(25);
  const [pageDebt, setPageDebt] = useState(1);

  // ====== State: Stok
  const [sFrom, setSFrom] = useState("");
  const [sTo, setSTo] = useState("");
  const [sJenis, setSJenis] = useState("ALL");
  const [rowsStock, setRowsStock] = useState([]);
  const [loadingStock, setLoadingStock] = useState(false);

  // Sorting & Pagination Stok
  const [sortKeyStock, setSortKeyStock] = useState("tanggal");
  const [sortDirStock, setSortDirStock] = useState("desc");
  const [pageSizeStock, setPageSizeStock] = useState(25);
  const [pageStock, setPageStock] = useState(1);

  // Helper functions for sorting
  const setSortTx = (f) => sortKeyTx === f ? setSortDirTx((d) => (d === "asc" ? "desc" : "asc")) : (setSortKeyTx(f), setSortDirTx("asc"));
  const setSortDebt = (f) => sortKeyDebt === f ? setSortDirDebt((d) => (d === "asc" ? "desc" : "asc")) : (setSortKeyDebt(f), setSortDirDebt("asc"));
  const setSortStock = (f) => sortKeyStock === f ? setSortDirStock((d) => (d === "asc" ? "desc" : "asc")) : (setSortKeyStock(f), setSortDirStock("asc"));

  // ====== Loaders
  const loadTx = async () => {
    try {
      setLoadingTx(true);
      const data = await DataService.getSalesHistory({
        from: tFrom || undefined,
        to: (tTo && (tTo.length === 10 ? tTo + " 23:59:59" : tTo)) || undefined,
        method: tMethod,
        status: tStatus,
        cashier: tCashier || undefined,
        q: tQ || undefined,
        limit: 800,
      });
      setRowsTx(data || []);
    } catch (e) {
      toast?.show?.({ type: "error", message: `${e.message}` });
    } finally {
      setLoadingTx(false);
    }
  };

  const loadDebt = async () => {
    try {
      setLoadingDebt(true);
      const data = await DataService.getDebts({
        query: qDebt || "",
        limit: 300,
      });
      const mapped = (data || []).map((r) => ({
        ...r,
        invoice_display: r.invoice_display || `PLP/${String(r.created_at || "").slice(0,4)}/${String(r.created_at || "").slice(5,7)}/${String(r.id).padStart(3,"0")}`,
      }));
      setRowsDebt(mapped);
    } catch (e) {
      toast?.show?.({ type: "error", message: `${e.message}` });
    } finally {
      setLoadingDebt(false);
    }
  };

  const loadStock = async () => {
    try {
      setLoadingStock(true);
      const data = await DataService.getStockHistory({
        from: sFrom || undefined,
        to: (sTo && (sTo.length === 10 ? sTo + " 23:59:59" : sTo)) || undefined,
        jenis: sJenis,
        limit: 400,
      });
      setRowsStock(data || []);
    } catch (e) {
      toast?.show?.({ type: "error", message: `${e.message}` });
    } finally {
      setLoadingStock(false);
    }
  };

  // Trigger load sesuai tab
  useEffect(() => {
    if (tab === "transaksi") loadTx();
    if (tab === "hutang") loadDebt();
    if (tab === "stok") loadStock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // ====== Data Processing: Transaksi
  const sortedTx = useMemo(() => {
    const rows = [...rowsTx];
    const key = sortKeyTx;
    const dir = sortDirTx === "asc" ? 1 : -1;
    
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
  }, [rowsTx, sortKeyTx, sortDirTx]);

  const pagedTx = useMemo(() => {
    const start = (pageTx - 1) * pageSizeTx;
    return sortedTx.slice(start, start + pageSizeTx);
  }, [sortedTx, pageTx, pageSizeTx]);
  const totalPagesTx = Math.max(1, Math.ceil(sortedTx.length / pageSizeTx));

  // ====== Data Processing: Hutang
  const totalDebt = useMemo(() => rowsDebt.reduce((a, b) => a + Number(b.total || 0), 0), [rowsDebt]);

  const sortedDebt = useMemo(() => {
    const rows = [...rowsDebt];
    const key = sortKeyDebt;
    const dir = sortDirDebt === "asc" ? 1 : -1;
    
    rows.sort((a, b) => {
      const va = key === "total" ? Number(a.total) : key === "created_at" ? new Date(a.created_at || 0).getTime() : a[key];
      const vb = key === "total" ? Number(b.total) : key === "created_at" ? new Date(b.created_at || 0).getTime() : b[key];
      
      if (["qty", "total"].includes(key)) return (Number(va) - Number(vb)) * dir;
      if (key === "created_at") return (va - vb) * dir;
      return String(va || "").localeCompare(String(vb || ""), "id") * dir;
    });
    return rows;
  }, [rowsDebt, sortKeyDebt, sortDirDebt]);

  const pagedDebt = useMemo(() => {
    const start = (pageDebt - 1) * pageSizeDebt;
    return sortedDebt.slice(start, start + pageSizeDebt);
  }, [sortedDebt, pageDebt, pageSizeDebt]);
  const totalPagesDebt = Math.max(1, Math.ceil(sortedDebt.length / pageSizeDebt));

  // ====== Data Processing: Stok
  const sortedStock = useMemo(() => {
    const rows = [...rowsStock];
    const key = sortKeyStock;
    const dir = sortDirStock === "asc" ? 1 : -1;
    
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
  }, [rowsStock, sortKeyStock, sortDirStock]);

  const pagedStock = useMemo(() => {
    const start = (pageStock - 1) * pageSizeStock;
    return sortedStock.slice(start, start + pageSizeStock);
  }, [sortedStock, pageStock, pageSizeStock]);
  const totalPagesStock = Math.max(1, Math.ceil(sortedStock.length / pageSizeStock));

  // Reset pagination when filters change
  useEffect(() => setPageTx(1), [tFrom, tTo, tMethod, tStatus, tCashier, tQ, pageSizeTx]);
  useEffect(() => setPageDebt(1), [qDebt, pageSizeDebt]);
  useEffect(() => setPageStock(1), [sFrom, sTo, sJenis, pageSizeStock]);

  // Filter Section Component
  const FilterSection = ({ title, children, onReload, onReset, loading }) => (
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

  return (
    <Stack spacing={3}>
      {/* Header Tabs */}
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
          <Tab value="transaksi" label="Transaksi" icon={<ReceiptLongIcon />} iconPosition="start" />
          <Tab value="hutang" label="Hutang" icon={<CreditCardIcon />} iconPosition="start" />
          <Tab value="stok" label="Stok" icon={<InventoryIcon />} iconPosition="start" />
        </Tabs>
      </Stack>

      {/* ========= TRANSAKSI ========= */}
      {tab === "transaksi" && (
        <>
          <FilterSection
            title="Filter Transaksi"
            onReload={loadTx}
            onReset={() => {
              setTFrom("");
              setTTo("");
              setTMethod("ALL");
              setTStatus("ALL");
              setTCashier("");
              setTQ("");
              loadTx();
            }}
            loading={loadingTx}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4} lg={2}>
                <TextField
                  {...FIELD_PROPS}
                  sx={FIELD_SX}
                  label="Dari Tanggal"
                  type="date"
                  value={tFrom}
                  onChange={(e) => setTFrom(e.target.value)}
                  inputProps={{ min: MIN_DATE, max: maxAllowedDate() }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4} lg={2}>
                <TextField
                  {...FIELD_PROPS}
                  sx={FIELD_SX}
                  label="Sampai"
                  type="date"
                  value={tTo}
                  onChange={(e) => setTTo(e.target.value)}
                  inputProps={{ min: MIN_DATE, max: maxAllowedDate() }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4} lg={2}>
                <FormControl {...FIELD_PROPS} sx={FIELD_SX}>
                  <InputLabel id="method">Metode Bayar</InputLabel>
                  <Select labelId="method" label="Metode Bayar" value={tMethod} onChange={(e) => setTMethod(e.target.value)}>
                    <MenuItem value="ALL">Semua</MenuItem>
                    <MenuItem value="TUNAI">TUNAI</MenuItem>
                    <MenuItem value="HUTANG">HUTANG</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4} lg={2}>
                <FormControl {...FIELD_PROPS} sx={FIELD_SX}>
                  <InputLabel id="status">Status Bayar</InputLabel>
                  <Select labelId="status" label="Status Bayar" value={tStatus} onChange={(e) => setTStatus(e.target.value)}>
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
                  value={tCashier}
                  onChange={(e) => setTCashier(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4} lg={2}>
                <TextField
                  {...FIELD_PROPS}
                  sx={FIELD_SX}
                  label="Pencarian"
                  placeholder="Invoice/Nama"
                  value={tQ}
                  onChange={(e) => setTQ(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />,
                  }}
                />
              </Grid>
            </Grid>
          </FilterSection>

          <Card sx={CARD_STYLES}>
            <CardHeader
              title={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <ReceiptLongIcon color="primary" />
                  <Typography variant="h6" fontWeight={600}>
                    Riwayat Transaksi
                    {loadingTx && <CircularProgress size={16} sx={{ ml: 1 }} />}
                  </Typography>
                </Stack>
              }
              subheader={
                <Typography variant="body2" color="text.secondary">
                  {`Menampilkan ${pagedTx.length} dari ${sortedTx.length} transaksi`}
                </Typography>
              }
            />
            <CardContent>
              <CustomPagination
                page={pageTx}
                totalPages={totalPagesTx}
                onPageChange={setPageTx}
                pageSize={pageSizeTx}
                onPageSizeChange={setPageSizeTx}
                loading={loadingTx}
              />

              <TableContainer component={Paper} sx={TABLE_STYLES}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <TableSortLabel
                          active={sortKeyTx === "created_at"}
                          direction={sortDirTx}
                          onClick={() => setSortTx("created_at")}
                        >
                          <b>📅 Tanggal</b>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortKeyTx === "id"}
                          direction={sortDirTx}
                          onClick={() => setSortTx("id")}
                        >
                          <b>No. Invoice</b>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortKeyTx === "customer"}
                          direction={sortDirTx}
                          onClick={() => setSortTx("customer")}
                        >
                          <b>Pelanggan</b>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="right">
                        <TableSortLabel
                          active={sortKeyTx === "qty"}
                          direction={sortDirTx}
                          onClick={() => setSortTx("qty")}
                        >
                          <b>Qty</b>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="right">
                        <TableSortLabel
                          active={sortKeyTx === "total"}
                          direction={sortDirTx}
                          onClick={() => setSortTx("total")}
                        >
                          <b>Total</b>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortKeyTx === "method"}
                          direction={sortDirTx}
                          onClick={() => setSortTx("method")}
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
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loadingTx ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={8}>
                            <Skeleton variant="text" height={40} />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : !pagedTx.length ? (
                      <EmptyState 
                        message="Tidak ada transaksi" 
                        description="Tidak ada data transaksi yang ditemukan dengan filter saat ini"
                        icon="📊"
                      />
                    ) : (
                      pagedTx.map((r, i) => {
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

      {/* ========= HUTANG ========= */}
      {tab === "hutang" && (
        <>
          <FilterSection
            title="Filter Hutang"
            onReload={loadDebt}
            onReset={() => {
              setQDebt("");
              loadDebt();
            }}
            loading={loadingDebt}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <TextField
                  {...FIELD_PROPS}
                  sx={FIELD_SX}
                  label="Pencarian Pelanggan / Invoice"
                  placeholder="Nama pelanggan atau nomor invoice"
                  value={qDebt}
                  onChange={(e) => setQDebt(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />,
                  }}
                />
              </Grid>
            </Grid>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
              Menampilkan transaksi HUTANG dengan status <b>belum lunas</b>.
            </Typography>
          </FilterSection>

          <Card sx={CARD_STYLES}>
            <CardHeader
              title={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CreditCardIcon color="primary" />
                  <Typography variant="h6" fontWeight={600}>
                    Riwayat Hutang
                    {loadingDebt && <CircularProgress size={16} sx={{ ml: 1 }} />}
                  </Typography>
                </Stack>
              }
              subheader={
                <Typography variant="body2" color="text.secondary">
                  {`Total Hutang: ${fmtIDR(totalDebt)} — Menampilkan ${pagedDebt.length} dari ${sortedDebt.length} data`}
                </Typography>
              }
            />
            <CardContent>
              <CustomPagination
                page={pageDebt}
                totalPages={totalPagesDebt}
                onPageChange={setPageDebt}
                pageSize={pageSizeDebt}
                onPageSizeChange={setPageSizeDebt}
                loading={loadingDebt}
              />

              <TableContainer component={Paper} sx={TABLE_STYLES}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <TableSortLabel
                          active={sortKeyDebt === "created_at"}
                          direction={sortDirDebt}
                          onClick={() => setSortDebt("created_at")}
                        >
                          <b>📅 Tanggal</b>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortKeyDebt === "invoice_display"}
                          direction={sortDirDebt}
                          onClick={() => setSortDebt("invoice_display")}
                        >
                          <b>No. Invoice</b>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortKeyDebt === "customer"}
                          direction={sortDirDebt}
                          onClick={() => setSortDebt("customer")}
                        >
                          <b>Pelanggan</b>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="right">
                        <TableSortLabel
                          active={sortKeyDebt === "qty"}
                          direction={sortDirDebt}
                          onClick={() => setSortDebt("qty")}
                        >
                          <b>Qty</b>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="right">
                        <TableSortLabel
                          active={sortKeyDebt === "total"}
                          direction={sortDirDebt}
                          onClick={() => setSortDebt("total")}
                        >
                          <b>Total Hutang</b>
                        </TableSortLabel>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loadingDebt ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={5}>
                            <Skeleton variant="text" height={40} />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : !pagedDebt.length ? (
                      <EmptyState 
                        message="Tidak ada hutang" 
                        description="Tidak ada data hutang yang ditemukan dengan filter saat ini"
                        icon="💰"
                      />
                    ) : (
                      pagedDebt.map((d, i) => {
                        const invoiceDisplay = d.invoice_display || `PLP/${String(d.created_at || "").slice(0,4)}/${String(d.created_at || "").slice(5,7)}/${String(d.id).padStart(3,"0")}`;
                        
                        return (
                          <TableRow 
                            key={d.id} 
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
                            <TableCell>{String(d.created_at || "").slice(0, 10)}</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{invoiceDisplay}</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{d.customer || "PUBLIC"}</TableCell>
                            <TableCell align="right">{d.qty}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, color: 'error.main' }}>
                              {fmtIDR(d.total)}
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

      {/* ========= STOK ========= */}
      {tab === "stok" && (
        <>
          <FilterSection
            title="Filter Mutasi Stok"
            onReload={loadStock}
            onReset={() => {
              setSFrom("");
              setSTo("");
              setSJenis("ALL");
              loadStock();
            }}
            loading={loadingStock}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
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
              <Grid item xs={12} sm={6} md={4}>
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
              <Grid item xs={12} sm={6} md={4}>
                <FormControl {...FIELD_PROPS} sx={FIELD_SX}>
                  <InputLabel id="jenis-stok">Jenis Stok</InputLabel>
                  <Select labelId="jenis-stok" label="Jenis Stok" value={sJenis} onChange={(e) => setSJenis(e.target.value)}>
                    <MenuItem value="ALL">Semua</MenuItem>
                    <MenuItem value="ISI">ISI</MenuItem>
                    <MenuItem value="KOSONG">KOSONG</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </FilterSection>

          <Card sx={CARD_STYLES}>
            <CardHeader
              title={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <InventoryIcon color="primary" />
                  <Typography variant="h6" fontWeight={600}>
                    Riwayat Mutasi Stok
                    {loadingStock && <CircularProgress size={16} sx={{ ml: 1 }} />}
                  </Typography>
                </Stack>
              }
              subheader={
                <Typography variant="body2" color="text.secondary">
                  {`Menampilkan ${pagedStock.length} dari ${sortedStock.length} data mutasi stok`}
                </Typography>
              }
            />
            <CardContent>
              <CustomPagination
                page={pageStock}
                totalPages={totalPagesStock}
                onPageChange={setPageStock}
                pageSize={pageSizeStock}
                onPageSizeChange={setPageSizeStock}
                loading={loadingStock}
              />

              <TableContainer component={Paper} sx={TABLE_STYLES}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <TableSortLabel
                          active={sortKeyStock === "tanggal"}
                          direction={sortDirStock}
                          onClick={() => setSortStock("tanggal")}
                        >
                          <b>📅 Tanggal</b>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortKeyStock === "code"}
                          direction={sortDirStock}
                          onClick={() => setSortStock("code")}
                        >
                          <b>Jenis</b>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortKeyStock === "keterangan"}
                          direction={sortDirStock}
                          onClick={() => setSortStock("keterangan")}
                        >
                          <b>Keterangan</b>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="right">
                        <TableSortLabel
                          active={sortKeyStock === "masuk"}
                          direction={sortDirStock}
                          onClick={() => setSortStock("masuk")}
                        >
                          <b>Masuk</b>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="right">
                        <TableSortLabel
                          active={sortKeyStock === "keluar"}
                          direction={sortDirStock}
                          onClick={() => setSortStock("keluar")}
                        >
                          <b>Keluar</b>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="right">
                        <TableSortLabel
                          active={sortKeyStock === "sisa"}
                          direction={sortDirStock}
                          onClick={() => setSortStock("sisa")}
                        >
                          <b>Sisa Stok</b>
                        </TableSortLabel>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loadingStock ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={6}>
                            <Skeleton variant="text" height={40} />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : !pagedStock.length ? (
                      <EmptyState 
                        message="Tidak ada data stok" 
                        description="Tidak ada data mutasi stok yang ditemukan dengan filter saat ini"
                        icon="📦"
                      />
                    ) : (
                      pagedStock.map((r, i) => (
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
                          <TableCell>{r.tanggal}</TableCell>
                          <TableCell>
                            <StokBadge code={r.code} />
                          </TableCell>
                          <TableCell>{r.keterangan}</TableCell>
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
      )}
    </Stack>
  );
}