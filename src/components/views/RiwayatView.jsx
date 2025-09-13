// src/components/views/RiwayatView.jsx
import React, { useEffect, useState } from 'react';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { DataService } from '../../services/DataService.js';
import { supabase } from '../../lib/supabase.js';
import { fmtIDR } from '../../utils/helpers.js';
import { COLORS } from '../../utils/constants.js';

export default function RiwayatView({ onCancel }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [sales, setSales] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const rows = await DataService.loadSales(500);
      setSales(rows);
    } catch (e) {
      toast?.show?.({ type: 'error', message: e.message || 'Gagal memuat riwayat penjualan' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let alive = true;
    (async () => { if (alive) await load(); })();

    // Realtime: dengarkan perubahan di tabel sales
    const ch = supabase
      .channel('sales-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, async () => {
        try { await load(); } catch {}
      })
      .subscribe();

    return () => {
      try { supabase.removeChannel(ch); } catch {}
      alive = false;
    };
  }, []);

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Button onClick={loading ? undefined : onCancel} disabled={loading}>← Kembali</Button>
        <h1 style={{ margin: 0 }}>Riwayat Penjualan</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Button className="secondary" onClick={load} disabled={loading}>
            {loading ? 'Memuat…' : 'Muat Ulang'}
          </Button>
        </div>
      </div>

      <Card title="Daftar Penjualan Terbaru">
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Pelanggan</th>
                <th>Qty</th>
                <th>Harga</th>
                <th>Total</th>
                <th>Metode</th>
                <th>Catatan</th>
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 && !loading && (
                <tr><td colSpan={7} style={{ color: COLORS.secondary, fontStyle: 'italic' }}>Belum ada data</td></tr>
              )}
              {sales.map(row => (
                <tr key={row.id}>
                  <td>{new Date(row.created_at).toLocaleString('id-ID')}</td>
                  <td style={{ fontWeight: 600 }}>{row.customer || 'PUBLIC'}</td>
                  <td>{row.qty}</td>
                  <td>{fmtIDR(row.price)}</td>
                  <td style={{ fontWeight: 700, color: COLORS.success }}>{fmtIDR(row.total)}</td>
                  <td>{row.method}</td>
                  <td>{row.note || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
