import { supabase } from "../lib/supabase";

// Helper: ubah rows → object stok
function rowsToStockObject(rows) {
  const obj = { ISI: 0, KOSONG: 0 };
  (rows || []).forEach((r) => {
    const code = String(r.code || "").toUpperCase();
    if (code in obj) obj[code] = Number(r.qty || 0);
  });
  return obj;
}

export const DataService = {
  async loadStocks() {
    const { data, error } = await supabase.rpc("get_stock_snapshot");
    if (error) {
      console.error("❌ loadStocks error:", error);
      throw new Error(error.message || "Gagal ambil stok");
    }
    return rowsToStockObject(data);
  },

  async loadLogs(limit = 500) {
    const { data, error } = await supabase
      .from("stock_logs")
      .select("id,code,qty_change,note,created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) {
      console.error("❌ loadLogs error:", error);
      throw new Error(error.message || "Gagal ambil log stok");
    }
    return data || [];
  },

  async loadSales(limit = 500) {
    const { data, error } = await supabase
      .from("sales")
      .select("id,customer,qty,price,total,method,note,created_at,hpp,laba")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) {
      console.error("❌ loadSales error:", error);
      throw new Error(error.message || "Gagal ambil penjualan");
    }
    return data || [];
  },

  async addKosong({ qty, note }) {
    if (!(qty > 0)) throw new Error("Jumlah harus > 0");
    const { data, error } = await supabase.rpc("stock_add_kosong", {
      p_qty: qty,
      p_note: note || "tambah tabung kosong",
    });
    if (error) {
      console.error("❌ addKosong error:", error);
      throw new Error(error.message || "Gagal tambah stok kosong");
    }
    return rowsToStockObject(data);
  },

  async addIsi({ qty, note }) {
    if (!(qty > 0)) throw new Error("Jumlah harus > 0");
    const { data, error } = await supabase.rpc("stock_add_isi", {
      p_qty: qty,
      p_note: note || "isi dari agen",
    });
    if (error) {
      console.error("❌ addIsi error:", error);
      throw new Error(error.message || "Gagal tambah stok isi");
    }
    return rowsToStockObject(data);
  },

  async createSale({ customer = "PUBLIC", qty, price, method = "TUNAI", note = "" }) {
    if (!(qty > 0)) throw new Error("Qty harus > 0");
    if (!(price > 0)) throw new Error("Harga tidak valid");

    const { data, error } = await supabase.rpc("stock_sell_public_v2", {
      p_qty: qty,
      p_price: price,
      p_method: method,
      p_note: note,
    });
    if (error) {
      console.error("❌ createSale error:", error);
      throw new Error(error.message || "Gagal menyimpan penjualan");
    }
    return rowsToStockObject(data);
  },

  async resetAllData() {
    const { error } = await supabase.rpc("reset_all_data");
    if (error) {
      console.error("❌ resetAllData error:", error);
      throw new Error(error.message || "Reset ditolak (khusus admin)");
    }
    return this.loadStocks();
  },
};
