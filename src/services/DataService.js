import { supabase } from '../lib/supabase';
import { MIN_YEAR, MAX_YEAR } from '../utils/constants';

const errMsg = (e,fb)=> e?.message || fb;
const rowsToStockObject = (rows)=>{
  const obj={ISI:0,KOSONG:0};
  (rows||[]).forEach(r=>{
    const code = String(r.code||'').toUpperCase();
    if (code in obj) obj[code] = Number(r.qty||0);
  });
  return obj;
};

/** ====== Anti double-submit (mutex sederhana di FE) ====== */
let saleInFlight = false;
let lastSubmitAt = 0;
const COOLDOWN_MS = 2000; // cegah spam klik < 2 detik

export const DataService = {
  async loadStocks(){
    const {data,error} = await supabase.rpc('get_stock_snapshot');
    if (error) throw new Error(errMsg(error,'Gagal ambil stok'));
    return rowsToStockObject(data);
  },

  async loadLogs(limit=500){
    const {data,error} = await supabase
      .from('stock_logs')
      .select('id,code,qty_change,note,created_at')
      .order('created_at',{ascending:false})
      .limit(limit);
    if (error) throw new Error(errMsg(error,'Gagal ambil log stok'));
    return data||[];
  },

  async loadSales(limit=500){
    const {data,error} = await supabase
      .from('sales')
      .select('id,customer,qty,price,total,method,note,created_at')
      .order('created_at',{ascending:false})
      .limit(limit);
    if (error) throw new Error(errMsg(error,'Gagal ambil penjualan'));
    return data||[];
  },

  async addKosong({qty,date,note}){
    if(!(qty>0)) throw new Error('Jumlah harus > 0');
    const yyyy=Number(String(date).slice(0,4));
    if(Number.isFinite(yyyy)&&(yyyy<MIN_YEAR||yyyy>MAX_YEAR))
      throw new Error(`Tanggal harus antara ${MIN_YEAR}-${MAX_YEAR}`);

    const {data,error} = await supabase.rpc('stock_add_kosong',{
      p_qty: qty, p_date: date, p_note: note || 'beli tabung'
    });
    if (error) throw new Error(errMsg(error,'Gagal tambah stok kosong'));
    return rowsToStockObject(data);
  },

  async addIsi({qty,date,note}){
    if(!(qty>0)) throw new Error('Jumlah harus > 0');
    const yyyy=Number(String(date).slice(0,4));
    if(Number.isFinite(yyyy)&&(yyyy<MIN_YEAR||yyyy>MAX_YEAR))
      throw new Error(`Tanggal harus antara ${MIN_YEAR}-${MAX_YEAR}`);

    const {data,error} = await supabase.rpc('stock_add_isi',{
      p_qty: qty, p_date: date, p_note: note || 'isi dari agen'
    });
    if (error) throw new Error(errMsg(error,'Gagal tambah stok isi'));
    return rowsToStockObject(data);
  },

  /** Penjualan dengan guard anti double-submit */
  async createSale({customer='PUBLIC', qty, price, method='TUNAI', date, note='', idemKey}){
    if(!(qty>0))   throw new Error('Qty harus > 0');
    if(!(price>0)) throw new Error('Harga tidak valid');

    // mutex + cooldown
    const now = Date.now();
    if (saleInFlight) throw new Error('Transaksi masih diproses, tunggu sebentar…');
    if (now - lastSubmitAt < COOLDOWN_MS) throw new Error('Terlalu cepat, coba lagi sesaat lagi…');

    saleInFlight = true;
    lastSubmitAt = now;

    try{
      const {data,error} = await supabase.rpc('stock_sell_public_v2',{
        p_qty: qty, p_price: price, p_method: method, p_note: note
        // idemKey tidak dipakai di RPC (jaga di sisi FE saja)
      });
      if (error) throw error;
      return rowsToStockObject(data);
    }catch(e){
      // kegagalan, longgarkan cooldown agar bisa coba lagi
      lastSubmitAt = 0;
      throw new Error(errMsg(e,'Gagal menyimpan penjualan'));
    }finally{
      saleInFlight = false;
    }
  },

  async resetAllData(){
    const { data:u } = await supabase.auth.getUser();
    if (!u?.user) throw new Error('Unauthorized: silakan login dulu');

    const { error } = await supabase.rpc('reset_all_data');
    if (error) throw new Error(errMsg(error,'Reset ditolak (khusus admin)'));
    return this.loadStocks();
  }
};
