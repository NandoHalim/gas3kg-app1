import React, { useState } from 'react';
import Card from '../ui/Card.jsx';
import Input from '../ui/Input.jsx';
import Button from '../ui/Button.jsx';
import { todayStr, maxAllowedDate } from '../../utils/helpers.js';
import { MIN_DATE, COLORS } from '../../utils/constants.js';
import { DataService } from '../../services/DataService.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function StokView({ stocks = {}, onSaved, onCancel }) {
  const toast = useToast();
  const [loadingIsi, setLoadingIsi] = useState(false);
  const [loadingKosong, setLoadingKosong] = useState(false);

  const [isi, setIsi] = useState({ qty: '', date: todayStr(), note: '' });
  const [kos, setKos] = useState({ qty: '', date: todayStr(), note: '' });

  const stokKosong = Number(stocks.KOSONG || 0);

  const submitIsi = async (e) => {
    e?.preventDefault?.();
    if (loadingIsi || loadingKosong) return;
    setLoadingIsi(true);
    try {
      const snap = await DataService.addIsi({
        qty: Number(isi.qty),
        date: isi.date,
        note: isi.note
      });
      onSaved?.(snap);
      setIsi({ qty: '', date: todayStr(), note: '' });
      toast.show({ type: 'success', message: `✅ Berhasil menambah ${isi.qty} tabung ISI` });
    } catch (e2) {
      toast.show({ type: 'error', message: e2.message || '❌ Gagal tambah stok isi' });
    } finally {
      setLoadingIsi(false);
    }
  };

  const submitKosong = async (e) => {
    e?.preventDefault?.();
    if (loadingIsi || loadingKosong) return;
    setLoadingKosong(true);
    try {
      const snap = await DataService.addKosong({
        qty: Number(kos.qty),
        date: kos.date,
        note: kos.note
      });
      onSaved?.(snap);
      setKos({ qty: '', date: todayStr(), note: '' });
      toast.show({ type: 'success', message: `✅ Berhasil menambah ${kos.qty} tabung KOSONG` });
    } catch (e2) {
      toast.show({ type: 'error', message: e2.message || '❌ Gagal tambah stok kosong' });
    } finally {
      setLoadingKosong(false);
    }
  };

  const disabledIsiBase = !(Number(isi.qty) > 0);
  const disabledKosBase = !(Number(kos.qty) > 0);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Button onClick={loadingIsi || loadingKosong ? undefined : onCancel} disabled={loadingIsi || loadingKosong}>
          ← Kembali
        </Button>
        <h1 style={{ margin: 0 }}>Kelola Stok</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <div style={{ padding: '6px 10px', background: '#f1f5f9', borderRadius: 999, fontSize: 12 }}>
            ISI: <b>{Number(stocks.ISI || 0)}</b>
          </div>
          <div style={{ padding: '6px 10px', background: '#f1f5f9', borderRadius: 999, fontSize: 12 }}>
            KOSONG: <b>{Number(stocks.KOSONG || 0)}</b>
          </div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr', gap: 16 }}>
        {/* Tambah ISI */}
        <Card title="Tambah Stok ISI">
          <form
            onSubmit={submitIsi}
            className="grid"
            style={{ opacity: loadingIsi || loadingKosong ? 0.7 : 1, pointerEvents: loadingIsi || loadingKosong ? 'none' : 'auto' }}
          >
            <div>
              <label>Jumlah (Qty)</label>
              <Input
                type="number"
                min={1}
                value={isi.qty}
                onChange={(e) => setIsi({ ...isi, qty: e.target.value })}
              />
              <div style={{ fontSize: 12, color: COLORS.secondary, marginTop: 4 }}>
                Stok kosong tersedia: <b>{stokKosong}</b>
              </div>
            </div>
            <div>
              <label>Tanggal</label>
              <Input
                type="date"
                value={isi.date}
                min={MIN_DATE}
                max={maxAllowedDate()}
                onChange={(e) => setIsi({ ...isi, date: e.target.value })}
              />
            </div>
            <div>
              <label>Catatan</label>
              <Input value={isi.note} onChange={(e) => setIsi({ ...isi, note: e.target.value })} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <Button type="button" className="secondary" onClick={onCancel} disabled={loadingIsi || loadingKosong}>
                Batal
              </Button>
              <Button type="submit" disabled={loadingIsi || loadingKosong || disabledIsiBase}>
                {loadingIsi ? 'Menyimpan…' : 'Simpan ISI'}
              </Button>
            </div>
          </form>
        </Card>

        {/* Tambah KOSONG */}
        <Card title="Tambah Stok KOSONG">
          <form
            onSubmit={submitKosong}
            className="grid"
            style={{ opacity: loadingIsi || loadingKosong ? 0.7 : 1, pointerEvents: loadingIsi || loadingKosong ? 'none' : 'auto' }}
          >
            <div>
              <label>Jumlah (Qty)</label>
              <Input
                type="number"
                min={1}
                value={kos.qty}
                onChange={(e) => setKos({ ...kos, qty: e.target.value })}
              />
            </div>
            <div>
              <label>Tanggal</label>
              <Input
                type="date"
                value={kos.date}
                min={MIN_DATE}
                max={maxAllowedDate()}
                onChange={(e) => setKos({ ...kos, date: e.target.value })}
              />
            </div>
            <div>
              <label>Catatan</label>
              <Input value={kos.note} onChange={(e) => setKos({ ...kos, note: e.target.value })} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <Button type="button" className="secondary" onClick={onCancel} disabled={loadingIsi || loadingKosong}>
                Batal
              </Button>
              <Button type="submit" disabled={loadingIsi || loadingKosong || disabledKosBase}>
                {loadingKosong ? 'Menyimpan…' : 'Simpan KOSONG'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
