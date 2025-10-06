import React from "react";
import { Grid } from "@mui/material";
import StatTile from "../ui/StatTile";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";

const LOW_STOCK_THRESHOLD = 5;

function SummaryTiles({ isi, kosong, todayQty, todayMoney, receivablesTotal, loading }) {
  return (
    <Grid container spacing={3} alignItems="stretch">
      <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
        <StatTile
          title="Stok Isi"
          value={isi}
          subtitle={isi <= LOW_STOCK_THRESHOLD ? "⚠️ Stok menipis" : "Siap jual"}
          color="success"
          icon={<Inventory2Icon />}
          loading={loading}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
        <StatTile
          title="Stok Kosong"
          value={kosong}
          subtitle={kosong <= LOW_STOCK_THRESHOLD ? "⚠️ Stok menipis" : "Tabung kembali"}
          color="error"
          icon={<Inventory2Icon />}
          loading={loading}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
        <StatTile
          title="Penjualan Hari Ini"
          value={todayQty}
          subtitle={todayMoney}
          color="info"
          icon={<ShoppingCartIcon />}
          loading={loading}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
        <StatTile
          title="Piutang"
          value={receivablesTotal}
          subtitle="Belum lunas"
          color="warning"
          icon={<ReceiptLongIcon />}
          loading={loading}
        />
      </Grid>
    </Grid>
  );
}

export default SummaryTiles;
