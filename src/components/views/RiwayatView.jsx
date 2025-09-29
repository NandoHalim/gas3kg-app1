// src/components/views/RiwayatView.jsx
import React, { useEffect, useMemo, useState } from "react";
import { COLORS, MIN_DATE } from "../../utils/constants.js";
import { fmtIDR, maxAllowedDate } from "../../utils/helpers.js";
import { DataService } from "../../services/DataService.js";
import { useToast } from "../../context/ToastContext.jsx";

// Child sections - MASIH menggunakan komponen existing yang kaya fitur
import TransaksiSection from "./RiwayatSections.jsx";
import HutangSection from "./RiwayatHutangView.jsx";
import StokSection from "./RiwayatStokSection.jsx";

// MUI Components - PERTAHANKAN semua imports existing
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Skeleton,
  useMediaQuery,
  useTheme,
  LinearProgress,
} from "@mui/material";

// Icons - PERTAHANKAN semua icons
import {
  ExpandMore as ExpandMoreIcon,
  ReceiptLong as ReceiptLongIcon,
  Inventory as InventoryIcon,
  CreditCard as CreditCardIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";

/* ============ Constants & Styles - PERTAHANKAN ============ */
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

/* ============ Helper Functions ============ */
const normalizeToDate = (to) => (to && to.length === 10 ? `${to} 23:59:59` : to);
const todayStr = () => new Date().toISOString().split('T')[0];

// XLSX Export helper - PERTAHANKAN fungsi existing
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

export default function RiwayatView() {
  const toast = useToast();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  /* ================= STATE MANAGEMENT ================= */
  const [tab, setTab] = useState("transaksi"); // transaksi | hutang | stok

  // === TRANSAKSI STATE ===
  const [tFrom, setTFrom] = useState(MIN_DATE || "2024-01-01");
  const [tTo, setTTo] = useState(todayStr());
  const [tMethod, setTMethod] = useState("ALL");
  const [tStatus, setTStatus] = useState("ALL");
  const [tCashier, setTCashier] = useState("");
  const [tQ, setTQ] = useState("");
  const [trxRows, setTrxRows] = useState([]);
  const [trxLoading, setTrxLoading] = useState(false);
  const [trxSortKey, setTrxSortKey] = useState("created_at");
  const [trxSortDir, setTrxSortDir] = useState("desc");
  const [trxPageSize, setTrxPageSize] = useState(25);
  const [trxPage, setTrxPage] = useState(1);

  // === HUTANG STATE ===
  const [qDebt, setQDebt] = useState("");
  const [debtStatusFilter, setDebtStatusFilter] = useState("BELUM_LUNAS");
  const [debts, setDebts] = useState([]);
  const [debtLoading, setDebtLoading] = useState(false);
  const [debtSortKey, setDebtSortKey] = useState("created_at");
  const [debtSortDir, setDebtSortDir] = useState("desc");
  const [debtPageSize, setDebtPageSize] = useState(25);
  const [debtPage, setDebtPage] = useState(1);

  // === STOK STATE ===
  const [sFrom, setSFrom] = useState(MIN_DATE || "2024-01-01");
  const [sTo, setSTo] = useState(todayStr());
  const [sJenis, setSJenis] = useState("ALL");
  const [stokRows, setStokRows] = useState([]);
  const [stokLoading, setStokLoading] = useState(false);
  const [stokSortKey, setStokSortKey] = useState("tanggal");
  const [stokSortDir, setStokSortDir] = useState("desc");
  const [stokPageSize, setStokPageSize] = useState(25);
  const [stokPage, setStokPage] = useState(1);

  // === MODAL STATES (PERTAHANKAN semua modals) ===
  const [detailSale, setDetailSale] = useState(null);
  const [voidSale, setVoidSale] = useState(null);
  const [voidReason, setVoidReason] = useState("");
  const [payingDebt, setPayingDebt] = useState(null);
  const VOID_REASONS = ["Salah Input Data", "Batal oleh Pelanggan", "Barang Rusak", "Lainnya"];

  /* ================= DATA FETCHING ================= */
  const loadTrx = async () => {
    try {
      setTrxLoading(true);
      const data = await DataService.getSalesHistory({
        from: tFrom || undefined,
        to: normalizeToDate(tTo) || undefined,
        method: tMethod === "ALL" ? undefined : tMethod,
        status: tStatus === "ALL" ? undefined : tStatus,
        cashier: tCashier || undefined,
        q: tQ || undefined,
        limit: 800,
      });
      setTrxRows(data || []);
    } catch (e) {
      toast?.show?.({ type: "error", message: `${e.message}` });
    } finally {
      setTrxLoading(false);
    }
  };

  const loadDebts = async () => {
    try {
      setDebtLoading(true);
      const data = await DataService.getDebts({
        query: qDebt || "",
        limit: 300,
        status: debtStatusFilter === "BELUM_LUNAS" ? "BELUM_LUNAS" : undefined,
      });
      // PERTAHANKAN mapping data yang ada
      const mapped = (data || []).map((r) => ({
        ...r,
        invoice_display: r.invoice_display || `PLP/${String(r.created_at || "").slice(0,4)}/${String(r.created_at || "").slice(5,7)}/${String(r.id).padStart(3,"0")}`,
      }));
      setDebts(mapped);
    } catch (e) {
      toast?.show?.({ type: "error", message: `${e.message}` });
    } finally {
      setDebtLoading(false);
    }
  };

  const loadStok = async () => {
    try {
      setStokLoading(true);
      const data = await DataService.getStockHistory({
        from: sFrom || undefined,
        to: normalizeToDate(sTo) || undefined,
        jenis: sJenis === "ALL" ? undefined : sJenis,
        limit: 400,
      });
      setStokRows(data || []);
    } catch (e) {
      toast?.show?.({ type: "error", message: `${e.message}` });
    } finally {
      setStokLoading(false);
    }
  };

  /* ================= EFFECTS ================= */
  // Load data ketika tab berubah
  useEffect(() => {
    if (tab === "transaksi") loadTrx();
    if (tab === "hutang") loadDebts();
    if (tab === "stok") loadStok();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Reset pagination ketika filter berubah
  useEffect(() => { if (tab === "transaksi") setTrxPage(1); }, [tFrom, tTo, tMethod, tStatus, tCashier, tQ, trxPageSize]);
  useEffect(() => { if (tab === "hutang") setDebtPage(1); }, [qDebt, debtStatusFilter, debtPageSize]);
  useEffect(() => { if (tab === "stok") setStokPage(1); }, [sFrom, sTo, sJenis, stokPageSize]);

  /* ================= DERIVED DATA ================= */
  // TRANSAKSI - PERTAHANKAN sorting logic existing
  const sortedTrx = useMemo(() => {
    const rows = [...trxRows];
    const key = trxSortKey;
    const dir = trxSortDir === "asc" ? 1 : -1;
    
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
  }, [trxRows, trxSortKey, trxSortDir]);

  const pagedTrx = useMemo(() => {
    const start = (trxPage - 1) * trxPageSize;
    return sortedTrx.slice(start, start + trxPageSize);
  }, [sortedTrx, trxPage, trxPageSize]);

  // HUTANG - PERTAHANKAN sorting logic existing
  const totalHutang = useMemo(() => debts.reduce((a, b) => a + Number(b.total || 0), 0), [debts]);
  
  const sortedDebts = useMemo(() => {
    const rows = [...debts];
    const key = debtSortKey;
    const dir = debtSortDir === "asc" ? 1 : -1;
    
    rows.sort((a, b) => {
      const va = key === "total" ? Number(a.total) : key === "created_at" ? new Date(a.created_at || 0).getTime() : a[key];
      const vb = key === "total" ? Number(b.total) : key === "created_at" ? new Date(b.created_at || 0).getTime() : b[key];
      
      if (["qty", "total"].includes(key)) return (Number(va) - Number(vb)) * dir;
      if (key === "created_at") return (va - vb) * dir;
      return String(va || "").localeCompare(String(vb || ""), "id") * dir;
    });
    return rows;
  }, [debts, debtSortKey, debtSortDir]);

  const pagedDebts = useMemo(() => {
    const start = (debtPage - 1) * debtPageSize;
    return sortedDebts.slice(start, start + debtPageSize);
  }, [sortedDebts, debtPage, debtPageSize]);

  // STOK - PERTAHANKAN sorting logic existing
  const sortedStok = useMemo(() => {
    const rows = [...stokRows];
    const key = stokSortKey;
    const dir = stokSortDir === "asc" ? 1 : -1;
    
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
  }, [stokRows, stokSortKey, stokSortDir]);

  const pagedStok = useMemo(() => {
    const start = (stokPage - 1) * stokPageSize;
    return sortedStok.slice(start, start + stokPageSize);
  }, [sortedStok, stokPage, stokPageSize]);

  /* ================= EVENT HANDLERS ================= */
  // Sorting handlers - PERTAHANKAN logic existing
  const setSortTrx = (f) => trxSortKey === f ? setTrxSortDir((d) => (d === "asc" ? "desc" : "asc")) : (setTrxSortKey(f), setTrxSortDir("asc"));
  const setSortDebt = (f) => debtSortKey === f ? setDebtSortDir((d) => (d === "asc" ? "desc" : "asc")) : (setDebtSortKey(f), setDebtSortDir("asc"));
  const setSortStok = (f) => stokSortKey === f ? setStokSortDir((d) => (d === "asc" ? "desc" : "asc")) : (setStokSortKey(f), setStokSortDir("asc"));

  // Void transaction - PERTAHANKAN logic existing
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

  // Pay debt - PERTAHANKAN logic existing
  const onPaid = async () => {
    if (!payingDebt) return;
    try {
      await DataService.payDebt({
        sale_id: payingDebt.id,
        amount: Number(payingDebt.total || 0),
        note: `pelunasan: ${payingDebt.customer || ""}`,
      });
      toast?.show?.({ type: "success", message: "Hutang berhasil dilunasi" });
      setPayingDebt(null);
      loadDebts();
    } catch (e) {
      toast?.show?.({ type: "error", message: e.message || "Gagal melunasi hutang" });
    }
  };

  // WhatsApp helper - PERTAHANKAN fungsi existing
  const waHref = (nama, total) => {
    const pesan = `Halo ${nama || "Pelanggan"},\n\nTagihan LPG 3kg Anda sebesar ${fmtIDR(total)} sudah jatuh tempo. Mohon konfirmasi pembayaran ya. Terima kasih 🙏`;
    return `https://wa.me/?text=${encodeURIComponent(pesan)}`;
  };

  // Export functions - PERTAHANKAN fungsi existing
  const exportTrxXlsx = () => exportXlsx("riwayat-transaksi.xlsx", sortedTrx, [
    { header: "Tanggal", key: (r) => String(r.created_at || "").slice(0, 19).replace("T", " ") },
    { header: "Invoice", key: (r) => r.invoice || r.id },
    { header: "Pelanggan", key: "customer" },
    { header: "Qty", key: "qty" },
    { header: "Harga Satuan", key: "price" },
    { header: "Total", key: (r) => r.total ?? (Number(r.qty || 0) * Number(r.price || 0)) },
    { header: "Metode", key: "method" },
    { header: "Status", key: "status" },
    { header: "Catatan", key: "note" },
  ]);

  const exportStokXlsx = () => exportXlsx("riwayat-stok.xlsx", sortedStok, [
    { header: "Tanggal", key: "tanggal" },
    { header: "Jenis Stok", key: "code" },
    { header: "Keterangan", key: "keterangan" },
    { header: "Masuk", key: "masuk" },
    { header: "Keluar", key: "keluar" },
    { header: "Sisa", key: "sisa" },
  ]);

  const exportHutangXlsx = () => exportXlsx("riwayat-hutang.xlsx", sortedDebts, [
    { header: "Tanggal", key: (r) => String(r.created_at || "").slice(0, 10) },
    { header: "Invoice", key: (r) => r.invoice || r.id },
    { header: "Pelanggan", key: "customer" },
    { header: "Qty", key: "qty" },
    { header: "Total Hutang", key: "total" },
    { header: "Catatan", key: "note" },
  ]);

  /* ================= RENDER ================= */
  return (
    <Stack spacing={3}>
      {/* Header dengan Tabs - PERTAHANKAN styling existing */}
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

      {/* RENDER CHILD SECTIONS DENGAN PROPS LENGKAP */}
      {tab === "transaksi" && (
        <TransaksiSection
          // Data & State
          rows={pagedTrx}
          totalRows={sortedTrx.length}
          loading={trxLoading}
          
          // Filter State
          filters={{
            from: tFrom,
            to: tTo,
            method: tMethod,
            status: tStatus,
            cashier: tCashier,
            query: tQ
          }}
          
          // Pagination & Sorting
          pagination={{
            page: trxPage,
            pageSize: trxPageSize,
            totalPages: Math.ceil(sortedTrx.length / trxPageSize)
          }}
          sorting={{
            key: trxSortKey,
            direction: trxSortDir
          }}
          
          // Event Handlers
          onFilterChange={{
            setFrom: setTFrom,
            setTo: setTTo,
            setMethod: setTMethod,
            setStatus: setTStatus,
            setCashier: setTCashier,
            setQuery: setTQ
          }}
          onPaginationChange={{
            setPage: setTrxPage,
            setPageSize: setTrxPageSize
          }}
          onSortChange: setSortTrx
          onReload: loadTrx
          onExport: exportTrxXlsx
          
          // Modal Handlers
          onDetail: setDetailSale
          onVoid: setVoidSale
        />
      )}

      {tab === "hutang" && (
        <HutangSection
          // Data & State
          rows={pagedDebts}
          totalRows={sortedDebts.length}
          totalHutang={totalHutang}
          loading={debtLoading}
          
          // Filter State
          filters={{
            query: qDebt,
            status: debtStatusFilter
          }}
          
          // Pagination & Sorting
          pagination={{
            page: debtPage,
            pageSize: debtPageSize,
            totalPages: Math.ceil(sortedDebts.length / debtPageSize)
          }}
          sorting={{
            key: debtSortKey,
            direction: debtSortDir
          }}
          
          // Event Handlers
          onFilterChange={{
            setQuery: setQDebt,
            setStatus: setDebtStatusFilter
          }}
          onPaginationChange={{
            setPage: setDebtPage,
            setPageSize: setDebtPageSize
          }}
          onSortChange: setSortDebt
          onReload: loadDebts
          onExport: exportHutangXlsx
          
          // Action Handlers
          onPay: setPayingDebt
          onWhatsApp: waHref
        />
      )}

      {tab === "stok" && (
        <StokSection
          // Data & State
          rows={pagedStok}
          totalRows={sortedStok.length}
          loading={stokLoading}
          
          // Filter State
          filters={{
            from: sFrom,
            to: sTo,
            jenis: sJenis
          }}
          
          // Pagination & Sorting
          pagination={{
            page: stokPage,
            pageSize: stokPageSize,
            totalPages: Math.ceil(sortedStok.length / stokPageSize)
          }}
          sorting={{
            key: stokSortKey,
            direction: stokSortDir
          }}
          
          // Event Handlers
          onFilterChange={{
            setFrom: setSFrom,
            setTo: setSTo,
            setJenis: setSJenis
          }}
          onPaginationChange={{
            setPage: setStokPage,
            setPageSize: setStokPageSize
          }}
          onSortChange: setSortStok
          onReload: loadStok
          onExport: exportStokXlsx
        />
      )}

      {/* ======= MODALS (PERTAHANKAN semua modals existing) ======= */}
      
      {/* Detail Modal */}
      <Dialog open={!!detailSale} onClose={() => setDetailSale(null)} fullWidth maxWidth="sm">
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <ReceiptLongIcon color="primary" />
            <span>Detail Transaksi — {detailSale?.invoice || detailSale?.id || ""}</span>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {/* ... PERTAHANKAN modal content existing ... */}
        </DialogContent>
      </Dialog>

      {/* Void Modal */}
      <Dialog open={!!voidSale} onClose={() => setVoidSale(null)} fullWidth maxWidth="sm">
        {/* ... PERTAHANKAN modal content existing ... */}
      </Dialog>

      {/* Pay Debt Modal */}
      <Dialog open={!!payingDebt} onClose={() => setPayingDebt(null)} fullWidth maxWidth="sm">
        {/* ... PERTAHANKAN modal content existing ... */}
      </Dialog>
    </Stack>
  );
}