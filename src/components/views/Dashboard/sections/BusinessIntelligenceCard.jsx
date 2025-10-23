// src/components/views/Dashboard/sections/BusinessIntelligenceCard.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  Card, CardContent, Typography, Box, Stack, Alert, Chip, Tooltip, 
  CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Paper, IconButton, Divider, Grid
} from "@mui/material";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import InfoIcon from "@mui/icons-material/Info";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import HistoryIcon from "@mui/icons-material/History";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import PeopleIcon from "@mui/icons-material/People";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import InventoryIcon from "@mui/icons-material/Inventory";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import { DataService } from "../../../../services/DataService.js";

const formatCurrency = (amount) => {
  if (amount == null || amount === 0) return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
};

const formatNumber = (num) => {
  if (num == null) return '-';
  return new Intl.NumberFormat('id-ID').format(num);
};

// 🔥 FILTER UNTUK MENGHAPUS ADVICE TENTANG STOK
const filterStockRelatedAdvice = (advice) => {
  if (!advice) return null;
  
  const stockKeywords = ['stok', 'restock', 'tabung', 'kekurangan', 'aman', 'hari', 'risiko'];
  const message = advice.message?.toLowerCase() || '';
  const title = advice.title?.toLowerCase() || '';
  
  // Cek apakah advice mengandung kata-kata terkait stok
  const hasStockReference = stockKeywords.some(keyword => 
    message.includes(keyword) || title.includes(keyword)
  );
  
  return hasStockReference ? null : advice;
};

// 🔥 FUNGSI UNTUK MENDAPATKAN DATA PERBANDINGAN BULANAN
const getMonthlyComparisonData = async () => {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    // Data untuk September dan Oktober
    const septemberData = await DataService.getMonthlyWeeklyBreakdown(currentYear, 8); // September (0-indexed)
    const octoberData = await DataService.getMonthlyWeeklyBreakdown(currentYear, 9); // Oktober (0-indexed)

    console.log('📊 Data September:', septemberData);
    console.log('📊 Data Oktober:', octoberData);

    return {
      september: septemberData || [],
      october: octoberData || []
    };

  } catch (error) {
    console.error('Error mengambil data perbandingan bulanan:', error);
    return { september: [], october: [] };
  }
};

// 🔥 FUNGSI UNTUK MENDAPATKAN DATA 7 HARI TERAKHIR
const getSevenDaysSalesData = async () => {
  try {
    const sevenDaysData = await DataService.getSevenDaySalesRealtime?.();
    
    if (!sevenDaysData || !Array.isArray(sevenDaysData)) {
      console.warn('Data 7 hari tidak tersedia');
      return null;
    }

    const validData = sevenDaysData
      .filter(item => item && (item.qty !== undefined && item.qty !== null))
      .map(item => ({
        date: item.date,
        qty: Number(item.qty) || 0,
        totalValue: Number(item.totalValue) || 0
      }));

    return validData;

  } catch (error) {
    console.error('Error mengambil data 7 hari:', error);
    return null;
  }
};

// 🔥 HITUNG RATA-RATA HARIAN
const calculateAccurateDailyAverage = (salesData) => {
  if (!salesData || salesData.length === 0) return 0;

  const daysWithSales = salesData.filter(day => day.qty > 0);
  if (daysWithSales.length === 0) return 0;

  const totalQty = daysWithSales.reduce((sum, day) => sum + day.qty, 0);
  return Math.round(totalQty / daysWithSales.length);
};

// 🔥 ANALISIS TREN PENJUALAN
const calculateSalesTrend = (salesData) => {
  if (!salesData || salesData.length < 2) return null;
  
  const recentData = salesData.slice(-3);
  const previousData = salesData.slice(-6, -3);
  
  const recentAvg = recentData.reduce((a, b) => a + (b.qty || 0), 0) / recentData.length;
  const previousAvg = previousData.reduce((a, b) => a + (b.qty || 0), 0) / previousData.length;
  
  const changePercent = previousAvg > 0 ? 
    ((recentAvg - previousAvg) / previousAvg) * 100 : 0;
  
  return {
    direction: changePercent > 5 ? 'naik' : changePercent < -5 ? 'turun' : 'stabil',
    percentage: Math.abs(changePercent).toFixed(1),
    value: changePercent
  };
};

export default function BusinessIntelligenceCard() {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const [topCustomers, setTopCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerHistory, setCustomerHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [monthlyComparison, setMonthlyComparison] = useState(null);
  const [sevenDaysData, setSevenDaysData] = useState(null);

  const { loading, error, data } = state;

  // 🔥 FILTER ADVICE UNTUK MENGHAPUS YANG TENTANG STOK
  const filteredAdvice = useMemo(() => {
    return data?.advice ? filterStockRelatedAdvice(data.advice) : null;
  }, [data?.advice]);

  useEffect(() => {
    let alive = true;
    
    (async () => {
      try {
        const res = await DataService.getAIInsightsV2?.() || await DataService.getAIInsights?.();
        if (!alive) return;
        setState({ loading: false, error: null, data: res });
        
        setCustomersLoading(true);
        
        // 🔥 AMBIL DATA PERBANDINGAN BULANAN
        const monthlyData = await getMonthlyComparisonData();
        if (!alive) return;
        setMonthlyComparison(monthlyData);

        // 🔥 AMBIL DATA 7 HARI TERAKHIR
        const sevenDaysSales = await getSevenDaysSalesData();
        if (!alive) return;
        setSevenDaysData(sevenDaysSales);

        // 🔥 TOP CUSTOMERS - SEMUA WAKTU (BUKAN HANYA BULAN BERJALAN)
        const topCust = await DataService.getTopCustomersPeriod({
          period: "all_time", // Ubah dari "this_month" ke "all_time"
          limit: 5,
          onlyPaid: true
        });
        
        if (!alive) return;
        setTopCustomers(topCust || []);
        
      } catch (e) {
        if (!alive) return;
        setState({ loading: false, error: e, data: null });
      } finally {
        if (alive) setCustomersLoading(false);
      }
    })();
    
    return () => { alive = false; };
  }, []);

  // 🔥 ANALISIS DATA PERBANDINGAN BULANAN
  const monthlyAnalysis = useMemo(() => {
    if (!monthlyComparison) return null;

    const { september, october } = monthlyComparison;

    // Hitung total untuk September
    const septTotalQty = september.reduce((sum, week) => sum + (week.value || 0), 0);
    const septTotalRevenue = september.reduce((sum, week) => sum + (week.totalValue || 0), 0);
    const septWeeks = september.length;

    // Hitung total untuk Oktober
    const octTotalQty = october.reduce((sum, week) => sum + (week.value || 0), 0);
    const octTotalRevenue = october.reduce((sum, week) => sum + (week.totalValue || 0), 0);
    const octWeeks = october.length;

    // Hitung perubahan
    const qtyChange = septTotalQty > 0 ? ((octTotalQty - septTotalQty) / septTotalQty) * 100 : 0;
    const revenueChange = septTotalRevenue > 0 ? ((octTotalRevenue - septTotalRevenue) / septTotalRevenue) * 100 : 0;

    return {
      september: {
        totalQty: septTotalQty,
        totalRevenue: septTotalRevenue,
        weeks: septWeeks,
        avgWeeklyQty: septWeeks > 0 ? Math.round(septTotalQty / septWeeks) : 0
      },
      october: {
        totalQty: octTotalQty,
        totalRevenue: octTotalRevenue,
        weeks: octWeeks,
        avgWeeklyQty: octWeeks > 0 ? Math.round(octTotalQty / octWeeks) : 0
      },
      changes: {
        qty: qtyChange,
        revenue: revenueChange
      }
    };
  }, [monthlyComparison]);

  // 🔥 ANALISIS DATA 7 HARI
  const sevenDaysAnalysis = useMemo(() => {
    if (!sevenDaysData) return null;

    const dailyAverage = calculateAccurateDailyAverage(sevenDaysData);
    const trend = calculateSalesTrend(sevenDaysData);
    const total7Days = sevenDaysData.reduce((sum, day) => sum + day.qty, 0);
    const revenue7Days = sevenDaysData.reduce((sum, day) => sum + day.totalValue, 0);

    return {
      dailyAverage,
      trend,
      total7Days,
      revenue7Days,
      dataPoints: sevenDaysData.length
    };
  }, [sevenDaysData]);

  const handleCustomerClick = async (customer) => {
    setSelectedCustomer(customer);
    setModalOpen(true);
    setHistoryLoading(true);
    
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3); // 3 bulan terakhir
      
      const history = await DataService.getCustomerSalesByRange({
        from: startDate.toISOString().split('T')[0],
        to: endDate.toISOString().split('T')[0],
        customer: customer.customer_name || customer.customer,
        onlyPaid: false,
        limit: 100
      });

      const validHistory = history.filter(transaction => 
        String(transaction.status || '').toUpperCase() !== 'DIBATALKAN'
      );
      
      setCustomerHistory(validHistory || []);
    } catch (error) {
      console.error('Error fetching customer history:', error);
      setCustomerHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedCustomer(null);
    setCustomerHistory([]);
  };

  const CustomerHistoryModal = () => (
    <Dialog 
      open={modalOpen} 
      onClose={handleCloseModal}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            📊 Riwayat Transaksi
          </Typography>
          <IconButton onClick={handleCloseModal} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        {selectedCustomer && (
          <Typography variant="body2" color="text.secondary">
            {selectedCustomer.customer_name || selectedCustomer.customer}
          </Typography>
        )}
      </DialogTitle>
      
      <DialogContent>
        {historyLoading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : customerHistory.length === 0 ? (
          <Box textAlign="center" py={4}>
            <HistoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Tidak ada riwayat transaksi
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Tanggal</strong></TableCell>
                  <TableCell align="right"><strong>Qty</strong></TableCell>
                  <TableCell align="right"><strong>Harga</strong></TableCell>
                  <TableCell align="right"><strong>Total</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customerHistory.map((transaction, index) => (
                  <TableRow key={transaction.id || index}>
                    <TableCell>
                      {new Date(transaction.created_at).toLocaleDateString('id-ID')}
                    </TableCell>
                    <TableCell align="right">
                      <Chip 
                        label={`${transaction.qty} tabung`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {formatCurrency(transaction.price)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(transaction.total)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={transaction.status}
                        size="small"
                        color={
                          transaction.status === 'LUNAS' ? 'success' :
                          transaction.status === 'HUTANG' ? 'warning' : 'default'
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
                
                <TableRow sx={{ backgroundColor: 'grey.50' }}>
                  <TableCell colSpan={1}>
                    <Typography variant="body2" fontWeight="bold">
                      TOTAL
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold">
                      {customerHistory.reduce((sum, t) => sum + (t.qty || 0), 0)} tabung
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="text.secondary">
                      -
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(customerHistory.reduce((sum, t) => sum + (t.total || 0), 0))}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {customerHistory.length} transaksi
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleCloseModal}>Tutup</Button>
      </DialogActions>
    </Dialog>
  );

  // 🔥 KOMPONEN PERBANDINGAN BULANAN
  const MonthlyComparisonSection = () => {
    if (!monthlyAnalysis) return null;

    const { september, october, changes } = monthlyAnalysis;

    return (
      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <CompareArrowsIcon color="primary" />
          <Typography variant="subtitle2" fontWeight="bold">
            Perbandingan September vs Oktober
          </Typography>
        </Box>
        
        <Grid container spacing={2}>
          {/* September */}
          <Grid item xs={12} sm={6}>
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.100', height: '100%' }}>
              <Typography variant="body2" fontWeight="bold" gutterBottom color="primary.main">
                📅 September
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="primary.main" gutterBottom>
                {formatNumber(september.totalQty)} tabung
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {formatCurrency(september.totalRevenue)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Rata-rata: {formatNumber(september.avgWeeklyQty)} tabung/minggu
              </Typography>
            </Box>
          </Grid>

          {/* Oktober */}
          <Grid item xs={12} sm={6}>
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: changes.qty >= 0 ? 'success.50' : 'warning.50', border: '1px solid', borderColor: changes.qty >= 0 ? 'success.100' : 'warning.100', height: '100%' }}>
              <Typography variant="body2" fontWeight="bold" gutterBottom color={changes.qty >= 0 ? 'success.main' : 'warning.main'}>
                📅 Oktober
              </Typography>
              <Typography variant="h6" fontWeight="bold" color={changes.qty >= 0 ? 'success.main' : 'warning.main'} gutterBottom>
                {formatNumber(october.totalQty)} tabung
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {formatCurrency(october.totalRevenue)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Rata-rata: {formatNumber(october.avgWeeklyQty)} tabung/minggu
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Summary Perubahan */}
        <Box sx={{ mt: 2, p: 1.5, borderRadius: 1, bgcolor: 'background.paper' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" fontWeight="bold">
              Perubahan:
            </Typography>
            <Box textAlign="right">
              <Chip 
                label={
                  changes.qty >= 0 ? 
                  `📈 +${changes.qty.toFixed(1)}%` : 
                  `📉 ${changes.qty.toFixed(1)}%`
                }
                size="small"
                color={changes.qty >= 0 ? 'success' : 'error'}
                variant="outlined"
              />
            </Box>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            {changes.qty >= 0 ? 'Peningkatan' : 'Penurunan'} dalam jumlah tabung terjual
          </Typography>
        </Box>
      </Box>
    );
  };

  // 🔥 KOMPONEN STATISTIK 7 HARI
  const SevenDaysStats = () => {
    if (!sevenDaysAnalysis) return null;

    return (
      <Box sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 2, border: '1px solid', borderColor: 'primary.100' }}>
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="primary.main">
          📈 Performa 7 Hari Terakhir
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Box textAlign="center">
              <Typography variant="h4" fontWeight="bold" color="primary.main">
                {formatNumber(sevenDaysAnalysis.total7Days)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Tabung
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box textAlign="center">
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {formatNumber(sevenDaysAnalysis.dailyAverage)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Rata-rata / Hari
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {sevenDaysAnalysis.trend && (
          <Box sx={{ mt: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" fontWeight="medium">
                Tren:
              </Typography>
              <Chip 
                label={
                  sevenDaysAnalysis.trend.direction === 'naik' ? `📈 Naik ${sevenDaysAnalysis.trend.percentage}%` :
                  sevenDaysAnalysis.trend.direction === 'turun' ? `📉 Turun ${sevenDaysAnalysis.trend.percentage}%` :
                  '➡️ Stabil'
                }
                size="small"
                color={
                  sevenDaysAnalysis.trend.direction === 'naik' ? 'success' :
                  sevenDaysAnalysis.trend.direction === 'turun' ? 'error' : 'default'
                }
                variant="outlined"
              />
            </Box>
          </Box>
        )}
      </Box>
    );
  };

  // 🔥 KOMPONEN TOP CUSTOMERS (SEMUA WAKTU)
  const TopCustomersSection = () => {
    if (!topCustomers || topCustomers.length === 0) return null;

    return (
      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <PeopleIcon color="primary" />
          <Typography variant="subtitle2" fontWeight="bold">
            Top 5 Pelanggan (Sepanjang Masa)
          </Typography>
          <Tooltip title="Berdasarkan total nilai transaksi sepanjang waktu">
            <InfoIcon fontSize="small" color="action" />
          </Tooltip>
        </Box>
        
        <Stack spacing={1.5}>
          {topCustomers.slice(0, 5).map((customer, index) => (
            <Box 
              key={customer.customer_name || customer.customer || index}
              onClick={() => handleCustomerClick(customer)}
              sx={{
                p: 1.5,
                borderRadius: 2,
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: 'background.paper',
                border: '1px solid #e0e0e0',
                '&:hover': {
                  backgroundColor: 'primary.light',
                  transform: 'translateY(-1px)',
                  boxShadow: 1
                }
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight="medium" noWrap>
                    {index + 1}. {customer.customer_name || customer.customer || 'N/A'}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                    <Typography variant="caption" color="text.secondary">
                      {customer.total_qty || 0} tabung
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      •
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {customer.total_transaksi || 0} transaksi
                    </Typography>
                  </Stack>
                </Box>
                <Box sx={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" fontWeight="bold" color="primary.main">
                    {formatCurrency(customer.total_value)}
                  </Typography>
                  <Tooltip title="Klik untuk lihat riwayat 3 bulan terakhir">
                    <HistoryIcon fontSize="small" color="action" />
                  </Tooltip>
                </Box>
              </Box>
            </Box>
          ))}
        </Stack>
      </Box>
    );
  };

  // 🔥 KOMPONEN KPI SUMMARY
  const KPISummary = () => {
    if (!data?.kpi) return null;

    return (
      <Box sx={{ p: 2, bgcolor: 'success.50', borderRadius: 2, border: '1px solid', borderColor: 'success.100' }}>
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="success.main">
          📊 Kinerja Utama (MTD)
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Box textAlign="center">
              <InventoryIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h6" fontWeight="bold" color="primary.main">
                {formatCurrency(data.kpi.omzet)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Omzet
              </Typography>
            </Box>
          </Grid>
          
          {data.kpi.laba != null && (
            <Grid item xs={6}>
              <Box textAlign="center">
                <AttachMoneyIcon color="success" sx={{ fontSize: 32, mb: 1 }} />
                <Typography 
                  variant="h6" 
                  fontWeight="bold"
                  color={data.kpi.laba >= 0 ? 'success.main' : 'error.main'}
                >
                  {formatCurrency(data.kpi.laba)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Laba Bersih
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>

        {data.kpi.margin != null && (
          <Box sx={{ mt: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2">
                Margin:
              </Typography>
              <Chip 
                label={`${data.kpi.margin.toFixed(1)}%`}
                size="small"
                color={data.kpi.margin >= 20 ? 'success' : data.kpi.margin >= 10 ? 'warning' : 'error'}
              />
            </Box>
          </Box>
        )}
      </Box>
    );
  };

  if (loading) {
    return (
      <Card sx={{ width: '100%', maxWidth: '100%', borderRadius: 2, boxShadow: 2 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box>
              <Typography variant="h6" fontWeight="bold">Business Intelligence</Typography>
              <Typography variant="caption" color="text.secondary">
                Sedang memuat analisis...
              </Typography>
            </Box>
            <CircularProgress size={24} />
          </Box>
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ width: '100%', maxWidth: '100%', borderRadius: 2, boxShadow: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight="bold">Business Intelligence</Typography>
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {error?.message || "Gagal memuat analisis bisnis"}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card sx={{ width: '100%', maxWidth: '100%', borderRadius: 2, boxShadow: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight="bold">Business Intelligence</Typography>
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Data analisis tidak tersedia saat ini.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ 
      width: '100%', 
      maxWidth: '100%', 
      borderRadius: 2, 
      boxShadow: 2,
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
      <CardContent>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
          <Box>
            <Typography variant="h5" gutterBottom fontWeight="bold" color="primary.main">
              Business Intelligence
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Analisis mendalam performa bisnis Anda
            </Typography>
          </Box>
          <Tooltip title={`Terakhir update: ${new Date(data.generated_at || Date.now()).toLocaleString("id-ID")}`}>
            <Chip 
              label="AI Powered" 
              color="primary" 
              size="small" 
              icon={<AnalyticsIcon />} 
              sx={{ fontWeight: 'bold' }}
            />
          </Tooltip>
        </Box>

        <Stack spacing={3}>
          {/* AI Insight */}
          {data.insight && (
            <Alert 
              icon={<InfoIcon />} 
              severity="info" 
              sx={{ 
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'primary.light'
              }}
            >
              <Typography variant="body2" fontWeight={500}>
                {data.insight}
              </Typography>
            </Alert>
          )}

          {/* Stats Grid */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <SevenDaysStats />
            </Grid>
            <Grid item xs={12} md={6}>
              <KPISummary />
            </Grid>
          </Grid>

          {/* 🔥 PERBANDINGAN BULANAN */}
          <MonthlyComparisonSection />

          {/* 🔥 TOP CUSTOMERS (SEMUA WAKTU) */}
          <TopCustomersSection />

          {/* 🔥 AI Advice (FILTERED - TANPA STOK) */}
          {filteredAdvice && (
            <Alert
              icon={filteredAdvice.level === "warning" ? <WarningAmberIcon /> : <CheckCircleIcon />}
              severity={filteredAdvice.level || "info"}
              sx={{ 
                borderRadius: 2,
                border: '1px solid',
                borderColor: filteredAdvice.level === "warning" ? 'warning.light' : 'info.light'
              }}
            >
              <Typography variant="body2" fontWeight={700} gutterBottom>
                {filteredAdvice.title}
              </Typography>
              <Typography variant="body2">
                {filteredAdvice.message}
              </Typography>
            </Alert>
          )}
        </Stack>

        <CustomerHistoryModal />
      </CardContent>
    </Card>
  );
}