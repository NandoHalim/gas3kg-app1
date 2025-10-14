// KpiStrip.jsx - Versi mobile-first yang lebih robust
import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  useTheme,
  useMediaQuery,
  Skeleton
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Inventory,
  AttachMoney,
  Analytics,
  ShowChart
} from '@mui/icons-material';

const KpiStrip = ({ 
  financialData = {}, 
  stockPrediction = {}, 
  businessIntel = {}, 
  loading = false 
}) => {
  const theme = useTheme();
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Safe data extraction dengan fallbacks
  const safeFinancialData = financialData || {};
  const safeStockPrediction = stockPrediction || {};
  const safeBusinessIntel = businessIntel || {};
  
  const laba = Number(safeFinancialData.laba) || 0;
  const currentStock = Number(safeStockPrediction.current_stock?.ISI) || 0;
  const revenueGrowth = Number(safeBusinessIntel.growth_metrics?.revenue_growth) || 0;

  const formatCurrency = (amount) => {
    const numAmount = Number(amount) || 0;
    if (numAmount >= 1000000) {
      return `Rp ${(numAmount / 1000000).toFixed(1)}Jt`;
    }
    if (numAmount >= 1000) {
      return `Rp ${(numAmount / 1000).toFixed(1)}Rb`;
    }
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(numAmount);
  };

  const formatGrowth = (growth) => {
    const numGrowth = Number(growth) || 0;
    return `${numGrowth > 0 ? '+' : ''}${numGrowth.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <Card sx={{ 
        width: '100%', 
        mb: 2,
        borderRadius: 2,
        boxShadow: theme.shadows[1]
      }}>
        <CardContent sx={{ p: 2 }}>
          <Skeleton variant="text" width="40%" height={28} sx={{ mb: 2 }} />
          <Stack spacing={1.5}>
            {[1, 2, 3].map((item) => (
              <Box key={item} display="flex" justifyContent="space-between" alignItems="center">
                <Box display="flex" alignItems="center" gap={1}>
                  <Skeleton variant="circular" width={20} height={20} />
                  <Skeleton variant="text" width={60} height={20} />
                </Box>
                <Skeleton variant="text" width={80} height={20} />
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>
    );
  }

  // Hide jika tidak ada data yang meaningful
  const hasMeaningfulData = laba !== 0 || currentStock !== 0 || revenueGrowth !== 0;
  if (!hasMeaningfulData) {
    return null;
  }

  return (
    <Card sx={{ 
      width: '100%', 
      mb: 2,
      borderRadius: 2,
      border: `1px solid ${theme.palette.divider}`,
      background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
      boxShadow: theme.shadows[1],
      '&:hover': {
        boxShadow: theme.shadows[2],
      }
    }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Typography 
          variant="h6" 
          gutterBottom 
          sx={{ 
            fontSize: '1rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <ShowChart fontSize="small" />
          Key Indicators
        </Typography>
        
        <Stack spacing={1.5}>
          {/* Financial - Laba */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              <AttachMoney 
                fontSize="small" 
                sx={{ 
                  color: laba > 0 ? theme.palette.success.main : theme.palette.text.secondary,
                  fontSize: '18px'
                }} 
              />
              <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                {isSmallMobile ? 'Laba' : 'Total Laba'}:
              </Typography>
            </Box>
            <Typography 
              variant="body2" 
              fontWeight="bold"
              sx={{ 
                color: laba > 0 ? theme.palette.success.main : theme.palette.text.primary,
                fontSize: '0.875rem'
              }}
            >
              {formatCurrency(laba)}
            </Typography>
          </Box>

          {/* Stock Indicator */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              <Inventory 
                fontSize="small" 
                sx={{ 
                  color: currentStock > 10 ? theme.palette.success.main : 
                         currentStock > 5 ? theme.palette.warning.main : theme.palette.error.main,
                  fontSize: '18px'
                }} 
              />
              <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                {isSmallMobile ? 'Stok' : 'Stok ISI'}:
              </Typography>
            </Box>
            <Typography 
              variant="body2" 
              fontWeight="bold"
              sx={{ 
                color: currentStock > 10 ? theme.palette.success.main : 
                       currentStock > 5 ? theme.palette.warning.main : theme.palette.error.main,
                fontSize: '0.875rem'
              }}
            >
              {currentStock}
            </Typography>
          </Box>

          {/* Growth Indicator */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              <Analytics 
                fontSize="small" 
                sx={{ 
                  color: revenueGrowth > 0 ? theme.palette.success.main : 
                         revenueGrowth < 0 ? theme.palette.error.main : theme.palette.info.main,
                  fontSize: '18px'
                }} 
              />
              <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                {isSmallMobile ? 'Growth' : 'Revenue Growth'}:
              </Typography>
            </Box>
            <Chip 
              label={formatGrowth(revenueGrowth)}
              color={revenueGrowth > 0 ? 'success' : revenueGrowth < 0 ? 'error' : 'default'}
              size="small"
              variant="outlined"
              icon={revenueGrowth > 0 ? <TrendingUp /> : <TrendingDown />}
              sx={{ 
                fontSize: '0.75rem',
                height: '24px',
                '& .MuiChip-icon': {
                  fontSize: '16px'
                }
              }}
            />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

// Default props untuk safety
KpiStrip.defaultProps = {
  financialData: {},
  stockPrediction: {},
  businessIntel: {},
  loading: false
};

export default React.memo(KpiStrip);