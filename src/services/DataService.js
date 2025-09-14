// src/services/DataService.js
import { supabase } from "../lib/supabase";
import { MIN_YEAR, MAX_YEAR } from "../utils/constants";
import { todayStr } from "../utils/helpers";

const errMsg = (e, fb) => e?.message || fb;

function rowsToStockObject(rows) {
  const obj = { ISI: 0, KOSONG: 0 };
  (rows || []).forEach((r) => {
    const code = String(r.code || "").toUpperCase();
    if (code in obj) obj[code] = Number(r.qty || 0);
  });
  return obj;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

const dayStart = (d) => `${d}T00:00:00`;
const dayEnd = (d) => `${d}T23:59:59`;
const isMissingRelation = (e) => {
  const m = (e?.message || "").toLowerCase();
  return m.includes("relation") && m.includes("does not exist");
};

export const DataService = {
  // Snapshot stok (ISI & KOSONG) via RPC agar konsisten
  async loadStocks() {
    const { data, error } = await supabase.rpc("get_stock_snapshot");
    if (error) throw new Error(errMsg(error, "Gagal ambil stok"));
    return rowsToStockObject(data);
  },

  // Log stok terbaru
  async loadLogs(limit = 500) {
    const { data, error } = await supabase
      .from("stock_logs")
      .select("id,code,qty_change,note,created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(errMsg(error, "Gagal ambil log stok"));
    return data || [];
  },

  // Riwayat penjualan terbaru
  async loadSales(limit = 500) {
    const { data, error } = await supabase
      .from("sales")
      .select("id,customer,qty,price,total,method,note,created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(errMsg(error, "Gagal ambil penjualan"));
    return data || [];
  },

  // Tambah stok KOSONG (balance log sudah dijaga di fungsi DB)
  async addKosong({ qty, date, note }) {
    if (!(qty > 0)) throw new Error("Jumlah harus > 0");
    const yyyy = Number(String(date).slice(0, 4));
    if (Number.isFinite(yyyy) && (yyyy < MIN_YEAR || yyyy > MAX_YEAR)) {
      throw new Error(`Tanggal harus antara ${MIN_YEAR}-${MAX_YEAR}`);
    }
    const { data, error } = await supabase.rpc("stock_add_kosong", {
      p_qty: qty,
      p_date: date,
      p_note: note || "beli tabung",
    });
    if (error) throw new Error(errMsg(error, "Gagal tambah stok kosong"));
    return rowsToStockObject(data);
  },

  // Tambah stok ISI (butuh KOSONG cukup — dicek di fungsi DB)
  async addIsi({ qty, date, note }) {
    if (!(qty > 0)) throw new Error("Jumlah harus > 0");
    const yyyy = Number(String(date).slice(0, 4));
    if (Number.isFinite(yyyy) && (yyyy < MIN_YEAR || yyyy > MAX_YEAR)) {
      throw new Error(`Tanggal harus antara ${MIN_YEAR}-${MAX_YEAR}`);
    }
    const { data, error } = await supabase.rpc("stock_add_isi", {
      p_qty: qty,
      p_date: date,
      p_note: note || "isi dari agen",
    });
    if (error) throw new Error(errMsg(error, "Gagal tambah stok isi"));
    return rowsToStockObject(data);
  },

  /**
   * Simpan penjualan:
   * - Prefer: stock_sell_with_customer (nama customer realtime)
   * - Fallback: stock_sell_public_v2 (jika ada)
   * - Fallback: stock_sell_public (sisipkan nama customer ke note)
   */
  async createSale({ customer = "PUBLIC", qty, price, method = "TUNAI", date, note = "" }) {
    if (!(qty > 0)) throw new Error("Qty harus > 0");
    if (!(price > 0)) throw new Error("Harga tidak valid");

    const tryWithCustomer = () =>
      supabase.rpc("stock_sell_with_customer", {
        p_customer: customer,
        p_qty: qty,
        p_price: price,
        p_method: method,
        p_note: note,
      });

    const tryV2 = () =>
      supabase.rpc("stock_sell_public_v2", {
        p_customer: customer,
        p_qty: qty,
        p_price: price,
        p_method: method,
        p_note: note,
      });

    const tryV1 = () => {
      const legacyNote = (note ? `${note} | ` : "") + `cust:${customer}`;
      return supabase.rpc("stock_sell_public", {
        p_qty: qty,
        p_price: price,
        p_method: method,
        p_note: legacyNote,
      });
    };

    let resp = await tryWithCustomer();

    // Jika function tidak ditemukan → coba v2
    if (resp.error) {
      const msg = (resp.error.message || "").toLowerCase();
      const fnMissing = msg.includes("could not find function") || msg.includes("does not exist");
      if (fnMissing) resp = await tryV2();
    }

    // Jika v2 juga tidak ada → fallback v1
    if (resp.error) {
      const msg = (resp.error.message || "").toLowerCase();
      const fnMissing = msg.includes("could not find function") || msg.includes("does not exist");
      if (fnMissing) resp = await tryV1();
    }

    if (resp.error) throw new Error(errMsg(resp.error, "Gagal menyimpan penjualan"));
    return rowsToStockObject(resp.data);
  },

  // Reset semua data (khusus admin)
  async resetAllData() {
    const { data: u } = await supabase.auth.getUser();
    if (!u?.user) throw new Error("Unauthorized: silakan login dulu");
    const { error } = await supabase.rpc("reset_all_data");
    if (error) throw new Error(errMsg(error, "Reset ditolak (khusus admin)"));
    return this.loadStocks();
  },

  // ===== Helper untuk Dashboard =====

  // Ringkasan (qty & omzet) dalam rentang tanggal (prefer view, fallback tabel)
  async getSalesSummary({ from, to }) {
    // Coba via view (jika tersedia)
    const viewTry = await supabase
      .from("view_sales_daily")
      .select("tanggal,total_qty,omzet")
      .gte("tanggal", from)
      .lte("tanggal", to)
      .order("tanggal", { ascending: true });

    if (!viewTry.error) {
      const rows = viewTry.data || [];
      const qty = rows.reduce((a, b) => a + (Number(b.total_qty) || 0), 0);
      const money = rows.reduce((a, b) => a + (Number(b.omzet) || 0), 0);
      return { qty, money };
    }

    // Fallback: agregasi di JS dari tabel sales berdasar created_at
    if (!isMissingRelation(viewTry.error)) {
      // error lain (misal permission), lempar saja
      throw viewTry.error;
    }
    const { data, error } = await supabase
      .from("sales")
      .select("qty,price,created_at")
      .gte("created_at", dayStart(from))
      .lte("created_at", dayEnd(to));
    if (error) throw error;
    const qty = (data || []).reduce((a, b) => a + (Number(b.qty) || 0), 0);
    const money = (data || []).reduce(
      (a, b) => a + (Number(b.qty) || 0) * (Number(b.price) || 0),
      0
    );
    return { qty, money };
  },

  // Total piutang (sementara: semua transaksi method=HUTANG)
  async getTotalReceivables() {
    const { data, error } = await supabase
      .from("sales")
      .select("qty,price,method")
      .eq("method", "HUTANG");
    if (error) throw error;
    return (data || []).reduce(
      (a, b) => a + (Number(b.qty) || 0) * (Number(b.price) || 0),
      0
    );
  },

  // 7 hari terakhir (prefer view, fallback tabel)
  async getSevenDaySales() {
    const start = daysAgo(6);

    // Coba view
    const viewTry = await supabase
      .from("view_sales_daily")
      .select("tanggal,total_qty")
      .gte("tanggal", start)
      .order("tanggal", { ascending: true });

    if (!viewTry.error) {
      const data = viewTry.data || [];
      const out = [];
      for (let i = 6; i >= 0; i--) {
        const d = daysAgo(i);
        const row = data.find((r) => r.tanggal === d);
        out.push({ date: d, qty: row ? row.total_qty : 0 });
      }
      return out;
    }
    if (!isMissingRelation(viewTry.error)) throw viewTry.error;

    // Fallback tabel
    const end = todayStr();
    const { data, error } = await supabase
      .from("sales")
      .select("qty,created_at")
      .gte("created_at", dayStart(start))
      .lte("created_at", dayEnd(end));
    if (error) throw error;
    const map = {};
    (data || []).forEach((r) => {
      const d = (r.created_at || "").slice(0, 10);
      map[d] = (map[d] || 0) + (Number(r.qty) || 0);
    });
    const out = [];
    for (let i = 6; i >= 0; i--) {
      const d = daysAgo(i);
      out.push({ date: d, qty: map[d] || 0 });
    }
    return out;
  },

  // Transaksi terbaru
  async getRecentSales(limit = 10) {
    const { data, error } = await supabase
      .from("sales")
      .select("id,customer,qty,price,method,created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },
};
