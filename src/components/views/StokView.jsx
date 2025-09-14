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

  const [jenis, setJenis] = useState("KOSONG"); // "KOSONG" | "ISI"
  const [qty, setQty] = useState("");
  const [date, setDate] = useState(todayStr());
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const stokIsi = Number(stocks.ISI || 0);
  const stokKosong = Number(stocks.KOSONG || 0);

  const reset = () => {
    setQty("");
    setDate(todayStr());
    setNote("");
  };

  const submit = async (e) => {
    e?.preventDefault?.();
    if (loading) return;

    try {
      setLoading(true);

      let snap;
      const q = Number(qty);

      if (!(q > 0)) throw new Error("Jumlah harus > 0");

      if (jenis === "KOSONG") {
        // Tambah stok kosong (titip/beli tabung)
        snap = await DataService.addKosong({
          qty: q,
          date,
          note: note || "beli / titip tabung kosong",
        });
      } else {
        // ISI: restok dengan menukar KOSONG (wajib cukup)
        if (q > stokKosong)
          throw new Error("Stok KOSONG tidak cukup untuk ditukar");
        snap = await DataService.addIsi({
          qty: q,
          date,
          note: note || "restok isi (tukar tabung kosong)",
        });
      }

      onSaved?.(snap);
      toast?.show?.({
        type: "success",
        message:
          jenis === "KOSONG"
            ? `✅ Tambah ${q} tabung KOSONG`
            : `✅ Restok ${q} tabung ISI (tukar kosong)`,
      });
      reset();
    } catch (err) {
      toast?.show?.({ type: "error", message: `❌ ${err.message}` });
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

      <Card title="Update Stok">
        <form onSubmit={submit} className="grid" style={{ gap: 12 }}>
          <label>Jenis Stok</label>
          <select
            value={jenis}
            onChange={(e) => setJenis(e.target.value)}
            disabled={loading}
            style={{ padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8 }}
          >
            <option value="KOSONG">Tambah KOSONG</option>
            <option value="ISI">Restok ISI (Tukar dari KOSONG)</option>
          </select>

          <label>Jumlah</label>
          <Input
            type="number"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            min={1}
            required
            disabled={loading}
          />
          {jenis === "ISI" && (
            <div style={{ fontSize: 12, color: "#64748b" }}>
              Stok KOSONG tersedia: <b>{stokKosong}</b>
              {qty > stokKosong && (
                <div style={{ color: COLORS.danger }}>
                  ⚠️ Jumlah melebihi stok KOSONG
                </div>
              )}
            </div>
          )}

          <label>Tanggal</label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={MIN_DATE}
            max={maxAllowedDate()}
            disabled={loading}
          />

          <label>Catatan (opsional)</label>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Contoh: titip pelanggan / restok agen"
            disabled={loading}
          />

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button
              type="button"
              className="secondary"
              onClick={reset}
              disabled={loading}
            >
              Reset
            </Button>
            <Button
              type="submit"
              disabled={
                loading ||
                !qty ||
                (jenis === "ISI" && Number(qty) > stokKosong)
              }
            >
              {loading ? "Menyimpan…" : "Simpan"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
