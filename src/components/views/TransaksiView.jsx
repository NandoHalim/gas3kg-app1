// src/components/views/TransaksiView.jsx
import React, { useEffect, useState } from "react";
import Card from "../ui/Card.jsx";
import Input from "../ui/Input.jsx";
import Button from "../ui/Button.jsx";
import { COLORS } from "../../utils/constants.js";
import { fmtIDR } from "../../utils/helpers.js";
import PenjualanView from "./PenjualanView.jsx";
import { DataService } from "../../services/DataService.js";
import { useToast } from "../../context/ToastContext.jsx";

export default function TransaksiView({ stocks = {}, onSaved }) {
  const toast = useToast();
  const [tab, setTab] = useState("penjualan"); // 'penjualan' | 'hutang'
  const [q, setQ] = useState("");
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(null); // { id, customer, total, created_at }

  // Load daftar hutang ketika tab hutang aktif / keyword berubah
  useEffect(() => {
    let on = true;
    (async () => {
      if (tab !== "hutang") return;
      try {
        setLoading(true);
        const rows = await DataService.getDebts({ query: q, limit: 200 });
        if (on) setDebts(rows);
      } catch (e) {
        toast?.show?.({ type: "error", message: `❌ ${e.message}` });
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => { on = false; };
  }, [tab, q]); // eslint-disable-line react-hooks/exhaustive-deps

  // Submit pelunasan (nominal wajib tepat — DIKUNCI)
  const onPaid = async (ev) => {
    ev?.preventDefault?.();
    if (!paying) return;

    // amount dikunci == paying.total (readOnly), ambil langsung dari state
    const amount = Number(paying.total || 0);
    if (!(amount > 0)) {
      toast?.show?.({ type: "error", message: "Nominal harus > 0" });
      return;
    }

    try {
      setLoading(true);
      await DataService.payDebt({
        sale_id: paying.id,     // integer ID
        amount,                 // wajib pas
        note: `pelunasan: ${paying.customer || ""}`,
      });
      toast?.show?.({ type: "success", message: "✅ Pembayaran hutang dicatat (LUNAS)" });
      setPaying(null);

      // refresh daftar hutang
      const rows = await DataService.getDebts({ query: q, limit: 200 });
      setDebts(rows);

      // beri tahu parent bila perlu refresh stok/dll
      onSaved?.();
    } catch (e) {
      toast?.show?.({ type: "error", message: `❌ ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Transaksi</h1>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <Button className={tab === "penjualan" ? "primary" : ""} onClick={() => setTab("penjualan")}>
            Penjualan Baru
          </Button>
          <Button className={tab === "hutang" ? "primary" : ""} onClick={() => setTab("hutang")}>
            Bayar Hutang
          </Button>
        </div>
      </div>

      {/* PENJUALAN BARU (validasi nama & qty sudah di PenjualanView dan TIDAK diubah) */}
      {tab === "penjualan" && (
        <PenjualanView stocks={stocks} onSaved={onSaved} onCancel={() => {}} />
      )}

      {/* BAYAR HUTANG */}
      {tab === "hutang" && (
        <>
          <Card title="Cari Hutang">
            <div className="grid" style={{ gridTemplateColumns: "1fr auto" }}>
              <Input
                placeholder="Nama pelanggan / catatan"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                disabled={loading}
              />
              <Button className="secondary" onClick={() => setQ("")} disabled={loading}>
                Reset
              </Button>
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: COLORS.secondary }}>
              Menampilkan transaksi dengan metode <b>HUTANG</b>. Pembayaran wajib <b>lunas</b>.
            </div>
          </Card>

          <Card title={`Daftar Hutang ${loading ? "(memuat…)" : ""}`}>
            <div style={{ overflow: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Pelanggan</th>
                    <th>Qty</th>
                    <th>Harga</th>
                    <th>Total</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {!debts.length && !loading && (
                    <tr>
                      <td colSpan={6} style={{ color: "#64748b" }}>
                        Tidak ada data hutang
                      </td>
                    </tr>
                  )}
                  {debts.map((d) => (
                    <tr key={d.id}>
                      <td>{(d.created_at || "").slice(0, 10)}</td>
                      <td>{d.customer || "PUBLIC"}</td>
                      <td>{d.qty}</td>
                      <td>{fmtIDR(d.price)}</td>
                      <td>{fmtIDR(d.total)}</td>
                      <td>
                        <Button
                          size="sm"
                          onClick={() =>
                            setPaying({
                              id: d.id,
                              customer: d.customer,
                              total: d.total,        // dikunci untuk pelunasan penuh
                              created_at: d.created_at,
                            })
                          }
                          disabled={loading || (Number(d.total) || 0) <= 0}
                        >
                          Bayar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Modal sederhana BAYAR */}
          {paying && (
            <Card title={`Bayar Hutang — ${paying.customer || "PUBLIC"}`}>
              <form onSubmit={onPaid} style={{ display: "grid", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Total Tagihan</span>
                  <b>{fmtIDR(paying.total)}</b>
                </div>

                <label>Nominal Pembayaran</label>
                {/* Nominal DIKUNCI agar selalu sama dengan total (tidak bisa edit) */}
                <Input
                  name="amount"
                  type="number"
                  min={1}
                  value={Number(paying.total || 0)}
                  readOnly
                  inputMode="numeric"
                  disabled={loading}
                />
                <div style={{ fontSize: 12, color: COLORS.secondary }}>
                  *Pembayaran wajib <b>tepat sama</b> dengan sisa hutang.
                </div>

                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <Button
                    className="secondary"
                    type="button"
                    onClick={() => setPaying(null)}
                    disabled={loading}
                  >
                    Batal
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Menyimpan…" : "Simpan"}
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
