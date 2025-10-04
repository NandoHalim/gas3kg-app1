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
  Alert
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  People as PeopleIcon,
  Receipt as ReceiptIcon,
  AttachMoney as AttachMoneyIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';

const BusinessIntelligenceCard = ({ data, loading }) => {
  if (loading) {
    return (
      <Card sx={{ minWidth: 275 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" component="h2">
              Business Intelligence
            </Typography>
            <Chip label="Loading..." color="default" size="small" />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Memuat analisis bisnis...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card sx={{ minWidth: 275 }}>
        <CardContent>
          <Typography variant="h6" component="h2" gutterBottom>
            Business Intelligence
          </Typography>
          <Alert severity="info">
            Tidak dapat memuat analisis bisnis saat ini.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const { atv, growth_metrics, insights, period } = data;
  const { revenue_growth, transaction_growth, customer_growth } = growth_metrics;

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format percentage
  const formatPercent = (value) => {
    if (value === null || value === undefined) return '0%';
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
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
    return new Date(dateString).toLocaleDateString('id-ID');
  };

  return (
    <Card sx={{ minWidth: 275 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" component="h2">
            Business Intelligence
          </Typography>
          <Chip 
            label={`${formatPeriod(period?.from)} - ${formatPeriod(period?.to)}`}
            color="primary"
            variant="outlined"
            size="small"
          />
        </Box>

        <Stack spacing={3}>
          {/* ATV Section */}
          <Card variant="outlined" sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Tooltip title="Average Transaction Value">
                <Box display="flex" alignItems="center" gap={1}>
                  <AttachMoneyIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle2" fontWeight="bold">
                    ATV
                  </Typography>
                </Box>
              </Tooltip>
              <Typography variant="h5" fontWeight="bold">
                {formatCurrency(atv || 0)}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Rata-rata nilai transaksi
            </Typography>
          </Card>

          {/* Growth Metrics */}
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Growth Metrics
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={4}>
                <Tooltip title="Pertumbuhan Pendapatan">
                  <Box textAlign="center">
                    <TrendingUpIcon 
                      fontSize="small"
                      color={
                        revenue_growth > 0 ? 'success' : 
                        revenue_growth < 0 ? 'error' : 
                        'disabled'
                      } 
                    />
                    <Typography variant="caption" display="block" color="text.secondary">
                      Revenue
                    </Typography>
                    <Chip 
                      label={formatPercent(revenue_growth)}
                      color={getGrowthConfig(revenue_growth).color}
                      variant="outlined"
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                </Tooltip>
              </Grid>

              <Grid item xs={4}>
                <Tooltip title="Pertumbuhan Transaksi">
                  <Box textAlign="center">
                    <ReceiptIcon 
                      fontSize="small"
                      color={
                        transaction_growth > 0 ? 'success' : 
                        transaction_growth < 0 ? 'error' : 
                        'disabled'
                      } 
                    />
                    <Typography variant="caption" display="block" color="text.secondary">
                      Transactions
                    </Typography>
                    <Chip 
                      label={formatPercent(transaction_growth)}
                      color={getGrowthConfig(transaction_growth).color}
                      variant="outlined"
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                </Tooltip>
              </Grid>

              <Grid item xs={4}>
                <Tooltip title="Pertumbuhan Pelanggan">
                  <Box textAlign="center">
                    <PeopleIcon 
                      fontSize="small"
                      color={
                        customer_growth > 0 ? 'success' : 
                        customer_growth < 0 ? 'error' : 
                        'disabled'
                      } 
                    />
                    <Typography variant="caption" display="block" color="text.secondary">
                      Customers
                    </Typography>
                    <Chip 
                      label={formatPercent(customer_growth)}
                      color={getGrowthConfig(customer_growth).color}
                      variant="outlined"
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                </Tooltip>
              </Grid>
            </Grid>
          </Box>

          {/* Insights */}
          {insights && insights.length > 0 && (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Insights
                </Typography>
                <AnalyticsIcon fontSize="small" color="action" />
              </Box>
              <Stack spacing={1}>
                {insights.map((insight, index) => (
                  <Card key={index} variant="outlined" sx={{ p: 1 }}>
                    <Typography variant="body2">{insight}</Typography>
                  </Card>
                ))}
              </Stack>
            </Box>
          )}

          {/* Performance Summary */}
          <Alert 
            severity={revenue_growth > 0 ? "success" : "warning"}
            sx={{ mt: 1 }}
          >
            <Typography variant="body2">
              <strong>Summary:</strong> {' '}
              {revenue_growth > 0 ? 'Pertumbuhan positif ' : 'Perlu perhatian '}
              dengan ATV {formatCurrency(atv || 0)}.{' '}
              {transaction_growth > 0 ? 'Transaksi meningkat.' : 'Transaksi menurun.'}
            </Typography>
          </Alert>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default BusinessIntelligenceCard;