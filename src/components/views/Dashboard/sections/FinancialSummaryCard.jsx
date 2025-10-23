import React from "react";
import { 
  Card, 
  CardHeader, 
  CardContent, 
  Stack, 
  Box, 
  Typography, 
  Divider, 
  Skeleton,
  Chip,
  Tooltip,
  IconButton
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { 
  AccountBalanceWallet, 
  TrendingUp, 
  TrendingDown,
  Info,
  AttachMoney,
  Inventory,
  PieChart
} from "@mui/icons-material";
import { fmtIDR } from "../../../../utils/helpers.js";
import RowKV from "../ui/RowKV.jsx";
import { useMediaQuery } from "@mui/material";

// Safe color helper untuk menghindari error theme
const getSafeColor = (theme, colorPath, fallback = 'text.primary') => {
  try {
    if (!colorPath || typeof colorPath !== 'string') return fallback;
    
    // Handle color seperti 'success.main', 'error.main', dll
    if (colorPath.includes('.')) {
      const [colorName, shade] = colorPath.split('.');
      return theme.palette[colorName]?.[shade] || fallback;
    }
    
    // Handle basic color names
    return theme.palette[colorPath]?.main || theme.palette[colorPath] || fallback;
  } catch (error) {
    console.warn('Color error:', error);
    return fallback;
  }
};

const FinancialSummaryCard = React.forwardRef(function FinancialSummaryCard({ 
  omzet = 0, 
  hpp = 0, 
  laba = 0, 
  margin = 0, 
  transactionCount = 0, 
  totalQty = 0, 
  loading = false,
  period = "",
  showDetails = false,
  onToggleDetails,
  ...props
}, ref) {
  const theme = useTheme();
  
  // Safe media queries dengan error handling
  const [isMobile, setIsMobile] = React.useState(false);
  
  React.useEffect(() => {
    try {
      const mobileMql = window.matchMedia('(max-width: 600px)');
      const updateMobile = () => setIsMobile(mobileMql.matches);
      
      updateMobile(); // Set initial value
      mobileMql.addEventListener('change', updateMobile);
      
      return () => mobileMql.removeEventListener('change', updateMobile);
    } catch (error) {
      console.warn('Media query error:', error);
      setIsMobile(false);
    }
  }, []);

  // Calculate additional metrics dengan error handling
  const averageTransactionValue = React.useMemo(() => {
    try {
      return transactionCount > 0 ? omzet / transactionCount : 0;
    } catch {
      return 0;
    }
  }, [omzet, transactionCount]);

  const profitPerUnit = React.useMemo(() => {
    try {
      return totalQty > 0 ? laba / totalQty : 0;
    } catch {
      return 0;
    }
  }, [laba, totalQty]);

  // Color schemes based on performance - dengan safe fallbacks
  const getPerformanceColor = (value, type = 'default') => {
    try {
      if (type === 'margin') {
        if (value >= 30) return 'success';
        if (value >= 15) return 'warning';
        return 'error';
      }
      if (type === 'profit') {
        return value >= 0 ? 'success' : 'error';
      }
      return 'default';
    } catch {
      return 'default';
    }
  };

  const getPerformanceIcon = (value, type = 'default') => {
    try {
      if (type === 'margin') {
        if (value >= 30) return <TrendingUp sx={{ fontSize: 16 }} />;
        if (value >= 15) return <TrendingUp sx={{ fontSize: 16 }} />;
        return <TrendingDown sx={{ fontSize: 16 }} />;
      }
      if (type === 'profit') {
        return value >= 0 ? <TrendingUp sx={{ fontSize: 16 }} /> : <TrendingDown sx={{ fontSize: 16 }} />;
      }
      return null;
    } catch {
      return null;
    }
  };

  // Enhanced mobile row component dengan forwardRef
  const MobileRow = React.forwardRef(function MobileRow({ 
    label, 
    value, 
    color = 'text.primary', 
    isTotal = false, 
    icon = null,
    tooltip = "",
    chip = false,
    ...rowProps 
  }, ref) {
    
    // Safe color untuk mobile row
    const safeColor = React.useMemo(() => {
      try {
        // Untuk color seperti 'success.main', gunakan hanya base color 'success'
        if (typeof color === 'string' && color.includes('.')) {
          return color.split('.')[0];
        }
        return color;
      } catch {
        return 'text.primary';
      }
    }, [color]);

    const safeIconColor = React.useMemo(() => {
      try {
        return getSafeColor(theme, color, 'primary.main');
      } catch {
        return theme.palette.primary.main;
      }
    }, [theme, color]);

    return (
      <Tooltip title={tooltip} arrow placement="top">
        <Box 
          ref={ref}
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            py: 1.5,
            px: 1,
            borderRadius: 1,
            bgcolor: isTotal ? alpha(theme.palette.primary.main, 0.03) : 'transparent',
            border: isTotal ? `1px solid ${alpha(theme.palette.primary.main, 0.1)}` : 'none',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.02),
            }
          }}
          {...rowProps}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
            {icon && React.isValidElement(icon) && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                width: 24,
                height: 24,
                borderRadius: '50%',
                bgcolor: alpha(safeIconColor, 0.1)
              }}>
                {React.cloneElement(icon, { 
                  sx: { 
                    fontSize: 16, 
                    color: safeIconColor 
                  } 
                })}
              </Box>
            )}
            <Typography 
              variant={isTotal ? "body1" : "body2"} 
              fontWeight={isTotal ? 600 : 500}
              color="text.secondary"
              sx={{ 
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                lineHeight: 1.2
              }}
            >
              {label}
            </Typography>
          </Box>
          
          {chip ? (
            <Chip
              label={value}
              color={getPerformanceColor(margin, 'margin')}
              variant="filled"
              size="small"
              icon={getPerformanceIcon(margin, 'margin')}
              sx={{ 
                fontWeight: 600,
                minWidth: 60
              }}
            />
          ) : (
            <Typography 
              variant={isTotal ? "h6" : "body1"} 
              fontWeight={isTotal ? 700 : 600}
              color={safeColor}
              sx={{ 
                fontSize: isMobile ? '0.8rem' : isTotal ? '1rem' : '0.9rem',
                textAlign: 'right',
                fontFamily: 'monospace'
              }}
            >
              {value}
            </Typography>
          )}
        </Box>
      </Tooltip>
    );
  });

  // Enhanced skeleton loader
  const MobileSkeleton = () => (
    <Stack spacing={2}>
      {[...Array(4)].map((_, i) => (
        <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
            <Skeleton variant="circular" width={24} height={24} />
            <Skeleton variant="text" width="60%" height={20} />
          </Box>
          <Skeleton variant="text" width="30%" height={20} />
        </Box>
      ))}
      <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 1 }} />
    </Stack>
  );

  const DesktopSkeleton = () => (
    <Stack spacing={2.5}>
      <Skeleton height={32} />
      <Skeleton height={32} />
      <Divider />
      <Skeleton height={40} />
      <Skeleton height={32} />
      <Skeleton variant="rectangular" height={50} sx={{ borderRadius: 1 }} />
    </Stack>
  );

  // Safe background colors
  const safeBackground = React.useMemo(() => {
    try {
      return `linear(135deg, ${alpha(getSafeColor(theme, 'success.main'), 0.03)} 0%, ${alpha(getSafeColor(theme, 'info.main'), 0.03)} 100%)`;
    } catch {
      return `linear(135deg, ${alpha(theme.palette.success.main, 0.03)} 0%, ${alpha(theme.palette.info.main, 0.03)} 100%)`;
    }
  }, [theme]);

  const safeHeaderBackground = React.useMemo(() => {
    try {
      return `linear(135deg, ${getSafeColor(theme, 'success.main')} 0%, ${getSafeColor(theme, 'info.main')} 100%)`;
    } catch {
      return `linear(135deg, ${theme.palette.success.main} 0%, ${theme.palette.info.main} 100%)`;
    }
  }, [theme]);

  return (
    <Card 
      ref={ref}
      sx={{
        background: safeBackground,
        border: `1px solid ${alpha(getSafeColor(theme, 'success.main'), 0.15)}`,
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4],
          borderColor: alpha(getSafeColor(theme, 'success.main'), 0.3),
        }
      }}
      {...props}
    >
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                width: isMobile ? 36 : 44,
                height: isMobile ? 36 : 44,
                borderRadius: 2,
                background: safeHeaderBackground,
                color: 'white'
              }}>
                <AccountBalanceWallet sx={{ fontSize: isMobile ? '1.1rem' : '1.3rem' }} />
              </Box>
              <Box>
                <Typography 
                  variant={isMobile ? "subtitle1" : "h6"} 
                  fontWeight={700}
                  sx={{ 
                    fontSize: isMobile ? '0.9rem' : '1.1rem',
                    lineHeight: 1.2
                  }}
                >
                  Ringkasan Keuangan
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontSize: isMobile ? '0.65rem' : '0.75rem',
                    color: 'text.secondary'
                  }}
                >
                  {period || "Periode terkini"}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Tooltip title="Hanya transaksi Tunai dan status LUNAS yang dihitung" arrow>
                <IconButton size="small" sx={{ color: 'text.secondary' }}>
                  <Info sx={{ fontSize: isMobile ? 16 : 18 }} />
                </IconButton>
              </Tooltip>
              
              {onToggleDetails && (
                <Tooltip title={showDetails ? "Sembunyikan detail" : "Tampilkan detail"} arrow>
                  <IconButton 
                    size="small" 
                    onClick={onToggleDetails}
                    sx={{ 
                      color: getSafeColor(theme, 'primary.main'),
                      transform: showDetails ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.3s ease-in-out'
                    }}
                  >
                    <PieChart sx={{ fontSize: isMobile ? 16 : 18 }} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        }
        sx={{ 
          pb: 2, 
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          px: isMobile ? 1.5 : 3,
          pt: isMobile ? 2 : 3,
          '& .MuiCardHeader-content': {
            width: '100%'
          }
        }}
      />
      
      <CardContent sx={{ 
        px: isMobile ? 1.5 : 3, 
        pb: isMobile ? 2 : 3,
        pt: 2 
      }}>
        {loading ? (
          isMobile ? <MobileSkeleton /> : <DesktopSkeleton />
        ) : isMobile ? (
          // Enhanced Mobile View dengan safe colors
          <Stack spacing={1}>
            <MobileRow 
              label="Total Omzet" 
              value={fmtIDR(omzet)} 
              color="success"
              icon={<AttachMoney />}
              tooltip="Total pendapatan dari transaksi yang dibayar"
            />
            
            <MobileRow 
              label="HPP" 
              value={`- ${fmtIDR(hpp)}`} 
              color="error"
              icon={<Inventory />}
              tooltip="Harga Pokok Penjualan"
            />
            
            <Box sx={{ py: 0.5 }}>
              <Divider />
            </Box>
            
            <MobileRow 
              label="Laba Kotor" 
              value={fmtIDR(laba)} 
              color={laba >= 0 ? 'success' : 'error'}
              icon={getPerformanceIcon(laba, 'profit')}
              isTotal={true}
              tooltip="Laba sebelum pengurangan biaya operasional"
            />
            
            <MobileRow 
              label="Margin Laba" 
              value={`${margin}%`} 
              chip={true}
              tooltip="Persentase laba terhadap omzet"
            />

            {/* Additional metrics when showDetails is true */}
            {showDetails && (
              <>
                <Box sx={{ py: 0.5 }}>
                  <Divider />
                </Box>
                
                <MobileRow 
                  label="Rata-rata/Transaksi" 
                  value={fmtIDR(averageTransactionValue)} 
                  color="info"
                  tooltip="Nilai rata-rata per transaksi"
                />
                
                <MobileRow 
                  label="Laba/Unit" 
                  value={fmtIDR(profitPerUnit)} 
                  color={profitPerUnit >= 0 ? 'success' : 'error'}
                  tooltip="Laba kotor per unit tabung"
                />
              </>
            )}
            
            {/* Summary footer */}
            <Box sx={{ 
              mt: 1, 
              p: 2, 
              bgcolor: alpha(getSafeColor(theme, 'primary.main'), 0.08), 
              borderRadius: 2,
              textAlign: 'center',
              border: `1px solid ${alpha(getSafeColor(theme, 'primary.main'), 0.1)}`
            }}>
              <Typography 
                variant="caption" 
                fontWeight={600}
                color="text.secondary" 
                sx={{ fontSize: '0.7rem' }}
              >
                📊 {transactionCount} transaksi • 🏺 {totalQty} tabung
              </Typography>
              {showDetails && (
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  sx={{ 
                    fontSize: '0.65rem',
                    display: 'block',
                    mt: 0.5
                  }}
                >
                  Performa: {margin >= 30 ? '💪 Sangat Baik' : margin >= 15 ? '👍 Baik' : '⚠️ Perlu Perhatian'}
                </Typography>
              )}
            </Box>
          </Stack>
        ) : (
          // Enhanced Desktop View dengan safe colors
          <Stack spacing={2.5}>
            <RowKV 
              k={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AttachMoney sx={{ fontSize: 18, color: getSafeColor(theme, 'success.main') }} />
                  <span>Total Omzet</span>
                </Box>
              } 
              v={fmtIDR(omzet)} 
              vSx={{ 
                fontWeight: 700, 
                color: getSafeColor(theme, 'success.main'),
                fontSize: '1.1rem',
                fontFamily: 'monospace'
              }}
            />
            
            <RowKV 
              k={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Inventory sx={{ fontSize: 18, color: getSafeColor(theme, 'error.main') }} />
                  <span>Harga Pokok Penjualan</span>
                </Box>
              } 
              v={`- ${fmtIDR(hpp)}`} 
              vSx={{ 
                fontWeight: 600, 
                color: getSafeColor(theme, 'error.main'),
                fontFamily: 'monospace'
              }}
            />
            
            <Divider sx={{ my: 1 }} />
            
            <RowKV 
              k="Laba Kotor" 
              v={fmtIDR(laba)} 
              vSx={{ 
                fontWeight: 800, 
                fontSize: '1.3rem',
                color: getSafeColor(theme, laba >= 0 ? 'success.main' : 'error.main'),
                fontFamily: 'monospace'
              }}
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body1" fontWeight={600} color="text.secondary">
                Margin Laba
              </Typography>
              <Chip
                label={`${margin}%`}
                color={getPerformanceColor(margin, 'margin')}
                variant="filled"
                icon={getPerformanceIcon(margin, 'margin')}
                sx={{ 
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  minWidth: 80
                }}
              />
            </Box>

            {/* Additional metrics when showDetails is true */}
            {showDetails && (
              <>
                <Divider sx={{ my: 1 }} />
                
                <RowKV 
                  k="Rata-rata per Transaksi" 
                  v={fmtIDR(averageTransactionValue)} 
                  vSx={{ 
                    fontWeight: 600, 
                    color: getSafeColor(theme, 'info.main'),
                    fontFamily: 'monospace'
                  }}
                />
                
                <RowKV 
                  k="Laba per Unit" 
                  v={fmtIDR(profitPerUnit)} 
                  vSx={{ 
                    fontWeight: 600, 
                    color: getSafeColor(theme, profitPerUnit >= 0 ? 'success.main' : 'error.main'),
                    fontFamily: 'monospace'
                  }}
                />
              </>
            )}
            
            {/* Summary footer */}
            <Box sx={{ 
              mt: 2, 
              p: 2.5, 
              bgcolor: alpha(getSafeColor(theme, 'primary.main'), 0.08), 
              borderRadius: 2,
              border: `1px solid ${alpha(getSafeColor(theme, 'primary.main'), 0.1)}`
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" fontWeight={600} color="text.secondary">
                  📊 Ringkasan Performa
                </Typography>
                <Chip
                  label={margin >= 30 ? 'Sangat Baik' : margin >= 15 ? 'Baik' : 'Perlu Perhatian'}
                  color={getPerformanceColor(margin, 'margin')}
                  size="small"
                  variant="outlined"
                />
              </Box>
              <Typography variant="caption" color="text.secondary" display="block">
                {transactionCount} transaksi • {totalQty} unit tabung
                {showDetails && ` • ${fmtIDR(averageTransactionValue)}/transaksi`}
              </Typography>
            </Box>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
});

FinancialSummaryCard.displayName = 'FinancialSummaryCard';

export default FinancialSummaryCard;