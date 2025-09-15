import React, { useEffect, useState } from "react";
import Card from "../ui/Card.jsx";
import Input from "../ui/Input.jsx";
import Button from "../ui/Button.jsx";
import { DataService } from "../../services/DataService.js";
import { useToast } from "../../context/ToastContext.jsx";
import { COLORS, MIN_DATE } from "../../utils/constants.js";
import { todayStr, maxAllowedDate } from "../../utils/helpers.js";

export default function StokView({ stocks = {}, onSaved, onCancel }) {
  const toast = useToast();
  const [snap, setSnap] = useState({ ISI: Number(stocks.ISI || 0), KOSONG: Number(stocks.KOSONG || 0) });

  // sinkron dengan props
  useEffect(() => {
    setSnap({ ISI: Number(stocks.ISI || 0), KOSONG: Number(stocks.KOSONG || 0) });
  }, [stocks]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <Button onClick={onCancel}>← Kembali</Button>
        <h1 style={{ margin: 0 }}>Kelola Stok</h1>

        {/* Tampilkan snapshot stok langsung */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <span
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              fontSize: 12,
              background: "#eef2ff",
              border: "1px solid #c7d2fe",
            }}
          >
            ISI: <b>{snap.ISI}</b>
          </span>
          <span
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              fontSize: 12,
              background: "#fee2e2",
              border: "1px solid #fecaca",
            }}
          >
            KOSONG: <b>{snap.KOSONG}</b>
          </span>
        </div>
      </div>

      <section className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}>
        <TambahKosong onSaved={(s) => { setSnap(s); onSaved?.(s); }} />
        <RestokIsi onSaved={(s) => { setSnap(s); onSaved?.(s); }} />
      </section>
    </div>
  );
}

/* ----------- Tambah Stok KOSONG ----------- */
function TambahKosong({ onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({ qty: "", date: todayStr(), note: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const qtyNum = Number(form.qty) || 0;
    if (qtyNum <= 0) {
      toast?.show?.({ type: "error", message: "❌ Jumlah harus > 0" });
      return;
    }
    try {
      setLoading(true);
      const snap = await DataService.addKosong({
        qty: qtyNum,
        date: form.date,
        note: form.note,
      });
      toast?.show?.({ type: "success", message: `✅ Stok KOSONG +${qtyNum}` });
      setForm({ qty: "", date: todayStr(), note: "" });
      onSaved?.(snap);
    } catch (e2) {
      toast?.show?.({ type: "error", message: `❌ ${e2.message || "Gagal tambah KOSONG"}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Tambah Stok Kosong">
      <form onSubmit={submit} className="grid" style={{ opacity: loading ? 0.7 : 1 }}>
        <div>
          <label>Jumlah</label>
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            value={form.qty}
            onChange={(e) => setForm({ ...form, qty: e.target.value })}
            disabled={loading}
            placeholder="contoh: 10"
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
          <label>Catatan (opsional)</label>
          <Input
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            disabled={loading}
            placeholder="mis: titip pelanggan"
          />
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button
            className="secondary"
            type="button"
            onClick={() => setForm({ qty: "", date: todayStr(), note: "" })}
            disabled={loading}
          >
            Reset
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Menyimpan…" : "Simpan"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

/* ----------- Restok ISI (Tukar KOSONG) ----------- */
function RestokIsi({ onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({ qty: "", date: todayStr(), note: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const qtyNum = Number(form.qty) || 0;
    if (qtyNum <= 0) {
      toast?.show?.({ type: "error", message: "❌ Jumlah harus > 0" });
      return;
    }
    try {
      setLoading(true);
      const snap = await DataService.addIsi({
        qty: qtyNum,
        date: form.date,
        note: form.note || "restok agen (tukar kosong)",
      });
      toast?.show?.({ type: "success", message: `✅ Stok ISI +${qtyNum} (tukar kosong)` });
      setForm({ qty: "", date: todayStr(), note: "" });
      onSaved?.(snap);
    } catch (e2) {
      toast?.show?.({ type: "error", message: `❌ ${e2.message || "Gagal restok ISI"}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Restok Isi (Tukar Kosong)">
      <form onSubmit={submit} className="grid" style={{ opacity: loading ? 0.7 : 1 }}>
        <div>
          <label>Jumlah</label>
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            value={form.qty}
            onChange={(e) => setForm({ ...form, qty: e.target.value })}
            disabled={loading}
            placeholder="contoh: 10"
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
          <label>Catatan (opsional)</label>
          <Input
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            disabled={loading}
            placeholder="mis: tukar kosong di agen"
          />
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button
            className="secondary"
            type="button"
            onClick={() => setForm({ qty: "", date: todayStr(), note: "" })}
            disabled={loading}
          >
            Reset
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Menyimpan…" : "Simpan"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
