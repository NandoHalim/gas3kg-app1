// src/services/DataService.js
import { supabase } from "../lib/supabase";
import { MIN_YEAR, MAX_YEAR } from "../utils/constants";

const errMsg = (e, fb) => e?.message || fb;

function rowsToStockObject(rows) {
  const obj = { ISI: 0, KOSONG: 0 };
  (rows || []).forEach((r) => {
    const code = String(r.code || "").toUpperCase();
    if (code in obj) obj[code] = Number(r.qty || 0);
  });
  return obj;
}

export const DataService = {
  // ====== STOK (tetap) ======
  async loadStocks() {
    const { data, error } = await supabase.rpc("get_stock_snapshot");
    if (error) throw new Error(errMsg(error, "Gagal ambil stok"));
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

  async addIsi({ qty, date, note }) {
    if (!(qty > 0)) throw new Error("Jumlah harus > 0");
    const yyyy = Number(String(date).slice(0, 4));
    if (Number.isFinite(yyyy) && (yyyy < MIN_YEAR || yyyy > MAX_YEAR)) {
      throw new Error(`Tanggal harus antara ${MIN_YEAR}-${MAX_YEAR}`);
    }
    try {
      const snap = await this.loadStocks();
      if (Number(qty) > Number(snap.KOSONG || 0)) {
        throw new Error("Stok KOSONG tidak cukup untuk ditukar menjadi ISI");
      }
    } catch {}
    const { data, error } = await supabase.rpc("stock_add_isi", {
      p_qty: qty,
      p_date: date,
      p_note: note || "isi dari agen (tukar kosong)",
    });
    if (error) throw new Error(errMsg(error, "Gagal tambah stok isi"));
    return rowsToStockObject(data);
  },

  // ====== PENJUALAN (tetap) ======
  async loadSales(limit = 500) {
    const { data, error } = await supabase
      .from("sales")
      .select("id,invoice_no,customer,qty,price,total,method,note,created_at,status,hpp,laba,cashier,created_by")
      .eq("status", "LUNAS")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(errMsg(error, "Gagal ambil penjualan"));
    return data || [];
  },

  async getRecentSales(limit = 10) {
    const { data, error } = await supabase
      .from("sales")
      .select("id,invoice_no,customer,qty,price,method,created_at,status,cashier,created_by")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(errMsg(error, "Gagal ambil transaksi terbaru"));
    return data || [];
  },

  async createSale({ customer = "PUBLIC", qty, price, method = "TUNAI", date, note = "" }) {
    if (!(qty > 0)) throw new Error("Qty harus > 0");
    if (!(price > 0)) throw new Error("Harga tidak valid");

    const isoDate =
      date && String(date).length >= 10
        ? new Date(date).toISOString()
        : new Date().toISOString();

    const tryWithCustomer6 = () =>
      supabase.rpc("stock_sell_with_customer", {
        p_customer: customer,
        p_qty: qty,
        p_price: price,
        p_method: method,
        p_date: isoDate,
        p_note: note,
      });

    const tryV2_6 = () =>
      supabase.rpc("stock_sell_public_v2", {
        p_customer: customer,
        p_qty: qty,
        p_price: price,
        p_method: method,
        p_date: isoDate,
        p_note: note,
      });

    const tryV2_5 = () =>
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

    let resp = await tryWithCustomer6();
    if (resp.error) {
      const m = (resp.error.message || "").toLowerCase();
      const fnMissing = m.includes("could not find function") || m.includes("does not exist");
      if (fnMissing) resp = await tryV2_6();
    }
    if (resp.error) {
      const m = (resp.error.message || "").toLowerCase();
      const fnMissing = m.includes("could not find function") || m.includes("does not exist");
      if (fnMissing) resp = await tryV2_5();
    }
    if (resp.error) {
      const m = (resp.error.message || "").toLowerCase();
      const fnMissing = m.includes("could not find function") || m.includes("does not exist");
      if (fnMissing) resp = await tryV1();
    }
    if (resp.error) throw new Error(errMsg(resp.error, "Gagal menyimpan penjualan"));
    return rowsToStockObject(resp.data);
  },

  // ====== RINGKASAN (tetap) ======
  async getSalesSummary({ from, to }) {
    const { data, error } = await supabase
      .from("sales")
      .select("qty,price,method,created_at,status")
      .gte("created_at", from)
      .lte("created_at", to)
      .eq("status", "LUNAS");
    if (error) throw new Error(errMsg(error, "Gagal ambil ringkasan penjualan"));
    const qty = (data || []).reduce((a, b) => a + Number(b.qty || 0), 0);
    const money = (data || []).reduce((a, b) => a + (Number(b.qty) || 0) * (Number(b.price) || 0), 0);
    return { qty, money };
  },

  async getSevenDaySales() {
    const { data, error } = await supabase
      .from("view_sales_daily")
      .select("tanggal,total_qty")
      .order("tanggal", { ascending: true })
      .limit(7);
    if (error) throw new Error(errMsg(error, "Gagal ambil grafik 7 hari"));
    return (data || []).map((r) => ({ date: r.tanggal, qty: r.total_qty }));
  },

  async getTotalReceivables() {
    const { data, error } = await supabase
      .from("sales")
      .select("qty,price,method,status")
      .eq("method", "HUTANG")
      .neq("status", "LUNAS");
    if (error) throw new Error(errMsg(error, "Gagal ambil piutang"));
    return (data || []).reduce((a, b) => a + (Number(b.qty) || 0) * (Number(b.price) || 0), 0);
  },

  // ====== HUTANG (tetap) ======
  async getDebts({ query = "", limit = 200 } = {}) {
    let q = supabase
      .from("sales")
      .select("id, invoice_no, customer, qty, price, method, status, note, created_at, cashier, created_by, phone")
      .eq("method", "HUTANG")
      .neq("status", "LUNAS")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (query && query.trim().length > 0) {
      // cari di invoice_no, customer, note
      q = q.or(`invoice_no.ilike.%${query}%,customer.ilike.%${query}%,note.ilike.%${query}%`);
    }

    const { data, error } = await q;
    if (error) throw new Error(errMsg(error, "Gagal ambil daftar hutang"));
    return (data || []).map((r) => ({
      ...r,
      total: (Number(r.qty) || 0) * (Number(r.price) || 0),
    }));
  },

  async payDebt({ sale_id, amount, note = "" }) {
    if (!sale_id) throw new Error("sale_id wajib");
    if (!(amount > 0)) throw new Error("Nominal pembayaran harus > 0");
    const { data, error } = await supabase.rpc("sales_pay_debt", {
      p_sale_id: sale_id,
      p_amount: amount,
      p_note: note,
    });
    if (error) throw new Error(errMsg(error, "Gagal mencatat pembayaran hutang"));
    return data;
  },

  // ====== RESET (tetap) ======
  async resetAllData() {
    const { data: u } = await supabase.auth.getUser();
    if (!u?.user) throw new Error("Unauthorized: silakan login dulu");
    const { error } = await supabase.rpc("reset_all_data");
    if (error) throw new Error(errMsg(error, "Reset ditolak (khusus admin)"));
    return this.loadStocks();
  },

  // ====== RIWAYAT BARU (filter lanjutan & note) ======
  async getAllSales({ from, to, method, status, cashier, q, limit = 500 } = {}) {
    let query = supabase
      .from("sales")
      .select("id,invoice_no,customer,qty,price,total,method,note,created_at,status,cashier,created_by")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (from) query = query.gte("created_at", from);
    if (to) query = query.lte("created_at", to);
    if (method) query = query.eq("method", method);
    if (status) query = query.eq("status", status);
    if (cashier) query = query.ilike("cashier", `%${cashier}%`);
    if (q && q.trim().length > 0) {
      query = query.or(`invoice_no.ilike.%${q}%,customer.ilike.%${q}%`);
    }

    const { data, error } = await query;
    if (error) throw new Error(errMsg(error, "Gagal ambil riwayat transaksi"));
    return data || [];
  },

  async getStockHistory(limit = 500) {
    const { data, error } = await supabase
      .from("stock_logs")
      .select("id,code,qty_change,note,created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(errMsg(error, "Gagal ambil riwayat stok"));
    return data || [];
  },

  async getDebtHistory({ q, limit = 500 } = {}) {
    let query = supabase
      .from("sales")
      .select("id,invoice_no,customer,qty,price,total,method,note,created_at,status,phone")
      .eq("method", "HUTANG")
      .neq("status", "LUNAS")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (q && q.trim().length > 0) {
      query = query.or(`invoice_no.ilike.%${q}%,customer.ilike.%${q}%`);
    }

    const { data, error } = await query;
    if (error) throw new Error(errMsg(error, "Gagal ambil riwayat hutang"));
    return (data || []).map((r) => ({
      ...r,
      total: (Number(r.qty) || 0) * (Number(r.price) || 0),
    }));
  },

  async appendSaleNote({ sale_id, extra_note }) {
    if (!sale_id) throw new Error("sale_id wajib");
    const { data, error } = await supabase
      .from("sales")
      .update({ note: extra_note })
      .eq("id", sale_id)
      .select("id,note")
      .single();
    if (error) throw new Error(errMsg(error, "Gagal menyimpan catatan"));
    return data;
  },
};
