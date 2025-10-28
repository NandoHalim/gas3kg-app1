import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { COLORS, MIN_DATE } from "../../utils/constants.js";
import { fmtIDR } from "../../utils/helpers.js";
import { DataService } from "../../services/DataService.js";
import { useToast } from "../../context/ToastContext.jsx";

// Child sections
import TransaksiSection from "./RiwayatSections.jsx";
import HutangSection from "./RiwayatHutangView.jsx";
import StokSection from "./RiwayatStokSection.jsx";

// MUI Components
import {
  Box,
  Stack,
  Typography,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Tabs,
  Tab
} from "@mui/material";

// Icons
import {
  ReceiptLong as ReceiptLongIcon,
  Inventory as InventoryIcon,
  CreditCard as CreditCardIcon,
} from "@mui/icons-material";

/* ============ Helper ============ */
const normalizeToDate = (to) => (to && to.length === 10 ? `${to} 23:59:59` : to);
const todayStr = () => new Date().toISOString().split("T")[0];

// XLSX Export helper
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

// Detail Row Component
function Row({ label, value }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" py={0.5}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body1" fontWeight={600}>{value}</Typography>
    </Stack>
  );
}

// Status Chip Component untuk modals
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
      sx={{ bgcolor: style.bgcolor, color: style.color, fontWeight: 600, fontSize: "0.75rem", px: 0.5, minWidth: 80 }}
    />
  );
}

export default function RiwayatView() {
  const toast = useToast();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const location = useLocation();
  const navigate = useNavigate();

  // Tentukan tab aktif berdasarkan URL
  const currentTab = location.pathname.includes("/riwayat/hutang")
    ? "hutang"
    : location.pathname.includes("/riwayat/stok")
    ? "stok"
    : "transaksi";

  /* ================= STATE ================= */
  // TRANSAKSI
  const [tFrom, setTFrom] = useState(MIN_DATE || "2024-01-01");
  const [tTo, setTTo] = useState(todayStr());
  const [tMethod, setTMethod] = useState("ALL");
  the const [tStatus, setTStatus] = useState("ALL");
  const [tCashier, setTCashier] = useState("");
  const [tQ, setTQ] = useState("");
  const [trxRows, setTrxRows] = useState([]);
  const [trxLoading, setTrxLoading] = useState(false);
  const [trxSortKey, setTrxSortKey] = useState("created_at");
  const [trxSortDir, setTrxSortDir] = useState("desc");
  const [trxPageSize, setTrxPageSize] = useState(25);
  const [trxPage, setTrxPage] = useState(1);

  // HUTANG
  const [qDebt, setQDebt] = useState("");
  const [debtStatusFilter, setDebtStatusFilter] = useState("BELUM_LUNAS");
  const [debts, setDebts] = useState([]);
  const [debtLoading, setDebtLoading] = useState(false);
  const [debtSortKey, setDebtSortKey] = useState("created_at");
  const [debtSortDir, setDebtSortDir] = useState("desc");
  const [debtPageSize, setDebtPageSize] = useState(25);
  const [debtPage, setDebtPage] = useState(1);

  // STOK
  const [sFrom, setSFrom] = useState(MIN_DATE || "2024-01-01");
  const [sTo, setSTo] = useState(todayStr());
  const [sJenis, setSJenis] = useState("ALL");
  const [stokRows, setStokRows] = useState([]);
  const [stokLoading, setStokLoading] = useState(false);
  const [stokSortKey, setStokSortKey] = useState("tanggal");
  const [stokSortDir, setStokSortDir] = useState("desc");
  const [stokPageSize, setStokPageSize] = useState(25);
  const [stokPage, setStokPage] = useState(1);

  // MODALS
  const [detailSale, setDetailSale] = useState(null);
  const [voidSale, setVoidSale] = useState(null);
  const [voidReason, setVoidReason] = useState("");
  const [payingDebt, setPayingDebt] = useState(null);
  const [payDebtLoading, setPayDebtLoading] = useState(false);
  const VOID_REASONS = ["Salah Input Data", "Batal oleh Pelanggan", "Barang Rusak", "Lainnya"];

  /* ================= DATA ================= */
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
      const mapped = (data || []).map((r) => ({
        ...r,
        invoice_display:
          r.invoice_display ||
          `PLP/${String(r.created_at || "").slice(0, 4)}/${String(r.created_at || "").slice(5, 7)}/${String(r.id).padStart(3, "0")}`,
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
  useEffect(() => {
    if (currentTab === "transaksi") loadTrx();
    if (currentTab === "hutang") loadDebts();
    if (currentTab === "stok") loadStok();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTab]);

  // Reset pagination ketika filter berubah
  useEffect(() => { if (currentTab === "transaksi") setTrxPage(1); }, [tFrom, tTo, tMethod, tStatus, tCashier, tQ, trxPageSize, currentTab]);
  useEffect(() => { if (currentTab === "hutang") setDebtPage(1); }, [qDebt, debtStatusFilter, debtPageSize, currentTab]);
  useEffect(() => { if (currentTab === "stok") setStokPage(1); }, [sFrom, sTo, sJenis, stokPageSize, currentTab]);

  /* ================= DERIVED ================= */
  // TRANSAKSI
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

  // HUTANG
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

  // STOK
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

  /* ================= EVENT ================= */
  const setSortTrx = (f) => (trxSortKey === f ? setTrxSortDir((d) => (d === "asc" ? "desc" : "asc")) : (setTrxSortKey(f), setTrxSortDir("asc")));
  const setSortDebt = (f) => (debtSortKey === f ? setDebtSortDir((d) => (d === "asc" ? "desc" : "asc")) : (setDebtSortKey(f), setDebtSortDir("asc")));
  const setSortStok = (f) => (stokSortKey === f ? setStokSortDir((d) => (d === "asc" ? "desc" : "asc")) : (setStokSortKey(f), setStokSortDir("asc")));

  // Void transaction
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

  // Pay debt
  const handlePayDebt = async (debtData) => {
    if (!debtData) return;
    try {
      setPayDebtLoading(true);
      await DataService.payDebt({
        sale_id: debtData.id,
        amount: Number(debtData.total || 0),
        note: `pelunasan: ${debtData.customer || ""}`,
      });
      toast?.show?.({ type: "success", message: "Hutang berhasil dilunasi" });
      setPayingDebt(null);
      loadDebts();
    } catch (e) {
      toast?.show?.({ type: "error", message: e.message || "Gagal melunasi hutang" });
    } finally {
      setPayDebtLoading(false);
    }
  };

  // WhatsApp helper
  const waHref = (nama, total) => {
    const pesan = `Halo ${nama || "Pelanggan"},\n\nTagihan LPG 3kg Anda sebesar ${fmtIDR(total)} sudah jatuh tempo. Mohon konfirmasi pembayaran ya. Terima kasih 🙏`;
    return `https://wa.me/?text=${encodeURIComponent(pesan)}`;
  };

  // Export
  const exportTrxXlsx = () =>
    exportXlsx("riwayat-transaksi.xlsx", sortedTrx, [
      { header: "Tanggal", key: (r) => String(r.created_at || "").slice(0, 19).replace("T", " ") },
      { header: "Invoice", key: (r) => r.invoice || r.id },
      { header: "Pelanggan", key: "customer" },
      { header: "Qty", key: "qty" },
      { header: "Harga Satuan", key: "price" },
      { header: "Total", key: (r) => r.total ?? Number(r.qty || 0) * Number(r.price || 0) },
      { header: "Metode", key: "method" },
      { header: "Status", key: "status" },
      { header: "Catatan", key: "note" },
    ]);

  const exportStokXlsx = () =>
    exportXlsx("riwayat-stok.xlsx", sortedStok, [
      { header: "Tanggal", key: "tanggal" },
      { header: "Jenis Stok", key: "code" },
      { header: "Keterangan", key: "keterangan" },
      { header: "Masuk", key: "masuk" },
      { header: "Keluar", key: "keluar" },
      { header: "Sisa", key: "sisa" },
    ]);

  const exportHutangXlsx = () =>
    exportXlsx("riwayat-hutang.xlsx", sortedDebts, [
      { header: "Tanggal", key: (r) => String(r.created_at || "").slice(0, 10) },
      { header: "Invoice", key: (r) => r.invoice || r.id },
      { header: "Pelanggan", key: "customer" },
      { header: "Qty", key: "qty" },
      { header: "Total Hutang", key: "total" },
      { header: "Catatan", key: "note" },
    ]);

  /* ================= RENDER ================= */
  return (
    <Stack spacing={2}>
      {/* Header */}
      <Typography variant="h4" fontWeight={700} color="primary">
        Riwayat
      </Typography>

      {/* Sticky Tabs: mobile-first, compact, route-aware */}
      <Box
        sx={{
          position: "sticky",
          top: { xs: 56, sm: 64 }, // offset AppBar
          zIndex: 10,
          backgroundColor: "background.paper",
          borderBottom: (t) => `1px solid ${t.palette.divider}`,
          backdropFilter: "saturate(1.2) blur(6px)",
          mx: -1.5,
          px: 1.5,
        }}
      >
        <Tabs
          value={currentTab}
          onChange={(_, v) => {
            if (v === "transaksi") navigate("/riwayat/transaksi");
            if (v === "hutang") navigate("/riwayat/hutang");
            if (v === "stok") navigate("/riwayat/stok");
          }}
          variant="scrollable"
          allowScrollButtonsMobile
          textColor="primary"
          indicatorColor="primary"
          sx={{
            minHeight: 44,
            "& .MuiTab-root": {
              minHeight: 44,
              px: { xs: 1.25, md: 2 },
              fontWeight: 600,
            },
          }}
        >
          <Tab value="transaksi" label={isMobile ? "Trx" : "Transaksi"} icon={<ReceiptLongIcon />} iconPosition="start" />
          <Tab value="hutang" label="Hutang" icon={<CreditCardIcon />} iconPosition="start" />
          <Tab value="stok" label="Stok" icon={<InventoryIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {currentTab === "transaksi" && (
        <TransaksiSection
          rows={pagedTrx}
          totalRows={sortedTrx.length}
          loading={trxLoading}
          filterValues={{ from: tFrom, to: tTo, method: tMethod, status: tStatus, cashier: tCashier, query: tQ }}
          pagination={{ page: trxPage, pageSize: trxPageSize, totalPages: Math.ceil(sortedTrx.length / trxPageSize) }}
          sorting={{ key: trxSortKey, direction: trxSortDir }}
          onFilterChange={{
            onFromChange: setTFrom,
            onToChange: setTTo,
            onMethodChange: setTMethod,
            onStatusChange: setTStatus,
            onCashierChange: setTCashier,
            onQueryChange: setTQ,
          }}
          onPaginationChange={{ onPageChange: setTrxPage, onPageSizeChange: setTrxPageSize }}
          onSortChange={setSortTrx}
          onReload={loadTrx}
          onExport={exportTrxXlsx}
          onDetailOpen={setDetailSale}
          onVoidOpen={setVoidSale}
        />
      )}

      {currentTab === "hutang" && (
        <HutangSection
          rows={pagedDebts}
          totalRows={sortedDebts.length}
          totalHutang={totalHutang}
          loading={debtLoading}
          filterValues={{ query: qDebt, status: debtStatusFilter }}
          pagination={{ page: debtPage, pageSize: debtPageSize, totalPages: Math.ceil(sortedDebts.length / debtPageSize) }}
          sorting={{ key: debtSortKey, direction: debtSortDir }}
          onFilterChange={{ onQueryChange: setQDebt, onStatusChange: setDebtStatusFilter }}
          onPaginationChange={{ onPageChange: setDebtPage, onPageSizeChange: setDebtPageSize }}
          onSortChange={setSortDebt}
          onReload={loadDebts}
          onExport={exportHutangXlsx}
          onPayOpen={handlePayDebt}
          onWhatsApp={waHref}
        />
      )}

      {currentTab === "stok" && (
        <StokSection
          rows={pagedStok}
          totalRows={sortedStok.length}
          loading={stokLoading}
          filterValues={{ from: sFrom, to: sTo, jenis: sJenis }}
          pagination={{ page: stokPage, pageSize: stokPageSize, totalPages: Math.ceil(sortedStok.length / stokPageSize) }}
          sorting={{ key: stokSortKey, direction: stokSortDir }}
          onFilterChange={{ onFromChange: setSFrom, onToChange: setSTo, onJenisChange: setSJenis }}
          onPaginationChange={{ onPageChange: setStokPage, onPageSizeChange: setStokPageSize }}
          onSortChange={setSortStok}
          onReload={loadStok}
          onExport={exportStokXlsx}
        />
      )}

      {/* ======= MODALS ======= */}
      {/* Detail Modal */}
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
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", p: 1, bgcolor: "#f8fafc", borderRadius: 1 }}>
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

      {/* Void Modal */}
      <Dialog
        open={!!voidSale}
        onClose={() => {
          setVoidSale(null);
          setVoidReason("");
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle color="error">⚠️ Batalkan (Void) — {voidSale?.invoice || voidSale?.id || ""}</DialogTitle>
        <DialogContent dividers>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Pembatalan akan <b>mengembalikan stok</b> & menandai transaksi asli sebagai <b>DIBATALKAN</b>.
          </Alert>
          <FormControl fullWidth size="medium">
            <InputLabel id="void-reason">Alasan Pembatalan</InputLabel>
            <Select
              labelId="void-reason"
              label="Alasan Pembatalan"
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
            >
              <MenuItem value="">— Pilih alasan —</MenuItem>
              {VOID_REASONS.map((r) => (
                <MenuItem key={r} value={r}>{r}</MenuItem>
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

      {/* Pay Debt Modal */}
      <Dialog open={!!payingDebt} onClose={() => !payDebtLoading && setPayingDebt(null)} fullWidth maxWidth="sm">
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <CreditCardIcon color="primary" />
            <span>Bayar Hutang</span>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {payingDebt ? (
            <Stack spacing={2}>
              <Row label="No. Invoice" value={payingDebt.invoice || payingDebt.id} />
              <Row label="Pelanggan" value={payingDebt.customer || "PUBLIC"} />
              <Row label="Tanggal Transaksi" value={(payingDebt.created_at || "").slice(0, 10)} />
              <Divider />
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1 }}>
                <Typography variant="h6">Total Tagihan</Typography>
                <Typography variant="h5" color="error.main" fontWeight={700}>
                  {fmtIDR(payingDebt.total)}
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
          <Button variant="outlined" onClick={() => setPayingDebt(null)} disabled={payDebtLoading}>
            Batal
          </Button>
          <Button
            variant="contained"
            onClick={() => handlePayDebt(payingDebt)}
            disabled={payDebtLoading}
            startIcon={payDebtLoading ? <CircularProgress size={16} /> : <CreditCardIcon />}
            sx={{ minWidth: 120 }}
          >
            {payDebtLoading ? "Menyimpan…" : "Bayar Hutang"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
