import React, { useMemo, useState } from "react";
import Card from "../ui/Card.jsx";
import Input from "../ui/Input.jsx";
import Button from "../ui/Button.jsx";

import {
  DEFAULT_PRICE,
  PRICE_OPTIONS,
  PAYMENT_METHODS,
  COLORS,
  MIN_DATE,
  MAX_YEAR,
  MIN_YEAR,
} from "../../utils/constants.js";
import {
  todayStr,
  maxAllowedDate,
  fmtIDR,
} from "../../utils/helpers.js";
import { isValidCustomerName } from "../../utils/validators.js";
import { DataService } from "../../services/DataService.js";

/**
 * PERBAIKAN UTAMA:
 * - Validasi eksplisit per field (nama, tanggal, qty, harga, stok).
 * - Qty selalu bilangan bulat >=1 (dibulatkan & di-clamp ke stok).
 * - Pesan error spesifik di bawah field yang bermasalah.
 * - Tombol Simpan nonaktif bila ada error.
 * - Tanggal dibatasi MIN_DATE..maxAllowedDate() + cek tahun MIN_YEAR..MAX_YEAR (defensif).
 * - Total selalu realtime & jelas.
 * - Konfirmasi kembali saat stok tidak cukup / qty > stok (tidak bisa lanjut).
 */

export default function PenjualanView({ stocks = {}, onSaved, onCancel }) {
  const stokISI = Number(stocks.ISI || 0);

  const [form, setForm] = useState({
    customer: "",
    date: todayStr(),
    qty: "",
    price: DEFAULT_PRICE,
    method: "TUNAI",
    note: "",
  });

  const [loading, setLoading] = useState(false);
  const [serverErr, setServerErr] = useState("");

  // Normalisasi qty ke integer aman
  const qtyNum = useMemo(() => {
    const n = Number(form.qty);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.trunc(n));
  }, [form.qty]);

  const total = useMemo(
    () => qtyNum * (Number(form.price) || 0),
    [qtyNum, form.price]
  );

  // ---------- VALIDASI FIELD ----------
  const errors = useMemo(() => {
    const e = {};

    // Customer
    const name = (form.customer || "").trim();
    if (name.length === 0) e.customer = "Nama pelanggan wajib diisi.";
    else if (!isValidCustomerName(name))
      e.customer = "Nama hanya boleh huruf & spasi.";

    // Tanggal
    const d = String(form.date || "");
    const yyyy = Number(d.slice(0, 4));
    if (!d) e.date = "Tanggal wajib diisi.";
    else {
      if (!Number.isFinite(yyyy))
        e.date = "Format tanggal tidak valid.";
      else if (yyyy < MIN_YEAR || yyyy > MAX_YEAR)
        e.date = `Tahun harus antara ${MIN_YEAR}-${MAX_YEAR}.`;
      // batas tanggal harian
      const min = MIN_DATE;
      const max = maxAllowedDate();
      if (d < min || d > max) {
        e.date = `Tanggal harus antara ${min} s/d ${max}.`;
      }
    }

    // Qty
    if (qtyNum < 1) e.qty = "Jumlah (qty) minimal 1.";
    else if (qtyNum > stokISI)
      e.qty = `Stok tidak cukup. Maksimal ${stokISI}.`;

    // Price
    const p = Number(form.price);
    if (!Number.isFinite(p) || p <= 0) e.price = "Harga tidak valid.";

    // Method
    if (!PAYMENT_METHODS.includes(form.method))
      e.method = "Metode pembayaran tidak dikenal.";

    return e;
  }, [form, qtyNum, stokISI]);

  const hasError = Object.keys(errors).length > 0;
  const disableSubmit = loading || hasError;

  // ---------- HANDLER ----------
  const inc = (d) =>
    setForm((prev) => {
      const cur = Number(prev.qty) || 0;
      let next = Math.max(0, cur + d);
      if (stokISI > 0) next = Math.min(next, stokISI);
      return { ...prev, qty: next === 0 ? "" : next };
    });

  const handleQtyInput = (e) => {
    const raw = e.target.value;
    if (raw === "") return setForm((p) => ({ ...p, qty: "" }));
    // hanya angka, dibulatkan ke integer, clamp ke stok
    const n = Math.max(0, Math.trunc(Number(raw) || 0));
    setForm((p) => ({ ...p, qty: n }));
  };

  const handlePriceChange = (e) => {
    const v = Number(e.target.value);
    setForm((p) => ({ ...p, price: Number.isFinite(v) ? v : p.price }));
  };

  const submit = async () => {
    setServerErr("");
    if (hasError) return; // guard ekstra

    // double guard stok
    if (qtyNum > stokISI) return setServerErr(`Stok isi tidak cukup (maks ${stokISI}).`);

    setLoading(true);
    try {
      const snap = await DataService.createSale({
        customer: (form.customer || "").trim(),
        qty: qtyNum,
        price: Number(form.price),
        method: form.method,
        date: form.date,
        note: form.note || "",
      });
      onSaved?.(snap);
      // reset form seperlunya
      setForm({
        customer: "",
        date: todayStr(),
        qty: "",
        price: DEFAULT_PRICE,
        method: "TUNAI",
        note: "",
      });
    } catch (e) {
      setServerErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <Button onClick={onCancel}>← Kembali</Button>
        <h1 style={{ margin: 0 }}>Penjualan Baru</h1>
        <div
          style={{
            marginLeft: "auto",
            padding: "6px 10px",
            borderRadius: 999,
            fontSize: 12,
            background: "#f1f5f9",
          }}
          title="Stok isi yang tersedia saat ini"
        >
          Stok Isi: <b>{stokISI}</b>
        </div>
      </div>

      <Card title="Form Penjualan">
        {/* Server-side error */}
        {serverErr && (
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
            ⚠️ {serverErr}
          </div>
        )}

        <div className="grid" style={{ gap: 12 }}>
          {/* Nama Pelanggan */}
          <div>
            <label>Nama Pelanggan</label>
            <Input
              placeholder="Contoh: Ayu"
              value={form.customer}
              onChange={(e) =>
                setForm((p) => ({ ...p, customer: e.target.value }))
              }
              disabled={loading}
            />
            {errors.customer && (
              <div style={{ color: COLORS.danger, fontSize: 12, marginTop: 4 }}>
                {errors.customer}
              </div>
            )}
          </div>

          {/* Tanggal */}
          <div>
            <label>Tanggal</label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              min={MIN_DATE}
              max={maxAllowedDate()}
              disabled={loading}
            />
            {errors.date && (
              <div style={{ color: COLORS.danger, fontSize: 12, marginTop: 4 }}>
                {errors.date}
              </div>
            )}
          </div>

          {/* Qty */}
          <div>
            <label>Jumlah (Qty)</label>
            <div style={{ display: "flex", gap: 8 }}>
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
                onChange={handleQtyInput}
                min={1}
                max={stokISI}
                disabled={loading}
                style={{ flex: 1 }}
              />
              <Button
                onClick={() => inc(+1)}
                disabled={loading || (stokISI > 0 && qtyNum >= stokISI)}
                title="Tambah"
              >
                +
              </Button>
            </div>
            <div style={{ fontSize: 12, color: COLORS.secondary, marginTop: 4 }}>
              Stok isi tersedia: <b>{stokISI}</b>
            </div>
            {errors.qty && (
              <div style={{ color: COLORS.danger, fontSize: 12, marginTop: 4 }}>
                {errors.qty}
              </div>
            )}
          </div>

          {/* Harga satuan */}
          <div>
            <label>Harga Satuan</label>
            <select
              value={form.price}
              onChange={handlePriceChange}
              style={{
                padding: "10px 12px",
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                width: "100%",
              }}
              disabled={loading}
            >
              {PRICE_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    maximumFractionDigits: 0,
                  }).format(p)}
                </option>
              ))}
            </select>
            {errors.price && (
              <div style={{ color: COLORS.danger, fontSize: 12, marginTop: 4 }}>
                {errors.price}
              </div>
            )}
          </div>

          {/* Metode Pembayaran */}
          <div>
            <label>Metode Pembayaran</label>
            <select
              value={form.method}
              onChange={(e) =>
                setForm((p) => ({ ...p, method: e.target.value }))
              }
              style={{
                padding: "10px 12px",
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                width: "100%",
              }}
              disabled={loading}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            {errors.method && (
              <div style={{ color: COLORS.danger, fontSize: 12, marginTop: 4 }}>
                {errors.method}
              </div>
            )}
          </div>

          {/* Catatan */}
          <div>
            <label>Catatan (opsional)</label>
            <Input
              placeholder="Contoh: antar ke rumah, bayar nanti"
              value={form.note}
              onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
              disabled={loading}
            />
          </div>
        </div>

        {/* Ringkasan Total */}
        <div
          style={{
            padding: 16,
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            marginTop: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontWeight: 500 }}>Total:</span>
            <span style={{ fontSize: 18, fontWeight: "bold", color: COLORS.success }}>
              {fmtIDR(total)}
            </span>
          </div>
        </div>

        {/* Aksi */}
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "flex-end",
            marginTop: 12,
          }}
        >
          <Button onClick={onCancel} disabled={loading}>
            Batal
          </Button>
          <Button onClick={submit} disabled={disableSubmit} title={hasError ? "Periksa isian formulir" : "Simpan penjualan"}>
            Simpan
          </Button>
        </div>
      </Card>
    </div>
  );
}
