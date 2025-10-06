// src/components/views/Dashboard/sections/StockPredictionCard.jsx
import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  LinearProgress,
  Chip,
  Alert,
  Tooltip,
  Grid
} from '@mui/material';
import {
  Warning as WarningIcon,
  CalendarToday as CalendarIcon,
  TrendingDown as TrendingDownIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';

const StockPredictionCard = ({ data, loading }) => {
  if (loading) {
    return (
      <Card sx={{ minWidth: 275 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" component="h2">
              Prediksi Stok
            </Typography>
            <Chip label="Loading..." color="default" size="small" />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Memuat prediksi stok...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (!data?.prediction) {
    return (
      <Card sx={{ minWidth: 275 }}>
        <CardContent>
          <Typography variant="h6" component="h2" gutterBottom>
            Prediksi Stok
          </Typography>
          <Alert severity="info">
            Tidak dapat memuat prediksi stok saat ini.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const { prediction, current_stock, sales_analysis } = data;
  const { days_remaining_isi, restock_recommendation, estimated_depletion_date } = prediction;
  const { ISI, KOSONG } = current_stock;
  const { avg_daily_sales } = sales_analysis;

  // Tentukan severity level
  const getSeverity = () => {
    if (days_remaining_isi <= 2) return 'error';
    if (days_remaining_isi <= 5) return 'warning';
    return 'info';
  };

  const severity = getSeverity();
  
  // Konfigurasi berdasarkan severity
  const config = {
    error: {
      color: 'error',
      icon: <WarningIcon fontSize="small" />,
      title: 'Stok Kritis!',
      description: 'Stok akan habis dalam waktu dekat'
    },
    warning: {
      color: 'warning',
      icon: <TrendingDownIcon fontSize="small" />,
      title: 'Perhatian',
      description: 'Stok menipis'
    },
    info: {
      color: 'info',
      icon: <InventoryIcon fontSize="small" />,
      title: 'Stok Aman',
      description: 'Stok masih mencukupi'
    }
  };

  const currentConfig = config[severity];

  // Format tanggal
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Rekomendasi text
  const getRecommendationText = () => {
    switch (restock_recommendation) {
      case 'RESTOK_SEGERA':
        return 'Segera lakukan pengisian stok!';
      case 'RESTOK_MINGGU_INI':
        return 'Rencanakan pengisian stok minggu ini';
      case 'STOCK_AMAN':
        return 'Stok dalam kondisi aman';
      default:
        return 'Monitor stok secara berkala';
    }
  };

  // Calculate progress value
  const progressValue = Math.min((ISI / 100) * 100, 100);

  return (
    <Card sx={{ minWidth: 275 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" component="h2">
            Prediksi Stok
          </Typography>
          <Chip 
            icon={currentConfig.icon}
            label={currentConfig.title}
            color={currentConfig.color}
            variant="outlined"
            size="small"
          />
        </Box>

        <Stack spacing={2}>
          {/* Alert Status */}
          <Alert severity={severity} sx={{ mb: 1 }}>
            <Typography variant="body2">
              <strong>{currentConfig.description}</strong> - {getRecommendationText()}
            </Typography>
          </Alert>

          {/* Progress Bar */}
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2">Sisa Stok ISI</Typography>
              <Typography variant="body2" fontWeight="medium">
                {ISI} tabung
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={progressValue}
              color={severity}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>

          {/* Metrics Grid */}
          <Grid container spacing={2} sx={{ mb: 1 }}>
            <Grid item xs={6}>
              <Tooltip title="Perkiraan stok habis berdasarkan rata-rata penjualan">
                <Box textAlign="center">
                  <CalendarIcon color="action" sx={{ mb: 0.5 }} />
                  <Typography variant="caption" display="block" color="text.secondary">
                    Habis Dalam
                  </Typography>
                  <Typography 
                    variant="h6" 
                    fontWeight="bold"
                    color={`${severity}.main`}
                  >
                    {days_remaining_isi?.toFixed(1) || '0'} hari
                  </Typography>
                </Box>
              </Tooltip>
            </Grid>

            <Grid item xs={6}>
              <Tooltip title="Rata-rata penjualan harian">
                <Box textAlign="center">
                  <TrendingDownIcon color="action" sx={{ mb: 0.5 }} />
                  <Typography variant="caption" display="block" color="text.secondary">
                    Rata-rata/Hari
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {avg_daily_sales?.toFixed(1) || '0'}
                  </Typography>
                </Box>
              </Tooltip>
            </Grid>
          </Grid>

          {/* Detail Information */}
          <Card variant="outlined" sx={{ p: 1.5 }}>
            <Stack spacing={1}>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">Perkiraan Habis:</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {formatDate(estimated_depletion_date)}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">Stok KOSONG:</Typography>
                <Typography variant="body2" fontWeight="medium">{KOSONG} tabung</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">Analisis:</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {sales_analysis.analysis_period_days} hari
                </Typography>
              </Box>
            </Stack>
          </Card>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default StockPredictionCard;