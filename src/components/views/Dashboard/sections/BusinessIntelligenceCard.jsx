// src/components/views/Dashboard/sections/BusinessIntelligenceCard.jsx
import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Chip,
  Tooltip,
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  People as PeopleIcon,
  Receipt as ReceiptIcon,
  AttachMoney as AttachMoneyIcon,
  Analytics as AnalyticsIcon,
  Info as InfoIcon,
  Lightbulb as LightbulbIcon
} from '@mui/icons-material';

const BusinessIntelligenceCard = ({ data, loading, error }) => {
  // Safe data extraction dengan default values
  const safeData = data || {};
  const atv = safeData.atv || 0;
  const growth_metrics = safeData.growth_metrics || {};
  const insights = safeData.insights || [];
  const period = safeData.period || {};
  
  const {
    revenue_growth = 0,
    transaction_growth = 0, 
    customer_growth = 0
  } = growth_metrics;

  // Validasi data structure
  const isValidBusinessData = (data) => {
    if (!data) return false;
    
    try {
      return (
        typeof data.atv === 'number' &&
        data.growth_metrics &&
        typeof data.growth_metrics.revenue_growth === 'number' &&
        typeof data.growth_metrics.transaction_growth === 'number' &&
        typeof data.growth_metrics.customer_growth === 'number' &&
        Array.isArray(data.insights) &&
        data.period &&
        typeof data.period.from === 'string' &&
        typeof data.period.to === 'string'
      );
    } catch {
      return false;
    }
  };

  if (loading) {
    return (
      <Card sx={{ minWidth: 275, height: '100%', borderRadius: 2 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" component="h2">
              Business Intelligence
            </Typography>
            <Chip 
              label="Loading..." 
              color="primary" 
              size="small" 
              icon={<CircularProgress size={16} />}
            />
          </Box>
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ minWidth: 275, height: '100%', borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" component="h2" gutterBottom>
            Business Intelligence
          </Typography>
          <Alert severity="error">
            <Typography variant="body2">
              Gagal memuat analisis bisnis: {error.message || 'Terjadi kesalahan'}
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!data || !isValidBusinessData(data)) {
    return (
      <Card sx={{ minWidth: 275, height: '100%', borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" component="h2" gutterBottom>
            Business Intelligence
          </Typography>
          <Alert severity="info">
            <Typography variant="body2">
              Data analisis bisnis tidak tersedia atau format tidak valid.
              {!data && ' Data kosong.'}
              {data && !isValidBusinessData(data) && ' Struktur data tidak sesuai.'}
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Format percentage
  const formatPercent = (value) => {
    if (value === null || value === undefined) return '0%';
    const formattedValue = Math.abs(value).toFixed(1);
    return `${value >= 0 ? '+' : '-'}${formattedValue}%`;
  };

  // Get growth color and icon
  const getGrowthConfig = (value) => {
    if (value > 0) {
      return {
        color: 'success',
        icon: <TrendingUpIcon fontSize="small" />
      };
    } else if (value < 0) {
      return {
        color: 'error',
        icon: <TrendingDownIcon fontSize="small" />
      };
    }
    return {
      color: 'default',
      icon: null
    };
  };

  const formatPeriod = (dateString) => {
    if (!dateString) return 'Tidak tersedia';
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Enhanced period formatting dengan durasi
  const formatPeriodWithDuration = () => {
    if (!period.from || !period.to) return 'Periode tidak tersedia';
    
    try {
      const fromDate = new Date(period.from);
      const toDate = new Date(period.to);
      const durationDays = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1;
      
      return `${formatPeriod(period.from)} - ${formatPeriod(period.to)} (${durationDays} hari)`;
    } catch {
      return `${period.from} - ${period.to}`;
    }
  };

  // Enhanced performance analysis
  const getEnhancedPerformanceSummary = () => {
    const conditions = [
      { 
        test: () => revenue_growth > 15 && transaction_growth > 10 && customer_growth > 5,
        severity: "success",
        message: "🔥 Performa luar biasa! Semua metrik menunjukkan pertumbuhan kuat.",
        recommendation: "Pertahankan momentum dan ekspansi bisnis"
      },
      { 
        test: () => revenue_growth > 10 && transaction_growth > 5,
        severity: "success",
        message: "📈 Bisnis tumbuh sangat sehat dengan peningkatan signifikan.",
        recommendation: "Tingkatkan kapasitas untuk menangani pertumbuhan"
      },
      { 
        test: () => revenue_growth > 5 && transaction_growth > 0,
        severity: "success", 
        message: "✅ Bisnis tumbuh stabil dengan trend positif.",
        recommendation: "Fokus pada retensi customer yang ada"
      },
      { 
        test: () => revenue_growth > 0 && transaction_growth <= 0 && atv > 0,
        severity: "warning",
        message: "⚠️ Nilai transaksi meningkat tapi volume menurun.",
        recommendation: "Tingkatkan frekuensi pembelian customer"
      },
      { 
        test: () => revenue_growth <= 0 && transaction_growth > 0,
        severity: "warning",
        message: "📉 Volume transaksi naik tapi pendapatan turun.",
        recommendation: "Review pricing strategy dan diskon"
      },
      { 
        test: () => revenue_growth <= 0 && transaction_growth <= 0 && customer_growth > 0,
        severity: "warning",
        message: "👥 Customer base tumbuh tapi konversi menurun.",
        recommendation: "Tingkatkan efektivitas penjualan"
      },
      { 
        test: () => revenue_growth <= 0 && transaction_growth <= 0 && customer_growth <= 0,
        severity: "error",
        message: "🚨 Perlu perhatian serius. Semua metrik utama menurun.",
        recommendation: "Lakukan analisis mendalam dan corrective action"
      }
    ];

    const matchedCondition = conditions.find(condition => condition.test()) || conditions[conditions.length - 1];
    
    return matchedCondition;
  };

  // Generate dynamic insights based on data
  const generateDynamicInsights = () => {
    const dynamicInsights = [];
    
    if (atv > 500000) {
      dynamicInsights.push("🎯 ATV tinggi menunjukkan efektivitas penjualan premium dan upselling");
    } else if (atv < 200000) {
      dynamicInsights.push("💡 Potensi peningkatan ATV melalui bundling dan cross-selling");
    }
    
    if (customer_growth > 10) {
      dynamicInsights.push("👥 Pertumbuhan customer yang kuat - pertahankan strategi akuisisi");
    } else if (customer_growth < 0) {
      dynamicInsights.push("📉 Perlu strategi retensi customer untuk mengurangi churn");
    }
    
    if (revenue_growth > transaction_growth) {
      dynamicInsights.push("💰 Peningkatan nilai transaksi lebih cepat dari volume - pricing strategy efektif");
    }
    
    if (transaction_growth > revenue_growth) {
      dynamicInsights.push("📊 Volume transaksi tumbuh lebih cepat - pertimbangkan strategi upselling");
    }

    if (revenue_growth > 0 && customer_growth <= 0) {
      dynamicInsights.push("⭐ Existing customers memberikan nilai lebih - fokus pada loyalitas");
    }
    
    return dynamicInsights.length > 0 ? dynamicInsights : ["📈 Pertahankan konsistensi operasional bisnis"];
  };

  const performanceSummary = getEnhancedPerformanceSummary();
  const dynamicInsights = insights.length > 0 ? insights : generateDynamicInsights();

  return (
    <Card sx={{ minWidth: 275, height: '100%', borderRadius: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography variant="h6" component="h2" gutterBottom>
              Business Intelligence
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Analisis performa bisnis komprehensif
            </Typography>
          </Box>
          <Tooltip title={formatPeriodWithDuration()}>
            <Chip 
              label="Analisis"
              color="primary"
              variant="outlined"
              size="small"
              icon={<AnalyticsIcon fontSize="small" />}
            />
          </Tooltip>
        </Box>

        <Stack spacing={2}>
          {/* ATV Section */}
          <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Tooltip title="Average Transaction Value - Nilai rata-rata setiap transaksi">
                <Box display="flex" alignItems="center" gap={1}>
                  <AttachMoneyIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle2" fontWeight="bold">
                    ATV
                  </Typography>
                  <InfoIcon fontSize="small" color="disabled" sx={{ fontSize: 14 }} />
                </Box>
              </Tooltip>
              <Typography variant="h6" fontWeight="bold" color="primary">
                {formatCurrency(atv)}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Nilai transaksi rata-rata per customer
            </Typography>
          </Card>

          {/* Growth Metrics */}
          <Box>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="text.primary">
              Metrik Pertumbuhan
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={4}>
                <Tooltip title="Pertumbuhan pendapatan dibandingkan periode sebelumnya">
                  <Card variant="outlined" sx={{ p: 1, textAlign: 'center', borderRadius: 2 }}>
                    <AttachMoneyIcon 
                      fontSize="small"
                      color={
                        revenue_growth > 0 ? 'success' : 
                        revenue_growth < 0 ? 'error' : 
                        'disabled'
                      } 
                    />
                    <Typography variant="caption" display="block" color="text.secondary" gutterBottom>
                      Pendapatan
                    </Typography>
                    <Chip 
                      label={formatPercent(revenue_growth)}
                      color={getGrowthConfig(revenue_growth).color}
                      size="small"
                      variant="filled"
                      sx={{ 
                        fontWeight: 'bold',
                        fontSize: '0.7rem'
                      }}
                    />
                  </Card>
                </Tooltip>
              </Grid>

              <Grid item xs={4}>
                <Tooltip title="Pertumbuhan jumlah transaksi dibandingkan periode sebelumnya">
                  <Card variant="outlined" sx={{ p: 1, textAlign: 'center', borderRadius: 2 }}>
                    <ReceiptIcon 
                      fontSize="small"
                      color={
                        transaction_growth > 0 ? 'success' : 
                        transaction_growth < 0 ? 'error' : 
                        'disabled'
                      } 
                    />
                    <Typography variant="caption" display="block" color="text.secondary" gutterBottom>
                      Transaksi
                    </Typography>
                    <Chip 
                      label={formatPercent(transaction_growth)}
                      color={getGrowthConfig(transaction_growth).color}
                      size="small"
                      variant="filled"
                      sx={{ 
                        fontWeight: 'bold',
                        fontSize: '0.7rem'
                      }}
                    />
                  </Card>
                </Tooltip>
              </Grid>

              <Grid item xs={4}>
                <Tooltip title="Pertumbuhan jumlah customer aktif dibandingkan periode sebelumnya">
                  <Card variant="outlined" sx={{ p: 1, textAlign: 'center', borderRadius: 2 }}>
                    <PeopleIcon 
                      fontSize="small"
                      color={
                        customer_growth > 0 ? 'success' : 
                        customer_growth < 0 ? 'error' : 
                        'disabled'
                      } 
                    />
                    <Typography variant="caption" display="block" color="text.secondary" gutterBottom>
                      Customer
                    </Typography>
                    <Chip 
                      label={formatPercent(customer_growth)}
                      color={getGrowthConfig(customer_growth).color}
                      size="small"
                      variant="filled"
                      sx={{ 
                        fontWeight: 'bold',
                        fontSize: '0.7rem'
                      }}
                    />
                  </Card>
                </Tooltip>
              </Grid>
            </Grid>
          </Box>

          {/* Comparative Analysis */}
          <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Analisis Komparatif
            </Typography>
            <Stack spacing={1}>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption">vs Periode Sebelumnya:</Typography>
                <Chip 
                  label={
                    revenue_growth > 0 ? "Lebih Baik" : 
                    revenue_growth < 0 ? "Menurun" : "Stabil"
                  }
                  color={
                    revenue_growth > 0 ? "success" : 
                    revenue_growth < 0 ? "error" : "default"
                  }
                  size="small"
                />
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption">Tren Pasar:</Typography>
                <Typography variant="caption" fontWeight="bold">
                  {revenue_growth > 10 ? "Ekspansif" : revenue_growth > 0 ? "Stabil" : "Kontraksi"}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption">Health Score:</Typography>
                <Typography variant="caption" fontWeight="bold" color={
                  revenue_growth > 10 && transaction_growth > 5 ? "success.main" :
                  revenue_growth > 0 ? "warning.main" : "error.main"
                }>
                  {revenue_growth > 10 && transaction_growth > 5 ? "Excellent" :
                   revenue_growth > 0 ? "Good" : "Needs Attention"}
                </Typography>
              </Box>
            </Stack>
          </Card>

          {/* Actionable Recommendations */}
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <LightbulbIcon fontSize="small" color="warning" />
              <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
                Rekomendasi Tindakan
              </Typography>
            </Box>
            <Stack spacing={1}>
              {revenue_growth < 5 && (
                <Alert severity="warning" sx={{ fontSize: '0.8rem', py: 0.5 }}>
                  💡 Pertimbangkan promo untuk meningkatkan volume penjualan
                </Alert>
              )}
              {customer_growth < 2 && (
                <Alert severity="info" sx={{ fontSize: '0.8rem', py: 0.5 }}>
                  💡 Fokus pada program loyalitas untuk retensi customer
                </Alert>
              )}
              {atv < 300000 && (
                <Alert severity="info" sx={{ fontSize: '0.8rem', py: 0.5 }}>
                  💡 Implementasi upselling dan cross-selling untuk meningkatkan ATV
                </Alert>
              )}
              {transaction_growth < revenue_growth && (
                <Alert severity="info" sx={{ fontSize: '0.8rem', py: 0.5 }}>
                  💡 Optimasi konversi untuk meningkatkan volume transaksi
                </Alert>
              )}
            </Stack>
          </Box>

          {/* Insights */}
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <AnalyticsIcon fontSize="small" color="primary" />
              <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
                Insights & Rekomendasi
              </Typography>
            </Box>
            <Stack spacing={1}>
              {dynamicInsights.map((insight, index) => (
                <Alert 
                  key={index}
                  severity="info"
                  sx={{ 
                    '& .MuiAlert-message': { 
                      fontSize: '0.8rem',
                      lineHeight: 1.4
                    },
                    py: 0.5
                  }}
                >
                  {insight}
                </Alert>
              ))}
            </Stack>
          </Box>

          {/* Performance Summary */}
          <Alert 
            severity={performanceSummary.severity}
            sx={{ mt: 1 }}
          >
            <Box>
              <Typography variant="body2" fontWeight="medium">
                {performanceSummary.message}
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                {performanceSummary.recommendation}
              </Typography>
            </Box>
          </Alert>

          {/* Period Info */}
          <Box sx={{ textAlign: 'center', pt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {formatPeriodWithDuration()}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default BusinessIntelligenceCard;
