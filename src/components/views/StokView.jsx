import React, { useState } from "react";
import Card from "../ui/Card.jsx";
import Input from "../ui/Input.jsx";
import Button from "../ui/Button.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { DataService } from "../../services/DataService.js";
import { MIN_DATE } from "../../utils/constants.js";
import { todayStr, maxAllowedDate } from "../../utils/helpers.js";

export default function StokView({ stocks = {}, onSaved, onCancel }) {
  const toast = useToast();
  const [tab, setTab] = useState("cek"); // cek | titip | proses | restok
  const [form, setForm] = useState({ qty: "", date: todayStr() });
  const [loading, setLoading] = useState(false);
  const isi = Number(stocks.ISI || 0);
  const kosong = Number(stocks.KOSONG || 0);

  const resetForm = () => setForm({ qty: "", date: todayStr() });

  const submit = async (type) => {
    try {
      setLoading(true);
      let newStock;
      if (type === "titip") {
        newStock = await DataService.addKosong({
          qty: Number(form.qty),
          date: form.date,
          note: "titip isi",
        });
      } else if (type === "proses") {
        if (Number(form.qty) > kosong) {
          throw new Error("Stok kosong tidak cukup");
        }
        newStock = await DataService.addIsi({
          qty: Number(form.qty),
          date: form.date,
          note: "konversi kosong ke isi",
        });
      } else if (type === "restok") {
        newStock = await DataService.addIsi({
          qty: Number(form.qty),
          date: form.date,
          note: "restok agen",
        });
      }
      onSaved?.(newStock);
      toast?.show({ type: "success", message: "✅ Stok berhasil diperbarui" });
      resetForm();
      setTab("cek");
    } catch (e) {
      toast?.show({ type: "error", message: `❌ ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <Button onClick={loading ? undefined : onCancel} disabled={loading}>
          ← Kembali
        </Button>
        <h1 style={{ margin: 0 }}>Kelola Stok</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["cek", "titip", "proses", "restok"].map((t) => (
          <Button
            key={t}
            className={tab === t ? "" : "secondary"}
            onClick={() => setTab(t)}
            disabled={loading}
          >
            {t === "cek" && "Cek Stok"}
            {t === "titip" && "Titip Isi"}
            {t === "proses" && "Proses Isi"}
            {t === "restok" && "Restok Agen"}
          </Button>
        ))}
      </div>

      {/* CEK STOK */}
      {tab === "cek" && (
        <Card title="Cek Stok">
          <p>Stok Isi: <b>{isi}</b> tabung</p>
          <p>Stok Kosong: <b>{kosong}</b> tabung</p>
        </Card>
      )}

      {/* TITIP ISI */}
      {tab === "titip" && (
        <Card title="Titip Isi (Tambah Kosong)">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit("titip");
            }}
          >
            <label>Jumlah Tabung</label>
            <Input
              type="number"
              value={form.qty}
              onChange={(e) => setForm({ ...form, qty: e.target.value })}
              min={1}
              required
              disabled={loading}
            />

            <label>Tanggal</label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              min={MIN_DATE}
              max={maxAllowedDate()}
              disabled={loading}
            />

            <Button type="submit" disabled={loading || !form.qty}>
              {loading ? "Menyimpan…" : "Simpan"}
            </Button>
          </form>
        </Card>
      )}

      {/* PROSES ISI */}
      {tab === "proses" && (
        <Card title="Proses Isi (Kosong ➝ Isi)">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit("proses");
            }}
          >
            <label>Jumlah Tabung</label>
            <Input
              type="number"
              value={form.qty}
              onChange={(e) => setForm({ ...form, qty: e.target.value })}
              min={1}
              max={kosong}
              required
              disabled={loading}
            />
            <div style={{ fontSize: 12, color: "#64748b" }}>
              Stok Kosong tersedia: {kosong}
            </div>

            <label>Tanggal</label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              min={MIN_DATE}
              max={maxAllowedDate()}
              disabled={loading}
            />

            <Button type="submit" disabled={loading || !form.qty}>
              {loading ? "Menyimpan…" : "Simpan"}
            </Button>
          </form>
        </Card>
      )}

      {/* RESTOK AGEN */}
      {tab === "restok" && (
        <Card title="Restok Agen (Tambah Isi)">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit("restok");
            }}
          >
            <label>Jumlah Tabung</label>
            <Input
              type="number"
              value={form.qty}
              onChange={(e) => setForm({ ...form, qty: e.target.value })}
              min={1}
              required
              disabled={loading}
            />

            <label>Tanggal</label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              min={MIN_DATE}
              max={maxAllowedDate()}
              disabled={loading}
            />

            <Button type="submit" disabled={loading || !form.qty}>
              {loading ? "Menyimpan…" : "Simpan"}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
