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
  const number = Number(num) || 0;
  if (number >= 1000000) return (number / 1000000).toFixed(1) + 'Jt';
  if (number >= 1000) return (number / 1000).toFixed(1) + 'Rb';
  return number.toString();
};

const getStockStatus = (stockCount, isFilledStock = true) => {
  const count = Number(stockCount) || 0;
  if (count <= CRITICAL_STOCK_THRESHOLD) {
    return { 
      message: "Kritis", 
      shortMessage: "Kritis",
      color: "error",
      icon: <ErrorOutlineIcon />
    };
  }
  if (count <= LOW_STOCK_THRESHOLD) {
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

  // Validasi dan safe values
  const safeIsi = Math.max(0, Number(isi) || 0);
  const safeKosong = Math.max(0, Number(kosong) || 0);
  const safeTodayQty = Math.max(0, Number(todayQty) || 0);
  const safeTodayMoney = Math.max(0, Number(todayMoney) || 0);
  const safeReceivables = Math.max(0, Number(receivablesTotal) || 0);

  // Get stock status
  const filledStockStatus = getStockStatus(safeIsi, true);
  const emptyStockStatus = getStockStatus(safeKosong, false);

  // MOBILE-FIRST: Nilai untuk mobile dulu, desktop kemudian
  const displayIsi = isMobile ? formatCompactNumber(safeIsi) : safeIsi;
  const displayKosong = isMobile ? formatCompactNumber(safeKosong) : safeKosong;
  const displayTodayQty = isMobile ? formatCompactNumber(safeTodayQty) : safeTodayQty;
  const displayReceivables = isMobile ? formatCompactNumber(safeReceivables) : formatCurrency(safeReceivables);
  
  // MOBILE-FIRST: Konten yang dioptimalkan untuk mobile
  const stockSubtitle = isMobile ? filledStockStatus.shortMessage : filledStockStatus.message;
  const emptyStockSubtitle = isMobile ? emptyStockStatus.shortMessage : emptyStockStatus.message;
  const salesSubtitle = isMobile ? 
    (safeTodayMoney > 0 ? formatCompactNumber(safeTodayMoney) : "Rp 0") : 
    formatCurrency(safeTodayMoney);
  const receivablesSubtitle = isMobile ? 
    (safeReceivables > 0 ? "Belum lunas" : "Lunas") : 
    (safeReceivables > 0 ? "Belum lunas" : "Semua lunas");

  // MOBILE-FIRST: Grid spacing
  const gridSpacing = { xs: 1.5, sm: 2, md: 3 };

  return (
    <Box 
      sx={{
        width: '100%',
        borderRadius: { xs: 2, sm: 3 },
        border: `1px solid ${theme.palette.divider}`,
        background: theme.palette.background.paper,
        boxShadow: { xs: '0 1px 3px rgba(0,0,0,0.1)', sm: '0 2px 8px rgba(0,0,0,0.05)' },
        overflow: 'hidden',
        // MOBILE-FIRST: Padding scaling
        p: { xs: 1.5, sm: 2, md: 3 },
      }}
    >
      <Grid 
        container 
        spacing={gridSpacing}
        alignItems="stretch"
        sx={{
          width: '100%',
          margin: 0,
          '& .MuiGrid-item': {
            display: 'flex',
          }
        }}
      >
        {/* Stok Isi - MOBILE-FIRST: xs=6 untuk 2x2 grid di mobile */}
        <Grid item xs={6} md={3}>
          <StatTile
            title="Stok Isi"
            value={displayIsi}
            subtitle={stockSubtitle}
            color={filledStockStatus.color}
            icon={filledStockStatus.icon || <Inventory2Icon />}
            loading={loading}
          />
        </Grid>

        {/* Stok Kosong */}
        <Grid item xs={6} md={3}>
          <StatTile
            title="Stok Kosong"
            value={displayKosong}
            subtitle={emptyStockSubtitle}
            color={emptyStockStatus.color}
            icon={emptyStockStatus.icon || <Inventory2Icon />}
            loading={loading}
          />
        </Grid>

        {/* Penjualan Hari Ini */}
        <Grid item xs={6} md={3}>
          <StatTile
            title={isMobile ? "Hari Ini" : "Penjualan Hari Ini"}
            value={displayTodayQty}
            subtitle={salesSubtitle}
            color="info"
            icon={<ShoppingCartIcon />}
            loading={loading}
          />
        </Grid>

        {/* Piutang */}
        <Grid item xs={6} md={3}>
          <StatTile
            title="Piutang"
            value={displayReceivables}
            subtitle={receivablesSubtitle}
            color={safeReceivables > 0 ? "warning" : "success"}
            icon={<ReceiptLongIcon />}
            loading={loading}
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