// KpiStripMobile.jsx - Versi sederhana untuk mobile
import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Inventory,
  AttachMoney,
  Analytics
} from '@mui/icons-material';

const KpiStripMobile = ({ financialData, stockPrediction, businessIntel, loading }) => {
  const theme = useTheme();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <Card sx={{ width: '100%', mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>KPI</Typography>
          <Typography variant="body2" color="text.secondary">Loading...</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ width: '100%', mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>Key Indicators</Typography>
        
        <Stack spacing={2}>
          {/* Financial */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              <AttachMoney fontSize="small" color="primary" />
              <Typography variant="body2">Laba:</Typography>
            </Box>
            <Typography variant="body2" fontWeight="bold">
              {formatCurrency(financialData.laba || 0)}
            </Typography>
          </Box>

          {/* Stock */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              <Inventory fontSize="small" color="secondary" />
              <Typography variant="body2">Stok ISI:</Typography>
            </Box>
            <Typography variant="body2" fontWeight="bold">
              {stockPrediction?.current_stock?.ISI || 0}
            </Typography>
          </Box>

          {/* Growth */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              <Analytics fontSize="small" color="info" />
              <Typography variant="body2">Growth:</Typography>
            </Box>
            <Chip 
              label={`${businessIntel?.growth_metrics?.revenue_growth > 0 ? '+' : ''}${businessIntel?.growth_metrics?.revenue_growth || 0}%`}
              color={businessIntel?.growth_metrics?.revenue_growth > 0 ? 'success' : 'error'}
              size="small"
              icon={businessIntel?.growth_metrics?.revenue_growth > 0 ? <TrendingUp /> : <TrendingDown />}
            />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default KpiStripMobile;