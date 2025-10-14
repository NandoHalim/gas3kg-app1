import React from "react";
import { Grid, useTheme, useMediaQuery, Box } from "@mui/material";
import StatTile from "../ui/StatTile";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

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
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'Jt';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'Rb';
  }
  return num.toString();
};

const getStockStatus = (stockCount, isFilledStock = true) => {
  if (stockCount <= CRITICAL_STOCK_THRESHOLD) {
    return { 
      message: "Kritis", 
      shortMessage: "Kritis",
      color: "error",
      icon: <ErrorOutlineIcon />
    };
  }
  if (stockCount <= LOW_STOCK_THRESHOLD) {
    return { 
      message: "Stok menipis", 
      shortMessage: "Menipis",
      color: "warning",
      icon: <WarningIcon />
    };
  }
  return { 
    message: isFilledStock ? "Siap jual" : "Tabung kembali", 
    shortMessage: isFilledStock ? "Ready" : "Isi",
    color: "success",
    icon: null
  };
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
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Validasi input
  const safeIsi = Math.max(0, Number(isi) || 0);
  const safeKosong = Math.max(0, Number(kosong) || 0);
  const safeTodayQty = Math.max(0, Number(todayQty) || 0);
  const safeTodayMoney = Math.max(0, Number(todayMoney) || 0);
  const safeReceivables = Math.max(0, Number(receivablesTotal) || 0);

  // Get stock status
  const filledStockStatus = getStockStatus(safeIsi, true);
  const emptyStockStatus = getStockStatus(safeKosong, false);

  // Mobile-optimized values
  const displayIsi = isMobile ? formatCompactNumber(safeIsi) : safeIsi;
  const displayKosong = isMobile ? formatCompactNumber(safeKosong) : safeKosong;
  const displayTodayQty = isMobile ? formatCompactNumber(safeTodayQty) : safeTodayQty;
  
  // Mobile-optimized titles and subtitles
  const stockTitle = isMobile ? "Stok" : "Stok Isi";
  const emptyStockTitle = isMobile ? "Kosong" : "Stok Kosong";
  const salesTitle = isMobile ? "Hari Ini" : "Penjualan Hari Ini";
  const receivablesTitle = isMobile ? "Piutang" : "Piutang";

  const stockSubtitle = isMobile ? filledStockStatus.shortMessage : filledStockStatus.message;
  const emptyStockSubtitle = isMobile ? emptyStockStatus.shortMessage : emptyStockStatus.message;
  const salesSubtitle = isMobile ? 
    (safeTodayMoney > 0 ? formatCompactNumber(safeTodayMoney) : "Rp 0") : 
    formatCurrency(safeTodayMoney);
  const receivablesSubtitle = isMobile ? 
    (safeReceivables > 0 ? "Belum lunas" : "Lunas") : 
    (safeReceivables > 0 ? "Belum lunas" : "Semua lunas");

  return (
    <Grid 
      container 
      spacing={isMobile ? 1.5 : 2} 
      alignItems="stretch"
      sx={{
        // Optimized padding for mobile
        px: isMobile ? 0.5 : 0,
        '& .MuiGrid-item': {
          display: 'flex'
        }
      }}
    >
      {/* Stok Isi - Mobile: 2x2 grid, Tablet: 2x2, Desktop: 4x1 */}
      <Grid item xs={6} md={3} sx={{ display: "flex" }}>
        <StatTile
          title={stockTitle}
          value={displayIsi}
          subtitle={stockSubtitle}
          color={filledStockStatus.color}
          icon={isMobile ? null : (filledStockStatus.icon || <Inventory2Icon />)}
          loading={loading}
          warning={safeIsi <= LOW_STOCK_THRESHOLD}
          compact={isMobile}
          size={isMobile ? "small" : "medium"}
        />
      </Grid>

      {/* Stok Kosong */}
      <Grid item xs={6} md={3} sx={{ display: "flex" }}>
        <StatTile
          title={emptyStockTitle}
          value={displayKosong}
          subtitle={emptyStockSubtitle}
          color={emptyStockStatus.color}
          icon={isMobile ? null : (emptyStockStatus.icon || <Inventory2Icon />)}
          loading={loading}
          warning={safeKosong >= LOW_STOCK_THRESHOLD}
          compact={isMobile}
          size={isMobile ? "small" : "medium"}
        />
      </Grid>

      {/* Penjualan Hari Ini */}
      <Grid item xs={6} md={3} sx={{ display: "flex" }}>
        <StatTile
          title={salesTitle}
          value={displayTodayQty}
          subtitle={salesSubtitle}
          color="info"
          icon={isMobile ? null : <ShoppingCartIcon />}
          loading={loading}
          trend={safeTodayQty > 0 ? "up" : "neutral"}
          compact={isMobile}
          size={isMobile ? "small" : "medium"}
          tooltip={isMobile ? `Penjualan: ${safeTodayQty} item • ${formatCurrency(safeTodayMoney)}` : null}
        />
      </Grid>

      {/* Piutang */}
      <Grid item xs={6} md={3} sx={{ display: "flex" }}>
        <StatTile
          title={receivablesTitle}
          value={isMobile ? formatCompactNumber(safeReceivables) : formatCurrency(safeReceivables)}
          subtitle={receivablesSubtitle}
          color={safeReceivables > 0 ? "warning" : "success"}
          icon={isMobile ? null : <ReceiptLongIcon />}
          loading={loading}
          alert={safeReceivables > 0}
          compact={isMobile}
          size={isMobile ? "small" : "medium"}
          tooltip={isMobile ? `Total piutang: ${formatCurrency(safeReceivables)}` : null}
        />
      </Grid>
    </Grid>
  );
}

// Mobile-optimized wrapper component
export function SummaryTilesWithContainer(props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box 
      sx={{ 
        width: '100%',
        // Better scrolling on mobile if needed
        overflowX: isMobile ? 'hidden' : 'visible',
        // Optimized spacing
        mb: isMobile ? 2 : 3
      }}
    >
      <SummaryTiles {...props} />
    </Box>
  );
}

// Default props untuk safety
SummaryTiles.defaultProps = {
  isi: 0,
  kosong: 0,
  todayQty: 0,
  todayMoney: 0,
  receivablesTotal: 0,
  loading: false
};

export default React.memo(SummaryTiles);