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

  if (status === "DIBATALKAN") return false;
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
  const [from, setFrom] = useState(() => {
    // Default ke tanggal 1 bulan ini untuk mobile-first
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  });
  const [to, setTo] = useState(todayStr());
  const [exportLoading, setExportLoading] = useState(false);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [settings, setSettings] = useState({});

  // Quick date presets - MOBILE FIRST dengan periode mulai tanggal 1
  const quickDateRanges = useMemo(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    
    return [
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
        from: firstDayOfMonth, 
        to: todayStr() 
      },
    ];
  }, []);

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
  }, [from, to, toast]);

  // Columns responsif untuk mobile
  const columns = useMemo(() => {
    const baseColumns = [
      { key: "created_at", label: "Tanggal", width: "100px" },
      { key: "customer", label: "Pelanggan", width: "120px" },
      { key: "qty", label: "Qty", width: "60px", align: "right" },
      { key: "price", label: "Harga", width: "100px", align: "right" },
      { key: "total", label: "Total", width: "100px", align: "right" },
      { key: "method", label: "Metode", width: "100px" },
      { key: "status", label: "Status", width: "100px" },
    ];

    // Untuk mobile yang sangat kecil, sembunyikan beberapa kolom
    if (isSmallMobile) {
      return baseColumns.filter(col => 
        !['customer', 'price', 'method'].includes(col.key)
      );
    }
    
    // Untuk mobile biasa, sembunyikan kolom tertentu
    if (isMobile) {
      return baseColumns.filter(col => 
        !['customer'].includes(col.key)
      );
    }

    return baseColumns;
  }, [isMobile, isSmallMobile]);

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

  // Handler untuk pindah tab - prevent layout shift
  const handleTabChange = (_, newValue) => {
    setTab(newValue);
    // Scroll ke atas dengan smooth behavior untuk mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Stack spacing={2} sx={{ 
      pb: { xs: 2, md: 2 },
      px: { xs: 1, sm: 2 }, // Padding horizontal yang responsif
      maxWidth: '100%',
      overflow: 'hidden'
    }}>
      {/* Header - Mobile First */}
      <Box sx={{ 
        pt: { xs: 1, sm: 2 },
        pb: 1
      }}>
        <Typography 
          variant="h4" 
          fontWeight={800} 
          gutterBottom
          sx={{ 
            fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' },
            background: `linear(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            textAlign: { xs: 'center', sm: 'left' }
          }}
        >
          Laporan
        </Typography>
        <Typography 
          color="text.secondary" 
          variant="body2"
          sx={{ 
            textAlign: { xs: 'center', sm: 'left' },
            fontSize: { xs: '0.875rem', sm: '1rem' }
          }}
        >
          Pantau performa penjualan dan analisa laba rugi
        </Typography>
      </Box>

      {/* Tab Navigation - Mobile Optimized */}
      <Card sx={{ 
        background: `linear(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        mx: { xs: -1, sm: 0 } // Full width on mobile
      }}>
        <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
          <Tabs
            value={tab}
            onChange={handleTabChange}
            textColor="primary"
            indicatorColor="primary"
            variant={isMobile ? "fullWidth" : "standard"}
            sx={{
              minHeight: { xs: 48, sm: 64 },
              '& .MuiTab-root': {
                fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
                fontWeight: 600,
                minHeight: { xs: 40, sm: 48 },
                minWidth: { xs: 'auto', sm: 120 },
                px: { xs: 1, sm: 2 },
                '&.Mui-selected': {
                  color: theme.palette.primary.main,
                },
              },
            }}
          >
            <Tab 
              icon={isSmallMobile ? <Inventory fontSize="small" /> : <Inventory />}
              iconPosition={isSmallMobile ? "top" : "start"}
              label={isSmallMobile ? "Penjualan" : "Penjualan"} 
              value="penjualan" 
            />
            <Tab 
              icon={isSmallMobile ? <TrendingUp fontSize="small" /> : <TrendingUp />}
              iconPosition={isSmallMobile ? "top" : "start"}
              label={isSmallMobile ? "Laba Rugi" : "Laba Rugi"} 
              value="labarugi" 
            />
          </Tabs>
        </CardContent>
      </Card>

      {/* Filter Section - Mobile Optimized */}
      <Card sx={{ mx: { xs: -1, sm: 0 } }}>
        <CardHeader 
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DateRange color="primary" fontSize={isSmallMobile ? "small" : "medium"} />
              <Typography variant="h6" fontSize={{ xs: '1rem', sm: '1.25rem' }}>
                Filter Periode
              </Typography>
            </Box>
          }
          sx={{ 
            pb: 1,
            px: { xs: 2, sm: 3 },
            pt: { xs: 2, sm: 3 }
          }}
        />
        <CardContent sx={{ px: { xs: 2, sm: 3 }, pt: 0 }}>
          <Stack spacing={2}>
            {/* Quick Date Buttons */}
            <Box>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                gutterBottom 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}
              >
                <Today fontSize={isSmallMobile ? "small" : "inherit"} />
                Periode Cepat:
              </Typography>
              <Stack direction="row" gap={1} flexWrap="wrap" useFlexGap>
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
                    sx={{ 
                      mb: 1,
                      fontSize: { xs: '0.7rem', sm: '0.8125rem' }
                    }}
                  />
                ))}
              </Stack>
            </Box>

            <Divider />

            {/* Custom Date Range */}
            <Box>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                gutterBottom 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}
              >
                <CalendarMonth fontSize={isSmallMobile ? "small" : "inherit"} />
                Periode Kustom:
              </Typography>
              <Grid container spacing={1.5}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Dari Tanggal"
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ 
                      min: MIN_DATE, 
                      max: maxAllowedDate(),
                      style: { fontSize: isSmallMobile ? '14px' : 'inherit' }
                    }}
                    size={isSmallMobile ? "small" : "medium"}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Sampai Tanggal"
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ 
                      min: MIN_DATE, 
                      max: maxAllowedDate(),
                      style: { fontSize: isSmallMobile ? '14px' : 'inherit' }
                    }}
                    size={isSmallMobile ? "small" : "medium"}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button 
                    fullWidth={isSmallMobile}
                    variant="contained" 
                    onClick={() => tab === "penjualan" 
                      ? handleExport(exportPenjualan, "Laporan Penjualan")
                      : handleExport(exportLabaRugi, "Laporan Laba Rugi")
                    }
                    startIcon={<Download />}
                    disabled={exportLoading || loading}
                    size={isSmallMobile ? "small" : "medium"}
                    sx={{ 
                      mt: 1,
                      minWidth: { sm: 'auto' }
                    }}
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
            background: `${theme.palette.error.main}08`,
            mx: { xs: -1, sm: 0 }
          }}
        >
          {err}
        </Alert>
      )}

      {/* TAB: PENJUALAN */}
      {tab === "penjualan" && (
        <Stack spacing={2} sx={{ mx: { xs: -1, sm: 0 } }}>
          {/* Summary Cards - Mobile Optimized */}
          {!loading && (
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={6}>
                <Card sx={{ 
                  background: `linear(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                }}>
                  <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Box sx={{ 
                        p: { xs: 1, sm: 1.5 }, 
                        borderRadius: 2, 
                        background: alpha(theme.palette.info.main, 0.1) 
                      }}>
                        <Inventory fontSize={isSmallMobile ? "small" : "medium"} color="info" />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography color="text.secondary" variant="body2" fontSize={{ xs: '0.75rem', sm: '0.875rem' }}>
                          Total Quantity
                        </Typography>
                        <Typography variant="h6" fontWeight={800} color="info.main" fontSize={{ xs: '1.1rem', sm: '1.25rem' }}>
                          {summarySales.qty.toLocaleString()}
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
                  <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Box sx={{ 
                        p: { xs: 1, sm: 1.5 }, 
                        borderRadius: 2, 
                        background: alpha(theme.palette.success.main, 0.1) 
                      }}>
                        <AttachMoney fontSize={isSmallMobile ? "small" : "medium"} color="success" />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography color="text.secondary" variant="body2" fontSize={{ xs: '0.75rem', sm: '0.875rem' }}>
                          Total Omzet
                        </Typography>
                        <Typography variant="h6" fontWeight={800} color="success.main" fontSize={{ xs: '1.1rem', sm: '1.25rem' }}>
                          {fmtIDR(summarySales.omzet)}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Data Table - Mobile Optimized */}
          <Card>
            <CardHeader 
              title={
                <Typography variant="h6" fontSize={{ xs: '1rem', sm: '1.25rem' }}>
                  Detail Transaksi Penjualan
                </Typography>
              }
              action={
                <Tooltip title="Menampilkan semua transaksi kecuali yang dibatalkan">
                  <IconButton size="small">
                    <Info fontSize={isSmallMobile ? "small" : "medium"} />
                  </IconButton>
                </Tooltip>
              }
              sx={{ 
                px: { xs: 2, sm: 3 },
                py: { xs: 1.5, sm: 2 }
              }}
            />
            <CardContent sx={{ p: 0 }}>
              {loading ? (
                <Box sx={{ p: 2 }}>
                  {[1, 2, 3, 4, 5].map((item) => (
                    <Skeleton key={item} height={48} sx={{ mb: 1 }} />
                  ))}
                </Box>
              ) : (
                <TableContainer 
                  component={Paper} 
                  elevation={0}
                  sx={{ 
                    maxHeight: { xs: 400, md: 600 },
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 1,
                    overflow: 'auto'
                  }}
                >
                  <Table 
                    size="small" 
                    stickyHeader
                    sx={{
                      minWidth: 400, // Minimum width untuk prevent layout break
                      '& .MuiTableCell-head': {
                        backgroundColor: theme.palette.background.default,
                        fontWeight: 700,
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        py: { xs: 1, sm: 1.5 }
                      },
                      '& .MuiTableCell-body': {
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        py: { xs: 1, sm: 1.5 }
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
                              minWidth: c.width,
                              px: { xs: 1, sm: 2 }
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
                          {columns.map((col) => (
                            <TableCell 
                              key={col.key}
                              align={col.align || "left"}
                              sx={{ 
                                px: { xs: 1, sm: 2 },
                                fontFamily: col.align === 'right' ? 'monospace' : 'inherit'
                              }}
                            >
                              {renderTableCell(r, col.key)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                      {!rows.length && (
                        <TableRow>
                          <TableCell colSpan={columns.length} sx={{ textAlign: 'center', py: 6 }}>
                            <Box sx={{ color: 'text.secondary' }}>
                              <Inventory sx={{ fontSize: { xs: 36, sm: 48 }, mb: 1, opacity: 0.5 }} />
                              <Typography variant="body1" gutterBottom fontSize={{ xs: '0.875rem', sm: '1rem' }}>
                                Tidak ada data transaksi
                              </Typography>
                              <Typography variant="body2" fontSize={{ xs: '0.75rem', sm: '0.875rem' }}>
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
        <Stack spacing={2} sx={{ mx: { xs: -1, sm: 0 } }}>
          {/* Info Card */}
          <Alert 
            severity="info" 
            variant="outlined"
            icon={<Info fontSize={isSmallMobile ? "small" : "medium"} />}
            sx={{ 
              border: `1px solid ${theme.palette.info.main}20`,
              background: `${theme.palette.info.main}08`
            }}
          >
            <Typography variant="body2" fontSize={{ xs: '0.75rem', sm: '0.875rem' }}>
              <strong>Hanya menampilkan transaksi Tunai dan status LUNAS.</strong><br />
              HPP menggunakan nilai dari pengaturan: <strong>{fmtIDR(settings.hpp || 0)} per tabung</strong>
            </Typography>
          </Alert>

          {/* Laba Rugi Cards - Mobile Optimized */}
          <Grid container spacing={1.5}>
            {[
              { 
                key: 'omzet', 
                label: 'Omzet (Dibayar)', 
                value: fmtIDR(lr.omzet), 
                color: 'primary',
                icon: <Receipt fontSize={isSmallMobile ? "small" : "medium"} />
              },
              { 
                key: 'hpp', 
                label: 'HPP', 
                value: fmtIDR(lr.hpp), 
                color: 'warning',
                icon: <Inventory fontSize={isSmallMobile ? "small" : "medium"} />
              },
              { 
                key: 'laba', 
                label: 'Laba/Rugi', 
                value: fmtIDR(lr.laba), 
                color: lr.laba >= 0 ? 'success' : 'error',
                icon: lr.laba >= 0 ? 
                  <TrendingUp fontSize={isSmallMobile ? "small" : "medium"} /> : 
                  <TrendingDown fontSize={isSmallMobile ? "small" : "medium"} />
              },
              { 
                key: 'margin', 
                label: 'Margin', 
                value: `${lr.margin}%`, 
                color: 'info',
                icon: <TrendingUp fontSize={isSmallMobile ? "small" : "medium"} />
              }
            ].map((item) => (
              <Grid item xs={12} sm={6} md={3} key={item.key}>
                <Card sx={{ 
                  background: `linear(135deg, ${alpha(theme.palette[item.color].main, 0.1)} 0%, ${alpha(theme.palette[item.color].main, 0.05)} 100%)`,
                  border: `1px solid ${alpha(theme.palette[item.color].main, 0.2)}`,
                  height: '100%'
                }}>
                  <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Box sx={{ 
                        p: { xs: 1, sm: 1.5 }, 
                        borderRadius: 2, 
                        background: alpha(theme.palette[item.color].main, 0.1) 
                      }}>
                        {item.icon}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography 
                          color="text.secondary" 
                          variant="body2" 
                          fontSize={{ xs: '0.75rem', sm: '0.875rem' }}
                          noWrap
                        >
                          {item.label}
                        </Typography>
                        <Typography 
                          variant="h6" 
                          fontWeight={800} 
                          color={`${item.color}.main`}
                          fontSize={{ xs: '1rem', sm: '1.25rem' }}
                          noWrap
                        >
                          {item.value}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Detailed Breakdown */}
          {!loading && (
            <Card>
              <CardHeader 
                title={
                  <Typography variant="h6" fontSize={{ xs: '1rem', sm: '1.25rem' }}>
                    Rincian Laba Rugi
                  </Typography>
                }
                sx={{ 
                  px: { xs: 2, sm: 3 },
                  py: { xs: 1.5, sm: 2 }
                }}
              />
              <CardContent sx={{ px: { xs: 2, sm: 3 } }}>
                <Stack spacing={2}>
                  <Box sx={{ 
                    p: { xs: 1.5, sm: 2 }, 
                    background: alpha(theme.palette.primary.main, 0.02), 
                    borderRadius: 1 
                  }}>
                    <RowKV k="Omzet (Transaksi Dibayar)" v={fmtIDR(lr.omzet)} />
                    <RowKV k="Harga Pokok Penjualan (HPP)" v={`- ${fmtIDR(lr.hpp)}`} />
                    <Divider sx={{ my: 1 }} />
                    <RowKV 
                      k="Laba Kotor" 
                      v={fmtIDR(lr.laba)} 
                      vSx={{ 
                        color: lr.laba >= 0 ? "success.main" : "error.main",
                        fontWeight: 800,
                        fontSize: { xs: '1rem', sm: '1.1rem' }
                      }}
                    />
                    <RowKV 
                      k="Margin Laba Kotor" 
                      v={`${lr.margin}%`}
                      vSx={{ 
                        color: "info.main",
                        fontWeight: 700,
                        fontSize: { xs: '0.875rem', sm: '1rem' }
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

/* Helper untuk render table cell */
function renderTableCell(row, key) {
  switch (key) {
    case 'created_at':
      return String(row.created_at || "").slice(0, 10);
    
    case 'customer':
      return (
        <Typography variant="body2" noWrap sx={{ maxWidth: 120 }}>
          {row.customer || "PUBLIC"}
        </Typography>
      );
    
    case 'qty':
      return row.qty;
    
    case 'price':
      return fmtIDR(row.price);
    
    case 'total':
      return (
        <Typography variant="body2" fontWeight={600}>
          {fmtIDR(row.total)}
        </Typography>
      );
    
    case 'method':
      return (
        <Chip
          icon={getMethodIcon(row.method)}
          label={row.method}
          size="small"
          variant="outlined"
          color={String(row.method).toUpperCase() === "TUNAI" ? "success" : "primary"}
        />
      );
    
    case 'status':
      return (
        <Chip
          label={row.status || "PENDING"}
          size="small"
          color={getStatusColor(row.status)}
          variant="filled"
        />
      );
    
    default:
      return row[key] || '';
  }
}

/* small row */
function RowKV({ k, v, vSx }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography 
        variant="body2" 
        color="text.secondary"
        fontSize={{ xs: '0.75rem', sm: '0.875rem' }}
      >
        {k}
      </Typography>
      <Typography 
        variant="body2" 
        sx={{ 
          fontWeight: 600, 
          fontSize: { xs: '0.75rem', sm: '0.875rem' },
          ...vSx 
        }}
      >
        {v}
      </Typography>
    </Stack>
  );
}