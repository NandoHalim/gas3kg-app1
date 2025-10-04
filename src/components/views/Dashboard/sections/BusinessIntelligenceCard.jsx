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
  Info as InfoIcon
} from '@mui/icons-material';

const BusinessIntelligenceCard = ({ data, loading, error }) => {
  if (loading) {
    return (
      <Card sx={{ minWidth: 275, height: '100%' }}>
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
      <Card sx={{ minWidth: 275, height: '100%' }}>
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

  if (!data) {
    return (
      <Card sx={{ minWidth: 275, height: '100%' }}>
        <CardContent>
          <Typography variant="h6" component="h2" gutterBottom>
            Business Intelligence
          </Typography>
          <Alert severity="info">
            <Typography variant="body2">
              Data analisis bisnis tidak tersedia saat ini.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const { atv, growth_metrics, insights, period } = data;
  const { revenue_growth = 0, transaction_growth = 0, customer_growth = 0 } = growth_metrics || {};

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
    if (!dateString) return '';
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

  // Generate performance summary
  const getPerformanceSummary = () => {
    if (revenue_growth > 10 && transaction_growth > 5) {
      return {
        severity: "success",
        message: "Performansi bisnis sangat baik dengan pertumbuhan pendapatan dan transaksi yang kuat."
      };
    } else if (revenue_growth > 0 && transaction_growth > 0) {
      return {
        severity: "success",
        message: "Bisnis menunjukkan pertumbuhan positif dalam pendapatan dan transaksi."
      };
    } else if (revenue_growth > 0 && transaction_growth <= 0) {
      return {
        severity: "warning",
        message: "Pendapatan tumbuh namun jumlah transaksi menurun. Perhatikan nilai transaksi rata-rata."
      };
    } else if (revenue_growth <= 0 && transaction_growth > 0) {
      return {
        severity: "warning",
        message: "Jumlah transaksi meningkat namun pendapatan menurun. Perhatikan harga dan diskon."
      };
    } else {
      return {
        severity: "error",
        message: "Perlu perhatian khusus. Baik pendapatan maupun transaksi menunjukkan penurunan."
      };
    }
  };

  const performanceSummary = getPerformanceSummary();

  return (
    <Card sx={{ minWidth: 275, height: '100%' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography variant="h6" component="h2" gutterBottom>
              Business Intelligence
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Analisis performa bisnis
            </Typography>
          </Box>
          <Tooltip title={`Periode analisis: ${formatPeriod(period?.from)} - ${formatPeriod(period?.to)}`}>
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
          <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
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
                  <Card variant="outlined" sx={{ p: 1, textAlign: 'center' }}>
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
                  <Card variant="outlined" sx={{ p: 1, textAlign: 'center' }}>
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
                  <Card variant="outlined" sx={{ p: 1, textAlign: 'center' }}>
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

          {/* Insights */}
          {insights && insights.length > 0 && (
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <AnalyticsIcon fontSize="small" color="primary" />
                <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
                  Insights & Rekomendasi
                </Typography>
              </Box>
              <Stack spacing={1}>
                {insights.map((insight, index) => (
                  <Alert 
                    key={index}
                    severity="info"
                    sx={{ 
                      '& .MuiAlert-message': { 
                        fontSize: '0.8rem',
                        lineHeight: 1.4
                      }
                    }}
                  >
                    {insight}
                  </Alert>
                ))}
              </Stack>
            </Box>
          )}

          {/* Performance Summary */}
          <Alert 
            severity={performanceSummary.severity}
            sx={{ mt: 1 }}
          >
            <Typography variant="body2" fontWeight="medium">
              {performanceSummary.message}
            </Typography>
          </Alert>

          {/* Period Info */}
          <Box sx={{ textAlign: 'center', pt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Periode: {formatPeriod(period?.from)} - {formatPeriod(period?.to)}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default BusinessIntelligenceCard;