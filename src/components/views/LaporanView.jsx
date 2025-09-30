// src/components/views/LaporanView.jsx
import React, { useEffect, useMemo, useState } from "react";
import { DataService } from "../../services/DataService.js";
import { useToast } from "../../context/ToastContext.jsx";
import { MIN_DATE } from "../../utils/constants.js";
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
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  alpha,
  Divider,
} from "@mui/material";
import {
  Download,
  Info,
  Today,
  DateRange,
  CalendarMonth,
  AttachMoney,
  TrendingUp,
  TrendingDown,
  Inventory,
  Receipt,
} from "@mui/icons-material";

/* ===== helpers ===== */
async function saveXLSX(filename, rows, headers) {
  const XLSX = await import("xlsx");
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

const isPaid = (r) => {
  if (!r) return false;
  const status = String(r.status || "").toUpperCase();
  const method = String(r.method || "").toUpperCase();

  // 🚫 abaikan transaksi dibatalkan
  if (status === "DIBATALKAN") return false;

  // ✅ hanya hitung yang tunai atau sudah lunas
  if (method === "TUNAI") return true;
  if (status === "LUNAS") return true;

  return false;
};

const getStatusColor = (status) => {
  const stat = String(status || "").toUpperCase();
  if (stat === "LUNAS") return "success";
  if (stat === "PENDING") return "warning";
  if (stat === "DIBATALKAN") return "error";
  return "default";
};

const getMethodIcon = (method) => {
  const meth = String(method || "").toUpperCase();
  if (meth === "TUNAI") return <AttachMoney fontSize="small" />;
  return <Receipt fontSize="small" />;
};

/* ===== view ===== */
export default function LaporanView() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const toast = useToast();
  const [tab, setTab] = useState("penjualan");
  const [from, setFrom] = useState(todayStr());
  const [to, setTo] = useState(todayStr());
  const [exportLoading, setExportLoading] = useState(false);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [settings, setSettings] = useState({});

  // Quick date presets
  const quickDateRanges = [
    { label: "Hari Ini", from: todayStr(), to: todayStr() },
    { 
      label: "Kemarin", 
      from: new Date(Date.now() - 86400000).toISOString().split('T')[0], 
      to: new Date(Date.now() - 86400000).toISOString().split('T')[0] 
    },
    { 
      label: "Minggu Ini", 
      from: new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0], 
      to: todayStr() 
    },
    { 
      label: "Bulan Ini", 
      from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], 
      to: todayStr() 
    },
  ];

  // Ambil pengaturan dasar sekali di awal
  useEffect(() => {
    (async () => {
      try {
        const s = await DataService.getSettings();
        setSettings(s || {});
      } catch {
        setSettings({});
      }
    })();
  }, []);

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
    { key: "created_at", label: "Tanggal", width: "120px" },
    { key: "customer", label: "Pelanggan", width: "150px" },
    { key: "qty", label: "Qty", width: "80px", align: "right" },
    { key: "price", label: "Harga", width: "120px", align: "right" },
    { key: "total", label: "Total", width: "120px", align: "right" },
    { key: "method", label: "Metode", width: "120px" },
    { key: "status", label: "Status", width: "120px" },
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
    const hppVal = Number(settings.hpp || 0) || 0;
    const hpp = paid.reduce((a, b) => a + Number(b.qty || 0) * hppVal, 0);
    const laba = omzet - hpp;
    const margin = omzet > 0 ? Math.round((laba / omzet) * 100) : 0;
    return { omzet, hpp, laba, margin };
  }, [rows, settings]);

  /* ====== export ====== */
  const handleExport = async (exportFn, filename) => {
    try {
      setExportLoading(true);
      await exportFn();
      toast?.show?.({ 
        type: "success", 
        message: `File ${filename} berhasil diunduh` 
      });
    } catch (error) {
      toast?.show?.({ 
        type: "error", 
        message: `Gagal mengexport: ${error.message}` 
      });
    } finally {
      setExportLoading(false);
    }
  };

  const exportPenjualan = async () => {
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
    const headers = [
      "Tanggal",
      "Pelanggan",
      "Qty",
      "Harga",
      "Total",
      "Metode",
      "Status",
      "Catatan",
    ];
    await saveXLSX(`penjualan_${from}_sampai_${to}.xlsx`, data, headers);
  };

  const exportLabaRugi = async () => {
    const data = [
      { Keterangan: "Omzet (dibayar)", Nilai: lr.omzet },
      { Keterangan: "HPP", Nilai: -lr.hpp },
      { Keterangan: "Laba", Nilai: lr.laba },
      { Keterangan: "Margin (%)", Nilai: `${lr.margin}%` },
    ];
    await saveXLSX(
      `laba_rugi_${from}_sampai_${to}.xlsx`,
      data,
      ["Keterangan", "Nilai"]
    );
  };

  return (
    <Stack spacing={3} sx={{ pb: { xs: 8, md: 2 } }}>
      {/* Header */}
      <Box>
        <Typography 
          variant="h4" 
          fontWeight={800} 
          gutterBottom
          sx={{ 
            fontSize: { xs: '1.75rem', md: '2.125rem' },
            background: `linear(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
          }}
        >
          Laporan
        </Typography>
        <Typography color="text.secondary" variant="body1">
          Pantau performa penjualan dan analisa laba rugi bisnis Anda
        </Typography>
      </Box>

      {/* Tab Navigation */}
      <Card sx={{ 
        background: `linear(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
      }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            textColor="primary"
            indicatorColor="primary"
            variant={isMobile ? "fullWidth" : "standard"}
            sx={{
              '& .MuiTab-root': {
                fontSize: { xs: '0.875rem', md: '1rem' },
                fontWeight: 600,
                minHeight: { xs: 48, md: 64 },
                '&.Mui-selected': {
                  color: theme.palette.primary.main,
                },
              },
            }}
          >
            <Tab 
              icon={<Inventory sx={{ mb: 0.5 }} />}
              iconPosition="start"
              label="Penjualan" 
              value="penjualan" 
            />
            <Tab 
              icon={<TrendingUp sx={{ mb: 0.5 }} />}
              iconPosition="start"
              label="Laba Rugi" 
              value="labarugi" 
            />
          </Tabs>
        </CardContent>
      </Card>

      {/* Filter Section */}
      <Card>
        <CardHeader 
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DateRange color="primary" />
              <Typography variant="h6">Filter Periode</Typography>
            </Box>
          }
          sx={{ pb: 1 }}
        />
        <CardContent>
          <Stack spacing={3}>
            {/* Quick Date Buttons */}
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Today fontSize="small" />
                Periode Cepat:
              </Typography>
              <Stack direction="row" gap={1} flexWrap="wrap">
                {quickDateRanges.map((range, index) => (
                  <Chip
                    key={index}
                    label={range.label}
                    onClick={() => {
                      setFrom(range.from);
                      setTo(range.to);
                    }}
                    variant={from === range.from && to === range.to ? "filled" : "outlined"}
                    color="primary"
                    size={isSmallMobile ? "small" : "medium"}
                  />
                ))}
              </Stack>
            </Box>

            <Divider />

            {/* Custom Date Range */}
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarMonth fontSize="small" />
                Periode Kustom:
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={4} lg={3}>
                  <TextField
                    fullWidth
                    label="Dari Tanggal"
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: MIN_DATE, max: maxAllowedDate() }}
                    size={isSmallMobile ? "small" : "medium"}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={3}>
                  <TextField
                    fullWidth
                    label="Sampai Tanggal"
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: MIN_DATE, max: maxAllowedDate() }}
                    size={isSmallMobile ? "small" : "medium"}
                  />
                </Grid>
                <Grid item xs={12} md={4} lg={6} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                  <Button 
                    variant="contained" 
                    onClick={() => tab === "penjualan" 
                      ? handleExport(exportPenjualan, "Laporan Penjualan")
                      : handleExport(exportLabaRugi, "Laporan Laba Rugi")
                    }
                    startIcon={<Download />}
                    disabled={exportLoading || loading}
                    size={isSmallMobile ? "small" : "medium"}
                  >
                    {exportLoading ? "Mengexport..." : "Export Excel"}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {err && (
        <Alert 
          severity="error" 
          variant="outlined"
          sx={{ 
            border: `1px solid ${theme.palette.error.main}20`,
            background: `${theme.palette.error.main}08`
          }}
        >
          {err}
        </Alert>
      )}

      {/* TAB: PENJUALAN */}
      {tab === "penjualan" && (
        <Stack spacing={3}>
          {/* Summary Cards */}
          {!loading && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Card sx={{ 
                  background: `linear(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                }}>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Box sx={{ 
                        p: 1.5, 
                        borderRadius: 2, 
                        background: alpha(theme.palette.info.main, 0.1) 
                      }}>
                        <Inventory color="info" />
                      </Box>
                      <Box>
                        <Typography color="text.secondary" variant="body2">
                          Total Quantity
                        </Typography>
                        <Typography variant="h5" fontWeight={800} color="info.main">
                          {summarySales.qty}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card sx={{ 
                  background: `linear(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                }}>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Box sx={{ 
                        p: 1.5, 
                        borderRadius: 2, 
                        background: alpha(theme.palette.success.main, 0.1) 
                      }}>
                        <AttachMoney color="success" />
                      </Box>
                      <Box>
                        <Typography color="text.secondary" variant="body2">
                          Total Omzet
                        </Typography>
                        <Typography variant="h5" fontWeight={800} color="success.main">
                          {fmtIDR(summarySales.omzet)}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Data Table */}
          <Card>
            <CardHeader 
              title="Detail Transaksi Penjualan"
              action={
                <Tooltip title="Menampilkan semua transaksi kecuali yang dibatalkan">
                  <IconButton size="small">
                    <Info />
                  </IconButton>
                </Tooltip>
              }
            />
            <CardContent sx={{ p: 0 }}>
              {loading ? (
                <Box sx={{ p: 2 }}>
                  {[1, 2, 3, 4, 5].map((item) => (
                    <Skeleton key={item} height={53} sx={{ mb: 1 }} />
                  ))}
                </Box>
              ) : (
                <TableContainer 
                  component={Paper} 
                  elevation={0}
                  sx={{ 
                    maxHeight: { md: 600 },
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 1
                  }}
                >
                  <Table 
                    size="small" 
                    stickyHeader
                    sx={{
                      '& .MuiTableCell-head': {
                        backgroundColor: theme.palette.background.default,
                        fontWeight: 700,
                        fontSize: '0.875rem'
                      },
                      '& .MuiTableCell-body': {
                        fontSize: '0.875rem'
                      }
                    }}
                  >
                    <TableHead>
                      <TableRow>
                        {columns.map((c) => (
                          <TableCell 
                            key={c.key}
                            align={c.align || "left"}
                            sx={{ 
                              width: c.width,
                              minWidth: c.width 
                            }}
                          >
                            {c.label}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.map((r) => (
                        <TableRow 
                          key={r.id} 
                          hover
                          sx={{
                            opacity: String(r.status || "").toUpperCase() === "DIBATALKAN" ? 0.6 : 1,
                            backgroundColor: String(r.status || "").toUpperCase() === "DIBATALKAN" 
                              ? alpha(theme.palette.error.main, 0.02) 
                              : 'inherit'
                          }}
                        >
                          <TableCell sx={{ fontFamily: 'monospace' }}>
                            {String(r.created_at || "").slice(0, 10)}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                              {r.customer || "PUBLIC"}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                            {r.qty}
                          </TableCell>
                          <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                            {fmtIDR(r.price)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                            {fmtIDR(r.total)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={getMethodIcon(r.method)}
                              label={r.method}
                              size="small"
                              variant="outlined"
                              color={String(r.method).toUpperCase() === "TUNAI" ? "success" : "primary"}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={r.status || "PENDING"}
                              size="small"
                              color={getStatusColor(r.status)}
                              variant="filled"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                      {!rows.length && (
                        <TableRow>
                          <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6 }}>
                            <Box sx={{ color: 'text.secondary' }}>
                              <Inventory sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                              <Typography variant="body1" gutterBottom>
                                Tidak ada data transaksi
                              </Typography>
                              <Typography variant="body2">
                                Coba ubah periode filter untuk melihat data
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Stack>
      )}

      {/* TAB: LABA RUGI */}
      {tab === "labarugi" && (
        <Stack spacing={3}>
          {/* Info Card */}
          <Alert 
            severity="info" 
            variant="outlined"
            icon={<Info />}
            sx={{ 
              border: `1px solid ${theme.palette.info.main}20`,
              background: `${theme.palette.info.main}08`
            }}
          >
            <Typography variant="body2">
              <strong>Hanya menampilkan transaksi Tunai dan status LUNAS.</strong><br />
              HPP menggunakan nilai dari pengaturan: <strong>{fmtIDR(settings.hpp || 0)} per tabung</strong>
            </Typography>
          </Alert>

          {/* Laba Rugi Cards */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6} lg={3}>
              <Card sx={{ 
                background: `linear(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
              }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box sx={{ 
                      p: 1.5, 
                      borderRadius: 2, 
                      background: alpha(theme.palette.primary.main, 0.1) 
                    }}>
                      <Receipt color="primary" />
                    </Box>
                    <Box>
                      <Typography color="text.secondary" variant="body2">
                        Omzet (Dibayar)
                      </Typography>
                      <Typography variant="h6" fontWeight={800} color="primary.main">
                        {fmtIDR(lr.omzet)}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              <Card sx={{ 
                background: `linear(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
              }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box sx={{ 
                      p: 1.5, 
                      borderRadius: 2, 
                      background: alpha(theme.palette.warning.main, 0.1) 
                    }}>
                      <Inventory color="warning" />
                    </Box>
                    <Box>
                      <Typography color="text.secondary" variant="body2">
                        HPP
                      </Typography>
                      <Typography variant="h6" fontWeight={800} color="warning.main">
                        {fmtIDR(lr.hpp)}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              <Card sx={{ 
                background: `linear(135deg, ${alpha(lr.laba >= 0 ? theme.palette.success.main : theme.palette.error.main, 0.1)} 0%, ${alpha(lr.laba >= 0 ? theme.palette.success.main : theme.palette.error.main, 0.05)} 100%)`,
                border: `1px solid ${alpha(lr.laba >= 0 ? theme.palette.success.main : theme.palette.error.main, 0.2)}`
              }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box sx={{ 
                      p: 1.5, 
                      borderRadius: 2, 
                      background: alpha(lr.laba >= 0 ? theme.palette.success.main : theme.palette.error.main, 0.1) 
                    }}>
                      {lr.laba >= 0 ? <TrendingUp color="success" /> : <TrendingDown color="error" />}
                    </Box>
                    <Box>
                      <Typography color="text.secondary" variant="body2">
                        Laba/Rugi
                      </Typography>
                      <Typography 
                        variant="h6" 
                        fontWeight={800} 
                        color={lr.laba >= 0 ? "success.main" : "error.main"}
                      >
                        {fmtIDR(lr.laba)}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              <Card sx={{ 
                background: `linear(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
              }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box sx={{ 
                      p: 1.5, 
                      borderRadius: 2, 
                      background: alpha(theme.palette.info.main, 0.1) 
                    }}>
                      <TrendingUp color="info" />
                    </Box>
                    <Box>
                      <Typography color="text.secondary" variant="body2">
                        Margin
                      </Typography>
                      <Typography variant="h6" fontWeight={800} color="info.main">
                        {lr.margin}%
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Detailed Breakdown */}
          {!loading && (
            <Card>
              <CardHeader title="Rincian Laba Rugi" />
              <CardContent>
                <Stack spacing={2}>
                  <Box sx={{ p: 2, background: alpha(theme.palette.primary.main, 0.02), borderRadius: 1 }}>
                    <RowKV k="Omzet (Transaksi Dibayar)" v={fmtIDR(lr.omzet)} />
                    <RowKV k="Harga Pokok Penjualan (HPP)" v={`- ${fmtIDR(lr.hpp)}`} />
                    <Divider sx={{ my: 1 }} />
                    <RowKV 
                      k="Laba Kotor" 
                      v={fmtIDR(lr.laba)} 
                      vSx={{ 
                        color: lr.laba >= 0 ? "success.main" : "error.main",
                        fontWeight: 800,
                        fontSize: '1.1rem'
                      }}
                    />
                    <RowKV 
                      k="Margin Laba Kotor" 
                      v={`${lr.margin}%`}
                      vSx={{ 
                        color: "info.main",
                        fontWeight: 700
                      }}
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          )}
        </Stack>
      )}
    </Stack>
  );
}

/* small row */
function RowKV({ k, v, vSx }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography variant="body1" color="text.secondary">
        {k}
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: 600, ...vSx }}>
        {v}
      </Typography>
    </Stack>
  );
}