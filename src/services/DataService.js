// src/services/DataService.js
import { supabase } from "../lib/supabase";
import {
  MIN_YEAR,
  MAX_YEAR,
  DEFAULT_PRICE,
  PAYMENT_METHODS,
} from "../utils/constants";

// === Timezone helpers (Asia/Makassar, UTC+08) ===
const MAKASSAR_OFFSET_MIN = 8 * 60; // +08:00
function toISOStringWithOffset(date, offsetMin = MAKASSAR_OFFSET_MIN) {
  const d = new Date(date);
  // bikin "waktu lokal Makassar" dengan cara geser dari UTC
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  const local = new Date(utc + offsetMin * 60000);
  // format ke YYYY-MM-DDTHH:mm:ss.sss+08:00
  const pad = (n, w = 2) => String(n).padStart(w, "0");
  const yyyy = local.getFullYear();
  const mm = pad(local.getMonth() + 1);
  const dd = pad(local.getDate());
  const hh = pad(local.getHours());
  const mi = pad(local.getMinutes());
  const ss = pad(local.getSeconds());
  const ms = String(local.getMilliseconds()).padStart(3, "0");
  const sign = offsetMin >= 0 ? "+" : "-";
  const oh = pad(Math.floor(Math.abs(offsetMin) / 60));
  const om = pad(Math.abs(offsetMin) % 60);
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}.${ms}${sign}${oh}:${om}`;
}

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
        ? toISOStringWithOffset(new Date(date))
        : toISOStringWithOffset(new Date());

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

  // ====== PENJUALAN (tambahan range) ======
  async loadSalesByDateRange(fromISO, toISO) {
    let { data, error } = await supabase
      .from("sales")
      .select("id,customer,qty,price,total,method,status,created_at,note")
      .gte("created_at", fromISO)
      .lte("created_at", toISO)
      .order("created_at", { ascending: true });

    if (error) throw new Error(errMsg(error, "Gagal ambil penjualan (by range)"));
    return data || [];
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

  // ====== PELANGGAN  ======
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
  },

  // ====== AUTH/ROLE UTIL (via public.app_admins)
  async getUserRoleById(userId) {
    // Gunakan RPC server-side; abaikan argumen karena server sudah pakai auth.uid()
    try {
      const { data, error } = await supabase.rpc("get_user_role");
      if (error) {
        console.warn("[DataService.getUserRoleById] rpc error:", error.message);
        return "user";
      }
      return (data || "user"); // 'admin' | 'user'
    } catch (e) {
      console.warn("[DataService.getUserRoleById] exception:", e?.message || e);
      return "user";
    }
  },

  // ==== Tambahan: helper kompatibel lama
  async isAdmin() {
    try {
      // cache ringan 5 menit tetap berlaku
      const CK = "__isAdmin_cache_v1";
      const raw = localStorage.getItem(CK);
      if (raw) {
        try {
          const c = JSON.parse(raw);
          if (Date.now() - (c.ts || 0) < 5 * 60 * 1000) return !!c.val;
        } catch {}
      }
      const { data, error } = await supabase.rpc("is_admin");
      if (error) throw error;
      const val = !!data;
      localStorage.setItem(CK, JSON.stringify({ val, ts: Date.now() }));
      return val;
    } catch (e) {
      console.warn("[DataService.isAdmin] rpc error:", e?.message || e);
      return false;
    }
  },

  // ====== USER MANAGEMENT (via SQL function public.manage_user) ======
  async manageUser({ actorId, userId, action, role = null }) {
    if (!actorId) throw new Error("actorId wajib");
    if (!userId) throw new Error("userId target wajib");
    if (!action) throw new Error("action wajib");

    const { data, error } = await supabase.rpc("manage_user", {
      p_actor: actorId,
      p_user_id: userId,
      p_action: action,
      p_role: role,
    });
    if (error) throw new Error(errMsg(error, "Gagal menjalankan manage_user"));
    return data;
  },

  async getUserMeta(userId) {
    if (!userId) return null;
    const { data, error } = await supabase
      .from("app_user_meta")
      .select("user_id, role, force_reset, updated_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) return null;
    return data || null;
  },

  async getAllLocalUsers() {
    const { data: metas, error: e1 } = await supabase
      .from("app_user_meta")
      .select("user_id, role, force_reset, updated_at");
    if (e1) throw new Error(errMsg(e1, "Gagal ambil daftar pengguna"));

    const { data: admins } = await supabase.from("app_admins").select("user_id");
    const adminSet = new Set((admins || []).map((a) => a.user_id));

    return (metas || []).map((m) => ({
      user_id: m.user_id,
      role: m.role || (adminSet.has(m.user_id) ? "admin" : "user"),
      force_reset: !!m.force_reset,
      updated_at: m.updated_at,
      is_admin: adminSet.has(m.user_id),
    }));
  },



}; // << tutup DataService

// =======================================================
// ===============   SALES ANALYTICS (RPC)  ==============
// =======================================================

/** Util: hitung rentang tanggal standar (dipakai di TopCustomersPeriod & summary) */
DataService.getPeriodRange = function (type) {
  const now = new Date();

  const startOfWeek = (d) => {
    const x = new Date(d);
    const dow = (x.getDay() + 6) % 7; // Sen=0..Min=6
    x.setDate(x.getDate() - dow);
    x.setHours(0, 0, 0, 0);
    return x;
  };
  const endOfWeek = (d) => {
    const s = startOfWeek(d);
    const e = new Date(s);
    e.setDate(s.getDate() + 6);
    e.setHours(23, 59, 59, 999);
    return e;
  };

  const startOfMonth = (y, m) => {
    const d = new Date(y, m, 1);
    d.setHours(0, 0, 0, 0);
    return d;
  };
  const endOfMonth = (y, m) => {
    const d = new Date(y, m + 1, 0);
    d.setHours(23, 59, 59, 999);
    return d;
  };

  const iso = (d) => toISOStringWithOffset(d);

  switch (type) {
    case "this_week": {
      const s = startOfWeek(now);
      const e = endOfWeek(now);
      return { from: iso(s), to: iso(e) };
    }
    case "last_week": {
      const curS = startOfWeek(now);
      const s = new Date(curS);
      s.setDate(curS.getDate() - 7);
      const e = new Date(curS);
      e.setDate(curS.getDate() - 1);
      e.setHours(23, 59, 59, 999);
      return { from: iso(s), to: iso(e) };
    }
    case "this_month": {
      const y = now.getFullYear(),
        m = now.getMonth();
      const s = startOfMonth(y, m);
      const e = endOfMonth(y, m);
      return { from: iso(s), to: iso(e) };
    }
    case "last_month": {
      const y = now.getFullYear(),
        m = now.getMonth();
      const py = m === 0 ? y - 1 : y;
      const pm = m === 0 ? 11 : m - 1;
      const s = startOfMonth(py, pm);
      const e = endOfMonth(py, pm);
      return { from: iso(s), to: iso(e) };
    }
    case "this_month_yoy": {
      const y = now.getFullYear(),
        m = now.getMonth();
      const s = startOfMonth(y - 1, m);
      const e = endOfMonth(y - 1, m);
      return { from: iso(s), to: iso(e) };
    }
    default:
      return null;
  }
};

/** Daily summary (per hari) via RPC get_daily_summary */
DataService.getDailySummary = async function ({ from, to, onlyPaid = false }) {
  const { data, error } = await supabase.rpc("get_daily_summary", {
    p_from: from,
    p_to: to,
    p_only_paid: onlyPaid,
  });
  if (error) throw new Error(error.message || "Gagal ambil daily summary");
  // hasil: [{ tanggal: date, total_qty, total_value, total_laba }]
  return data || [];
};

/** Top Customers via RPC get_top_customers */
DataService.getTopCustomers = async function ({
  from,
  to,
  limit = 5,
  onlyPaid = false,
}) {
  const { data, error } = await supabase.rpc("get_top_customers", {
    p_from: from,
    p_to: to,
    p_limit: limit,
    p_only_paid: onlyPaid,
  });
  if (error) throw new Error(error.message || "Gagal ambil top customers");
  // hasil: [{ customer_name, total_transaksi, total_qty, total_value, last_tx_at }]
  return data || [];
};

/** Weekly comparison via RPC get_sales_weekly_comparison */
DataService.getWeeklyComparison = async function ({
  weekDate, // string 'YYYY-MM-DD' atau Date
  onlyPaid = false,
}) {
  const d = weekDate ? new Date(weekDate) : new Date();
  const paramDate = toISOStringWithOffset(d).slice(0, 10);
  const { data, error } = await supabase.rpc("get_sales_weekly_comparison", {
    p_week: paramDate,
    p_only_paid: onlyPaid,
  });
  if (error) throw new Error(error.message || "Gagal ambil perbandingan mingguan");
  // hasil: single row { this_week_qty, this_week_value, last_week_qty, last_week_value }
  return data?.[0] || {
    this_week_qty: 0,
    this_week_value: 0,
    last_week_qty: 0,
    last_week_value: 0,
  };
};

/** Monthly comparison (this vs last month) via RPC get_sales_monthly_comparison */
DataService.getMonthlyComparison = async function ({
  monthDate = new Date(), // tanggal apa saja di bulan target
  onlyPaid = false,
}) {
  const d = typeof monthDate === "string" ? new Date(monthDate) : monthDate;
  const paramDate = toISOStringWithOffset(d).slice(0, 10);
  const { data, error } = await supabase.rpc("get_sales_monthly_comparison", {
    p_month: paramDate,
    p_only_paid: onlyPaid,
  });
  if (error) throw new Error(error.message || "Gagal ambil perbandingan bulanan");
  // hasil: single row { this_month_qty, this_month_value, this_month_laba, last_month_* }
  return (
    data?.[0] || {
      this_month_qty: 0,
      this_month_value: 0,
      this_month_laba: 0,
      last_month_qty: 0,
      last_month_value: 0,
      last_month_laba: 0,
    }
  );
};

/** Monthly YoY via RPC get_sales_monthly_yoy */
DataService.getMonthlyYoY = async function ({
  monthDate = new Date(),
  onlyPaid = false,
}) {
  const d = typeof monthDate === "string" ? new Date(monthDate) : monthDate;
  const paramDate = toISOStringWithOffset(d).slice(0, 10);
  const { data, error } = await supabase.rpc("get_sales_monthly_yoy", {
    p_month: paramDate,
    p_only_paid: onlyPaid,
  });
  if (error) throw new Error(error.message || "Gagal ambil perbandingan YoY");
  // hasil: single row { this_year_qty/value/laba, last_year_qty/value/laba }
  return (
    data?.[0] || {
      this_year_qty: 0,
      this_year_value: 0,
      this_year_laba: 0,
      last_year_qty: 0,
      last_year_value: 0,
      last_year_laba: 0,
    }
  );
};

/** Helper: Top customers untuk periode standar (atau custom from/to) */
DataService.getTopCustomersPeriod = async function ({
  period = "this_month",
  from,
  to,
  limit = 5,
  onlyPaid = true,
} = {}) {
  let range = null;
  if (!from || !to) range = this.getPeriodRange(period) || this.getPeriodRange("this_month");
  const pFrom = from || range.from;
  const pTo = to || range.to;
  return this.getTopCustomers({ from: pFrom, to: pTo, limit, onlyPaid });
};

/** Ringkas perbandingan Weekly + Monthly + YoY sekaligus (semua via RPC) */
DataService.getComparisonsSummary = async function ({ onlyPaid = true } = {}) {
  const weekly = await this.getWeeklyComparison({ weekDate: new Date(), onlyPaid }).catch(() => null);
  const monthly = await this.getMonthlyComparison({ monthDate: new Date(), onlyPaid }).catch(() => null);
  const yoy = await this.getMonthlyYoY({ monthDate: new Date(), onlyPaid }).catch(() => null);

  return { weekly, monthly, yoy };
};

// --- Customer history by period (for modal) ---
DataService.getCustomerSalesByRange = async function ({
  from,
  to,
  customer,
  onlyPaid = false,
  limit = 500,
}) {
  if (!from || !to || !customer) return [];

  // Utamakan view dengan invoice jika ada
  let q = supabase
    .from("view_sales_with_invoice")
    .select("id,invoice:invoice_display,customer,qty,price,total,method,status,created_at,note")
    .gte("created_at", from)
    .lte("created_at", to)
    .eq("customer", customer)
    .neq("status", "DIBATALKAN")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (onlyPaid) q = q.eq("status", "LUNAS");

  let { data, error } = await q;

  // Fallback ke tabel sales jika view tidak ada
  if (error && (error.message || "").toLowerCase().includes("does not exist")) {
    let q2 = supabase
      .from("sales")
      .select("id,customer,qty,price,total,method,status,created_at,note")
      .gte("created_at", from)
      .lte("created_at", to)
      .eq("customer", customer)
      .neq("status", "DIBATALKAN")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (onlyPaid) q2 = q2.eq("status", "LUNAS");
    const r2 = await q2;
    data = r2.data || [];
    error = r2.error;
  }

  if (error) throw new Error(error.message || "Gagal ambil riwayat pelanggan");
  return data || [];
};



/* =========================
   SETTINGS (via Supabase + LS)
   ========================= */
const LS_KEY = "gas3kg_settings";
function readLS() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch { return {}; }
}
function writeLS(obj) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(obj || {})); } catch {}
}

DataService.getSettings = async function () {
  // 1) Coba RPC (aman dari CORS REST)
  try {
    const r = await supabase.rpc("get_app_settings");
    if (r.error) throw r.error;
    const row = Array.isArray(r.data) ? r.data[0] : r.data;
    if (!row) throw new Error("app_settings kosong");

    const normalized = {
      business_name: row.business_name ?? "",
      default_price: row.default_price ?? 0,
      hpp: row.hpp ?? 0,
      payment_methods: Array.isArray(row.payment_methods) ? row.payment_methods : [],
      updated_at: row.updated_at ?? null,
    };
    writeLS(normalized);
    try { window.__appSettings = normalized; } catch {}
    return normalized;
  } catch (_) {
    // 2) Fallback REST (kalau RPC belum dibuat)
    try {
      const { data, error } = await supabase
        .from("app_settings")
        .select("business_name, default_price, hpp, payment_methods, updated_at")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("app_settings kosong");

      const normalized = {
        business_name: data.business_name ?? "",
        default_price: data.default_price ?? 0,
        hpp: data.hpp ?? 0,
        payment_methods: Array.isArray(data.payment_methods) ? data.payment_methods : [],
        updated_at: data.updated_at ?? null,
      };
      writeLS(normalized);
      try { window.__appSettings = normalized; } catch {}
      return normalized;
    } catch (e2) {
      console.warn("[getSettings] fallback LS:", e2?.message);
      return readLS(); // 3) Fallback terakhir: cache lama
    }
  }
};
DataService.getActiveSettings = async function () {
  const s = await this.getSettings().catch(() => readLS());

  return {
    business_name: s?.business_name ?? "",
    // Kalau null/undefined → baru pakai DEFAULT_PRICE. Kalau 0 → tetap 0.
    default_price: s?.default_price ?? DEFAULT_PRICE,
    // Kalau null/undefined → 0; kalau 0 sah → tetap 0.
    hpp: s?.hpp ?? 0,
    // Kalau bukan array → pakai PAYMENT_METHODS; kalau [] sah → tetap [].
    payment_methods: Array.isArray(s?.payment_methods)
      ? s.payment_methods
      : PAYMENT_METHODS,
    updated_at: s?.updated_at ?? null,
  };
};
DataService.saveSettings = async function (payload) {
  const cur = await this.getSettings().catch(() => readLS());
  const merged = { ...cur, ...payload };

  // 1) Coba RPC admin-only
  try {
    const r = await supabase.rpc("set_app_settings", {
      p_business_name: merged.business_name ?? null,
      p_default_price: Number(merged.default_price) || 0,
      p_hpp: Number(merged.hpp) || 0,
      p_payment_methods: Array.isArray(merged.payment_methods)
        ? merged.payment_methods
        : [],
    });
    if (r.error) throw r.error;
  } catch (_) {
    // 2) Fallback REST update (kalau RPC belum ada)
    const { error } = await supabase
      .from("app_settings")
      .update({
        business_name: merged.business_name ?? null,
        default_price: Number(merged.default_price) || 0,
        hpp: Number(merged.hpp) || 0,
        payment_methods: Array.isArray(merged.payment_methods)
          ? merged.payment_methods
          : [],
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
    if (error) throw new Error(error.message || "Gagal menyimpan pengaturan");
  }

  // local cache + broadcast
  writeLS(merged);
  try { window.dispatchEvent(new CustomEvent("settings:updated", { detail: merged })); } catch {}
  return true;
};

/* =========================
   DASHBOARD SNAPSHOT (FAST)
   ========================= */
const DASH_CACHE_KEY = "dash_snap_v1";
function readDashCache() {
  try {
    return JSON.parse(localStorage.getItem(DASH_CACHE_KEY) || "null");
  } catch {
    return null;
  }
}
function writeDashCache(obj) {
  try { localStorage.setItem(DASH_CACHE_KEY, JSON.stringify(obj)); } catch {}
}

/**
 * Ambil snapshot dashboard secepat mungkin.
 * - Return dari cache jika masih fresh → UI tampil instan
 * - Lalu revalidate paralel dan siarkan event 'dashboard:snapshot'
 */
DataService.getDashboardSnapshot = async function ({
  revalidate = true,
  maxAgeMs = 3 * 60 * 1000,
} = {}) {
  const now = Date.now();
  const cached = readDashCache();
  const fresh = cached && now - (cached._ts || 0) < maxAgeMs ? cached : null;

  if (revalidate) {
    (async () => {
      try {
        const [stocks, sevenDays, receivables, recent] = await Promise.all([
          this.loadStocks().catch(() => ({ ISI: 0, KOSONG: 0 })),
          this.getSevenDaySales().catch(() => []),
          this.getTotalReceivables().catch(() => 0),
          this.getRecentSales(10).catch(() => []),
        ]);
        const snap = {
          stocks,
          sevenDays,
          receivables,
          recentSales: recent,
          _ts: Date.now(),
        };
        writeDashCache(snap);
        try { window.dispatchEvent(new CustomEvent("dashboard:snapshot", { detail: snap })); } catch {}
      } catch (e) {
        console.warn("[getDashboardSnapshot] gagal revalidate:", e?.message || e);
      }
    })();
  }

  return fresh || {
    stocks: { ISI: 0, KOSONG: 0 },
    sevenDays: [],
    receivables: 0,
    recentSales: [],
    _ts: 0,
  };
};

// ====== FUNGSI BARU: RINGKASAN KEUANGAN ======
DataService.getFinancialSummary = async function ({ from, to, hppPerUnit }) {
  try {
    // REUSE existing function untuk konsistensi data dengan LaporanView
    const salesData = await this.getSalesHistory({
      from,
      to,
      method: "ALL",
      status: "ALL",
      limit: 10000
    });

    // Logika perhitungan yang SAMA PERSIS dengan LaporanView.jsx
    const paid = salesData.filter(sale => {
   const method = String(sale.method || '').toUpperCase();
   const status = String(sale.status || '').toUpperCase();

   // 🚫 abaikan transaksi dibatalkan
   if (status === 'DIBATALKAN') return false;

   // ✅ hanya hitung tunai atau sudah lunas
   if (method === 'TUNAI') return true;
   if (status === 'LUNAS') return true;

   return false;
 });

    // Hitung omzet dari total transaksi (sama seperti LaporanView)
    const omzet = paid.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0);
    
    // Hitung total quantity dari transaksi dibayar
    const totalQty = paid.reduce((sum, sale) => sum + (Number(sale.qty) || 0), 0);
    
    // Hitung HPP (sama seperti LaporanView: totalQty × hppPerUnit)
    const hpp = totalQty * hppPerUnit;
    
    // Hitung laba dan margin (sama seperti LaporanView)
    const laba = omzet - hpp;
    const margin = omzet > 0 ? Math.round((laba / omzet) * 100) : 0;

    return { 
      omzet, 
      hpp, 
      laba, 
      margin, 
      totalQty, 
      transactionCount: paid.length,
      period: { from, to }
    };
  } catch (error) {
    console.error('[getFinancialSummary] Error:', error);
    throw new Error(errMsg(error, "Gagal menghitung ringkasan keuangan"));
  }
};

// ====== FUNGSI BARU: RINGKASAN KEUANGAN BULAN INI ======
DataService.getCurrentMonthFinancialSummary = async function (hppPerUnit) {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const from = toISOStringWithOffset(startOfMonth).slice(0, 10);
    const to = toISOStringWithOffset(endOfMonth).slice(0, 10);

    return await this.getFinancialSummary({
      from,
      to,
      hppPerUnit
    });
  } catch (error) {
    console.error('[getCurrentMonthFinancialSummary] Error:', error);
    throw new Error(errMsg(error, "Gagal menghitung ringkasan keuangan bulan ini"));
  }
};

// ====== FUNGSI BARU: RINGKASAN KEUANGAN MINGGU INI ======
DataService.getCurrentWeekFinancialSummary = async function (hppPerUnit) {
  try {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Minggu sebagai awal minggu
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + (6 - now.getDay())); // Sabtu sebagai akhir minggu
    endOfWeek.setHours(23, 59, 59, 999);

    const from = toISOStringWithOffset(startOfWeek).slice(0, 10);
    const to = toISOStringWithOffset(endOfWeek).slice(0, 10);

    return await this.getFinancialSummary({
      from,
      to,
      hppPerUnit
    });
  } catch (error) {
    console.error('[getCurrentWeekFinancialSummary] Error:', error);
    throw new Error(errMsg(error, "Gagal menghitung ringkasan keuangan minggu ini"));
  }
};

// ====== FUNGSI BARU: RINGKASAN KEUANGAN HARI INI ======
DataService.getTodayFinancialSummary = async function (hppPerUnit) {
  try {
    const today = todayStr();
    
    return await this.getFinancialSummary({
      from: today,
      to: today,
      hppPerUnit
    });
  } catch (error) {
    console.error('[getTodayFinancialSummary] Error:', error);
    throw new Error(errMsg(error, "Gagal menghitung ringkasan keuangan hari ini"));
  }
};

// ====== FUNGSI BARU: COMPARISON KEUANGAN ======
DataService.getFinancialComparison = async function ({ currentFrom, currentTo, previousFrom, previousTo, hppPerUnit }) {
  try {
    const [current, previous] = await Promise.all([
      this.getFinancialSummary({ from: currentFrom, to: currentTo, hppPerUnit }),
      this.getFinancialSummary({ from: previousFrom, to: previousTo, hppPerUnit })
    ]);

    // Hitung growth percentage
    const calculateGrowth = (currentVal, previousVal) => {
      if (previousVal === 0) return currentVal > 0 ? 100 : 0;
      return ((currentVal - previousVal) / previousVal) * 100;
    };

    return {
      current,
      previous,
      growth: {
        omzet: calculateGrowth(current.omzet, previous.omzet),
        laba: calculateGrowth(current.laba, previous.laba),
        margin: current.margin - previous.margin,
        transactionCount: calculateGrowth(current.transactionCount, previous.transactionCount),
        totalQty: calculateGrowth(current.totalQty, previous.totalQty)
      }
    };
  } catch (error) {
    console.error('[getFinancialComparison] Error:', error);
    throw new Error(errMsg(error, "Gagal menghitung perbandingan keuangan"));
  }
};
