import React, { useState } from 'react';
import Card from '../ui/Card.jsx';
import Input from '../ui/Input.jsx';
import Button from '../ui/Button.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { DataService } from '../../services/DataService.js';
import { COLORS } from '../../utils/constants.js';

export default function StokView({ stocks = {}, onSaved, onCancel }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [formIsi, setFormIsi] = useState({ qty: '', note: '' });
  const [formKosong, setFormKosong] = useState({ qty: '', note: '' });

  const handleAddIsi = async () => {
    const qty = Number(formIsi.qty || 0);
    if (!(qty > 0)) return toast?.show?.({ type: 'error', message: 'Jumlah harus > 0' });
    setLoading(true);
    try {
      const snap = await DataService.addIsi({ qty, note: formIsi.note || '' });
      onSaved?.(snap);
      setFormIsi({ qty: '', note: '' });
      toast?.show?.({ type: 'success', message: 'Stok ISI bertambah (diambil dari KOSONG)' });
    } catch (e) {
      toast?.show?.({ type: 'error', message: e.message || 'Gagal tambah stok ISI' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddKosong = async () => {
    const qty = Number(formKosong.qty || 0);
    if (!(qty > 0)) return toast?.show?.({ type: 'error', message: 'Jumlah harus > 0' });
    setLoading(true);
    try {
      const snap = await DataService.addKosong({ qty, note: formKosong.note || '' });
      onSaved?.(snap);
      setFormKosong({ qty: '', note: '' });
      toast?.show?.({ type: 'success', message: 'Stok KOSONG bertambah' });
    } catch (e) {
      toast?.show?.({ type: 'error', message: e.message || 'Gagal tambah stok KOSONG' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='grid' style={{ gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Button onClick={onCancel}>← Kembali</Button>
        <h1 style={{ margin: 0 }}>Kelola Stok</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <span style={{ padding: '6px 10px', background: '#f1f5f9', borderRadius: 999, fontSize: 12 }}>
            ISI: <b>{Number(stocks.ISI || 0)}</b>
          </span>
          <span style={{ padding: '6px 10px', background: '#f1f5f9', borderRadius: 999, fontSize: 12 }}>
            KOSONG: <b>{Number(stocks.KOSONG || 0)}</b>
          </span>
        </div>
      </div>

      <Card title="Tambah Stok ISI (butuh KOSONG)">
        <div className='grid' style={{ gap: 8 }}>
          <label>Jumlah</label>
          <Input type='number' min={1} value={formIsi.qty}
            onChange={e => setFormIsi({ ...formIsi, qty: e.target.value })}
            disabled={loading} />
          <label>Catatan</label>
          <Input placeholder='contoh: isi ulang'
            value={formIsi.note}
            onChange={e => setFormIsi({ ...formIsi, note: e.target.value })}
            disabled={loading} />
          <div style={{ fontSize: 12, color: COLORS.secondary }}>
            Menambah ISI akan <b>mengurangi</b> stok KOSONG jumlah yang sama.
          </div>
          <div>
            <Button onClick={handleAddIsi} disabled={loading}>Tambah ISI</Button>
          </div>
        </div>
      </Card>

      <Card title="Tambah Stok KOSONG">
        <div className='grid' style={{ gap: 8 }}>
          <label>Jumlah</label>
          <Input type='number' min={1} value={formKosong.qty}
            onChange={e => setFormKosong({ ...formKosong, qty: e.target.value })}
            disabled={loading} />
          <label>Catatan</label>
          <Input placeholder='contoh: beli tabung kosong'
            value={formKosong.note}
            onChange={e => setFormKosong({ ...formKosong, note: e.target.value })}
            disabled={loading} />
          <div>
            <Button onClick={handleAddKosong} disabled={loading}>Tambah KOSONG</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
