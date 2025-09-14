// src/components/views/StokView.jsx
import React, { useState } from "react";
import Card from "../ui/Card.jsx";
import Input from "../ui/Input.jsx";
import Button from "../ui/Button.jsx";
import { COLORS, MIN_DATE } from "../../utils/constants.js";
import { todayStr, maxAllowedDate } from "../../utils/helpers.js";
import { DataService } from "../../services/DataService.js";
import { useToast } from "../../context/ToastContext.jsx";

export default function StokView({ stocks = {}, onSaved, onCancel }) {
  const toast = useToast();

  const [formKosong, setFormKosong] = useState({
    qty: "",
    date: todayStr(),
    note: "",
  });
  const [formIsi, setFormIsi] = useState({
    qty: "",
    date: todayStr(),
    note: "",
  });

  const [loading, setLoading] = useState(false);
  const stokKosong = Number(stocks.KOSONG || 0);
  const stokIsi = Number(stocks.ISI || 0);

  const saveKosong = async (e) => {
    e?.preventDefault?.();
    if (loading) return;
    try {
      setLoading(true);
      const snap = await DataService.addKosong({
        qty: Number(formKosong.qty),
        date: formKosong.date,
        note: formKosong.note,
      });
      onSaved?.(snap);
      setFormKosong({ qty: "", date: todayStr(), note: "" });
      toast?.show({
        type: "success",
        message: `✅ Tambah ${formKosong.qty} tabung KOSONG`,
      });
    } catch (e2) {
      toast?.show({
        type: "error",
        message: `❌ ${e2.message || "Gagal tambah kosong"}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const saveIsi = async (e) => {
    e?.preventDefault?.();
    if (loading) return;
    try {
      setLoading(true);
      const snap = await DataService.addIsi({
        qty: Number(formIsi.qty),
        date: formIsi.date,
        note: formIsi.note,
      });
      onSaved?.(snap);
      setFormIsi({ qty: "", date: todayStr(), note: "" });
      toast?.show({
        type: "success",
        message: `✅ Restok ${formIsi.qty} tabung ISI (tukar kosong)`,
      });
    } catch (e2) {
      toast?.show({
        type: "error",
        message: `❌ ${e2.message || "Gagal restok isi"}`,
      });
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
        <Button onClick={loading ? undefined : onCancel} disabled={loading}>
          ← Kembali
        </Button>
        <h1 style={{ margin: 0 }}>Kelola Stok</h1>
        <div
          style={{
            marginLeft: "auto",
            padding: "6px 10px",
            borderRadius: 999,
            fontSize: 12,
            background: "#f1f5f9",
          }}
        >
          Isi: <b>{stokIsi}</b> • Kosong: <b>{stokKosong}</b>
        </div>
      </div>

      <section className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Tambah Kosong */}
        <Card title="Tambah Stok Kosong">
          <form onSubmit={saveKosong} className="grid" style={{ gap: 12 }}>
            <Input
              type="number"
              placeholder="Jumlah"
              value={formKosong.qty}
              onChange={(e) =>
                setFormKosong({ ...formKosong, qty: e.target.value })
              }
              min={1}
              required
              disabled={loading}
            />
            <Input
              type="date"
              value={formKosong.date}
              onChange={(e) =>
                setFormKosong({ ...formKosong, date: e.target.value })
              }
              min={MIN_DATE}
              max={maxAllowedDate()}
              disabled={loading}
            />
            <Input
              placeholder="Catatan (opsional)"
              value={formKosong.note}
              onChange={(e) =>
                setFormKosong({ ...formKosong, note: e.target.value })
              }
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !formKosong.qty}>
              {loading ? "Menyimpan…" : "Simpan"}
            </Button>
          </form>
        </Card>

        {/* Restok Isi */}
        <Card title="Restok Isi (Tukar Kosong)">
          <form onSubmit={saveIsi} className="grid" style={{ gap: 12 }}>
            <Input
              type="number"
              placeholder="Jumlah"
              value={formIsi.qty}
              onChange={(e) => setFormIsi({ ...formIsi, qty: e.target.value })}
              min={1}
              required
              disabled={loading}
            />
            <Input
              type="date"
              value={formIsi.date}
              onChange={(e) =>
                setFormIsi({ ...formIsi, date: e.target.value })
              }
              min={MIN_DATE}
              max={maxAllowedDate()}
              disabled={loading}
            />
            <Input
              placeholder="Catatan (opsional)"
              value={formIsi.note}
              onChange={(e) => setFormIsi({ ...formIsi, note: e.target.value })}
              disabled={loading}
            />
            <Button
              type="submit"
              disabled={loading || !formIsi.qty || formIsi.qty > stokKosong}
            >
              {loading ? "Menyimpan…" : "Simpan"}
            </Button>
            {formIsi.qty > stokKosong && (
              <div style={{ color: COLORS.danger, fontSize: 12 }}>
                ⚠️ Stok kosong tidak cukup untuk ditukar
              </div>
            )}
          </form>
        </Card>
      </section>
    </div>
  );
}
