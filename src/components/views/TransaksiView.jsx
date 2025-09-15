// src/components/views/TransaksiView.jsx
import React, { useState, useEffect } from "react";
import Card from "../ui/Card.jsx";
import Input from "../ui/Input.jsx";
import Button from "../ui/Button.jsx";
import { DataService } from "../../services/DataService.js";
import { useToast } from "../../context/ToastContext.jsx";
import { COLORS, DEFAULT_PRICE, PRICE_OPTIONS, PAYMENT_METHODS, MIN_DATE } from "../../utils/constants.js";
import { fmtIDR, todayStr, maxAllowedDate } from "../../utils/helpers.js";

export default function TransaksiView({ stocks = {}, onSaved, onCancel }) {
  const toast = useToast();
  const [tab, setTab] = useState("jual"); // jual | hutang

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <Button onClick={onCancel}>← Kembali</Button>
        <h1 style={{ margin: 0 }}>Transaksi</h1>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <Button className={tab === "jual" ? "primary" : "secondary"} onClick={() => setTab("jual")}>
          Penjualan Baru
        </Button>
        <Button className={tab === "hutang" ? "primary" : "secondary"} onClick={() => setTab("hutang")}>
          Bayar Hutang
        </Button>
      </div>

      {tab === "jual" ? (
        <PenjualanBaru stocks={stocks} onSaved={onSaved} />
      ) : (
        <BayarHutang />
      )}
    </div>
  );
}

/* ---------------- PENJUALAN BARU ---------------- */
function PenjualanBaru({ stocks = {}, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({
    customer: "",
    date: todayStr(),
    qty: "",
    price: DEFAULT_PRICE,
    method: "TUNAI",
    note: "",
  });
  const [loading, setLoading] = useState(false);
  const isi = Number(stocks.ISI || 0);
  const qtyNum = Number(form.qty) || 0;
  const total = qtyNum * (Number(form.price) || 0);

  const disabled =
    loading || !form.customer.trim() || qtyNum < 1 || qtyNum > isi || !(Number(form.price) > 0);

  const submit = async (e) => {
    e.preventDefault();
    if (disabled) return;
    setLoading(true);
    try {
      const snap = await DataService.createSale({
        customer: form.customer.trim(),
        qty: qtyNum,
        price: form.price,
        method: form.method,
        date: form.date,
        note: form.note,
      });
      toast?.show?.({ type: "success", message: `✅ Penjualan tersimpan: ${qtyNum} tabung • ${fmtIDR(total)}` });
      setForm({ customer: "", date: todayStr(), qty: "", price: DEFAULT_PRICE, method: "TUNAI", note: "" });
      onSaved?.(snap);
    } catch (e2) {
      toast?.show?.({ type: "error", message: `❌ ${e2.message || "Gagal menyimpan penjualan"}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Penjualan Baru">
      <form onSubmit={submit} className="grid" style={{ opacity: loading ? 0.7 : 1 }}>
        <div>
          <label>Nama Pelanggan</label>
          <Input
            value={form.customer}
            onChange={(e) => setForm({ ...form, customer: e.target.value })}
            disabled={loading}
            placeholder="Contoh: Budi"
          />
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
          <label>Jumlah (Isi tersedia: {isi})</label>
          <Input
            type="number"
            value={form.qty}
            min={1}
            max={isi}
            onChange={(e) => setForm({ ...form, qty: e.target.value })}
            disabled={loading}
          />
        </div>
        <div>
          <label>Harga</label>
          <select
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            disabled={loading}
          >
            {PRICE_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {fmtIDR(p)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Metode Bayar</label>
          <select
            value={form.method}
            onChange={(e) => setForm({ ...form, method: e.target.value })}
            disabled={loading}
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Catatan</label>
          <Input
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            disabled={loading}
            placeholder="Opsional"
          />
        </div>
        <div style={{ fontWeight: "bold", color: COLORS.success, marginTop: 8 }}>
          Total: {fmtIDR(total)}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <Button type="submit" disabled={disabled}>
            {loading ? "Menyimpan…" : "Simpan"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

/* ---------------- BAYAR HUTANG ---------------- */
function BayarHutang() {
  const toast = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const rows = await DataService.getUnpaidSales();
      setList(rows);
    } catch (e) {
      toast?.show?.({ type: "error", message: `❌ ${e.message || "Gagal ambil data hutang"}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const bayar = async (s) => {
    if (!confirm(`Bayar hutang ${s.customer} sebesar ${fmtIDR(s.total)} ?`)) return;
    try {
      await DataService.payDebt({ sale_id: s.id, amount: s.total, note: "Lunas" });
      toast?.show?.({ type: "success", message: `✅ Hutang ${s.customer} sudah dibayar` });
      load();
    } catch (e) {
      toast?.show?.({ type: "error", message: `❌ ${e.message || "Gagal bayar hutang"}` });
    }
  };

  return (
    <Card title="Daftar Hutang">
      <div style={{ overflow: "auto" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Pelanggan</th>
              <th>Qty</th>
              <th>Total</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {list.map((s) => (
              <tr key={s.id}>
                <td>{String(s.created_at).slice(0, 10)}</td>
                <td>{s.customer}</td>
                <td>{s.qty}</td>
                <td>{fmtIDR(s.total)}</td>
                <td>
                  <Button onClick={() => bayar(s)}>Bayar</Button>
                </td>
              </tr>
            ))}
            {!list.length && (
              <tr>
                <td colSpan={5} style={{ color: "#64748b" }}>
                  Tidak ada hutang
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
