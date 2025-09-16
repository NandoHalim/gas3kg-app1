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
  // ====== STOK ======
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

  // Tambah stok ISI (HARUS menukar dari KOSONG yang cukup)
  async addIsi({ qty, date, note }) {
    if (!(qty > 0)) throw new Error("Jumlah harus > 0");
    const yyyy = Number(String(date).slice(0, 4));
    if (Number.isFinite(yyyy) && (yyyy < MIN_YEAR || yyyy > MAX_YEAR)) {
      throw new Error(`Tanggal harus antara ${MIN_YEAR}-${MAX_YEAR}`);
    }

    // pagar tambahan (DB tetap validasi)
    try {
      const snap = await this.loadStocks();
      if (Number(qty) > Number(snap.KOSONG || 0)) {
        throw new Error("Stok KOSONG tidak cukup untuk ditukar menjadi ISI");
      }
    } catch {
      /* lanjut; DB akan validasi */
    }

    const { data, error } = await supabase.rpc("stock_add_isi", {
      p_qty: qty,
      p_date: date,
      p_note: note || "isi dari agen (tukar kosong)",
    });
    if (error) throw new Error(errMsg(error, "Gagal tambah stok isi"));
    return rowsToStockObject(data);
  },

  // ====== PENJUALAN ======
  async loadSales(limit = 500) {
    const { data, error } = await supabase
      .from("sales")
      .select(
        "id,customer,qty,price,total,method,note,created_at,status,hpp,laba"
      )
      .order("id", { ascending: false }) // urut invoice terbaru
      .limit(limit);
    if (error) throw new Error(errMsg(error, "Gagal ambil penjualan"));
    return data || [];
  },

  async getRecentSales(limit = 10) {
    const { data, error } = await supabase
      .from("sales")
      .select("id,customer,qty,price,method,created_at,status")
      .order("id", { ascending: false }) // urut invoice terbaru
      .limit(limit);
    if (error) throw new Error(errMsg(error, "Gagal ambil transaksi terbaru"));
    return data || [];
  },

  /**
   * Simpan penjualan (6 arg utama).
   * Catatan: tidak merusak logika yang sudah baik.
   */
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
      const msg = (resp.error.message || "").toLowerCase();
      const fnMissing =
        msg.includes("could not find function") || msg.includes("does not exist");
      if (fnMissing) resp = await tryV2_6();
    }
    if (resp.error) {
      const msg = (resp.error.message || "").toLowerCase();
      const fnMissing =
        msg.includes("could not find function") || msg.includes("does not exist");
      if (fnMissing) resp = await tryV2_5();
    }
    if (resp.error) {
      const msg = (resp.error.message || "").toLowerCase();
      const fnMissing =
        msg.includes("could not find function") || msg.includes("does not exist");
      if (fnMissing) resp = await tryV1();
    }
    if (resp.error)
      throw new Error(errMsg(resp.error, "Gagal menyimpan penjualan"));

    return rowsToStockObject(resp.data);
  },

  // ====== RINGKASAN ======
  async getSalesSummary({ from, to }) {
    const { data, error } = await supabase
      .from("sales")
      .select("qty,price,method,created_at,status")
      .gte("created_at", from)
      .lte("created_at", to)
      .eq("status", "LUNAS");
    if (error) throw new Error(errMsg(error, "Gagal ambil ringkasan penjualan"));
    const qty = (data || []).reduce((a, b) => a + Number(b.qty || 0), 0);
    const money = (data || []).reduce(
      (a, b) => a + (Number(b.qty) || 0) * (Number(b.price) || 0),
      0
    );
    return { qty, money };
  },

  // Grafik 7 hari: pakai view harian (sudah ada)
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
    return (data || []).reduce(
      (a, b) => a + (Number(b.qty) || 0) * (Number(b.price) || 0),
      0
    );
  },

  // ====== RIWAYAT TRANSAKSI (dengan filter)
  /**
   * @param {Object} p
   * @param {string} [p.from] 'YYYY-MM-DD'
   * @param {string} [p.to]   'YYYY-MM-DD'
   * @param {'ALL'|'TUNAI'|'HUTANG'} [p.method]
   * @param {'ALL'|'LUNAS'|'BELUM'}  [p.status]
   * @param {string} [p.cashier]   - fallback cari di note apabila kolom kasir tidak ada
   * @param {string} [p.q]         - cari invoice/id atau nama customer (ilike)
   * @param {number} [p.limit]
   */
  async getSalesHistory({
    from,
    to,
    method = "ALL",
    status = "ALL",
    cashier,
    q,
    limit = 800,
  } = {}) {
    let s = supabase
      .from("sales")
      .select(
        "id,invoice,customer,qty,price,total,method,status,created_at,kasir,cashier,note"
      )
      .order("id", { ascending: false })
      .limit(limit);

    if (from) s = s.gte("created_at", from);
    if (to) s = s.lte("created_at", to);
    if (method === "TUNAI" || method === "HUTANG") s = s.eq("method", method);
    if (status === "LUNAS" || status === "BELUM") s = s.eq("status", status);

    // Kasir: bila kolom kasir/cashier tidak ada, fallback cari di note
    if (cashier) {
      s = s.or(
        "kasir.ilike.%"+cashier+"%,cashier.ilike.%"+cashier+"%,note.ilike.%"+cashier+"%"
      );
    }

    // Pencarian invoice/nama
    if (q) {
      // cari di id (cast text), invoice, customer
      s = s.or(
        "invoice.ilike.%"+q+"%,customer.ilike.%"+q+"%"
      );
    }

    const { data, error } = await s;
    if (error) throw new Error(errMsg(error, "Gagal ambil riwayat transaksi"));
    return data || [];
  },

  // ====== HUTANG ======
  async getDebts({ query = "", limit = 200 } = {}) {
    let q = supabase
      .from("sales")
      .select("id, customer, qty, price, method, status, note, created_at")
      .eq("method", "HUTANG")
      .neq("status", "LUNAS")
      .order("id", { ascending: false })
      .limit(limit);

    if (query && query.trim().length > 0) {
      q = q.or(`customer.ilike.%${query}%,note.ilike.%${query}%`);
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

  // ====== RIWAYAT STOK ======
  /**
   * @param {Object} p
   * @param {string} [p.from]  'YYYY-MM-DD'
   * @param {string} [p.to]
   * @param {'ALL'|'ISI'|'KOSONG'} [p.jenis]
   * @param {number} [p.limit]
   */
  async getStockHistory({ from, to, jenis = "ALL", limit = 300 } = {}) {
    // coba view dengan balance dulu; fallback ke tabel stock_logs
    const base = async (source) => {
      let q = supabase
        .from(source)
        .select("id, code, qty_change, note, created_at, balance_after")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (from) q = q.gte("created_at", from);
      if (to) q = q.lte("created_at", to);
      if (jenis === "ISI" || jenis === "KOSONG") q = q.eq("code", jenis);

      return q;
    };

    let res = await base("stock_logs_with_balance");
    if (res.error && (res.error.message || "").toLowerCase().includes("does not exist")) {
      res = await base("stock_logs");
    }
    if (res.error) throw new Error(errMsg(res.error, "Gagal ambil riwayat stok"));

    const data = res.data || [];
    return data.map((r) => {
      const change = Number(r.qty_change || 0);
      const masuk = change > 0 ? change : 0;
      const keluar = change < 0 ? Math.abs(change) : 0;

      let ket;
      if (r.code === "ISI") ket = change > 0 ? "Stok ISI bertambah" : "Stok ISI berkurang";
      else if (r.code === "KOSONG") ket = change > 0 ? "Stok KOSONG bertambah" : "Stok KOSONG berkurang";
      else ket = "Mutasi stok";
      if (r.note) ket += ` — ${r.note}`;

      return {
        id: r.id,
        tanggal: String(r.created_at || "").slice(0, 10),
        code: r.code,
        keterangan: ket,
        masuk,
        keluar,
        sisa: r.balance_after ?? null,
      };
    });
  },

  // ====== RESET ======
  async resetAllData() {
    const { data: u } = await supabase.auth.getUser();
    if (!u?.user) throw new Error("Unauthorized: silakan login dulu");
    const { error } = await supabase.rpc("reset_all_data");
    if (error) throw new Error(errMsg(error, "Reset ditolak (khusus admin)"));
    return this.loadStocks();
  },
};
