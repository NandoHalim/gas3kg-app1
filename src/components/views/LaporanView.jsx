// src/components/views/LaporanView.jsx
import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { DataService } from "../../services/DataService.js";
import { useToast } from "../../context/ToastContext.jsx";
import { HPP, MIN_DATE } from "../../utils/constants.js";
import { fmtIDR, todayStr, maxAllowedDate } from "../../utils/helpers.js";

import {
  Box,
  Stack,
  Typography,
  Tabs,
  Tab,
  Card,
  CardHeader,
  CardContent,
  TextField,
  Button,
  Grid,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  TableContainer,
  Skeleton,
  Alert,
} from "@mui/material";

/* ===== helpers ===== */
function saveXLSX(filename, rows, headers) {
  const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const wbout = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  const blob = new Blob([wbout], { type: "application/octet-stream" });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  a.click();
  URL.revokeObjectURL(a.href);
}

const isPaid = (r) =>
  String(r.method).toUpperCase() === "TUNAI" ||
  String(r.status || "").toUpperCase() === "LUNAS";

/* ===== view ===== */
export default function LaporanView() {
  const toast = useToast();
  const [tab, setTab] = useState("penjualan"); // 'penjualan' | 'labarugi'
  const [from, setFrom] = useState(todayStr());
  const [to, setTo] = useState(todayStr());

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Ambil data dari server pada perubahan periode
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setErr("");
        setLoading(true);
        const data = await DataService.getSalesHistory({
          from,
          to,
          method: "ALL",
          status: "ALL",
          limit: 2000,
        });
        if (alive) setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        // fallback terakhir (harusnya jarang terjadi)
        const msg = e.message || "Gagal memuat data laporan";
        setErr(msg);
        toast?.show?.({ type: "error", message: msg });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  const columns = [
    { key: "created_at", label: "Tanggal" },
    { key: "customer", label: "Pelanggan" },
    { key: "qty", label: "Qty" },
    { key: "price", label: "Harga" },
    { key: "total", label: "Total" },
    { key: "method", label: "Metode" },
    { key: "status", label: "Status" },
  ];

  /* ====== ringkasan penjualan ====== */
  const summarySales = useMemo(() => {
    const notVoid = rows.filter(
      (r) => String(r.status || "").toUpperCase() !== "DIBATALKAN"
    );
    const qty = notVoid.reduce((a, b) => a + Number(b.qty || 0), 0);
    const omzet = notVoid.reduce((a, b) => a + Number(b.total || 0), 0);
    return { qty, omzet };
  }, [rows]);

  /* ====== laba rugi (dibayar) ====== */
  const lr = useMemo(() => {
    const paid = rows.filter(isPaid);
    const omzet = paid.reduce((a, b) => a + Number(b.total || 0), 0);
    const hpp = paid.reduce((a, b) => a + Number(b.qty || 0) * HPP, 0);
    const laba = omzet - hpp;
    const margin = omzet > 0 ? Math.round((laba / omzet) * 100) : 0;
    return { omzet, hpp, laba, margin };
  }, [rows]);

  /* ====== export ====== */
  const exportPenjualan = () => {
    const data = rows.map((r) => ({
      Tanggal: String(r.created_at || "").slice(0, 10),
      Pelanggan: r.customer || "PUBLIC",
      Qty: Number(r.qty || 0),
      Harga: Number(r.price || 0),
      Total: Number(r.total || 0),
      Metode: r.method,
      Status: r.status || "",
      Catatan: r.note || "",
    }));
    const headers = ["Tanggal", "Pelanggan", "Qty", "Harga", "Total", "Metode", "Status", "Catatan"];
    saveXLSX(`penjualan_${from}_sampai_${to}.xlsx`, data, headers);
  };

  const exportLabaRugi = () => {
    const data = [
      { Keterangan: "Omzet (dibayar)", Nilai: lr.omzet },
      { Keterangan: "HPP", Nilai: -lr.hpp },
      { Keterangan: "Laba", Nilai: lr.laba },
      { Keterangan: "Margin (%)", Nilai: `${lr.margin}%` },
    ];
    saveXLSX(`laba_rugi_${from}_sampai_${to}.xlsx`, data, ["Keterangan", "Nilai"]);
  };

  return (
    <Stack spacing={2} sx={{ pb: { xs: 8, md: 2 } }}>
      {/* Header + Tab */}
      <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap">
        <Typography variant="h5" fontWeight={800}>Laporan</Typography>
        <Box sx={{ ml: "auto" }} />
        <Tabs value={tab} onChange={(_, v) => setTab(v)} textColor="primary" indicatorColor="primary">
          <Tab label="Penjualan" value="penjualan" />
          <Tab label="Laba Rugi" value="labarugi" />
        </Tabs>
      </Stack>

      {/* Filter periode */}
      <Card>
        <CardHeader title="Filter Periode" />
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md="auto">
              <TextField
                label="Dari Tanggal"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: MIN_DATE, max: maxAllowedDate() }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md="auto">
              <TextField
                label="Sampai Tanggal"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: MIN_DATE, max: maxAllowedDate() }}
              />
            </Grid>
            <Grid item xs />
            {tab === "penjualan" ? (
              <Grid item>
                <Button variant="outlined" onClick={exportPenjualan}>Export XLSX</Button>
              </Grid>
            ) : (
              <Grid item>
                <Button variant="outlined" onClick={exportLabaRugi}>Export XLSX</Button>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {err && (
        <Alert severity="error" variant="outlined">{err}</Alert>
      )}

      {/* TAB: PENJUALAN */}
      {tab === "penjualan" && (
        <Card>
          <CardHeader title="Laporan Penjualan" />
          <CardContent>
            {loading ? (
              <Stack spacing={1}>
                <Skeleton height={36} />
                <Skeleton height={36} />
                <Skeleton height={36} />
              </Stack>
            ) : (
              <>
                <TableContainer component={Paper} sx={{ borderRadius: 1.5 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {columns.map((c) => (
                          <TableCell key={c.key}>{c.label}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.map((r) => (
                        <TableRow key={r.id} hover>
                          <TableCell>{String(r.created_at || "").slice(0, 10)}</TableCell>
                          <TableCell>{r.customer || "PUBLIC"}</TableCell>
                          <TableCell align="right">{r.qty}</TableCell>
                          <TableCell align="right">{fmtIDR(r.price)}</TableCell>
                          <TableCell align="right">{fmtIDR(r.total)}</TableCell>
                          <TableCell>{r.method}</TableCell>
                          <TableCell>{r.status || ""}</TableCell>
                        </TableRow>
                      ))}
                      {!rows.length && (
                        <TableRow>
                          <TableCell colSpan={7} sx={{ color: "text.secondary" }}>
                            Tidak ada data pada rentang tanggal ini
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box sx={{ mt: 2, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                  <Grid container>
                    <Grid item xs={12} sm={6}>
                      <Typography color="text.secondary">Total Qty</Typography>
                      <Typography fontWeight={800}>{summarySales.qty}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography color="text.secondary">Total Omzet</Typography>
                      <Typography fontWeight={800}>{fmtIDR(summarySales.omzet)}</Typography>
                    </Grid>
                  </Grid>
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB: LABA RUGI */}
      {tab === "labarugi" && (
        <Card>
          <CardHeader title="Laporan Laba Rugi (dibayar)" />
          <CardContent>
            {loading ? (
              <Stack spacing={1}>
                <Skeleton height={24} />
                <Skeleton height={24} />
                <Skeleton height={24} />
              </Stack>
            ) : (
              <Stack spacing={1.25}>
                <RowKV k="Omzet (Tunai + LUNAS)" v={fmtIDR(lr.omzet)} />
                <RowKV k="HPP" v={`- ${fmtIDR(lr.hpp)}`} vSx={{ color: "error.main" }} />
                <RowKV
                  k="Laba"
                  v={fmtIDR(lr.laba)}
                  vSx={{ color: lr.laba >= 0 ? "success.main" : "error.main", fontWeight: 700 }}
                />
                <RowKV k="Margin" v={`${lr.margin}%`} vSx={{ color: "info.main" }} />
              </Stack>
            )}
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}

/* small row */
function RowKV({ k, v, vSx }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography variant="body2" color="text.secondary">{k}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 700, ...vSx }}>{v}</Typography>
    </Stack>
  );
}
