// src/components/views/Dashboard/sections/SevenDaysChartCard.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Card, CardHeader, CardContent, CardActions,
  Box, Stack, Typography, Chip, Divider,
  ToggleButtonGroup, ToggleButton,
  FormControl, Select, MenuItem, InputLabel, Tooltip, Alert,
  Table, TableHead, TableRow, TableCell, TableBody, useMediaQuery,
  Button, Skeleton
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import TimelineIcon from "@mui/icons-material/Timeline";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import BoltIcon from "@mui/icons-material/Bolt";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import DownloadIcon from "@mui/icons-material/Download";
import CloseIcon from "@mui/icons-material/Close";
import { DataService } from "../../../../services/DataService";

// ---------- Constants & Helpers ----------
const fmt = new Intl.NumberFormat("id-ID");
const fmtRp = (n) => (n || n === 0 ? `Rp ${fmt.format(Math.round(n))}` : "-");
const pct = (v) => `${v > 0 ? "+" : ""}${(v || 0).toFixed(1)}%`;
const deltaPct = (cur, prev) => (prev > 0 ? ((cur - prev) / prev) * 100 : 0);

// Precompute trends untuk menghindari perhitungan berulang
const computeTrendData = (rows) => {
  return rows.map((r, i, arr) => {
    const prev = arr[i - 1]?.value ?? 0;
    const trendSlice = arr.slice(Math.max(0, i - 5), i + 1).map(x => x.value);
    return {
      ...r,
      delta: deltaPct(r.value, prev),
      trendSlice
    };
  });
};

// ---------- Optimized Components ----------
const Spark = React.memo(function Spark({ values = [] }) {
  const max = Math.max(...values, 1);
  const w = 56, h = 20, gap = 2;
  const bw = (w - gap * (values.length - 1)) / Math.max(values.length, 1);
  
  return (
    <svg width={w} height={h} aria-hidden focusable="false">
      {values.map((v, i) => {
        const bh = Math.max(2, (v / max) * (h - 2));
        return (
          <rect
            key={i}
            x={i * (bw + gap)}
            y={h - bh}
            width={bw}
            height={bh}
            rx="2"
            fill="#2f7eea"
            opacity={i === values.length - 1 ? 1 : 0.6}
          />
        );
      })}
    </svg>
  );
});

const TableRowMemo = React.memo(function TableRowMemo({ row, showTrend }) {
  return (
    <TableRow hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
      <TableCell>
        <Typography variant="body2" fontWeight="medium">
          {row.label}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2" fontWeight="bold" color="primary">
          {fmt.format(row.value)}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2">
          {fmtRp(row.total)}
        </Typography>
      </TableCell>
      <TableCell align="center">
        <Chip
          size="small"
          color={row.delta > 0 ? "success" : row.delta < 0 ? "error" : "default"}
          variant="outlined"
          label={pct(row.delta)}
        />
      </TableCell>
      {showTrend && (
        <TableCell align="center">
          <Tooltip title={`Tren: ${row.trendSlice.join(", ")}`} enterTouchDelay={20}>
            <span>
              <Spark values={row.trendSlice} />
            </span>
          </Tooltip>
        </TableCell>
      )}
    </TableRow>
  );
});

const MobileCardItem = React.memo(function MobileCardItem({ row }) {
  return (
    <Card variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="body2" fontWeight="medium" color="text.primary">
            {row.label}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {fmtRp(row.total)}
          </Typography>
        </Box>
        <Stack alignItems="flex-end" spacing={0.5}>
          <Typography variant="body2" fontWeight="bold" color="primary">
            {fmt.format(row.value)}
          </Typography>
          <Chip
            size="small"
            color={row.delta > 0 ? "success" : row.delta < 0 ? "error" : "default"}
            variant="outlined"
            label={pct(row.delta)}
          />
        </Stack>
      </Stack>
    </Card>
  );
});

const DataTable = React.memo(function DataTable({ rows }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Precompute data sekali saja
  const processedRows = useMemo(() => computeTrendData(rows), [rows]);

  // Virtual scrolling untuk data banyak
  const visibleRows = useMemo(() => {
    // Batasi tampilan untuk performa
    return isMobile ? processedRows.slice(0, 50) : processedRows.slice(0, 100);
  }, [processedRows, isMobile]);

  if (isMobile) {
    return (
      <Stack spacing={1}>
        {visibleRows.map((row, i) => (
          <MobileCardItem key={`${row.label}-${i}`} row={row} />
        ))}
        {processedRows.length > visibleRows.length && (
          <Typography variant="caption" color="text.secondary" textAlign="center" sx={{ py: 1 }}>
            Menampilkan {visibleRows.length} dari {processedRows.length} data
          </Typography>
        )}
      </Stack>
    );
  }

  return (
    <Box sx={{ overflowX: "auto", maxHeight: 400, overflowY: "auto" }}>
      <Table 
        size="small" 
        stickyHeader
        sx={{ 
          minWidth: 560,
          border: "1px solid #eee", 
          borderRadius: 2,
          '& .MuiTableCell-root': { py: 1.5 },
          '& .MuiTableHead-root': { position: 'sticky', top: 0, zIndex: 1 }
        }}
      >
        <TableHead>
          <TableRow sx={{ bgcolor: "#f9fafb" }}>
            <TableCell><Typography variant="subtitle2">Periode</Typography></TableCell>
            <TableCell align="right"><Typography variant="subtitle2">Qty</Typography></TableCell>
            <TableCell align="right"><Typography variant="subtitle2">Omzet</Typography></TableCell>
            <TableCell align="center"><Typography variant="subtitle2">Δ% (prev)</Typography></TableCell>
            <TableCell align="center"><Typography variant="subtitle2">Tren</Typography></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {visibleRows.map((row, i) => (
            <TableRowMemo 
              key={`${row.label}-${i}`} 
              row={row} 
              showTrend={true}
            />
          ))}
        </TableBody>
      </Table>
      {processedRows.length > visibleRows.length && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', py: 1 }}>
          Menampilkan {visibleRows.length} dari {processedRows.length} data
        </Typography>
      )}
    </Box>
  );
});

// Loading Skeleton Component
function TableSkeleton() {
  const isMobile = useMediaQuery('(max-width:600px)');
  
  if (isMobile) {
    return (
      <Stack spacing={1}>
        {[1, 2, 3, 4, 5].map((item) => (
          <Skeleton key={item} variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
        ))}
      </Stack>
    );
  }

  return (
    <Box>
      <Skeleton variant="rectangular" height={40} sx={{ mb: 1, borderRadius: 1 }} />
      {[1, 2, 3, 4, 5, 6, 7].map((item) => (
        <Skeleton key={item} variant="rectangular" height={50} sx={{ mb: 0.5, borderRadius: 1 }} />
      ))}
    </Box>
  );
}

// Empty State Component
function EmptyState() {
  return (
    <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
      <TimelineIcon sx={{ fontSize: 48, mb: 2, opacity: 0.3 }} />
      <Typography variant="h6" gutterBottom>
        Tidak Ada Data
      </Typography>
      <Typography variant="body2">
        Tidak ada data penjualan untuk periode yang dipilih
      </Typography>
    </Box>
  );
}

// Helper function untuk process data
function processDataBasedOnMode(data, mode, month, year) {
  const months = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  
  if (!data || data.length === 0) {
    return { series: [], summary: null };
  }

  let series = [];
  let summary = null;

  try {
    switch (mode) {
      case "7_hari":
        series = data.map(r => ({
          label: new Date(r.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
          value: r.qty || 0,
          total: r.totalValue || null
        }));
        break;

      case "4_minggu":
        let totalQty4 = 0, totalValue4 = 0;
        series = data.map(w => {
          totalQty4 += w.value; 
          totalValue4 += w.totalValue;
          return { 
            label: w.label, 
            value: w.value, 
            total: w.totalValue 
          };
        });
        const last4 = series[3]?.value || 0;
        const prevAvg4 = series.slice(0,3).reduce((s,x)=>s+x.value,0)/3 || 0;
        const growth4 = prevAvg4 > 0 ? ((last4 - prevAvg4) / prevAvg4) * 100 : 0;
        summary = { 
          totalQty: totalQty4, 
          totalValue: totalValue4, 
          avgWeeklyQty: totalQty4/4, 
          growth: growth4 
        };
        break;

      case "mingguan_bulan":
        let totalQtyMonth = 0, totalValueMonth = 0;
        series = data.map(w => {
          totalQtyMonth += w.value; 
          totalValueMonth += w.totalValue;
          return { 
            label: w.label, 
            value: w.value, 
            total: w.totalValue 
          };
        });
        summary = {
          totalQty: totalQtyMonth,
          totalValue: totalValueMonth,
          avgWeeklyQty: series.length ? totalQtyMonth / series.length : 0,
          weekCount: series.length
        };
        break;

      case "6_bulan":
        let totalQty6 = 0;
        series = data.map(m => ({ 
          label: m.label, 
          value: m.value, 
          total: m.totalValue 
        }));
        totalQty6 = series.reduce((s,x)=>s+x.value,0);
        const last6 = series[5]?.value || 0;
        const prevAvg6 = series.slice(0,5).reduce((s,x)=>s+x.value,0)/5 || 0;
        const growth6 = prevAvg6 > 0 ? ((last6 - prevAvg6) / prevAvg6) * 100 : 0;
        summary = { 
          totalQty: totalQty6, 
          avgMonthlyQty: totalQty6/6, 
          growth: growth6 
        };
        break;

      default:
        series = data;
    }
  } catch (error) {
    console.error('Error processing data:', error);
    series = [];
    summary = null;
  }

  return { series, summary };
}

// ---------- Main Optimized Card ----------
export default function SevenDaysChartCard({ loading = false }) {
  const theme = useTheme();
  const [mode, setMode] = useState("7_hari");
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [series, setSeries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const months = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  const years = useMemo(() => [year - 1, year, year + 1], [year]);

  // Optimized load function
  const load = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true); 
    setError(null);
    
    try {
      let result;
      switch (mode) {
        case "7_hari":
          result = await DataService.getSevenDaySalesRealtime();
          break;
        case "4_minggu":
          result = await DataService.getLast4WeeksSales();
          break;
        case "mingguan_bulan":
          result = await DataService.getMonthlyWeeklyBreakdown(year, month);
          break;
        case "6_bulan":
          result = await DataService.getLast6MonthsSales();
          break;
        default:
          result = [];
      }

      const processedData = processDataBasedOnMode(result, mode, month, year);
      setSeries(processedData.series);
      setSummary(processedData.summary);
      
    } catch (e) {
      setError(`Gagal memuat data: ${e?.message || e}`);
      setSeries([]); 
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  }, [mode, month, year, isLoading]);

  // Debounced useEffect
  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [load]);

  const headline = useMemo(() => {
    switch (mode) {
      case "7_hari": return "7 Hari Terakhir";
      case "4_minggu": return "4 Minggu Terakhir";
      case "mingguan_bulan": return `Mingguan • ${months[month]} ${year}`;
      case "6_bulan": return "6 Bulan Terakhir";
      default: return "Penjualan";
    }
  }, [mode, month, year, months]);

  // Optimized handlers
  const handleModeChange = useCallback((_, newMode) => {
    if (newMode) setMode(newMode);
  }, []);

  const handleMonthChange = useCallback((event) => {
    setMonth(event.target.value);
  }, []);

  const handleYearChange = useCallback((event) => {
    setYear(event.target.value);
  }, []);

  const handleResetFilter = useCallback(() => {
    setMonth(new Date().getMonth());
    setYear(new Date().getFullYear());
  }, []);

  return (
    <Card sx={{ 
      borderRadius: 3,
      border: `1px solid ${theme.palette.divider}`,
      background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.background.default, 0.5)} 100%)`,
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      overflow: "hidden"
    }}>
      <CardHeader
        sx={{ 
          py: 2, 
          bgcolor: "background.paper", 
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}` 
        }}
        title={
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ 
              p: 0.5, 
              borderRadius: 1, 
              bgcolor: alpha(theme.palette.primary.main, 0.1) 
            }}>
              <TimelineIcon fontSize="small" color="primary" />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700}>Tren Penjualan</Typography>
              <Typography variant="caption" color="text.secondary">
                {headline}
              </Typography>
            </Box>
            {summary?.growth !== undefined && (
              <Chip 
                size="small" 
                color={summary.growth > 0 ? "success" : summary.growth < 0 ? "error" : "default"}
                icon={summary.growth > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                label={pct(summary.growth)} 
              />
            )}
            <Tooltip title="Update realtime, kalkulasi mengikuti kalender.">
              <InfoOutlinedIcon fontSize="small" sx={{ color: "text.secondary" }} />
            </Tooltip>
          </Stack>
        }
        action={
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="flex-start">
            <ToggleButtonGroup 
              size="small" 
              color="primary" 
              exclusive 
              value={mode} 
              onChange={handleModeChange}
              sx={{ 
                backgroundColor: alpha(theme.palette.primary.main, 0.04), 
                borderRadius: 2 
              }}
            >
              <ToggleButton value="7_hari">7h</ToggleButton>
              <ToggleButton value="4_minggu">4w</ToggleButton>
              <ToggleButton value="mingguan_bulan">Minggu/Bln</ToggleButton>
              <ToggleButton value="6_bulan">6m</ToggleButton>
            </ToggleButtonGroup>

            {(mode === "mingguan_bulan" || mode === "6_bulan") && (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <FormControl size="small" sx={{ minWidth: 120 }} disabled={isLoading || mode==="6_bulan"}>
                  <InputLabel>Bulan</InputLabel>
                  <Select value={month} label="Bulan" onChange={handleMonthChange}>
                    {months.map((m,i) => (
                      <MenuItem key={i} value={i}>{m}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 100 }} disabled={isLoading}>
                  <InputLabel>Tahun</InputLabel>
                  <Select value={year} label="Tahun" onChange={handleYearChange}>
                    {years.map(y => (
                      <MenuItem key={y} value={y}>{y}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {(month !== new Date().getMonth() || year !== new Date().getFullYear()) && (
                  <Chip 
                    size="small"
                    variant="filled"
                    label={`${months[month]} ${year}`}
                    onDelete={handleResetFilter}
                    deleteIcon={<CloseIcon />}
                    sx={{ mt: 0.5 }}
                  />
                )}
              </Stack>
            )}
          </Stack>
        }
      />

      <CardContent sx={{ backgroundColor: "background.paper", pt: 2 }}>
        {error && (
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {isLoading ? (
          <TableSkeleton />
        ) : series.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* KPI strip */}
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
              <Chip 
                icon={<BoltIcon />} 
                size="small"
                label={
                  mode==="7_hari" ? "Realtime aktif" : 
                  mode==="4_minggu" ? "Rolling 28 hari" : 
                  mode==="mingguan_bulan" ? "Mulai tgl 1" : 
                  "Termasuk bulan berjalan"
                }
                sx={{ 
                  bgcolor: alpha(theme.palette.info.main, 0.08), 
                  color: theme.palette.info.main,
                  fontWeight: 500
                }} 
              />
              <Chip 
                icon={<TrendingUpIcon />} 
                size="small"
                label={
                  mode==="6_bulan"
                    ? `Rata2/Bulan: ${summary ? fmt.format(Math.round(summary.avgMonthlyQty||0)) : "-"}`
                    : `Rata2/Minggu: ${summary ? fmt.format(Math.round(summary.avgWeeklyQty||0)) : "-"}`
                }
                sx={{ 
                  bgcolor: alpha(theme.palette.success.main, 0.08), 
                  color: theme.palette.success.main,
                  fontWeight: 500
                }} 
              />
              {summary && (mode==="4_minggu" || mode==="6_bulan") && (
                <Chip 
                  icon={<CalendarMonthIcon />} 
                  size="small"
                  label={
                    mode==="4_minggu" ? 
                    `Total 4 Minggu: ${fmt.format(summary.totalQty)}` : 
                    `Total 6 Bulan: ${fmt.format(summary.totalQty)}`
                  }
                  sx={{ 
                    bgcolor: alpha(theme.palette.warning.main, 0.08), 
                    color: theme.palette.warning.main,
                    fontWeight: 500
                  }} 
                />
              )}
            </Stack>

            {/* OPTIMIZED TABLE */}
            <DataTable rows={series} />

            {/* Summary footer */}
            {summary && (
              <>
                <Divider sx={{ my: 2 }} />
                <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap">
                  <Chip 
                    size="small" 
                    variant="outlined"
                    label={`Total: ${fmt.format(summary.totalQty || 0)}`} 
                  />
                  <Chip 
                    size="small" 
                    variant="outlined"
                    label={`Rata-rata: ${fmt.format(Math.round(summary.avgWeeklyQty || summary.avgMonthlyQty || 0))}`} 
                  />
                  <Chip 
                    size="small" 
                    color={summary.growth > 0 ? "success" : summary.growth < 0 ? "error" : "default"} 
                    label={`Growth: ${pct(summary.growth || 0)}`} 
                  />
                </Stack>
              </>
            )}
          </>
        )}
      </CardContent>

      <CardActions sx={{ 
        px: 2, 
        pb: 2, 
        pt: 0, 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        backgroundColor: "background.paper",
        flexWrap: 'wrap',
        gap: 1
      }}>
        <Typography variant="caption" color="text.secondary">
          Data sinkron, kecuali status <b>DIBATALKAN</b>.
        </Typography>
        
        <Stack direction="row" spacing={1}>
          <Button 
            size="small" 
            startIcon={<RefreshIcon />} 
            onClick={load}
            disabled={isLoading}
          >
            Refresh
          </Button>
          <Button 
            size="small" 
            startIcon={<DownloadIcon />}
            disabled={series.length === 0 || isLoading}
          >
            Export
          </Button>
        </Stack>
      </CardActions>
    </Card>
  );
}