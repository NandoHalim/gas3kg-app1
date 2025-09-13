import { supabase } from "../lib/supabase";

function rowsToStockObject(rows) {
  const obj = { ISI: 0, KOSONG: 0 };
  (rows || []).forEach((r) => {
    const code = String(r.code || "").toUpperCase();
    if (code in obj) obj[code] = Number(r.qty || 0);
  });
  return obj;
}
const errMsg = (e, fb) => e?.message || fb;

export const DataService = {
  async loadStocks() {
    const { data, error } = await supabase.rpc("get_stock_snapshot");
    if (error) {
      console.error('[loadStocks]', error);
      throw new Error(errMsg(error, "Gagal ambil stok"));
    }
    return rowsToStockObject(data);
  },

  async loadLogs(limit = 500) {
    const { data, error } = await supabase
      .from("stock_logs")
      .select("id,code,qty_change,note,created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(errMsg(error, "Gagal ambil log stok"));
    return data || [];
  },

  async loadSales(limit = 500) {
    const { data, error } = await supabase
      .from("sales")
      .select("id,customer,qty,price,total,method,note,created_at,hpp,laba")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(errMsg(error, "Gagal ambil penjualan"));
    return data || [];
  },

  async addKosong({ qty, note }) {
    if (!(qty > 0)) throw new Error("Jumlah harus > 0");
    const { data, error } = await supabase.rpc("stock_add_kosong", {
      p_qty: qty,
      p_note: note || "beli tabung kosong",
    });
    if (error) throw new Error(errMsg(error, "Gagal tambah stok kosong"));
    return rowsToStockObject(data);
  },

  async addIsi({ qty, note }) {
    if (!(qty > 0)) throw new Error("Jumlah harus > 0");
    const { data, error } = await supabase.rpc("stock_add_isi", {
      p_qty: qty,
      p_note: note || "isi dari agen",
    });
    if (error) throw new Error(errMsg(error, "Gagal tambah stok isi"));
    return rowsToStockObject(data);
  },

  async createSale({ customer = "PUBLIC", qty, price, method = "TUNAI", note = "" }) {
    if (!(qty > 0)) throw new Error("Qty harus > 0");
    if (!(price > 0)) throw new Error("Harga tidak valid");

    // Jual
    const { data, error } = await supabase.rpc("stock_sell_public_v2", {
      p_qty: qty,
      p_price: price,
      p_method: method,
      p_note: note,
    });
    if (error) throw new Error(errMsg(error, "Gagal menyimpan penjualan"));

    // Set nama pelanggan terakhir di baris sale terbaru
    const { error: err2 } = await supabase.rpc("set_latest_sale_customer_by_match", {
      p_customer: customer || "PUBLIC",
      p_qty: qty,
      p_price: price,
      p_method: method,
      p_note: note || "",
    });
    if (err2) throw new Error(err2.message || "Gagal menyimpan nama pelanggan");

    return rowsToStockObject(data);
  },

  async resetAllData() {
    const { data: u } = await supabase.auth.getUser();
    if (!u?.user) throw new Error("Unauthorized: silakan login dulu");

    const { error } = await supabase.rpc("reset_all_data");
    if (error) throw new Error(errMsg(error, "Reset ditolak (khusus admin)"));
    return this.loadStocks();
  },
};
