// KpiStrip.jsx - Mobile First Optimized
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
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
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
        borderRadius: isSmallMobile ? 1 : 2,
        boxShadow: theme.shadows[1],
        mx: isSmallMobile ? 0.5 : 0
      }}>
        <CardContent sx={{ p: isSmallMobile ? 1.5 : 2 }}>
          <Skeleton variant="text" width="40%" height={isSmallMobile ? 20 : 28} sx={{ mb: 2 }} />
          <Stack spacing={1}>
            {[1, 2, 3].map((item) => (
              <Box key={item} display="flex" justifyContent="space-between" alignItems="center">
                <Box display="flex" alignItems="center" gap={1}>
                  <Skeleton variant="circular" width={isSmallMobile ? 16 : 20} height={isSmallMobile ? 16 : 20} />
                  <Skeleton variant="text" width={isSmallMobile ? 40 : 60} height={isSmallMobile ? 16 : 20} />
                </Box>
                <Skeleton variant="text" width={isSmallMobile ? 50 : 80} height={isSmallMobile ? 16 : 20} />
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

  // Mobile-optimized KPI Item
  const KpiItem = ({ icon, label, value, growth, valueColor = 'text.primary' }) => (
    <Box 
      display="flex" 
      justifyContent="space-between" 
      alignItems="center"
      sx={{ 
        py: isSmallMobile ? 0.5 : 1,
        borderBottom: `1px solid ${theme.palette.divider}`,
        '&:last-child': { borderBottom: 'none' }
      }}
    >
      <Box display="flex" alignItems="center" gap={1} sx={{ minWidth: 0, flex: 1 }}>
        <Box sx={{ 
          color: valueColor,
          fontSize: isSmallMobile ? '16px' : '18px',
          flexShrink: 0
        }}>
          {icon}
        </Box>
        <Typography 
          variant="body2" 
          sx={{ 
            fontSize: isSmallMobile ? '0.75rem' : '0.875rem', 
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {label}:
        </Typography>
      </Box>
      
      <Box display="flex" alignItems="center" gap={0.5} sx={{ flexShrink: 0 }}>
        <Typography 
          variant="body2" 
          fontWeight="bold"
          sx={{ 
            color: valueColor,
            fontSize: isSmallMobile ? '0.75rem' : '0.875rem',
            textAlign: 'right'
          }}
        >
          {value}
        </Typography>
        {growth && (
          <Chip 
            label={formatGrowth(growth)}
            color={growth > 0 ? 'success' : growth < 0 ? 'error' : 'default'}
            size="small"
            variant="outlined"
            sx={{ 
              height: isSmallMobile ? 18 : 24,
              fontSize: isSmallMobile ? '0.6rem' : '0.75rem',
              minWidth: isSmallMobile ? 45 : 60,
              '& .MuiChip-icon': {
                fontSize: isSmallMobile ? '12px' : '16px'
              }
            }}
          />
        )}
      </Box>
    </Box>
  );

  return (
    <Card sx={{ 
      width: '100%', 
      mb: 2,
      borderRadius: isSmallMobile ? 1 : 2,
      border: `1px solid ${theme.palette.divider}`,
      background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
      boxShadow: theme.shadows[1],
      mx: isSmallMobile ? 0.5 : 0
    }}>
      <CardContent sx={{ 
        p: isSmallMobile ? 1.5 : 2, 
        '&:last-child': { pb: isSmallMobile ? 1.5 : 2 } 
      }}>
        <Typography 
          variant={isSmallMobile ? "subtitle2" : "h6"} 
          gutterBottom 
          sx={{ 
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            fontSize: isSmallMobile ? '0.9rem' : '1rem',
            mb: isSmallMobile ? 1 : 2
          }}
        >
          <ShowChart fontSize={isSmallMobile ? "small" : "medium"} />
          Key Indicators
        </Typography>
        
        <Stack spacing={0}>
          {/* Financial - Laba */}
          <KpiItem
            icon={<AttachMoney fontSize={isSmallMobile ? "small" : "small"} />}
            label={isSmallMobile ? 'Laba' : 'Total Laba'}
            value={formatCurrency(laba)}
            valueColor={laba > 0 ? theme.palette.success.main : theme.palette.text.primary}
          />

          {/* Stock Indicator */}
          <KpiItem
            icon={<Inventory fontSize={isSmallMobile ? "small" : "small"} />}
            label={isSmallMobile ? 'Stok' : 'Stok ISI'}
            value={currentStock}
            valueColor={
              currentStock > 10 ? theme.palette.success.main : 
              currentStock > 5 ? theme.palette.warning.main : theme.palette.error.main
            }
          />

          {/* Growth Indicator */}
          <KpiItem
            icon={<Analytics fontSize={isSmallMobile ? "small" : "small"} />}
            label={isSmallMobile ? 'Growth' : 'Revenue Growth'}
            value={formatGrowth(revenueGrowth)}
            growth={revenueGrowth}
            valueColor={
              revenueGrowth > 0 ? theme.palette.success.main : 
              revenueGrowth < 0 ? theme.palette.error.main : theme.palette.info.main
            }
          />
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