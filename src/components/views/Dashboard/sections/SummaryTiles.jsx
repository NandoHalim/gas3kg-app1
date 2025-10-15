import React from "react";
import { 
  Grid, 
  useTheme, 
  useMediaQuery, 
  Box, 
  Stack, 
  Typography,
  Skeleton,
  Chip
} from "@mui/material";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorIcon from "@mui/icons-material/Error";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const LOW_STOCK_THRESHOLD = 5;
const CRITICAL_STOCK_THRESHOLD = 2;

// Helper functions
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatCompactNumber = (num) => {
  const number = Number(num) || 0;
  if (number >= 1000000) return (number / 1000000).toFixed(1) + 'Jt';
  if (number >= 1000) return (number / 1000).toFixed(1) + 'Rb';
  return number.toString();
};

// Safe number converter
const safeNumber = (value) => Math.max(0, Number(value) || 0);

// Status chip dengan icon
const StatusChip = ({ status, isMobile }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'critical':
        return {
          label: isMobile ? 'Kritis' : 'Stok Kritis',
          color: 'error',
          icon: <ErrorIcon fontSize="small" />
        };
      case 'low':
        return {
          label: isMobile ? 'Menipis' : 'Stok Menipis',
          color: 'warning',
          icon: <WarningIcon fontSize="small" />
        };
      case 'high':
        return {
          label: isMobile ? 'Banyak' : 'Banyak Kosong',
          color: 'error',
          icon: <WarningIcon fontSize="small" />
        };
      case 'medium':
        return {
          label: isMobile ? 'Perlu Isi' : 'Perlu Diisi',
          color: 'warning',
          icon: <WarningIcon fontSize="small" />
        };
      case 'unpaid':
        return {
          label: isMobile ? 'Belum Lunas' : 'Belum Lunas',
          color: 'warning',
          icon: <WarningIcon fontSize="small" />
        };
      case 'paid':
        return {
          label: isMobile ? 'Lunas' : 'Semua Lunas',
          color: 'success',
          icon: <CheckCircleIcon fontSize="small" />
        };
      default:
        return {
          label: isMobile ? 'Normal' : 'Stok Normal',
          color: 'success',
          icon: <CheckCircleIcon fontSize="small" />
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Chip
      icon={config.icon}
      label={config.label}
      color={config.color}
      size="small"
      variant="filled"
      sx={{
        height: isMobile ? 20 : 24,
        fontSize: isMobile ? '0.65rem' : '0.7rem',
        '& .MuiChip-icon': {
          fontSize: isMobile ? '0.8rem' : '1rem',
          ml: 0.5
        }
      }}
    />
  );
};

// Mobile-optimized Stat Tile dengan FIXED HEIGHT
const StatTile = ({ 
  title, 
  value, 
  subtitle, 
  status,
  icon,
  loading = false,
  isMobile,
  isSmallMobile 
}) => {
  const theme = useTheme();

  if (loading) {
    return (
      <Box
        sx={{
          p: isSmallMobile ? 1.5 : 2,
          borderRadius: 2,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          height: isSmallMobile ? 100 : 120, // FIXED HEIGHT
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
          <Skeleton variant="circular" width={20} height={20} />
          <Skeleton variant="text" width="60%" height={16} />
        </Stack>
        <Skeleton variant="text" width="80%" height={24} />
        <Skeleton variant="text" width="40%" height={14} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: isSmallMobile ? 1.5 : 2,
        borderRadius: 2,
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        height: isSmallMobile ? 100 : 120, // FIXED HEIGHT untuk konsistensi
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          transform: 'translateY(-2px)'
        }
      }}
    >
      {/* Header dengan icon dan title */}
      <Stack 
        direction="row" 
        alignItems="center" 
        spacing={1} 
        sx={{ mb: isSmallMobile ? 0.5 : 1 }}
      >
        <Box
          sx={{
            color: 'primary.main',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {icon}
        </Box>
        <Typography
          variant={isSmallMobile ? "caption" : "body2"}
          color="text.secondary"
          fontWeight={500}
          sx={{
            fontSize: isSmallMobile ? '0.7rem' : '0.8rem',
            lineHeight: 1.2
          }}
        >
          {title}
        </Typography>
      </Stack>

      {/* Value - dengan text alignment center untuk konsistensi */}
      <Box sx={{ textAlign: 'center', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography
          variant={isSmallMobile ? "h6" : "h5"}
          fontWeight={700}
          sx={{
            fontSize: isSmallMobile ? '1.3rem' : '1.6rem',
            lineHeight: 1.2,
            color: 'text.primary'
          }}
        >
          {value}
        </Typography>
      </Box>

      {/* Footer dengan status dan subtitle */}
      <Stack 
        direction="row" 
        alignItems="center" 
        justifyContent="space-between"
        spacing={0.5}
      >
        {status && <StatusChip status={status} isMobile={isSmallMobile} />}
        
        {subtitle && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              fontSize: isSmallMobile ? '0.6rem' : '0.7rem',
              textAlign: 'right',
              flex: 1
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Stack>
    </Box>
  );
};

// Get tile configuration
const getTileConfig = (type, value, todayMoney = 0, isSmallMobile = false) => {
  const numValue = safeNumber(value);
  
  switch (type) {
    case 'stok-isi':
      let stokIsiStatus = 'normal';
      let stokIsiSubtitle = isSmallMobile ? 'Siap jual' : 'Tabung siap jual';
      
      if (numValue <= CRITICAL_STOCK_THRESHOLD) {
        stokIsiStatus = 'critical';
        stokIsiSubtitle = isSmallMobile ? 'Segera restok' : 'Segera restok';
      } else if (numValue <= LOW_STOCK_THRESHOLD) {
        stokIsiStatus = 'low';
        stokIsiSubtitle = isSmallMobile ? 'Hampir habis' : 'Stok hampir habis';
      }
      
      return {
        status: stokIsiStatus,
        subtitle: stokIsiSubtitle,
        icon: <Inventory2Icon fontSize={isSmallMobile ? "small" : "medium"} />,
        displayValue: isSmallMobile ? formatCompactNumber(numValue) : numValue.toString(),
        title: isSmallMobile ? 'Stok Isi' : 'Stok Isi'
      };

    case 'stok-kosong':
      let stokKosongStatus = 'normal';
      let stokKosongSubtitle = isSmallMobile ? 'Normal' : 'Stok normal';
      
      if (numValue >= 10) {
        stokKosongStatus = 'high';
        stokKosongSubtitle = isSmallMobile ? 'Terlalu banyak' : 'Terlalu banyak';
      } else if (numValue >= 5) {
        stokKosongStatus = 'medium';
        stokKosongSubtitle = isSmallMobile ? 'Perlu ditukar' : 'Perlu ditukar';
      }
      
      return {
        status: stokKosongStatus,
        subtitle: stokKosongSubtitle,
        icon: <Inventory2Icon fontSize={isSmallMobile ? "small" : "medium"} />,
        displayValue: isSmallMobile ? formatCompactNumber(numValue) : numValue.toString(),
        title: isSmallMobile ? 'Stok Kosong' : 'Stok Kosong'
      };

    case 'penjualan':
      return {
        status: null,
        subtitle: isSmallMobile ? formatCompactNumber(safeNumber(todayMoney)) : formatCurrency(safeNumber(todayMoney)),
        icon: <ShoppingCartIcon fontSize={isSmallMobile ? "small" : "medium"} />,
        displayValue: isSmallMobile ? formatCompactNumber(numValue) : numValue.toString(),
        title: isSmallMobile ? 'Penjualan' : 'Penjualan Hari Ini'
      };

    case 'piutang':
      const hasReceivables = numValue > 0;
      return {
        status: hasReceivables ? 'unpaid' : 'paid',
        subtitle: hasReceivables ? (isSmallMobile ? 'Perlu ditagih' : 'Perlu penagihan') : (isSmallMobile ? 'Semua lunas' : 'Semua lunas'),
        icon: <ReceiptLongIcon fontSize={isSmallMobile ? "small" : "medium"} />,
        displayValue: isSmallMobile ? formatCompactNumber(numValue) : formatCurrency(numValue),
        title: isSmallMobile ? 'Piutang' : 'Total Piutang'
      };

    default:
      return {
        status: null,
        subtitle: '',
        icon: <Inventory2Icon fontSize={isSmallMobile ? "small" : "medium"} />,
        displayValue: numValue.toString(),
        title: ''
      };
  }
};

function SummaryTiles({ 
  isi = 0, 
  kosong = 0, 
  todayQty = 0, 
  todayMoney = 0, 
  receivablesTotal = 0, 
  loading = false 
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Get config untuk setiap tile
  const stokIsiConfig = getTileConfig('stok-isi', isi, todayMoney, isSmallMobile);
  const stokKosongConfig = getTileConfig('stok-kosong', kosong, todayMoney, isSmallMobile);
  const penjualanConfig = getTileConfig('penjualan', todayQty, todayMoney, isSmallMobile);
  const piutangConfig = getTileConfig('piutang', receivablesTotal, todayMoney, isSmallMobile);

  return (
    <Box 
      sx={{
        width: '100%',
        maxWidth: '100%',
        backgroundColor: theme.palette.background.default,
        overflow: 'hidden',
        px: { xs: 1, sm: 2 },
        py: { xs: 2, sm: 3 }
      }}
    >
      {/* Header Section */}
      <Stack 
        direction="row" 
        alignItems="center" 
        justifyContent="space-between" 
        sx={{ mb: { xs: 2, sm: 3 }, px: { xs: 1, sm: 0 } }}
      >
        <Typography
          variant={isSmallMobile ? "h6" : "h5"}
          fontWeight={600}
          sx={{
            fontSize: { xs: '1.1rem', sm: '1.4rem', md: '1.6rem' },
            color: 'text.primary'
          }}
        >
          Ringkasan
        </Typography>
        
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            fontSize: { xs: '0.7rem', sm: '0.8rem' },
            display: { xs: 'none', sm: 'block' } // Sembunyikan tanggal di mobile kecil
          }}
        >
          {new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </Typography>
      </Stack>

      {/* PERBAIKAN: True 2x2 Grid dengan ukuran sama */}
      <Grid 
        container 
        spacing={isSmallMobile ? 1.5 : { xs: 2, sm: 2.5 }} 
        alignItems="stretch"
        sx={{
          // Pastikan semua item grid memiliki height yang sama
          '& .MuiGrid-item': {
            display: 'flex'
          }
        }}
      >
        {/* Stok Isi */}
        <Grid item xs={6}>
          <StatTile
            title={stokIsiConfig.title}
            value={stokIsiConfig.displayValue}
            subtitle={stokIsiConfig.subtitle}
            status={stokIsiConfig.status}
            icon={stokIsiConfig.icon}
            loading={loading}
            isMobile={isMobile}
            isSmallMobile={isSmallMobile}
          />
        </Grid>

        {/* Stok Kosong */}
        <Grid item xs={6}>
          <StatTile
            title={stokKosongConfig.title}
            value={stokKosongConfig.displayValue}
            subtitle={stokKosongConfig.subtitle}
            status={stokKosongConfig.status}
            icon={stokKosongConfig.icon}
            loading={loading}
            isMobile={isMobile}
            isSmallMobile={isSmallMobile}
          />
        </Grid>

        {/* Penjualan Hari Ini */}
        <Grid item xs={6}>
          <StatTile
            title={penjualanConfig.title}
            value={penjualanConfig.displayValue}
            subtitle={penjualanConfig.subtitle}
            status={penjualanConfig.status}
            icon={penjualanConfig.icon}
            loading={loading}
            isMobile={isMobile}
            isSmallMobile={isSmallMobile}
          />
        </Grid>

        {/* Piutang */}
        <Grid item xs={6}>
          <StatTile
            title={piutangConfig.title}
            value={piutangConfig.displayValue}
            subtitle={piutangConfig.subtitle}
            status={piutangConfig.status}
            icon={piutangConfig.icon}
            loading={loading}
            isMobile={isMobile}
            isSmallMobile={isSmallMobile}
          />
        </Grid>
      </Grid>

      {/* Quick Status Legend - hanya untuk mobile kecil */}
      {isSmallMobile && (
        <Box sx={{ mt: 2, px: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
            • Kritis: ≤2 tabung • Menipis: ≤5 tabung
          </Typography>
        </Box>
      )}
    </Box>
  );
}

// Default props
SummaryTiles.defaultProps = {
  isi: 0,
  kosong: 0,
  todayQty: 0,
  todayMoney: 0,
  receivablesTotal: 0,
  loading: false
};

export default React.memo(SummaryTiles);