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

const calculateSalesTrend = (salesData) => {
  if (!salesData || salesData.length < 2) return null;
  
  const recentData = salesData.slice(-3);
  const previousData = salesData.slice(-6, -3);
  
  const recentAvg = recentData.reduce((a, b) => a + b, 0) / recentData.length;
  const previousAvg = previousData.reduce((a, b) => a + b, 0) / previousData.length;
  
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

  const { loading, error, data } = state;

  useEffect(() => {
    let alive = true;
    
    (async () => {
      try {
        const res = await DataService.getAIInsightsV2?.() || await DataService.getAIInsights?.();
        if (!alive) return;
        setState({ loading: false, error: null, data: res });
        
        setCustomersLoading(true);
        
        // 🔥 PERBAIKAN: Gunakan onlyPaid: true untuk konsistensi dengan DashboardContainer
        const topCust = await DataService.getTopCustomersPeriod({
          period: "this_month",
          limit: 5,
          onlyPaid: true  // Hanya transaksi yang sudah dibayar/lunas
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

      // 🔥 DEBUG: Log data untuk verifikasi
      console.log('🔄 Data Tren Bulanan (setelah perbaikan sorting):', monthlyStats);
      monthlyStats.forEach(month => {
        const totalQty = month.price18k.quantity + month.price20k.quantity;
        const totalRevenue = month.price18k.revenue + month.price20k.revenue;
        console.log(`📊 ${month.month}: ${totalQty} tabung, ${formatCurrency(totalRevenue)}`);
      });

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
      const monthKey = `${year}-${String(month).padStart(2, '0')}`; // Format: "2024-09"
      const monthName = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = {
          month: monthName,
          monthKey: monthKey, // 🔥 TAMBAHKAN untuk sorting yang benar
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
    
    // 🔥 PERBAIKAN CRITICAL: Sorting yang benar menggunakan monthKey
    return Object.values(monthlyMap)
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey)) // Descending: terbaru dulu
      .slice(0, 6); // Ambil 6 bulan terakhir
  };

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

  const forecastSummary = useMemo(() => {
    if (!data?.forecast) return null;
    
    const sales = Array.isArray(data.forecast.sales_next_7) ? data.forecast.sales_next_7 : [];
    const stock = Array.isArray(data.forecast.stock_next_7) ? data.forecast.stock_next_7 : [];
    
    const avgSales = sales.length ? 
      Math.round(sales.reduce((a, b) => a + b, 0) / sales.length) : null;

    const trend = calculateSalesTrend(sales);
    
    let safeDays = null;
    const currentStock = data.kpi?.current_stock?.ISI || data.current_stock?.ISI || 0;
    
    if (currentStock > 0 && avgSales > 0) {
      safeDays = Math.floor(currentStock / avgSales);
    }

    return {
      avgSales,
      safeUntil: safeDays != null ? formatDatePlus(safeDays) : null,
      safeDays,
      trend,
      dataSource: 'prediksi'
    };
  }, [data]);

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

          {/* Forecast */}
          {forecastSummary && (
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                📊 Forecast 7 Hari
              </Typography>
              
              <Stack spacing={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Penjualan Harian Rata-rata:</Typography>
                  <Typography variant="body2" fontWeight="bold" color="primary.main">
                    {forecastSummary.avgSales ?? "-"} tabung
                  </Typography>
                </Box>
                
                {forecastSummary.trend && (
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">Tren Penjualan:</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {forecastSummary.trend.description}
                    </Typography>
                  </Box>
                )}
                
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Estimasi Stok:</Typography>
                  <Typography 
                    variant="body2" 
                    fontWeight="bold"
                    color={
                      forecastSummary.safeDays <= 2 ? 'error.main' :
                      forecastSummary.safeDays <= 5 ? 'warning.main' : 'success.main'
                    }
                  >
                    {forecastSummary.safeDays != null ? (
                      `Aman ${forecastSummary.safeDays} hari (sampai ${forecastSummary.safeUntil})`
                    ) : "Tidak tersedia"}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          )}

          {/* Price Analysis */}
          <PriceAnalysisSection />

          {/* Monthly Trend */}
          <MonthlyTrendSection />

          {/* Top Customers - 🔥 SUDAH DIPERBAIKI dengan konsistensi data */}
          {!customersLoading && topCustomers.length > 0 && (
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <TrendingUpIcon color="primary" />
                <Typography variant="subtitle2" fontWeight="bold">
                  Top Pelanggan Bulan Ini
                </Typography>
                <Tooltip title="Hanya transaksi yang sudah dibayar/lunas">
                  <InfoIcon fontSize="small" color="action" />
                </Tooltip>
              </Box>
              
              <Stack spacing={1.5}>
                {topCustomers.slice(0, 3).map((customer, index) => (
                  <Box 
                    key={customer.customer_name || index} 
                    onClick={() => handleCustomerClick(customer)}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 1.5,
                      borderRadius: 2,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      backgroundColor: 'background.paper',
                      border: '1px solid #e0e0e0',
                      '&:hover': {
                        backgroundColor: 'primary.light',
                        transform: 'translateY(-2px)',
                        boxShadow: 2
                      }
                    }}
                  >
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
                      <Tooltip title="Klik untuk lihat riwayat">
                        <HistoryIcon fontSize="small" color="action" />
                      </Tooltip>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

          {/* KPI Summary */}
          {data.kpi && (
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                📈 Kinerja Utama (MTD)
              </Typography>
              <Stack spacing={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Total Omzet:</Typography>
                  <Typography variant="body2" fontWeight="bold" color="primary.main">
                    {formatCurrency(data.kpi.omzet)}
                  </Typography>
                </Box>
                {data.kpi.laba != null && (
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">Laba Bersih:</Typography>
                    <Typography 
                      variant="body2" 
                      fontWeight="bold"
                      color={data.kpi.laba >= 0 ? 'success.main' : 'error.main'}
                    >
                      {formatCurrency(data.kpi.laba)}
                    </Typography>
                  </Box>
                )}
                {data.kpi.margin != null && (
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">Margin:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {data.kpi.margin.toFixed(1)}%
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>
          )}
        </Stack>
      </CardContent>
      
      <CustomerHistoryModal />
    </Card>
  );
}