// src/components/views/RiwayatStokSection.jsx
import React, { useEffect, useState } from 'react';
import Card from '../ui/Card.jsx';
import Input from '../ui/Input.jsx';
import Button from '../ui/Button.jsx';
import { COLORS, MIN_DATE } from '../../utils/constants.js';
import { maxAllowedDate } from '../../utils/helpers.js';
import { DataService } from '../../services/DataService.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function RiwayatStokSection() {
  const toast = useToast();

  // Filter
  const [from, setFrom]   = useState('');
  const [to, setTo]       = useState('');
  const [jenis, setJenis] = useState('ALL'); // ALL | ISI | KOSONG

  // Data
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const data = await DataService.getStockHistory({
        from: from || undefined,
        to:   to   || undefined,
        jenis,
        limit: 500,
      });
      setRows(data);
    } catch (e) {
      toast?.show?.({ type: 'error', message: `❌ ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  // muat awal
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  return (
    <>
      <Card title="Filter Riwayat Stok">
        <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:12}}>
          <div>
            <label>Dari Tanggal</label>
            <Input type="date" value={from} onChange={e=>setFrom(e.target.value)}
              min={MIN_DATE} max={maxAllowedDate()} />
          </div>
          <div>
            <label>Sampai</label>
            <Input type="date" value={to} onChange={e=>setTo(e.target.value)}
              min={MIN_DATE} max={maxAllowedDate()} />
          </div>
          <div>
            <label>Jenis Stok</label>
            <select value={jenis} onChange={e=>setJenis(e.target.value)}
              style={{padding:'10px 12px', border:'1px solid #cbd5e1', borderRadius:8, width:'100%'}}>
              <option value="ALL">Semua</option>
              <option value="ISI">Isi</option>
              <option value="KOSONG">Kosong</option>
            </select>
          </div>
          <div style={{display:'flex', alignItems:'flex-end'}}>
            <Button onClick={load} disabled={loading}>{loading ? 'Memuat…' : 'Terapkan'}</Button>
          </div>
        </div>
      </Card>

      <Card title={`Riwayat Stok ${loading ? '(memuat…)' : ''}`}>
        <div style={{overflow:'auto'}}>
          <table className="table">
            <thead>
              <tr>
                <th style={{whiteSpace:'nowrap'}}>Tanggal</th>
                <th>Keterangan</th>
                <th style={{textAlign:'right'}}>Masuk</th>
                <th style={{textAlign:'right'}}>Keluar</th>
                <th style={{textAlign:'right'}}>Sisa Stok</th>
              </tr>
            </thead>
            <tbody>
              {!rows.length && !loading && (
                <tr><td colSpan={5} style={{color:COLORS.secondary}}>Tidak ada data</td></tr>
              )}
              {rows.map(r=>(
                <tr key={r.id}>
                  <td style={{whiteSpace:'nowrap'}}>{r.tanggal}</td>
                  <td>{r.keterangan}</td>
                  <td style={{textAlign:'right'}}>{r.masuk || ''}</td>
                  <td style={{textAlign:'right'}}>{r.keluar || ''}</td>
                  <td style={{textAlign:'right'}}>{(r.sisa ?? '') === '' ? '-' : r.sisa}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{marginTop:8, fontSize:12, color:COLORS.secondary}}>
          *Kolom “Sisa Stok” akan terisi otomatis jika tabel <code>stock_logs</code> memiliki kolom <code>balance_after</code>.
          Jika belum ada, nilainya ditampilkan <b>-</b>.
        </div>
      </Card>
    </>
  );
}
