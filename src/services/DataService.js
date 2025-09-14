// src/services/DataService.js
import { supabase } from '../lib/supabase';
import { MIN_YEAR, MAX_YEAR } from '../utils/constants';

const errMsg = (e, fb) => e?.message || fb;

function rowsToStockObject(rows) {
  const obj = { ISI: 0, KOSONG: 0 };
  (rows || []).forEach((r) => {
    const code = String(r.code || '').toUpperCase();
    if (code in obj) obj[code] = Number(r.qty || 0);
  });
  return obj;
}

export const DataService = {
  // Snapshot stok (ISI & KOSONG) via RPC agar konsisten
  async loadStocks() {
    const { data, error } = await supabase.rpc('get_stock_snapshot');
    if (error) throw new Error(errMsg(error, 'Gagal ambil stok'));
    return rowsToStockObject(data);
  },

  // Log stok terbaru
  async loadLogs(limit = 500) {
    const { data, error } = await supabase
      .from('stock_logs')
      .select('id,code,qty_change,note,created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw new Error(errMsg(error, 'Gagal ambil log stok'));
    return data || [];
  },

  // Riwayat penjualan terbaru
  async loadSales(limit = 500) {
    const { data, error } = await supabase
      .from('sales')
      .select('id,customer,qty,price,total,method,note,created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw new Error(errMsg(error, 'Gagal ambil penjualan'));
    return data || [];
  },

  // Tambah stok KOSONG (balance log sudah dijaga di fungsi DB)
  async addKosong({ qty, date, note }) {
    if (!(qty > 0)) throw new Error('Jumlah harus > 0');
    const yyyy = Number(String(date).slice(0, 4));
    if (Number.isFinite(yyyy) && (yyyy < MIN_YEAR || yyyy > MAX_YEAR)) {
      throw new Error(`Tanggal harus antara ${MIN_YEAR}-${MAX_YEAR}`);
    }
    const { data, error } = await supabase.rpc('stock_add_kosong', {
      p_qty: qty,
      p_date: date,
      p_note: note || 'beli tabung',
    });
    if (error) throw new Error(errMsg(error, 'Gagal tambah stok kosong'));
    return rowsToStockObject(data);
  },

  // Tambah stok ISI (butuh KOSONG cukup — dicek di fungsi DB)
  async addIsi({ qty, date, note }) {
    if (!(qty > 0)) throw new Error('Jumlah harus > 0');
    const yyyy = Number(String(date).slice(0, 4));
    if (Number.isFinite(yyyy) && (yyyy < MIN_YEAR || yyyy > MAX_YEAR)) {
      throw new Error(`Tanggal harus antara ${MIN_YEAR}-${MAX_YEAR}`);
    }
    const { data, error } = await supabase.rpc('stock_add_isi', {
      p_qty: qty,
      p_date: date,
      p_note: note || 'isi dari agen',
    });
    if (error) throw new Error(errMsg(error, 'Gagal tambah stok isi'));
    return rowsToStockObject(data);
  },

  /**
   * Simpan penjualan:
   * - Prefer: stock_sell_with_customer (nama customer realtime)
   * - Fallback: stock_sell_public_v2 (jika ada)
   * - Fallback: stock_sell_public (sisipkan nama customer ke note)
   */
  async createSale({ customer = 'PUBLIC', qty, price, method = 'TUNAI', date, note = '' }) {
    if (!(qty > 0)) throw new Error('Qty harus > 0');
    if (!(price > 0)) throw new Error('Harga tidak valid');

    // 1) Fungsi baru: nama pelanggan dikirim ke DB
    const tryWithCustomer = () =>
      supabase.rpc('stock_sell_with_customer', {
        p_customer: customer,
        p_qty: qty,
        p_price: price,
        p_method: method,
        p_note: note,
      });

    // 2) Versi v2 (beberapa env sudah punya p_customer)
    const tryV2 = () =>
      supabase.rpc('stock_sell_public_v2', {
        p_customer: customer,
        p_qty: qty,
        p_price: price,
        p_method: method,
        p_note: note,
      });

    // 3) Versi lama: tanpa customer param → embed di note
    const tryV1 = () => {
      const legacyNote = (note ? `${note} | ` : '') + `cust:${customer}`;
      return supabase.rpc('stock_sell_public', {
        p_qty: qty,
        p_price: price,
        p_method: method,
        p_note: legacyNote,
      });
    };

    let resp = await tryWithCustomer();

    // Jika function tidak ditemukan → coba v2
    if (resp.error) {
      const msg = (resp.error.message || '').toLowerCase();
      const fnMissing = msg.includes('could not find function') || msg.includes('does not exist');
      if (fnMissing) resp = await tryV2();
    }

    // Jika v2 juga tidak ada → fallback v1
    if (resp.error) {
      const msg = (resp.error.message || '').toLowerCase();
      const fnMissing = msg.includes('could not find function') || msg.includes('does not exist');
      if (fnMissing) resp = await tryV1();
    }

    if (resp.error) throw new Error(errMsg(resp.error, 'Gagal menyimpan penjualan'));
    return rowsToStockObject(resp.data);
  },

  // Reset semua data (khusus admin)
  async resetAllData() {
    const { data: u } = await supabase.auth.getUser();
    if (!u?.user) throw new Error('Unauthorized: silakan login dulu');
    const { error } = await supabase.rpc('reset_all_data');
    if (error) throw new Error(errMsg(error, 'Reset ditolak (khusus admin)'));
    return this.loadStocks();
  },
};
