import React from "react";
import { Grid, useTheme, useMediaQuery, Box } from "@mui/material";
import StatTile from "../ui/StatTile";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";

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

// Simple color logic - hanya gunakan valid MUI colors
const getTileConfig = (type, value, isMobile = false, isSmallMobile = false) => {
  const numValue = safeNumber(value);
  
  switch (type) {
    case 'stok-isi':
      let stokIsiColor = 'success';
      let stokIsiSubtitle = 'Siap jual';
      
      if (numValue <= CRITICAL_STOCK_THRESHOLD) {
        stokIsiColor = 'error';
        stokIsiSubtitle = isSmallMobile ? 'Kritis' : 'Stok kritis';
      } else if (numValue <= LOW_STOCK_THRESHOLD) {
        stokIsiColor = 'warning';
        stokIsiSubtitle = isSmallMobile ? 'Menipis' : 'Stok menipis';
      }
      
      return {
        color: stokIsiColor,
        subtitle: stokIsiSubtitle,
        icon: <Inventory2Icon />,
        displayValue: isSmallMobile ? formatCompactNumber(numValue) : numValue,
        title: isSmallMobile ? 'Stok Isi' : 'Stok Isi'
      };

    case 'stok-kosong':
      let stokKosongColor = 'success';
      let stokKosongSubtitle = 'Normal';
      
      if (numValue >= 10) {
        stokKosongColor = 'error';
        stokKosongSubtitle = isSmallMobile ? 'Banyak' : 'Banyak kosong';
      } else if (numValue >= 5) {
        stokKosongColor = 'warning';
        stokKosongSubtitle = isSmallMobile ? 'Perlu isi' : 'Perlu diisi';
      }
      
      return {
        color: stokKosongColor,
        subtitle: stokKosongSubtitle,
        icon: <Inventory2Icon />,
        displayValue: isSmallMobile ? formatCompactNumber(numValue) : numValue,
        title: isSmallMobile ? 'Stok Kosong' : 'Stok Kosong'
      };

    case 'penjualan':
      return {
        color: 'info',
        subtitle: isSmallMobile ? formatCompactNumber(safeNumber(value)) : formatCurrency(safeNumber(value)),
        icon: <ShoppingCartIcon />,
        displayValue: isSmallMobile ? formatCompactNumber(numValue) : numValue,
        title: isSmallMobile ? 'Hari Ini' : 'Penjualan Hari Ini'
      };

    case 'piutang':
      const hasReceivables = numValue > 0;
      return {
        color: hasReceivables ? 'warning' : 'success',
        subtitle: hasReceivables ? 'Belum lunas' : 'Lunas',
        icon: <ReceiptLongIcon />,
        displayValue: isSmallMobile ? formatCompactNumber(numValue) : formatCurrency(numValue),
        title: 'Piutang'
      };

    default:
      return {
        color: 'primary',
        subtitle: '',
        icon: <Inventory2Icon />,
        displayValue: numValue,
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
  const stokIsiConfig = getTileConfig('stok-isi', isi, isMobile, isSmallMobile);
  const stokKosongConfig = getTileConfig('stok-kosong', kosong, isMobile, isSmallMobile);
  const penjualanConfig = getTileConfig('penjualan', todayMoney, isMobile, isSmallMobile);
  const piutangConfig = getTileConfig('piutang', receivablesTotal, isMobile, isSmallMobile);

  return (
    <Box 
      sx={{
        width: '100%',
        maxWidth: '100%',
        borderRadius: isSmallMobile ? 1 : { xs: 2, sm: 3 },
        border: `1px solid ${theme.palette.divider}`,
        background: theme.palette.background.paper,
        boxShadow: isSmallMobile ? 'none' : { xs: '0 1px 3px rgba(0,0,0,0.1)', sm: '0 2px 8px rgba(0,0,0,0.05)' },
        overflow: 'hidden',
        p: isSmallMobile ? 1 : { xs: 1.5, sm: 2, md: 3 },
        mx: isSmallMobile ? 0.5 : 0,
      }}
    >
      <Grid container spacing={isSmallMobile ? 1 : { xs: 1.5, sm: 2 }} alignItems="stretch">
        {/* Stok Isi */}
        <Grid item xs={6} md={3}>
          <StatTile
            title={stokIsiConfig.title}
            value={stokIsiConfig.displayValue}
            subtitle={stokIsiConfig.subtitle}
            color={stokIsiConfig.color}
            icon={stokIsiConfig.icon}
            loading={loading}
            compact={isSmallMobile}
          />
        </Grid>

        {/* Stok Kosong */}
        <Grid item xs={6} md={3}>
          <StatTile
            title={stokKosongConfig.title}
            value={stokKosongConfig.displayValue}
            subtitle={stokKosongConfig.subtitle}
            color={stokKosongConfig.color}
            icon={stokKosongConfig.icon}
            loading={loading}
            compact={isSmallMobile}
          />
        </Grid>

        {/* Penjualan Hari Ini */}
        <Grid item xs={6} md={3}>
          <StatTile
            title={penjualanConfig.title}
            value={todayQty}
            subtitle={penjualanConfig.subtitle}
            color={penjualanConfig.color}
            icon={penjualanConfig.icon}
            loading={loading}
            compact={isSmallMobile}
          />
        </Grid>

        {/* Piutang */}
        <Grid item xs={6} md={3}>
          <StatTile
            title={piutangConfig.title}
            value={piutangConfig.displayValue}
            subtitle={piutangConfig.subtitle}
            color={piutangConfig.color}
            icon={piutangConfig.icon}
            loading={loading}
            compact={isSmallMobile}
          />
        </Grid>
      </Grid>
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