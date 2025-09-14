// src/components/views/PenjualanView.jsx
import React, { useState } from 'react';
import Card from '../ui/Card.jsx';
import Input from '../ui/Input.jsx';
import Button from '../ui/Button.jsx';
import {
  DEFAULT_PRICE,
  PRICE_OPTIONS,
  PAYMENT_METHODS,
  COLORS,
  MIN_DATE,
} from '../../utils/constants.js';
import { todayStr, maxAllowedDate, fmtIDR } from '../../utils/helpers.js';
import { isValidCustomerName } from '../../utils/validators.js';
import { DataService } from '../../services/DataService.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function PenjualanView({ stocks = {}, onSaved, onCancel }) {
  const toast = useToast();

  const [form, setForm] = useState({
    customer: '',
    date: todayStr(),
    qty: '',
    price: DEFAULT_PRICE,
    method: 'TUNAI',
  });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false); // 🔒 anti double submit

  const stokISI = Number(stocks.ISI || 0);
  const qtyNum = Number(form.qty) || 0;
  const total = qtyNum * (Number(form.price) || 0);

  const disabledBase =
    !Number.isFinite(qtyNum) ||
    qtyNum < 1 ||
    qtyNum > stokISI ||
    !isValidCustomerName(form.customer || '');

  const disabled = loading || disabledBase;

  const inc = (d) =>
    setForm((p) => {
      if (loading) return p;
      const cur = Number(p.qty) || 0;
      const next = Math.max(0, cur + d);
      return { ...p, qty: next === 0 ? '' : next };
    });

  const submit = async (e) => {
    e?.preventDefault?.();
    if (loading || disabledBase) return;
    setLoading(true);
    setErr('');
    try {
      const snap = await DataService.createSale({
        customer: form.customer.trim() || 'PUBLIC',
        qty: Number(form.qty),
        price: Number(form.price),
        method: form.method,
        date: form.date,
        note: '',
      });
      onSaved?.(snap);
      setForm({
        customer: '',
        date: todayStr(),
        qty: '',
        price: DEFAULT_PRICE,
        method: 'TUNAI',
      });

      // ✅ Toast sukses
      toast?.show?.({
        type: 'success',
        message: `✅ Penjualan tersimpan: ${qtyNum} tabung • Total ${fmtIDR(total)}`,
      });
    } catch (e2) {
      setErr(e2.message || 'Gagal menyimpan penjualan');
      // ❌ Toast gagal
      toast?.show?.({
        type: 'error',
        message: `❌ ${e2.message || 'Gagal menyimpan penjualan'}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Button onClick={loading ? undefined : onCancel} disabled={loading}>
          ← Kembali
        </Button>
        <h1 style={{ margin: 0 }}>Penjualan Baru</h1>
        <div
          style={{
            marginLeft: 'auto',
            padding: '6px 10px',
            borderRadius: 999,
            fontSize: 12,
            background: '#f1f5f9',
          }}
        >
          Stok Isi: <b>{stokISI}</b>
        </div>
      </div>

      <Card title="Form Penjualan">
        {err && (
          <div
            style={{
              color: COLORS.danger,
              padding: 12,
              background: `${COLORS.danger}15`,
              borderRadius: 8,
              marginBottom: 16,
              border: `1px solid ${COLORS.danger}30`,
            }}
          >
            ⚠️ {err}
          </div>
        )}

        <form
          onSubmit={submit}
          className="grid"
          style={{
            opacity: loading ? 0.7 : 1,
            pointerEvents: loading ? 'none' : 'auto',
          }}
        >
          <div>
            <label>Nama Pelanggan</label>
            <Input
              placeholder="Contoh: Ayu"
              value={form.customer}
              onChange={(e) => setForm({ ...form, customer: e.target.value })}
              disabled={loading}
            />
            {!isValidCustomerName(form.customer || '') &&
              form.customer.trim().length > 0 && (
                <div
                  style={{
                    color: COLORS.danger,
                    fontSize: 12,
                    marginTop: 4,
                  }}
                >
                  Nama hanya huruf & spasi
                </div>
              )}
          </div>

          <div>
            <label>Tanggal</label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              min={MIN_DATE}
              max={maxAllowedDate()}
              disabled={loading}
            />
          </div>

          <div>
            <label>Jumlah (Qty)</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                onClick={() => inc(-1)}
                disabled={loading || qtyNum <= 1}
                title="Kurangi"
              >
                −
              </Button>
              <Input
                type="number"
                value={form.qty}
                onChange={(e) =>
                  setForm({
                    ...form,
                    qty:
                      e.target.value === ''
                        ? ''
                        : Math.max(0, parseInt(e.target.value, 10) || 0),
                  })
                }
                min={1}
                max={stokISI}
                disabled={loading}
                style={{ flex: 1 }}
              />
              <Button
                onClick={() => inc(+1)}
                disabled={loading || qtyNum >= stokISI}
                title="Tambah"
              >
                +
              </Button>
            </div>
            <div style={{ fontSize: 12, color: COLORS.secondary, marginTop: 4 }}>
              Stok isi tersedia: <b>{stokISI}</b>
            </div>
          </div>

          <div>
            <label>Harga Satuan</label>
            <select
              value={form.price}
              onChange={(e) => setForm({ ...form, price: parseInt(e.target.value, 10) })}
              style={{
                padding: '10px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                width: '100%',
              }}
              disabled={loading}
            >
              {PRICE_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    maximumFractionDigits: 0,
                  }).format(p)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Metode Pembayaran</label>
            <select
              value={form.method}
              onChange={(e) => setForm({ ...form, method: e.target.value })}
              style={{
                padding: '10px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                width: '100%',
              }}
              disabled={loading}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              padding: 16,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontWeight: 500 }}>Total:</span>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: COLORS.success,
                }}
              >
                {fmtIDR(total)}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <Button
              type="button"
              onClick={loading ? undefined : onCancel}
              className="secondary"
              disabled={loading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={disabled}>
              {loading ? 'Menyimpan…' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
