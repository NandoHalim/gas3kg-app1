// src/components/views/Dashboard/sections/BusinessIntelligenceCard.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  Card, CardContent, Typography, Box, Stack, Alert, Chip, Tooltip, 
  CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Paper, IconButton, Divider
} from "@mui/material";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import InfoIcon from "@mui/icons-material/Info";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import HistoryIcon from "@mui/icons-material/History";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import StoreIcon from "@mui/icons-material/Store";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import { DataService } from "../../../../services/DataService.js";

function formatDatePlus(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
}

const formatCurrency = (amount) => {
  if (amount == null || amount === 0) return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
};

// 🔥 PERBAIKAN: Fungsi untuk mendapatkan data penjualan 7 hari terakhir
const getSevenDaysSalesData = async () => {
  try {
    const sevenDaysData = await DataService.getSevenDaySalesRealtime?.();
    
    if (!sevenDaysData || !Array.isArray(sevenDaysData)) {
      console.warn('Data 7 hari tidak tersedia, menggunakan fallback');
      return null;
    }

    // Filter data yang valid dan konversi ke format yang konsisten
    const validData = sevenDaysData
      .filter(item => item && (item.qty !== undefined && item.qty !== null))
      .map(item => ({
        date: item.date,
        qty: Number(item.qty) || 0,
        totalValue: Number(item.totalValue) || 0
      }));

    console.log('📊 Data 7 hari terakhir (dari SevenDaysChart):', validData);
    return validData;

  } catch (error) {
    console.error('Error mengambil data 7 hari:', error);
    return null;
  }
};

// 🔥 PERBAIKAN: Hitung rata-rata penjualan harian yang lebih akurat
const calculateAccurateDailyAverage = (salesData) => {
  if (!salesData || salesData.length === 0) return 0;

  // Filter hanya hari dengan penjualan (tidak termasuk hari tanpa penjualan)
  const daysWithSales = salesData.filter(day => day.qty > 0);
  
  if (daysWithSales.length === 0) return 0;

  const totalQty = daysWithSales.reduce((sum, day) => sum + day.qty, 0);
  const average = totalQty / daysWithSales.length;
  
  console.log('📈 Perhitungan rata-rata harian:', {
    totalHari: salesData.length,
    hariDenganPenjualan: daysWithSales.length,
    totalTabung: totalQty,
    rataRata: Math.round(average)
  });

  return Math.round(average);
};

// 🔥 PERBAIKAN: Forecast yang lebih akurat berdasarkan data historis
const calculateImprovedForecast = (salesData, currentStock) => {
  if (!salesData || salesData.length === 0) {
    return {
      avgSales: 0,
      safeDays: 0,
      safeUntil: null,
      confidence: 'low',
      trend: 'stabil'
    };
  }

  const dailyAverage = calculateAccurateDailyAverage(salesData);
  
  // Hitung tren berdasarkan 3 hari terakhir vs 3 hari sebelumnya
  const recentDays = salesData.slice(-3);
  const previousDays = salesData.slice(-6, -3);
  
  const recentAvg = recentDays.length > 0 ? 
    recentDays.reduce((sum, day) => sum + day.qty, 0) / recentDays.length : 0;
  const previousAvg = previousDays.length > 0 ? 
    previousDays.reduce((sum, day) => sum + day.qty, 0) / previousDays.length : 0;
  
  const trend = recentAvg > previousAvg * 1.1 ? 'naik' : 
                recentAvg < previousAvg * 0.9 ? 'turun' : 'stabil';

  // Hitung safe days dengan buffer berdasarkan tren
  let safeDays = 0;
  if (currentStock > 0 && dailyAverage > 0) {
    const baseDays = Math.floor(currentStock / dailyAverage);
    
    // Adjust berdasarkan tren
    if (trend === 'naik') {
      safeDays = Math.max(1, Math.floor(baseDays * 0.8)); // 20% buffer untuk tren naik
    } else if (trend === 'turun') {
      safeDays = Math.floor(baseDays * 1.2); // 20% extra untuk tren turun
    } else {
      safeDays = baseDays; // Tidak ada adjustment untuk tren stabil
    }
  }

  // Hitung confidence level
  const dataPoints = salesData.filter(day => day.qty > 0).length;
  const confidence = dataPoints >= 5 ? 'high' : dataPoints >= 3 ? 'medium' : 'low';

  return {
    avgSales: dailyAverage,
    safeDays,
    safeUntil: safeDays > 0 ? formatDatePlus(safeDays) : null,
    confidence,
    trend,
    dataPoints
  };
};

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
    description: changePercent > 5 ? `📈 Naik ${Math.abs(changePercent).toFixed(1)}%` : 
                 changePercent < -5 ? `📉 Turun ${Math.abs(changePercent).toFixed(1)}%` : '➡️ Stabil'
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
  const [priceAnalysis, setPriceAnalysis] = useState(null);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [sevenDaysData, setSevenDaysData] = useState(null); // 🔥 DATA BARU: Data 7 hari

  const { loading, error, data } = state;

  useEffect(() => {
    let alive = true;
    
    (async () => {
      try {
        const res = await DataService.getAIInsightsV2?.() || await DataService.getAIInsights?.();
        if (!alive) return;
        setState({ loading: false, error: null, data: res });
        
        setCustomersLoading(true);
        
        // 🔥 AMBIL DATA 7 HARI UNTUK PERHITUNGAN YANG LEBIH AKURAT
        const sevenDaysSales = await getSevenDaysSalesData();
        if (!alive) return;
        setSevenDaysData(sevenDaysSales);

        // Top customers
        const topCust = await DataService.getTopCustomersPeriod({
          period: "this_month",
          limit: 5,
          onlyPaid: true
        });
        
        if (!alive) return;
        setTopCustomers(topCust || []);
        
        analyzePriceData();
        
      } catch (e) {
        if (!alive) return;
        setState({ loading: false, error: e, data: null });
      } finally {
        if (alive) setCustomersLoading(false);
      }
    })();
    
    return () => { alive = false; };
  }, []);

  const analyzePriceData = async () => {
    setAnalysisLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const salesData = await DataService.getSalesHistory({
        from: startDate.toISOString().split('T')[0],
        to: endDate.toISOString().split('T')[0],
        limit: 1000
      });

      const priceStats = analyzePrices(salesData);
      setPriceAnalysis(priceStats);

      const monthlyStats = analyzeMonthlyTrend(salesData);
      setMonthlyTrend(monthlyStats);

    } catch (error) {
      console.error('Error analyzing price data:', error);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const analyzePrices = (salesData) => {
    const validSales = salesData.filter(sale => 
      String(sale.status || '').toUpperCase() !== 'DIBATALKAN'
    );

    const price18k = validSales.filter(s => s.price === 18000 || s.price === 18000.00);
    const price20k = validSales.filter(s => s.price === 20000 || s.price === 20000.00);
    const otherPrices = validSales.filter(s => s.price !== 18000 && s.price !== 20000);

    const total18k = price18k.reduce((sum, s) => sum + (s.total || s.qty * s.price), 0);
    const total20k = price20k.reduce((sum, s) => sum + (s.total || s.qty * s.price), 0);
    const totalOther = otherPrices.reduce((sum, s) => sum + (s.total || s.qty * s.price), 0);

    const qty18k = price18k.reduce((sum, s) => sum + (s.qty || 0), 0);
    const qty20k = price20k.reduce((sum, s) => sum + (s.qty || 0), 0);
    const qtyOther = otherPrices.reduce((sum, s) => sum + (s.qty || 0), 0);

    return {
      price18k: {
        transactions: price18k.length,
        quantity: qty18k,
        revenue: total18k,
        percentage: validSales.length ? (price18k.length / validSales.length) * 100 : 0
      },
      price20k: {
        transactions: price20k.length,
        quantity: qty20k,
        revenue: total20k,
        percentage: validSales.length ? (price20k.length / validSales.length) * 100 : 0
      },
      other: {
        transactions: otherPrices.length,
        quantity: qtyOther,
        revenue: totalOther,
        percentage: validSales.length ? (otherPrices.length / validSales.length) * 100 : 0
      },
      total: {
        transactions: validSales.length,
        quantity: qty18k + qty20k + qtyOther,
        revenue: total18k + total20k + totalOther
      }
    };
  };

  const analyzeMonthlyTrend = (salesData) => {
    const validSales = salesData.filter(sale => 
      String(sale.status || '').toUpperCase() !== 'DIBATALKAN'
    );

    const monthlyMap = {};
    
    validSales.forEach(sale => {
      const date = new Date(sale.created_at);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const monthKey = `${year}-${String(month).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = {
          month: monthName,
          monthKey: monthKey,
          year: year,
          monthNumber: month,
          price18k: { quantity: 0, revenue: 0, transactions: 0 },
          price20k: { quantity: 0, revenue: 0, transactions: 0 },
          other: { quantity: 0, revenue: 0, transactions: 0 }
        };
      }
      
      const price = sale.price;
      const quantity = sale.qty || 0;
      const revenue = sale.total || quantity * price;
      
      if (price === 18000 || price === 18000.00) {
        monthlyMap[monthKey].price18k.quantity += quantity;
        monthlyMap[monthKey].price18k.revenue += revenue;
        monthlyMap[monthKey].price18k.transactions += 1;
      } else if (price === 20000 || price === 20000.00) {
        monthlyMap[monthKey].price20k.quantity += quantity;
        monthlyMap[monthKey].price20k.revenue += revenue;
        monthlyMap[monthKey].price20k.transactions += 1;
      } else {
        monthlyMap[monthKey].other.quantity += quantity;
        monthlyMap[monthKey].other.revenue += revenue;
        monthlyMap[monthKey].other.transactions += 1;
      }
    });
    
    return Object.values(monthlyMap)
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey))
      .slice(0, 6);
  };

  // 🔥 PERBAIKAN: Forecast summary yang lebih akurat
  const forecastSummary = useMemo(() => {
    if (!sevenDaysData) return null;
    
    const currentStock = data?.kpi?.current_stock?.ISI || data?.current_stock?.ISI || 0;
    const forecast = calculateImprovedForecast(sevenDaysData, currentStock);
    
    return {
      ...forecast,
      dataSource: '7_hari_terakhir',
      rawData: sevenDaysData // Untuk debugging
    };
  }, [sevenDaysData, data]);

  // 🔥 PERBAIKAN: Stock risk analysis yang lebih akurat
  const stockRiskAnalysis = useMemo(() => {
    if (!forecastSummary || !data) return null;

    const currentStock = data.kpi?.current_stock?.ISI || data.current_stock?.ISI || 0;
    const { avgSales, safeDays, confidence, trend } = forecastSummary;

    let riskLevel = 'low';
    let riskMessage = '';
    let recommendation = '';

    if (currentStock === 0) {
      riskLevel = 'critical';
      riskMessage = '🚨 STOK HABIS - Segera restock!';
      recommendation = 'Pesan tabung segera untuk menghindari kehilangan penjualan';
    } else if (safeDays <= 2) {
      riskLevel = 'high';
      riskMessage = '⚠️ Stok kritis - Hanya cukup 2 hari lagi';
      recommendation = 'Restock dalam 24 jam untuk antisipasi';
    } else if (safeDays <= 5) {
      riskLevel = 'medium';
      riskMessage = '📦 Stok menipis - Cukup untuk 3-5 hari';
      recommendation = 'Rencanakan restock dalam 2-3 hari';
    } else {
      riskLevel = 'low';
      riskMessage = '✅ Stok aman';
      recommendation = 'Pantau tren penjualan untuk perencanaan';
    }

    // Adjust berdasarkan confidence level
    if (confidence === 'low') {
      riskMessage += ' (data terbatas)';
      recommendation = 'Tunggu lebih banyak data untuk analisis akurat';
    }

    return {
      riskLevel,
      riskMessage,
      recommendation,
      currentStock,
      dailyConsumption: avgSales,
      safeDays,
      confidence,
      trend
    };
  }, [forecastSummary, data]);

  const handleCustomerClick = async (customer) => {
    setSelectedCustomer(customer);
    setModalOpen(true);
    setHistoryLoading(true);
    
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
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
                  <TableCell><strong>Metode</strong></TableCell>
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
                    <TableCell>
                      <Typography variant="body2">
                        {transaction.method}
                      </Typography>
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
                  <TableCell colSpan={2}>
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

  const PriceAnalysisSection = () => {
    if (analysisLoading) {
      return (
        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <LocalShippingIcon color="primary" />
            <Typography variant="subtitle2" fontWeight="bold">
              Analisis Harga Jual
            </Typography>
          </Box>
          <Box display="flex" justifyContent="center" py={2}>
            <CircularProgress size={20} />
          </Box>
        </Box>
      );
    }

    if (!priceAnalysis) return null;

    return (
      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <LocalShippingIcon color="primary" />
          <Typography variant="subtitle2" fontWeight="bold">
            Analisis Harga Jual (30 Hari)
          </Typography>
        </Box>
        
        <Stack spacing={2}>
          {/* Delivery */}
          <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.100' }}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <LocalShippingIcon fontSize="small" color="success" />
              <Typography variant="body2" fontWeight="bold" color="success.main">
                Delivery (Rp 20.000)
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {priceAnalysis.price20k.transactions} transaksi
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="success.main">
                  {priceAnalysis.price20k.quantity} tabung
                </Typography>
              </Box>
              <Box textAlign="right">
                <Typography variant="body2" color="text.secondary">
                  Total Revenue
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="success.main">
                  {formatCurrency(priceAnalysis.price20k.revenue)}
                </Typography>
              </Box>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {priceAnalysis.price20k.percentage.toFixed(1)}% dari total transaksi
            </Typography>
          </Box>

          {/* Regular */}
          <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.100' }}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <StoreIcon fontSize="small" color="primary" />
              <Typography variant="body2" fontWeight="bold" color="primary.main">
                Regular (Rp 18.000)
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {priceAnalysis.price18k.transactions} transaksi
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="primary.main">
                  {priceAnalysis.price18k.quantity} tabung
                </Typography>
              </Box>
              <Box textAlign="right">
                <Typography variant="body2" color="text.secondary">
                  Total Revenue
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="primary.main">
                  {formatCurrency(priceAnalysis.price18k.revenue)}
                </Typography>
              </Box>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {priceAnalysis.price18k.percentage.toFixed(1)}% dari total transaksi
            </Typography>
          </Box>

          {/* Summary */}
          <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: 'background.paper' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" fontWeight="bold">
                Total 30 Hari:
              </Typography>
              <Box textAlign="right">
                <Typography variant="body2" fontWeight="bold">
                  {priceAnalysis.total.quantity} tabung
                </Typography>
                <Typography variant="body2" color="primary.main" fontWeight="bold">
                  {formatCurrency(priceAnalysis.total.revenue)}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Stack>
      </Box>
    );
  };

  const MonthlyTrendSection = () => {
    if (analysisLoading) {
      return (
        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <TrendingUpIcon color="primary" />
            <Typography variant="subtitle2" fontWeight="bold">
              Tren Harga per Bulan
            </Typography>
          </Box>
          <Box display="flex" justifyContent="center" py={2}>
            <CircularProgress size={20} />
          </Box>
        </Box>
      );
    }

    if (monthlyTrend.length === 0) return null;

    return (
      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <TrendingUpIcon color="primary" />
          <Typography variant="subtitle2" fontWeight="bold">
            Tren Harga per Bulan (6 Bulan Terakhir)
          </Typography>
        </Box>
        
        <Stack spacing={2}>
          {monthlyTrend.map((month, index) => {
            const totalQty = month.price18k.quantity + month.price20k.quantity;
            const totalRevenue = month.price18k.revenue + month.price20k.revenue;
            
            return (
              <Box key={index} sx={{ p: 2, borderRadius: 2, bgcolor: 'background.paper', border: '1px solid #e0e0e0' }}>
                <Typography variant="body2" fontWeight="bold" gutterBottom color="primary">
                  {month.month} 
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    (Total: {totalQty} tabung, {formatCurrency(totalRevenue)})
                  </Typography>
                </Typography>
                
                <Stack spacing={1.5}>
                  {/* Delivery */}
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" gap={1}>
                      <LocalShippingIcon fontSize="small" color="success" />
                      <Typography variant="body2" color="success.main">
                        Delivery
                      </Typography>
                    </Box>
                    <Box textAlign="right">
                      <Typography variant="body2" fontWeight="medium">
                        {month.price20k.quantity} tabung
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatCurrency(month.price20k.revenue)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Regular */}
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" gap={1}>
                      <StoreIcon fontSize="small" color="primary" />
                      <Typography variant="body2" color="primary.main">
                        Regular
                      </Typography>
                    </Box>
                    <Box textAlign="right">
                      <Typography variant="body2" fontWeight="medium">
                        {month.price18k.quantity} tabung
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatCurrency(month.price18k.revenue)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Total */}
                  <Divider />
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" fontWeight="bold">
                      Total Bulanan
                    </Typography>
                    <Box textAlign="right">
                      <Typography variant="body2" fontWeight="bold">
                        {totalQty} tabung
                      </Typography>
                      <Typography variant="body2" color="primary.main" fontWeight="bold">
                        {formatCurrency(totalRevenue)}
                      </Typography>
                    </Box>
                  </Box>
                </Stack>
              </Box>
            );
          })}
        </Stack>
      </Box>
    );
  };

  // 🔥 PERBAIKAN: Stock Risk Alert Component
  const StockRiskAlert = () => {
    if (!stockRiskAnalysis) return null;

    const { riskLevel, riskMessage, recommendation, currentStock, dailyConsumption, safeDays, confidence } = stockRiskAnalysis;

    const getAlertProps = () => {
      switch (riskLevel) {
        case 'critical':
          return { severity: 'error', icon: <WarningAmberIcon /> };
        case 'high':
          return { severity: 'warning', icon: <WarningAmberIcon /> };
        case 'medium':
          return { severity: 'info', icon: <InfoIcon /> };
        default:
          return { severity: 'success', icon: <CheckCircleIcon /> };
      }
    };

    const alertProps = getAlertProps();

    return (
      <Alert
        {...alertProps}
        sx={{ 
          borderRadius: 2,
          '& .MuiAlert-message': { width: '100%' }
        }}
      >
        <Typography variant="body2" fontWeight={700} gutterBottom>
          {riskMessage}
        </Typography>
        <Typography variant="body2" gutterBottom>
          Stok: {currentStock} tabung • Konsumsi: {dailyConsumption} tabung/hari • Aman: {safeDays} hari
          {confidence === 'low' && ' • ⚠️ Data terbatas'}
        </Typography>
        <Typography variant="body2">
          <strong>Rekomendasi:</strong> {recommendation}
        </Typography>
      </Alert>
    );
  };

  if (loading) {
    return (
      <Card sx={{ width: '100%', maxWidth: '100%' }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Business Intelligence (AI)</Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Chip label="Memuat insights..." color="primary" size="small" />
              <CircularProgress size={16} />
            </Box>
          </Box>
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ width: '100%', maxWidth: '100%' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Business Intelligence (AI)</Typography>
          <Alert severity="error">{error?.message || "Gagal memuat AI insights"}</Alert>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card sx={{ width: '100%', maxWidth: '100%' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Business Intelligence (AI)</Typography>
          <Alert severity="info">Data AI tidak tersedia.</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ width: '100%', maxWidth: '100%' }}>
      <CardContent>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
          <Box>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Business Intelligence (AI)
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Ringkasan & analisis otomatis dari data penjualan
            </Typography>
          </Box>
          <Tooltip title={`Terakhir update: ${new Date(data.generated_at || Date.now()).toLocaleString("id-ID")}`}>
            <Chip 
              label="AI Analysis" 
              color="primary" 
              variant="outlined" 
              size="small" 
              icon={<AnalyticsIcon fontSize="small" />} 
            />
          </Tooltip>
        </Box>

        <Stack spacing={3}>
          {/* AI Insight */}
          <Alert 
            icon={<InfoIcon />} 
            severity="info" 
            sx={{ 
              borderRadius: 2,
              '& .MuiAlert-message': { 
                fontSize: '0.9rem', 
                lineHeight: 1.5,
                width: '100%'
              } 
            }}
          >
            {data.insight}
          </Alert>

          {/* 🔥 PERBAIKAN: Stock Risk Alert - Lebih Akurat */}
          <StockRiskAlert />

          {/* AI Advice */}
          {data.advice && (
            <Alert
              icon={data.advice.level === "warning" ? <WarningAmberIcon /> : <CheckCircleIcon />}
              severity={data.advice.level || "info"}
              sx={{ borderRadius: 2 }}
            >
              <Typography variant="body2" fontWeight={700} gutterBottom>
                {data.advice.title}
              </Typography>
              <Typography variant="body2">
                {data.advice.message}
              </Typography>
            </Alert>
          )}

          {/* 🔥 PERBAIKAN: Forecast dengan Data 7 Hari */}
          {forecastSummary && (
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                📊 Forecast Berdasarkan 7 Hari Terakhir
              </Typography>
              
              <Stack spacing={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Rata-rata Penjualan Harian:</Typography>
                  <Typography variant="body2" fontWeight="bold" color="primary.main">
                    {forecastSummary.avgSales} tabung
                  </Typography>
                </Box>
                
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Stok Aman Sampai:</Typography>
                  <Typography variant="body2" fontWeight="bold" color="success.main">
                    {forecastSummary.safeUntil || 'Tidak dapat dihitung'}
                  </Typography>
                </Box>
                
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Tren Penjualan:</Typography>
                  <Chip 
                    label={forecastSummary.trend === 'naik' ? '📈 Naik' : 
                           forecastSummary.trend === 'turun' ? '📉 Turun' : '➡️ Stabil'} 
                    size="small"
                    color={forecastSummary.trend === 'naik' ? 'success' : 
                           forecastSummary.trend === 'turun' ? 'error' : 'default'}
                    variant="outlined"
                  />
                </Box>
                
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Tingkat Kepercayaan:</Typography>
                  <Chip 
                    label={forecastSummary.confidence === 'high' ? 'Tinggi' : 
                           forecastSummary.confidence === 'medium' ? 'Sedang' : 'Rendah'} 
                    size="small"
                    color={forecastSummary.confidence === 'high' ? 'success' : 
                           forecastSummary.confidence === 'medium' ? 'warning' : 'error'}
                  />
                </Box>
              </Stack>
            </Box>
          )}

          {/* Price Analysis */}
          <PriceAnalysisSection />

          {/* Monthly Trend */}
          <MonthlyTrendSection />

          {/* Top Customers */}
          {topCustomers && topCustomers.length > 0 && (
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                🏆 Top 5 Customers (Bulan Ini)
              </Typography>
              
              <Stack spacing={1}>
                {topCustomers.map((customer, index) => (
                  <Box 
                    key={customer.customer_name || customer.customer || index}
                    sx={{ 
                      p: 1.5, 
                      borderRadius: 1, 
                      bgcolor: 'background.paper',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      border: '1px solid #e0e0e0',
                      '&:hover': {
                        bgcolor: 'primary.50',
                        borderColor: 'primary.main'
                      }
                    }}
                    onClick={() => handleCustomerClick(customer)}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {customer.customer_name || customer.customer}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {customer.transactions || 0} transaksi
                        </Typography>
                      </Box>
                      <Box textAlign="right">
                        <Typography variant="body2" fontWeight="bold" color="primary.main">
                          {customer.total_qty || customer.quantity || 0} tabung
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatCurrency(customer.total_revenue || customer.revenue || 0)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}
        </Stack>

        <CustomerHistoryModal />
      </CardContent>
    </Card>
  );
}