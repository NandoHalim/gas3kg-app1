import { supabase } from "../lib/supabase";
import { withBusyTimeout } from "../lib/netbusy";

function rowsToStockObject(rows) {
  const obj = { ISI: 0, KOSONG: 0 };
  (rows || []).forEach((r) => {
    const code = String(r.code || "").toUpperCase();
    if (code in obj) obj[code] = Number(r.qty || 0);
  });
  return obj;
}

const errMsg = (error, fallback) => error?.message || fallback;

export const DataService = {
  async loadStocks() {
    const { data, error } = await withBusyTimeout(
      supabase.rpc("get_stock_snapshot"),
      10000,
      "Memuat stok"
    );
    if (error) throw new Error(errMsg(error, "Gagal ambil stok"));
    return rowsToStockObject(data);
  },

  async loadLogs(limit = 500) {
    const { data, error } = await withBusyTimeout(
      supabase
        .from("stock_logs")
        .select("id,code,qty_change,note,created_at")
        .order("created_at", { ascending: false })
        .limit(limit),
      12000,
      "Memuat riwayat stok"
    );
    if (error) throw new Error(errMsg(error, "Gagal ambil log stok"));
    return data || [];
  },

  async loadSales(limit = 500) {
    const { data, error } = await withBusyTimeout(
      supabase
        .from("sales")
        .select("id,customer,qty,price,total,method,note,created_at,hpp,laba")
        .order("created_at", { ascending: false })
        .limit(limit),
      12000,
      "Memuat riwayat penjualan"
    );
    if (error) throw new Error(errMsg(error, "Gagal ambil penjualan"));
    return data || [];
  },

  async addKosong({ qty, note }) {
    if (!(qty > 0)) throw new Error("Jumlah harus > 0");
    const { data, error } = await withBusyTimeout(
      supabase.rpc("stock_add_kosong", { p_qty: qty, p_note: note || "beli tabung kosong" }),
      12000,
      "Tambah stok kosong"
    );
    if (error) throw new Error(errMsg(error, "Gagal tambah stok kosong"));
    return rowsToStockObject(data);
  },

  async addIsi({ qty, note }) {
    if (!(qty > 0)) throw new Error("Jumlah harus > 0");
    const { data, error } = await withBusyTimeout(
      supabase.rpc("stock_add_isi", { p_qty: qty, p_note: note || "isi dari agen" }),
      12000,
      "Tambah stok isi"
    );
    if (error) throw new Error(errMsg(error, "Gagal tambah stok isi"));
    return rowsToStockObject(data);
  },

  async createSale({ customer = "PUBLIC", qty, price, method = "TUNAI", note = "" }) {
    if (!(qty > 0)) throw new Error("Qty harus > 0");
    if (!(price > 0)) throw new Error("Harga tidak valid");

    const { data, error } = await withBusyTimeout(
      supabase.rpc("stock_sell_public_v2", {
        p_qty: qty,
        p_price: price,
        p_method: method,
        p_note: note,
      }),
      12000,
      "Menyimpan penjualan"
    );
    if (error) throw new Error(errMsg(error, "Gagal menyimpan penjualan"));

    // simpan nama pelanggan terakhir pada baris sale terbaru (opsional)
    const { error: err2 } = await withBusyTimeout(
      supabase.rpc("set_latest_sale_customer_by_match", {
        p_customer: customer || "PUBLIC",
        p_qty: qty,
        p_price: price,
        p_method: method,
        p_note: note || "",
      }),
      8000,
      "Menyimpan nama pelanggan"
    );
    if (err2) throw new Error(err2.message || "Gagal menyimpan nama pelanggan");

    return rowsToStockObject(data);
  },

  async resetAllData() {
    const { data: u } = await supabase.auth.getUser();
    if (!u?.user) throw new Error("Unauthorized: silakan login dulu");

    const { error } = await withBusyTimeout(
      supabase.rpc("reset_all_data"),
      12000,
      "Reset data"
    );
    if (error) throw new Error(errMsg(error, "Reset ditolak (khusus admin)"));

    return this.loadStocks();
  },
};
