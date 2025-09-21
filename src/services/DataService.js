// src/services/DataService.js
import { supabase } from "../lib/supabase";
import {
  MIN_YEAR,
  MAX_YEAR,
  DEFAULT_PRICE,
  PAYMENT_METHODS,
} from "../utils/constants";

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
      /* DB tetap validasi */
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
    let { data, error } = await supabase
      .from("view_sales_with_invoice")
      .select(
        "id,invoice:invoice_display,customer,qty,price,total,method,note,created_at,status,hpp,laba"
      )
      .order("id", { ascending: false })
      .limit(limit);

    // fallback ke tabel sales (tanpa 'invoice_display')
    if (error && (error.message || "").toLowerCase().includes("does not exist")) {
      const res2 = await supabase
        .from("sales")
        .select(
          "id,customer,qty,price,total,method,note,created_at,status,hpp,laba"
        )
        .order("id", { ascending: false })
        .limit(limit);
      data = (res2.data || []).map((r) => ({ ...r, invoice: null }));
      error = res2.error;
    }
    if (error) throw new Error(errMsg(error, "Gagal ambil penjualan"));
    return data || [];
  },

  async getRecentSales(limit = 10) {
    let { data, error } = await supabase
      .from("view_sales_with_invoice")
      .select("id,invoice:invoice_display,customer,qty,price,method,created_at,status")
      .neq("status", "DIBATALKAN")
      .order("id", { ascending: false })
      .limit(limit);

    if (error && (error.message || "").toLowerCase().includes("does not exist")) {
      const res2 = await supabase
        .from("sales")
        .select("id,customer,qty,price,method,created_at,status")
        .neq("status", "DIBATALKAN")
        .order("id", { ascending: false })
        .limit(limit);
      data = (res2.data || []).map((r) => ({ ...r, invoice: null }));
      error = res2.error;
    }
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
      const msg = (resp.error.message || "").toLowerCase();
      if (msg.includes("could not find function") || msg.includes("does not exist")) {
        resp = await tryV2_6();
      }
    }
    if (resp.error) {
      const msg = (resp.error.message || "").toLowerCase();
      if (msg.includes("could not find function") || msg.includes("does not exist")) {
        resp = await tryV2_5();
      }
    }
    if (resp.error) {
      const msg = (resp.error.message || "").toLowerCase();
      if (msg.includes("could not find function") || msg.includes("does not exist")) {
        resp = await tryV1();
      }
    }
    if (resp.error) throw new Error(errMsg(resp.error, "Gagal menyimpan penjualan"));
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

  // Grafik 7 hari (exclude VOID) + fallback
  async getSevenDaySales() {
    let { data, error } = await supabase
      .from("view_sales_daily_clean")
      .select("tanggal,total_qty")
      .order("tanggal", { ascending: true })
      .limit(7);

    if (error && (error.message || "").toLowerCase().includes("does not exist")) {
      const res2 = await supabase
        .from("view_sales_daily")
        .select("tanggal,total_qty")
        .order("tanggal", { ascending: true })
        .limit(7);
      data = res2.data;
      error = res2.error;
    }
    if (error) throw new Error(errMsg(error, "Gagal ambil grafik 7 hari"));
    return (data || []).map((r) => ({ date: r.tanggal, qty: r.total_qty }));
  },

  async getTotalReceivables() {
    const { data, error } = await supabase
      .from("sales")
      .select("qty,price,method,status")
      .eq("method", "HUTANG")
      .neq("status", "LUNAS")
      .neq("status", "DIBATALKAN");
    if (error) throw new Error(errMsg(error, "Gagal ambil piutang"));
    return (data || []).reduce(
      (a, b) => a + (Number(b.qty) || 0) * (Number(b.price) || 0),
      0
    );
  },

  // ====== RIWAYAT TRANSAKSI ======
  async getSalesHistory({
    from,
    to,
    method = "ALL",
    status = "ALL",
    cashier,
    q,
    limit = 800,
  } = {}) {
    const build = () => {
      let s = supabase
        .from("view_sales_with_invoice")
        .select(
          "id,invoice:invoice_display,customer,qty,price,total,method,status,created_at,note"
        )
        .order("id", { ascending: false })
        .limit(limit);

      if (from) s = s.gte("created_at", from);
      if (to) s = s.lte("created_at", to);
      if (method !== "ALL") s = s.eq("method", method);
      if (status !== "ALL") s = s.eq("status", status);
      if (cashier) s = s.ilike("note", `%${cashier}%`);
      if (q) s = s.or(`invoice_display.ilike.%${q}%,customer.ilike.%${q}%`);
      return s;
    };

    let { data, error } = await build();
    if (error && (error.message || "").toLowerCase().includes("does not exist")) {
      // fallback: tabel sales (tanpa kolom invoice)
      let s3 = supabase
        .from("sales")
        .select("id,customer,qty,price,total,method,status,created_at,note")
        .order("id", { ascending: false })
        .limit(limit);
      if (from) s3 = s3.gte("created_at", from);
      if (to) s3 = s3.lte("created_at", to);
      if (method !== "ALL") s3 = s3.eq("method", method);
      if (status !== "ALL") s3 = s3.eq("status", status);
      if (cashier) s3 = s3.ilike("note", `%${cashier}%`);
      if (q) s3 = s3.or(`customer.ilike.%${q}%`);
      const res3 = await s3;
      data = (res3.data || []).map((r) => ({ ...r, invoice: null }));
      error = res3.error;
    }

    if (error) throw new Error(errMsg(error, "Gagal ambil riwayat transaksi"));
    return data || [];
  },

  // ====== HUTANG (list sederhana) ======
  async getDebts({ query = "", limit = 200 } = {}) {
    const build = () => {
      let s = supabase
        .from("view_sales_with_invoice")
        .select(
          "id,invoice:invoice_display,customer,qty,price,method,status,note,created_at"
        )
        .eq("method", "HUTANG")
        .neq("status", "LUNAS")
        .neq("status", "DIBATALKAN")
        .order("id", { ascending: false })
        .limit(limit);
      if (query && query.trim().length > 0) {
        s = s.or(
          `invoice_display.ilike.%${query}%,customer.ilike.%${query}%,note.ilike.%${query}%`
        );
      }
      return s;
    };

    let { data, error } = await build();

    if (error && (error.message || "").toLowerCase().includes("does not exist")) {
      let s2 = supabase
        .from("sales")
        .select("id,customer,qty,price,method,status,note,created_at")
        .eq("method", "HUTANG")
        .neq("status", "LUNAS")
        .neq("status", "DIBATALKAN")
        .order("id", { ascending: false })
        .limit(limit);
      if (query && query.trim().length > 0) {
        s2 = s2.or(`customer.ilike.%${query}%,note.ilike.%${query}%`);
      }
      const res2 = await s2;
      data = (res2.data || []).map((r) => ({ ...r, invoice: null }));
      error = res2.error;
    }

    if (error) throw new Error(errMsg(error, "Gagal ambil daftar hutang"));

    return (data || []).map((r) => ({
      ...r,
      total: (Number(r.qty) || 0) * (Number(r.price) || 0),
    }));
  },

  // ====== HUTANG (pagination untuk RiwayatHutangView) ======
  async getDebtsPaged({ limit = 20, qtext = "", customer = "", cursorId } = {}) {
    const baseFilter = (q) =>
      q
        .eq("method", "HUTANG")
        .neq("status", "LUNAS")
        .neq("status", "DIBATALKAN");

    // total count
    let countRes = await baseFilter(
      supabase
        .from("view_sales_with_invoice")
        .select("id", { count: "exact", head: true })
    );
    if (countRes.error && (countRes.error.message || "").toLowerCase().includes("does not exist")) {
      countRes = await baseFilter(
        supabase.from("sales").select("id", { count: "exact", head: true })
      );
    }
    const total = countRes.count || 0;

    // rows
    const builder = (table) => {
      let s = baseFilter(
        supabase
          .from(table)
          .select(
            table === "view_sales_with_invoice"
              ? "id,invoice:invoice_display,customer,qty,price,method,status,note,created_at"
              : "id,customer,qty,price,method,status,note,created_at"
          )
      ).order("id", { ascending: false }).limit(limit);

      if (cursorId) s = s.lt("id", cursorId);
      if (customer) s = s.ilike("customer", `%${customer}%`);
      if (qtext) {
        if (table === "view_sales_with_invoice") {
          s = s.or(
            `invoice_display.ilike.%${qtext}%,customer.ilike.%${qtext}%,note.ilike.%${qtext}%`
          );
        } else {
          s = s.or(`customer.ilike.%${qtext}%,note.ilike.%${qtext}%`);
        }
      }
      return s;
    };

    let res = await builder("view_sales_with_invoice");
    if (res.error && (res.error.message || "").toLowerCase().includes("does not exist")) {
      const res2 = await builder("sales");
      if (res2.error) throw new Error(errMsg(res2.error, "Gagal ambil hutang"));
      const rows = (res2.data || []).map((r) => ({
        ...r,
        invoice: null,
        total: (Number(r.qty) || 0) * (Number(r.price) || 0),
      }));
      return {
        rows,
        total,
        nextCursor: rows.length ? rows[rows.length - 1].id : null,
      };
    }

    if (res.error) throw new Error(errMsg(res.error, "Gagal ambil hutang"));
    const rows = (res.data || []).map((r) => ({
      ...r,
      total: (Number(r.qty) || 0) * (Number(r.price) || 0),
    }));
    return {
      rows,
      total,
      nextCursor: rows.length ? rows[rows.length - 1].id : null,
    };
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

  async addSaleNote({ sale_id, note }) {
    if (!sale_id) throw new Error("sale_id wajib");
    const { data, error } = await supabase
      .from("sales")
      .update({ note })
      .eq("id", sale_id)
      .select("id")
      .limit(1)
      .single();
    if (error) throw new Error(errMsg(error, "Gagal menyimpan catatan"));
    return data;
  },

  async getCustomerContact(name) {
    if (!name) return null;
    const { data, error } = await supabase
      .from("customers")
      .select("phone")
      .ilike("name", `%${name}%`)
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return null;
    return data?.phone || null;
  },

  // ====== RIWAYAT STOK ======
  async getStockHistory({ from, to, jenis = "ALL", limit = 300 } = {}) {
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

    const rows = res.data || [];

    const saleIds = Array.from(
      new Set(
        rows
          .map((r) => {
            const m = String(r.note || "").match(/sale_id\s*=\s*(\d+)/i);
            return m ? Number(m[1]) : null;
          })
          .filter(Boolean)
      )
    );

    let invoiceMap = {};
    if (saleIds.length > 0) {
      const { data: invRows, error: invErr } = await supabase
        .from("view_sales_with_invoice")
        .select("id, invoice_display")
        .in("id", saleIds);

      if (!invErr && Array.isArray(invRows)) {
        invRows.forEach((r) => (invoiceMap[r.id] = r.invoice_display));
      } else {
        saleIds.forEach((id) => (invoiceMap[id] = `INV#${id}`));
      }
    }

    const pretty = rows.map((r) => {
      const change = Number(r.qty_change || 0);
      const masuk = change > 0 ? change : 0;
      const keluar = change < 0 ? Math.abs(change) : 0;

      const note = String(r.note || "");
      const isVoid = /void/i.test(note);
      const isAdjust = /(adjust|penyesuaian|koreksi)/i.test(note);

      const labelJenis =
        r.code === "ISI" ? "Stok ISI" : r.code === "KOSONG" ? "Stok KOSONG" : "Stok";

      let ket = "";

      if (isVoid) {
        const m = note.match(/sale_id\s*=\s*(\d+)/i);
        const sid = m ? Number(m[1]) : null;
        const inv = sid && invoiceMap[sid] ? invoiceMap[sid] : sid ? `INV#${sid}` : "";
        const reason =
          (note.split(/alasan:|reason:/i)[1] || note.split("—")[1] || "")
            .trim()
            .replace(/^[-–—]\s*/, "");
        ket = `${labelJenis} — VOID ${inv ? `(${inv})` : ""}${reason ? ` — ${reason}` : ""}`;
      } else if (isAdjust) {
        const arah = change > 0 ? "Penyesuaian masuk" : "Penyesuaian keluar";
        const reason =
          (note.split(/alasan:|reason:/i)[1] || note.split("—")[1] || "")
            .trim()
            .replace(/^[-–—]\s*/, "");
        ket = `${labelJenis} — ${arah}${reason ? ` — ${reason}` : ""}`;
      } else {
        if (r.code === "ISI") ket = change > 0 ? "Stok ISI bertambah" : "Stok ISI berkurang";
        else if (r.code === "KOSONG")
          ket = change > 0 ? "Stok KOSONG bertambah" : "Stok KOSONG berkurang";
        else ket = "Mutasi stok";
        if (note) ket += ` — ${note}`;
      }

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

    return pretty;
  },

  // ====== VOID ======
  canVoidOnClient(sale, maxDays = 2) {
    if (!sale) return false;
    if ((sale.status || "").toUpperCase() === "DIBATALKAN") return false;
    const created = new Date(sale.created_at || Date.now());
    const ageDays = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
    return ageDays <= maxDays;
  },

  async voidSale({ sale_id, reason }) {
    if (!sale_id) throw new Error("sale_id wajib");
    if (!reason || !reason.trim()) throw new Error("Alasan wajib diisi");
    const { data, error } = await supabase.rpc("sales_void", {
      p_sale_id: sale_id,
      p_reason: reason,
    });
    if (error) throw new Error(errMsg(error, "Gagal membatalkan transaksi"));
    return data;
  },

  // ====== RESET ======
  async resetAllData() {
    const { data: u } = await supabase.auth.getUser();
    if (!u?.user) throw new Error("Unauthorized: silakan login dulu");
    const { error } = await supabase.rpc("reset_all_data");
    if (error) throw new Error(errMsg(error, "Reset ditolak (khusus admin)"));
    return this.loadStocks();
  },

  // ====== Penyesuaian Stok ======
  async adjustStock({ code, delta, date, reason }) {
    const vCode = String(code || "").toUpperCase();
    if (!["ISI", "KOSONG"].includes(vCode)) {
      throw new Error("Jenis stok tidak valid");
    }
    if (!Number.isFinite(delta) || Number(delta) === 0) {
      throw new Error("Jumlah penyesuaian tidak boleh 0");
    }
    if (!reason || !reason.trim()) {
      throw new Error("Alasan wajib diisi");
    }

    const yyyy = Number(String(date).slice(0, 4));
    if (Number.isFinite(yyyy) && (yyyy < MIN_YEAR || yyyy > MAX_YEAR)) {
      throw new Error(`Tanggal harus antara ${MIN_YEAR}-${MAX_YEAR}`);
    }

    const { data, error } = await supabase.rpc("stock_adjust", {
      p_code: vCode,
      p_delta: Number(delta),
      p_date: date,
      p_reason: reason,
    });
    if (error) throw new Error(errMsg(error, "Gagal penyesuaian stok"));
    return rowsToStockObject(data);
  },

  // ====== PELANGGAN ======
  async getCustomers({ q = "", filter = "ALL", limit = 300 } = {}) {
    let qry = supabase
      .from("view_customers_overview")
      .select("id,name,phone,address,note,active,total_tx,total_value,has_debt")
      .order("name", { ascending: true })
      .limit(limit);

    if (q) {
      qry = qry.or(`name.ilike.%${q}%,phone.ilike.%${q}%`);
    }
    if (filter === "ACTIVE") qry = qry.eq("active", true);
    if (filter === "DEBT") qry = qry.eq("has_debt", true);

    let { data, error } = await qry;

    if (error && (error.message || "").toLowerCase().includes("does not exist")) {
      let q2 = supabase
        .from("customers")
        .select("id,name,phone,address,note,active")
        .order("name", { ascending: true })
        .limit(limit);
      if (q) q2 = q2.or(`name.ilike.%${q}%,phone.ilike.%${q}%`);
      const r2 = await q2;
      if (r2.error) throw new Error(errMsg(r2.error, "Gagal ambil pelanggan"));
      data = (r2.data || []).map((c) => ({
        ...c,
        total_tx: 0,
        total_value: 0,
        has_debt: false,
      }));
      error = null;
    }

    if (error) throw new Error(errMsg(error, "Gagal ambil pelanggan"));
    return data || [];
  },

  async createCustomer({ name, phone = "", address = "", note = "" }) {
    if (!name || !name.trim()) throw new Error("Nama wajib diisi");
    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      note: note.trim(),
      active: true,
    };
    const { data, error } = await supabase
      .from("customers")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(errMsg(error, "Gagal menambah pelanggan"));
    return data;
  },

  async updateCustomer({ id, name, phone = "", address = "", note = "" }) {
    if (!id) throw new Error("id wajib");
    const payload = {
      ...(name != null ? { name: name.trim() } : {}),
      ...(phone != null ? { phone: phone.trim() } : {}),
      ...(address != null ? { address: address.trim() } : {}),
      ...(note != null ? { note: note.trim() } : {}),
    };
    const { data, error } = await supabase
      .from("customers")
      .update(payload)
      .eq("id", id)
      .select("id")
      .single();
    if (error) throw new Error(errMsg(error, "Gagal memperbarui pelanggan"));
    return data;
  },

  async toggleCustomerActive({ id, active }) {
    if (!id) throw new Error("id wajib");
    const { data, error } = await supabase
      .from("customers")
      .update({ active: !!active })
      .eq("id", id)
      .select("id,active")
      .single();
    if (error) throw new Error(errMsg(error, "Gagal mengubah status pelanggan"));
    return data;
  },

  async getCustomerStats({ customer_id, name }) {
    let rpc = await supabase.rpc("get_customer_stats", { p_customer_id: customer_id, p_name: name });
    if (!rpc.error && rpc.data) return rpc.data;

    let q = supabase
      .from("sales")
      .select("qty,price,method,status,customer,created_at")
      .neq("status", "DIBATALKAN");

    if (customer_id) {
      q = q.ilike("customer", `%${name || ""}%`);
    } else if (name) {
      q = q.ilike("customer", `%${name}%`);
    }

    const { data, error } = await q;
    if (error) throw new Error(errMsg(error, "Gagal ambil statistik pelanggan"));

    const tx = data || [];
    const totalTransaksi = tx.length;
    const totalNilai = tx.reduce((a, r) => a + (Number(r.qty) || 0) * (Number(r.price) || 0), 0);
    const rataRata = totalTransaksi ? Math.round(totalNilai / totalTransaksi) : 0;
    const hutangAktif = tx
      .filter((r) => r.method === "HUTANG" && r.status !== "LUNAS")
      .reduce((a, r) => a + (Number(r.qty) || 0) * (Number(r.price) || 0), 0);

    return { totalTransaksi, totalNilai, rataRata, hutangAktif };
  }
}; // << tutup DataService

// ====== SETTINGS (FE via localStorage + broadcast agar “efek langsung”) ======
const LS_KEY = "gas3kg_settings";
function readLS() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch { return {}; }
}
function writeLS(obj) {
  localStorage.setItem(LS_KEY, JSON.stringify(obj || {}));
}

DataService.getSettings = async function () {
  return readLS();
};

/**
 * Kembalikan pengaturan aktif dengan fallback aman (DEFAULT_PRICE, PAYMENT_METHODS).
 * Dipakai komponen agar tidak perlu mikir fallback lagi.
 */
DataService.getActiveSettings = async function () {
  const s = readLS();
  return {
    business_name: s.business_name || "",
    default_price: Number(s.default_price) > 0 ? Number(s.default_price) : DEFAULT_PRICE,
    hpp: Number(s.hpp) > 0 ? Number(s.hpp) : 0,
    payment_methods: Array.isArray(s.payment_methods) && s.payment_methods.length
      ? s.payment_methods
      : PAYMENT_METHODS,
  };
};

/**
 * Simpan dan siarkan event `settings:updated` supaya view lain langsung ikut.
 * Juga taruh cache ringan di window.__appSettings (opsional).
 */
DataService.saveSettings = async function (payload) {
  const cur = readLS();
  const merged = { ...cur, ...payload };
  writeLS(merged);

  try { window.__appSettings = merged; } catch {}
  try {
    window.dispatchEvent(new CustomEvent("settings:updated", { detail: merged }));
  } catch {}
  return true;
};

/**
 * Subscribe perubahan settings (opsional). Return fn untuk unsubscribe.
 */
DataService.onSettingsChange = function (handler) {
  const fn = (e) => handler?.(e?.detail || readLS());
  window.addEventListener("settings:updated", fn);
  return () => window.removeEventListener("settings:updated", fn);
};

// ====== USERS (placeholder FE only)
DataService.getUsers = async function () {
  const ls = readLS();
  return ls._users || [];
};

DataService.addUser = async function ({ email, role = "user" }) {
  const ls = readLS();
  const list = ls._users || [];
  list.push({ id: Date.now(), email, role });
  writeLS({ ...ls, _users: list });
  return true;
};

DataService.updateUserRole = async function ({ user_id, role }) {
  const ls = readLS();
  const list = (ls._users || []).map((u) => (u.id === user_id ? { ...u, role } : u));
  writeLS({ ...ls, _users: list });
  return true;
};

DataService.resetUserPassword = async function () {
  return true; // placeholder
};

// ====== BACKUP
DataService.exportAll = async function () {
  const [stocks, sales, customers] = await Promise.all([
    this.loadStocks().catch(() => ({})),
    this.loadSales(2000).catch(() => []),
    this.getCustomers({ limit: 2000 }).catch(() => []),
  ]);
  const blob = new Blob(
    [JSON.stringify({ stocks, sales, customers }, null, 2)],
    { type: "application/json" }
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `backup_gas3kg_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  return true;
};

DataService.importAll = async function (file) {
  await file?.text(); // placeholder
  return true;
};

// ====== Hard Reset
DataService.hardResetAll = async function () {
  return this.resetAllData();
};

// ==== Role helper
DataService.isAdmin = async function () {
  try {
    const { data } = await supabase.auth.getUser();
    const email = (data?.user?.email || "").toLowerCase();
    if (!email) return false;

    const users = await this.getUsers();
    return !!users.find(
      (u) => String(u.email || "").toLowerCase() === email && String(u.role) === "admin"
    );
  } catch {
    return false;
  }
};

// ====== AUTH/ROLE UTIL (via public.app_admins)
DataService.getUserRoleById = async function (userId) {
  try {
    if (!userId) return "user";
    const { data, error } = await supabase
      .from("app_admins")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.warn("[DataService.getUserRoleById] error:", error.message);
      return "user";
    }
    return data?.user_id ? "admin" : "user";
  } catch (e) {
    console.warn("[DataService.getUserRoleById] exception:", e?.message || e);
    return "user";
  }
};
