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
      color: "error", // Valid MUI color
      icon: <ErrorOutlineIcon />
    };
  }
  
  if (count <= LOW_STOCK_THRESHOLD) {
    return { 
      message: "Stok menipis", 
      shortMessage: "Menipis",
      color: "warning", // Valid MUI color
      icon: <WarningIcon />
    };
  }
  
  return { 
    message: isFilledStock ? "Siap jual" : "Tabung kembali", 
    shortMessage: isFilledStock ? "Ready" : "Isi",
    color: "success", // Valid MUI color
    icon: null
  };
};

// Safe number converter
const safeNumber = (value) => Math.max(0, Number(value) || 0);

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

  // Validasi input dengan safeNumber
  const safeIsi = safeNumber(isi);
  const safeKosong = safeNumber(kosong);
  const safeTodayQty = safeNumber(todayQty);
  const safeTodayMoney = safeNumber(todayMoney);
  const safeReceivables = safeNumber(receivablesTotal);

  // Get stock status
  const filledStockStatus = getStockStatus(safeIsi, true);
  const emptyStockStatus = getStockStatus(safeKosong, false);

  // Tentukan color untuk Stok Kosong - LOGIC YANG BENAR
  const emptyStockColor = safeKosong >= 10 ? "error" : 
                         safeKosong >= 5 ? "warning" : "success";

  // Mobile-optimized values
  const displayIsi = isMobile ? formatCompactNumber(safeIsi) : safeIsi;
  const displayKosong = isMobile ? formatCompactNumber(safeKosong) : safeKosong;
  const displayTodayQty = isMobile ? formatCompactNumber(safeTodayQty) : safeTodayQty;
  const displayReceivables = isMobile ? formatCompactNumber(safeReceivables) : formatCurrency(safeReceivables);
  
  // Mobile-optimized content
  const stockSubtitle = isMobile ? filledStockStatus.shortMessage : filledStockStatus.message;
  const emptyStockSubtitle = isMobile ? 
    (safeKosong >= 5 ? "Banyak" : "Normal") : 
    (safeKosong >= 5 ? "Perlu diisi" : "Stok normal");
  
  const salesSubtitle = isMobile ? 
    (safeTodayMoney > 0 ? formatCompactNumber(safeTodayMoney) : "Rp 0") : 
    formatCurrency(safeTodayMoney);
  
  const receivablesSubtitle = isMobile ? 
    (safeReceivables > 0 ? "Belum lunas" : "Lunas") : 
    (safeReceivables > 0 ? "Belum lunas" : "Semua lunas");

  return (
    <Box 
      sx={{
        width: '100%',
        borderRadius: { xs: 2, sm: 3 },
        border: `1px solid ${theme.palette.divider}`,
        background: theme.palette.background.paper,
        boxShadow: { xs: '0 1px 3px rgba(0,0,0,0.1)', sm: '0 2px 8px rgba(0,0,0,0.05)' },
        overflow: 'hidden',
        p: { xs: 1.5, sm: 2, md: 3 },
      }}
    >
      <Grid 
        container 
        spacing={{ xs: 1.5, sm: 2 }}
        alignItems="stretch"
      >
        {/* Stok Isi */}
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

        {/* Stok Kosong - FIXED COLOR LOGIC */}
        <Grid item xs={6} md={3}>
          <StatTile
            title="Stok Kosong"
            value={displayKosong}
            subtitle={emptyStockSubtitle}
            color={emptyStockColor} // Gunakan logic yang fixed
            icon={<Inventory2Icon />}
            loading={loading}
          />
        </Grid>

        {/* Penjualan Hari Ini */}
        <Grid item xs={6} md={3}>
          <StatTile
            title={isMobile ? "Hari Ini" : "Penjualan Hari Ini"}
            value={displayTodayQty}
            subtitle={salesSubtitle}
            color="info" // Valid MUI color
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
            color={safeReceivables > 0 ? "warning" : "success"} // Valid MUI colors
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