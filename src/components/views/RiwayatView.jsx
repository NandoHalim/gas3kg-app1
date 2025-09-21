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
} from "@mui/material";

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
   Utilities
   ========= */
const FIELD_PROPS = { fullWidth: true, size: "medium" };
const FIELD_SX = {
  "& .MuiOutlinedInput-root": { borderRadius: 2, minHeight: 48 },
  "& input": { paddingTop: 1.25, paddingBottom: 1.25 },
};
const zebra = (i) => (i % 2 ? { background: "#fcfcfd" } : undefined);
const statusStyle = (s) => {
  const v = String(s || "").toUpperCase();
  if (v === "LUNAS") return { bg: "#dcfce7", fg: "#166534", icon: "✅" };
  if (v === "DIBATALKAN") return { bg: "#e5e7eb", fg: "#374151", icon: "⚫" };
  return { bg: "#fee2e2", fg: "#991b1b", icon: "❌" };
};

/* ==================
   Main Riwayat View
   ================== */
export default function RiwayatView() {
  const toast = useToast();
  const [tab, setTab] = useState("trx"); // trx | stok | hutang

  /* ------------------- TRANSaksi ------------------- */
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

  /* ------------------- STOk ------------------- */
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

  /* ------------------- HUtang ------------------- */
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
    <Stack spacing={2} sx={{ pb: { xs: 8, md: 2 } }}>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Typography variant="h5" fontWeight={700}>
          Riwayat
        </Typography>
        <Box sx={{ ml: "auto" }} />
        <Tabs value={tab} onChange={(_, v) => setTab(v)} textColor="primary" indicatorColor="primary">
          <Tab value="trx" label="Riwayat Transaksi" />
          <Tab value="stok" label="Riwayat Stok" />
          <Tab value="hutang" label="Riwayat Hutang" />
        </Tabs>
      </Stack>

      {/* =============== TRANSAKSI =============== */}
      {tab === "trx" && (
        <>
          <Card>
            <CardHeader title="Filter Transaksi" />
            <CardContent>
              <Grid container spacing={1.5}>
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
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Stack direction="row" spacing={1} justifyContent={{ xs: "stretch", md: "flex-end" }}>
                    <Button variant="contained" onClick={loadTrx} disabled={trxLoading}>
                      {trxLoading ? "Memuat…" : "Terapkan"}
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
                      📄 Ekspor XLSX
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title={`Riwayat Transaksi ${trxLoading ? "(memuat…)" : ""}`}
              subheader={`Menampilkan ${pagedTrx.length} dari ${sortedTrx.length} data`}
            />
            <CardContent>
              {/* controls atas kanan */}
              <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mb: 1 }}>
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <InputLabel id="rows-trx">Baris/hal</InputLabel>
                  <Select
                    labelId="rows-trx"
                    label="Baris/hal"
                    value={pageSizeTrx}
                    onChange={(e) => setPageSizeTrx(Number(e.target.value))}
                  >
                    {[10, 25, 50, 100].map((n) => (
                      <MenuItem key={n} value={n}>
                        {n}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button variant="outlined" disabled={pageTrx <= 1} onClick={() => setPageTrx(1)}>
                  ⏮
                </Button>
                <Button
                  variant="outlined"
                  disabled={pageTrx <= 1}
                  onClick={() => setPageTrx((p) => Math.max(1, p - 1))}
                >
                  ◀
                </Button>
                <Chip label={`Hal. ${pageTrx} / ${totalPagesTrx}`} />
                <Button
                  variant="outlined"
                  disabled={pageTrx >= totalPagesTrx}
                  onClick={() => setPageTrx((p) => Math.min(totalPagesTrx, p + 1))}
                >
                  ▶
                </Button>
                <Button variant="outlined" disabled={pageTrx >= totalPagesTrx} onClick={() => setPageTrx(totalPagesTrx)}>
                  ⏭
                </Button>
              </Stack>

              <TableContainer component={Paper} sx={{ borderRadius: 1.5 }}>
                <Table size="small">
                  <TableHead sx={{ position: "sticky", top: 0, bgcolor: "#f1f5f9", zIndex: 1 }}>
                    <TableRow>
                      <TableCell onClick={() => setSortTrx("created_at")}><b>Tanggal</b></TableCell>
                      <TableCell onClick={() => setSortTrx("id")}><b>No. Invoice</b></TableCell>
                      <TableCell onClick={() => setSortTrx("customer")}><b>Pelanggan</b></TableCell>
                      <TableCell align="right" onClick={() => setSortTrx("qty")}><b>Qty</b></TableCell>
                      <TableCell align="right" onClick={() => setSortTrx("total")}><b>Total</b></TableCell>
                      <TableCell onClick={() => setSortTrx("method")}><b>Metode</b></TableCell>
                      <TableCell onClick={() => setSortTrx("status")}><b>Status</b></TableCell>
                      <TableCell align="center"><b>Aksi</b></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {!pagedTrx.length && !trxLoading && (
                      <TableRow>
                        <TableCell colSpan={8} sx={{ color: "text.secondary" }}>
                          Tidak ada data
                        </TableCell>
                      </TableRow>
                    )}
                    {pagedTrx.map((r, i) => {
                      const canVoid = DataService.canVoidOnClient?.(r, 2);
                      const stat = statusStyle(r.status);
                      const dim = (r.status || "").toUpperCase() === "DIBATALKAN" ? 0.75 : 1;
                      return (
                        <TableRow key={r.id} hover sx={{ ...zebra(i), opacity: dim }}>
                          <TableCell>{String(r.created_at || "").slice(0, 10)}</TableCell>
                          <TableCell>{r.invoice || r.id}</TableCell>
                          <TableCell>{r.customer || "PUBLIC"}</TableCell>
                          <TableCell align="right">{r.qty}</TableCell>
                          <TableCell align="right">{fmtIDR(r.total ?? (Number(r.qty || 0) * Number(r.price || 0)))}</TableCell>
                          <TableCell>{r.method}</TableCell>
                          <TableCell>
                            <Chip
                              label={r.status || "-"}
                              size="small"
                              sx={{ bgcolor: stat.bg, color: stat.fg, fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Stack direction="row" spacing={1} justifyContent="center">
                              <Button size="small" variant="outlined" onClick={() => setDetailSale(r)}>
                                Detail
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                disabled={!canVoid}
                                onClick={() => setVoidSale(r)}
                              >
                                Void
                              </Button>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
          <Card>
            <CardHeader title="Filter Riwayat Stok" />
            <CardContent>
              <Grid container spacing={1.5}>
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
                  <Stack direction="row" spacing={1} justifyContent={{ xs: "stretch", md: "flex-end" }}>
                    <Button variant="contained" onClick={loadStok} disabled={stokLoading}>
                      {stokLoading ? "Memuat…" : "Terapkan"}
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
                      📄 Ekspor XLSX
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title={`Riwayat Stok ${stokLoading ? "(memuat…)" : ""}`}
              subheader={`Menampilkan ${pagedStok.length} dari ${sortedStok.length} data`}
            />
            <CardContent>
              <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mb: 1 }}>
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <InputLabel id="rows-stok">Baris/hal</InputLabel>
                  <Select
                    labelId="rows-stok"
                    label="Baris/hal"
                    value={pageSizeStok}
                    onChange={(e) => setPageSizeStok(Number(e.target.value))}
                  >
                    {[10, 25, 50, 100].map((n) => (
                      <MenuItem key={n} value={n}>
                        {n}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button variant="outlined" disabled={pageStok <= 1} onClick={() => setPageStok(1)}>
                  ⏮
                </Button>
                <Button variant="outlined" disabled={pageStok <= 1} onClick={() => setPageStok((p) => Math.max(1, p - 1))}>
                  ◀
                </Button>
                <Chip label={`Hal. ${pageStok} / ${totalPagesStok}`} />
                <Button
                  variant="outlined"
                  disabled={pageStok >= totalPagesStok}
                  onClick={() => setPageStok((p) => Math.min(totalPagesStok, p + 1))}
                >
                  ▶
                </Button>
                <Button variant="outlined" disabled={pageStok >= totalPagesStok} onClick={() => setPageStok(totalPagesStok)}>
                  ⏭
                </Button>
              </Stack>

              <TableContainer component={Paper} sx={{ borderRadius: 1.5 }}>
                <Table size="small">
                  <TableHead sx={{ position: "sticky", top: 0, bgcolor: "#f1f5f9", zIndex: 1 }}>
                    <TableRow>
                      <TableCell onClick={() => setSortStok("tanggal")}><b>Tanggal & Waktu</b></TableCell>
                      <TableCell onClick={() => setSortStok("code")}><b>Jenis Stok</b></TableCell>
                      <TableCell><b>Keterangan</b></TableCell>
                      <TableCell align="right" onClick={() => setSortStok("masuk")}><b>Masuk</b></TableCell>
                      <TableCell align="right" onClick={() => setSortStok("keluar")}><b>Keluar</b></TableCell>
                      <TableCell align="right" onClick={() => setSortStok("sisa")}><b>Stok Akhir</b></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {!pagedStok.length && !stokLoading && (
                      <TableRow>
                        <TableCell colSpan={6} sx={{ color: "text.secondary" }}>
                          Tidak ada data
                        </TableCell>
                      </TableRow>
                    )}
                    {pagedStok.map((r, i) => (
                      <TableRow key={r.id} hover sx={zebra(i)}>
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
                        <TableCell align="right">{r.masuk || ""}</TableCell>
                        <TableCell align="right">{r.keluar || ""}</TableCell>
                        <TableCell align="right">{(r.sisa ?? "") === "" ? "-" : r.sisa}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                *Kolom “Stok Akhir” muncul otomatis bila view <code>stock_logs_with_balance</code> tersedia.
              </Typography>
            </CardContent>
          </Card>
        </>
      )}

      {/* =============== HUTANG =============== */}
      {tab === "hutang" && (
        <>
          <Card>
            <CardHeader title="Filter Hutang" />
            <CardContent>
              <Grid container spacing={1.5}>
                <Grid item xs={12} md={4}>
                  <TextField
                    {...FIELD_PROPS}
                    sx={FIELD_SX}
                    label="Nama Pelanggan"
                    placeholder="Cari nama pelanggan"
                    value={hNama}
                    onChange={(e) => setHNama(e.target.value)}
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
                  <Stack direction="row" spacing={1} justifyContent={{ xs: "stretch", md: "flex-end" }}>
                    <Button variant="contained" onClick={loadDebts} disabled={debtLoading}>
                      {debtLoading ? "Memuat…" : "Terapkan"}
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
                      📄 Ekspor XLSX
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="Riwayat Hutang"
              subheader={`Total Belum Lunas: ${fmtIDR(totalHutang)} — Menampilkan ${pagedHut.length} dari ${sortedHut.length} data`}
            />
            <CardContent>
              <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mb: 1 }}>
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <InputLabel id="rows-hut">Baris/hal</InputLabel>
                  <Select
                    labelId="rows-hut"
                    label="Baris/hal"
                    value={pageSizeHut}
                    onChange={(e) => setPageSizeHut(Number(e.target.value))}
                  >
                    {[10, 25, 50, 100].map((n) => (
                      <MenuItem key={n} value={n}>
                        {n}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button variant="outlined" disabled={pageHut <= 1} onClick={() => setPageHut(1)}>
                  ⏮
                </Button>
                <Button variant="outlined" disabled={pageHut <= 1} onClick={() => setPageHut((p) => Math.max(1, p - 1))}>
                  ◀
                </Button>
                <Chip label={`Hal. ${pageHut} / ${totalPagesHut}`} />
                <Button
                  variant="outlined"
                  disabled={pageHut >= totalPagesHut}
                  onClick={() => setPageHut((p) => Math.min(totalPagesHut, p + 1))}
                >
                  ▶
                </Button>
                <Button variant="outlined" disabled={pageHut >= totalPagesHut} onClick={() => setPageHut(totalPagesHut)}>
                  ⏭
                </Button>
              </Stack>

              <TableContainer component={Paper} sx={{ borderRadius: 1.5 }}>
                <Table size="small">
                  <TableHead sx={{ position: "sticky", top: 0, bgcolor: "#f1f5f9", zIndex: 1 }}>
                    <TableRow>
                      <TableCell onClick={() => setSortHut("created_at")}><b>Tanggal</b></TableCell>
                      <TableCell onClick={() => setSortHut("id")}><b>No. Invoice</b></TableCell>
                      <TableCell onClick={() => setSortHut("customer")}><b>Pelanggan</b></TableCell>
                      <TableCell align="right" onClick={() => setSortHut("qty")}><b>Qty</b></TableCell>
                      <TableCell align="right" onClick={() => setSortHut("total")}><b>Total Hutang</b></TableCell>
                      <TableCell align="center"><b>Aksi</b></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {!pagedHut.length && !debtLoading && (
                      <TableRow>
                        <TableCell colSpan={6} sx={{ color: "text.secondary" }}>
                          Tidak ada hutang
                        </TableCell>
                      </TableRow>
                    )}
                    {pagedHut.map((d, i) => (
                      <TableRow key={d.id} hover sx={zebra(i)}>
                        <TableCell>{String(d.created_at || "").slice(0, 10)}</TableCell>
                        <TableCell>{d.invoice || d.id}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{d.customer}</TableCell>
                        <TableCell align="right">{d.qty}</TableCell>
                        <TableCell align="right">{fmtIDR(d.total)}</TableCell>
                        <TableCell align="center">
                          <Button
                            size="small"
                            variant="outlined"
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
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}

      {/* ======= DIALOG DETAIL ======= */}
      <Dialog open={!!detailSale} onClose={() => setDetailSale(null)} fullWidth maxWidth="sm">
        <DialogTitle>Detail Transaksi — {detailSale?.invoice || detailSale?.id || ""}</DialogTitle>
        <DialogContent dividers>
          {detailSale ? (
            <Stack spacing={1.5}>
              <Row label="Tanggal" value={String(detailSale.created_at || "").slice(0, 16).replace("T", " ")} />
              <Row label="Pelanggan" value={detailSale.customer || "PUBLIC"} />
              <Row label="Qty" value={detailSale.qty} />
              <Row label="Total" value={fmtIDR(detailSale.total || (detailSale.qty || 0) * (detailSale.price || 0))} />
              <Row label="Metode" value={detailSale.method} />
              <Row label="Status" value={detailSale.status} />
              {detailSale.note && (
                <>
                  <Divider />
                  <Typography variant="subtitle2">Catatan</Typography>
                  <Typography sx={{ whiteSpace: "pre-wrap" }}>{detailSale.note}</Typography>
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
        <DialogTitle>Batalkan (Void) — {voidSale?.invoice || voidSale?.id || ""}</DialogTitle>
        <DialogContent dividers>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Pembatalan akan <b>mengembalikan stok</b> & menandai transaksi asli sebagai <b>DIBATALKAN</b>.
          </Alert>
          <FormControl {...FIELD_PROPS}>
            <InputLabel id="void-reason">Alasan</InputLabel>
            <Select
              labelId="void-reason"
              label="Alasan"
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

/* kecil: baris label-value */
function Row({ label, value }) {
  return (
    <Stack direction="row" justifyContent="space-between">
      <Typography color="text.secondary">{label}</Typography>
      <Typography fontWeight={700}>{value}</Typography>
    </Stack>
  );
}
