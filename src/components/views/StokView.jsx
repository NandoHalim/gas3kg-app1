import React, { useState } from "react";
import Card from "../ui/Card.jsx";
import Input from "../ui/Input.jsx";
import Button from "../ui/Button.jsx";
import { DataService } from "../../services/DataService.js";
import { COLORS } from "../../utils/constants.js";

export default function StokView({ stocks = {}, onSaved, onCancel }) {
  const [form, setForm] = useState({ qty: "", note: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submitIsi = async () => {
    setLoading(true);
    setErr("");
    try {
      const snap = await DataService.addIsi({
        qty: Number(form.qty),
        note: form.note,
      });
      onSaved?.(snap);
      setForm({ qty: "", note: "" });
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const submitKosong = async () => {
    setLoading(true);
    setErr("");
    try {
      const snap = await DataService.addKosong({
        qty: Number(form.qty),
        note: form.note,
      });
      onSaved?.(snap);
      setForm({ qty: "", note: "" });
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <Button onClick={onCancel}>← Kembali</Button>
        <h1 style={{ margin: 0 }}>Update Stok</h1>
      </div>

      <Card title="Form Stok">
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

        <div className="grid">
          <div>
            <label>Jumlah (Qty)</label>
            <Input
              type="number"
              value={form.qty}
              onChange={(e) => setForm({ ...form, qty: e.target.value })}
              disabled={loading}
            />
          </div>

          <div>
            <label>Keterangan</label>
            <Input
              placeholder="Catatan (opsional)"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              disabled={loading}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <Button onClick={submitIsi} disabled={loading}>
            Tambah ISI
          </Button>
          <Button onClick={submitKosong} disabled={loading}>
            Tambah KOSONG
          </Button>
          <Button onClick={onCancel}>Batal</Button>
        </div>
      </Card>
    </div>
  );
}
