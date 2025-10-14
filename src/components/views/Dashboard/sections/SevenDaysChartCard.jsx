// src/components/views/Dashboard/sections/SevenDaysChartCard.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Card, CardHeader, CardContent, CardActions,
  Box, Stack, Typography, Chip, Divider,
  ToggleButtonGroup, ToggleButton,
  FormControl, Select, MenuItem, InputLabel, Tooltip, Alert,
  Table, TableHead, TableRow, TableCell, TableBody, useMediaQuery,
  Button, Skeleton, IconButton
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
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { ChartsDataService } from "../../../../services/ChartsDataService";

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
  const w = 40, h = 16, gap = 1;
  const bw = (w - gap * (values.length - 1)) / Math.max(values.length, 1);
  
  return (
    <svg width={w} height={h} aria-hidden focusable="false">
      {values.map((v, i) => {
        const bh = Math.max(1, (v / max) * (h - 2));
        return (
          <rect
            key={i}
            x={i * (bw + gap)}
            y={h - bh}
            width={bw}
            height={bh}
            rx="1"
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
      <TableCell sx={{ py: 1, width: '25%' }}>
        <Typography variant="body2" fontSize="0.8rem" noWrap>
          {row.label}
        </Typography>
      </TableCell>
      <TableCell align="right" sx={{ py: 1, width: '20%' }}>
        <Typography variant="body2" fontWeight="bold" color="primary" fontSize="0.8rem">
          {fmt.format(row.value)}
        </Typography>
      </TableCell>
      <TableCell align="right" sx={{ py: 1, width: '25%' }}>
        <Typography variant="body2" fontSize="0.75rem" noWrap>
          {fmtRp(row.total)}
        </Typography>
      </TableCell>
      <TableCell align="center" sx={{ py: 1, width: '15%' }}>
        <Chip
          size="small"
          color={row.delta > 0 ? "success" : row.delta < 0 ? "error" : "default"}
          variant="outlined"
          label={pct(row.delta)}
          sx={{ height: 20, fontSize: '0.7rem', minWidth: 60 }}
        />
      </TableCell>
      {showTrend && (
        <TableCell align="center" sx={{ py: 1, width: '15%' }}>
          <Tooltip title={`Tren: ${row.trendSlice.join(", ")}`} enterTouchDelay={20}>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Spark values={row.trendSlice} />
            </Box>
          </Tooltip>
        </TableCell>
      )}
    </TableRow>
  );
});

const MobileCardItem = React.memo(function MobileCardItem({ row }) {
  return (
    <Box sx={{ 
      p: 1, 
      borderRadius: 1, 
      border: `1px solid #f0f0f0`,
      backgroundColor: '#fafafa'
    }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight="medium" fontSize="0.8rem" noWrap>
            {row.label}
          </Typography>
          <Typography variant="body2" color="text.secondary" fontSize="0.75rem" noWrap>
            {fmtRp(row.total)}
          </Typography>
        </Box>
        <Stack alignItems="flex-end" spacing={0.3} sx={{ minWidth: 0, flexShrink: 0 }}>
          <Typography variant="body2" fontWeight="bold" color="primary" fontSize="0.8rem" noWrap>
            {fmt.format(row.value)}
          </Typography>
          <Chip
            size="small"
            color={row.delta > 0 ? "success" : row.delta < 0 ? "error" : "default"}
            variant="outlined"
            label={pct(row.delta)}
            sx={{ height: 18, fontSize: '0.65rem', minWidth: 50 }}
          />
        </Stack>
      </Stack>
    </Box>
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
    return isMobile ? processedRows.slice(0, 30) : processedRows.slice(0, 50);
  }, [processedRows, isMobile]);

  if (isMobile) {
    return (
      <Box sx={{ width: '100%' }}>
        <Stack spacing={0.5}>
          {visibleRows.map((row, i) => (
            <MobileCardItem key={`${row.label}-${i}`} row={row} />
          ))}
        </Stack>
        {processedRows.length > visibleRows.length && (
          <Typography variant="caption" color="text.secondary" textAlign="center" sx={{ py: 0.5 }}>
            Menampilkan {visibleRows.length} dari {processedRows.length} data
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ 
      width: '100%', 
      overflowX: "auto",
      overflowY: "auto",
      '& .MuiTable-root': {
        minWidth: '100%',
        tableLayout: 'fixed'
      }
    }}>
      <Table 
        size="small" 
        stickyHeader
        sx={{ 
          width: '100%',
          minWidth: 500,
          tableLayout: 'fixed',
          border: "1px solid #f0f0f0", 
          borderRadius: 1,
          '& .MuiTableCell-root': { 
            py: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          },
          '& .MuiTableHead-root': { 
            position: 'sticky', 
            top: 0, 
            zIndex: 1,
            '& .MuiTableCell-root': {
              backgroundColor: '#f8f9fa',
              py: 1,
              fontSize: '0.75rem',
              fontWeight: 600
            }
          }
        }}
      >
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: '25%' }}>
              <Typography variant="subtitle2" fontSize="0.75rem" noWrap>
                Periode
              </Typography>
            </TableCell>
            <TableCell align="right" sx={{ width: '20%' }}>
              <Typography variant="subtitle2" fontSize="0.75rem" noWrap>
                Qty
              </Typography>
            </TableCell>
            <TableCell align="right" sx={{ width: '25%' }}>
              <Typography variant="subtitle2" fontSize="0.75rem" noWrap>
                Omzet
              </Typography>
            </TableCell>
            <TableCell align="center" sx={{ width: '15%' }}>
              <Typography variant="subtitle2" fontSize="0.75rem" noWrap>
                Δ%
              </Typography>
            </TableCell>
            <TableCell align="center" sx={{ width: '15%' }}>
              <Typography variant="subtitle2" fontSize="0.75rem" noWrap>
                Tren
              </Typography>
            </TableCell>
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
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', py: 0.5 }}>
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
      <Stack spacing={0.5}>
        {[1, 2, 3, 4, 5].map((item) => (
          <Skeleton key={item} variant="rectangular" height={60} sx={{ borderRadius: 1 }} />
        ))}
      </Stack>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Skeleton variant="rectangular" height={32} sx={{ mb: 0.5, borderRadius: 1 }} />
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <Skeleton key={item} variant="rectangular" height={38} sx={{ mb: 0.3, borderRadius: 0.5 }} />
      ))}
    </Box>
  );
}

// Empty State Component
function EmptyState() {
  return (
    <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary', width: '100%' }}>
      <TimelineIcon sx={{ fontSize: 36, mb: 1, opacity: 0.3 }} />
      <Typography variant="body2" gutterBottom>
        Tidak Ada Data
      </Typography>
      <Typography variant="caption">
        Tidak ada data penjualan untuk periode yang dipilih
      </Typography>
    </Box>
  );
}

// Helper function untuk process data
function processDataBasedOnMode(data, mode, month, year) {
  const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];
  
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

// ---------- Main Compact Card ----------
export default function SevenDaysChartCard({ loading = false }) {
  const theme = useTheme();
  const [mode, setMode] = useState("7_hari");
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [series, setSeries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];
  const years = useMemo(() => [year - 1, year, year + 1], [year]);

  // ✅ FIXED: Layout-stable useEffect dengan ChartsDataService
  useEffect(() => {
    const loadData = async () => {
      if (isLoading) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        let result;
        switch (mode) {
          case "7_hari":
            result = await ChartsDataService.getSevenDaySalesRealtime();
            break;
          case "4_minggu":
            result = await ChartsDataService.getLast4WeeksSales();
            break;
          case "mingguan_bulan":
            result = await ChartsDataService.getMonthlyWeeklyBreakdown(year, month);
            break;
          case "6_bulan":
            result = await ChartsDataService.getLast6MonthsSales();
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
    };

    const timer = setTimeout(loadData, 300);
    return () => clearTimeout(timer);
  }, [mode, month, year]); // ✅ Dependencies yang stabil

  const headline = useMemo(() => {
    switch (mode) {
      case "7_hari": return "7 Hari Terakhir";
      case "4_minggu": return "4 Minggu Terakhir";
      case "mingguan_bulan": return `Mingguan • ${months[month]} ${year}`;
      case "6_bulan": return "6 Bulan Terakhir";
      default: return "Penjualan";
    }
  }, [mode, month, year, months]);

  // Optimized handlers dengan layout stability
  const handleModeChange = useCallback((_, newMode) => {
    if (newMode) {
      setMode(newMode);
      // Reset filter ketika ganti mode untuk konsistensi layout
      if (newMode !== "mingguan_bulan") {
        setMonth(new Date().getMonth());
        setYear(new Date().getFullYear());
      }
    }
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

  // Manual refresh function dengan ChartsDataService
  const handleManualRefresh = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      let result;
      switch (mode) {
        case "7_hari":
          result = await ChartsDataService.getSevenDaySalesRealtime();
          break;
        case "4_minggu":
          result = await ChartsDataService.getLast4WeeksSales();
          break;
        case "mingguan_bulan":
          result = await ChartsDataService.getMonthlyWeeklyBreakdown(year, month);
          break;
        case "6_bulan":
          result = await ChartsDataService.getLast6MonthsSales();
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

  return (
    <Card sx={{ 
      width: '100%',
      maxWidth: '100%',
      borderRadius: 2,
      border: `1px solid ${theme.palette.divider}`,
      background: theme.palette.background.paper,
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      overflow: "hidden",
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box'
    }}>
      <CardHeader
        sx={{ 
          py: 1.5, 
          px: 2,
          bgcolor: "background.paper", 
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          width: '100%',
          boxSizing: 'border-box'
        }}
        title={
          <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
            <Box sx={{ 
              p: 0.5, 
              borderRadius: 0.5, 
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              flexShrink: 0
            }}>
              <TimelineIcon fontSize="small" color="primary" />
            </Box>
            <Box flex={1} sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={600} fontSize="0.9rem" noWrap>
                Tren Penjualan
              </Typography>
              <Typography variant="caption" color="text.secondary" fontSize="0.7rem" noWrap>
                {headline}
              </Typography>
            </Box>
            {summary?.growth !== undefined && (
              <Chip 
                size="small" 
                color={summary.growth > 0 ? "success" : summary.growth < 0 ? "error" : "default"}
                icon={summary.growth > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                label={pct(summary.growth)} 
                sx={{ height: 20, fontSize: '0.7rem', flexShrink: 0 }}
              />
            )}
          </Stack>
        }
        action={
          <Box sx={{ 
            flexShrink: 0,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 0.5, sm: 0.5 },
            alignItems: { xs: 'flex-end', sm: 'center' }
          }}>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <ToggleButtonGroup 
                size="small" 
                color="primary" 
                exclusive 
                value={mode} 
                onChange={handleModeChange}
                sx={{ 
                  backgroundColor: alpha(theme.palette.primary.main, 0.04), 
                  borderRadius: 1,
                  '& .MuiToggleButton-root': {
                    px: 1,
                    py: 0.5,
                    fontSize: '0.7rem',
                    minWidth: 'auto',
                    border: '1px solid transparent',
                    '&.Mui-selected': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.12),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
                    }
                  }
                }}
              >
                <ToggleButton value="7_hari">7h</ToggleButton>
                <ToggleButton value="4_minggu">4w</ToggleButton>
                <ToggleButton value="mingguan_bulan">M/B</ToggleButton>
                <ToggleButton value="6_bulan">6m</ToggleButton>
              </ToggleButtonGroup>

              <Tooltip title="Info tren penjualan">
                <IconButton size="small">
                  <InfoOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
        }
      />

      <CardContent sx={{ 
        width: '100%',
        maxWidth: '100%',
        backgroundColor: "background.paper", 
        pt: 1, 
        pb: 1, 
        px: 2,
        flex: 1,
        overflow: 'auto',
        boxSizing: 'border-box'
      }}>
        {error && (
          <Alert severity="warning" sx={{ mb: 1, borderRadius: 1, py: 0, width: '100%' }} size="small">
            {error}
          </Alert>
        )}

        {/* Filter controls untuk mode tertentu - FIXED LAYOUT */}
        {(mode === "mingguan_bulan" || mode === "6_bulan") && (
          <Stack direction="row" spacing={1} sx={{ mb: 1.5, width: '100%' }} alignItems="center" flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 80, flex: 1 }} disabled={isLoading || mode==="6_bulan"}>
              <Select 
                value={month} 
                onChange={handleMonthChange}
                sx={{ fontSize: '0.75rem', height: '32px' }}
              >
                {months.map((m,i) => (
                  <MenuItem key={i} value={i} sx={{ fontSize: '0.75rem' }}>{m}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 80, flex: 1 }} disabled={isLoading}>
              <Select 
                value={year} 
                onChange={handleYearChange}
                sx={{ fontSize: '0.75rem', height: '32px' }}
              >
                {years.map(y => (
                  <MenuItem key={y} value={y} sx={{ fontSize: '0.75rem' }}>{y}</MenuItem>
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
                sx={{ height: 24, fontSize: '0.7rem', flexShrink: 0 }}
              />
            )}
          </Stack>
        )}

        {isLoading ? (
          <TableSkeleton />
        ) : series.length === 0 ? (
          <EmptyState />
        ) : (
          <Box sx={{ width: '100%', maxWidth: '100%' }}>
            {/* KPI strip - lebih kompak */}
            <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap" sx={{ mb: 1.5, width: '100%' }}>
              <Chip 
                size="small"
                label={
                  mode==="7_hari" ? "Realtime" : 
                  mode==="4_minggu" ? "28 hari" : 
                  mode==="mingguan_bulan" ? "Mulai tgl 1" : 
                  "Bulan berjalan"
                }
                sx={{ 
                  bgcolor: alpha(theme.palette.info.main, 0.08), 
                  color: theme.palette.info.main,
                  fontWeight: 500,
                  height: 20,
                  fontSize: '0.65rem'
                }} 
              />
              <Chip 
                size="small"
                label={
                  mode==="6_bulan"
                    ? `Rata2/Bln: ${summary ? fmt.format(Math.round(summary.avgMonthlyQty||0)) : "-"}`
                    : `Rata2/Mgg: ${summary ? fmt.format(Math.round(summary.avgWeeklyQty||0)) : "-"}`
                }
                sx={{ 
                  bgcolor: alpha(theme.palette.success.main, 0.08), 
                  color: theme.palette.success.main,
                  fontWeight: 500,
                  height: 20,
                  fontSize: '0.65rem'
                }} 
              />
              {summary && (mode==="4_minggu" || mode==="6_bulan") && (
                <Chip 
                  size="small"
                  label={
                    mode==="4_minggu" ? 
                    `Total: ${fmt.format(summary.totalQty)}` : 
                    `Total: ${fmt.format(summary.totalQty)}`
                  }
                  sx={{ 
                    bgcolor: alpha(theme.palette.warning.main, 0.08), 
                    color: theme.palette.warning.main,
                    fontWeight: 500,
                    height: 20,
                    fontSize: '0.65rem'
                  }} 
                />
              )}
            </Stack>

            {/* OPTIMIZED TABLE dengan lebar tetap */}
            <DataTable rows={series} />

            {/* Summary footer - lebih minimalis */}
            {summary && (
              <>
                <Divider sx={{ my: 1 }} />
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ width: '100%' }}>
                  <Typography variant="caption" fontWeight="medium">
                    Total: {fmt.format(summary.totalQty || 0)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Rata: {fmt.format(Math.round(summary.avgWeeklyQty || summary.avgMonthlyQty || 0))}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    color={summary.growth > 0 ? "success.main" : summary.growth < 0 ? "error.main" : "text.secondary"}
                    fontWeight="medium"
                  >
                    Growth: {pct(summary.growth || 0)}
                  </Typography>
                </Stack>
              </>
            )}
          </Box>
        )}
      </CardContent>

      <CardActions sx={{ 
        px: 1.5, 
        py: 1,
        width: '100%',
        maxWidth: '100%',
        backgroundColor: "background.paper",
        borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        boxSizing: 'border-box'
      }}>
        <Typography variant="caption" color="text.secondary" fontSize="0.7rem" flex={1} noWrap>
          Data sinkron, kecuali status <b>DIBATALKAN</b>.
        </Typography>
        
        <Stack direction="row" spacing={0.5}>
          <IconButton 
            size="small" 
            onClick={handleManualRefresh}
            disabled={isLoading}
            sx={{ width: 32, height: 32 }}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
          <IconButton 
            size="small"
            disabled={series.length === 0 || isLoading}
            sx={{ width: 32, height: 32 }}
          >
            <DownloadIcon fontSize="small" />
          </IconButton>
        </Stack>
      </CardActions>
    </Card>
  );
}