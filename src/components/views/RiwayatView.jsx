// src/components/views/RiwayatView.jsx
import React, { useEffect, useMemo, useState } from "react";
import Card from "../ui/Card.jsx";
import Input from "../ui/Input.jsx";
import Button from "../ui/Button.jsx";
import { COLORS } from "../../utils/constants.js";
import { fmtIDR } from "../../utils/helpers.js";
import { DataService } from "../../services/DataService.js";
import { useToast } from "../../context/ToastContext.jsx";

export default function RiwayatView() {
  const toast = useToast();
  const [tab, setTab] = useState("transaksi"); // transaksi | hutang
  const [loading, setLoading] = useState(false);

  // ===== Transaksi filters =====
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [method, setMethod] = useState("");   // "", "TUNAI", "HUTANG"
  const [status, setStatus] = useState("");   // "", "LUNAS", "BELUM"
  const [cashier, setCashier] = useState("");
  const [q, setQ] = useState("");             // invoice/name
  const [rowsTrx, setRowsTrx] = useState([]);

  // ===== Hutang filters =====
  const [qDebt, setQDebt] = useState("");
  const [rowsDebt, setRowsDebt] = useState([]);

  const totalDebt = useMemo(
    () => rowsDebt.reduce((a, b) => a + Number(b.total || 0), 0),
    [rowsDebt]
  );

  // Loaders
  const loadTransaksi = async () => {
    try {
      setLoading(true);
      const data = await DataService.getAllSales({
        from,
        to,
        method,
        status,
        cashier,
        q,
        limit: 1000,
      });
      setRowsTrx(data);
    } catch (e) {
      toast?.show?.({ type: "error", message: `❌ ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  const loadHutang = async () => {
    try {
      setLoading(true);
      const data = await DataService.getDebtHistory({ q: qDebt, limit: 1000 });
      setRowsDebt(data);
    } catch (e) {
      toast?.show?.({ type: "error", message: `❌ ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "transaksi") loadTransaksi();
    if (tab === "hutang") loadHutang();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Actions
  const handlePayDebt = async (row) => {
    try {
      setLoading(true);
      await DataService.payDebt({
        sale_id: row.id,
        amount: Number(row.total || 0),
        note: `pelunasan (${row.invoice_no || row.id})`,
      });
      toast?.show?.({ type: "success", message: "✅ Ditandai LUNAS" });
      await loadHutang();
    } catch (e) {
      toast?.show?.({ type: "error", message: `❌ ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (row) => {
    const current = row?.note || "";
    const extra = prompt("Tambah/ubah catatan:", current);
    if (extra === null) return;
    try {
      setLoading(true);
      await DataService.appendSaleNote({ sale_id: row.id, extra_note: extra });
      toast?.show?.({ type: "success", message: "📝 Catatan disimpan" });
      if (tab === "transaksi") await loadTransaksi();
      else await loadHutang();
    } catch (e) {
      toast?.show?.({ type: "error", message: `❌ ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  const buildWhatsappUrl = (row) => {
    const phone = (row.phone || "").replace(/[^\d]/g, "");
    const msg = encodeURIComponent(
      `Halo ${row.customer}, tagihan tabung 3kg:\n` +
      `Invoice: ${row.invoice_no || row.id}\n` +
      `Total: ${fmtIDR(row.total || 0)}\n\n` +
      `Mohon konfirmasi pelunasan. Terima kasih 🙏`
    );
    return phone ? `https://wa.me/${phone}?text=${msg}` : `https://wa.me/?text=${msg}`;
  };

  return (
    <div>
      {/* Header & Tabs */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Riwayat</h1>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <Button className={tab === "transaksi" ? "primary" : ""} onClick={() => setTab("transaksi")}>
            Riwayat Transaksi
          </Button>
          <Button className={tab === "hutang" ? "primary" : ""} onClick={() => setTab("hutang")}>
            Riwayat Hutang
          </Button>
        </div>
      </div>

      {/* ===================== RIWAYAT TRANSAKSI ===================== */}
      {tab === "transaksi" && (
        <>
          <Card title="Filter">
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 8 }}>
              <div>
                <label>Dari</label>
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div>
                <label>Sampai</label>
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
              <div>
                <label>Metode</label>
                <select value={method} onChange={(e) => setMethod(e.target.value)} style={{ width: "100%", padding: 10 }}>
                  <option value="">Semua</option>
                  <option value="TUNAI">Tunai</option>
                  <option value="HUTANG">Hutang</option>
                </select>
              </div>
              <div>
                <label>Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: "100%", padding: 10 }}>
                  <option value="">Semua</option>
                  <option value="LUNAS">Lunas</option>
                  <option value="BELUM">Belum Lunas</option>
                </select>
              </div>
              <div>
                <label>Kasir</label>
                <Input placeholder="Nama kasir" value={cashier} onChange={(e) => setCashier(e.target.value)} />
              </div>
              <div>
                <label>Pencarian</label>
                <Input placeholder="No. Invoice / Nama" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <div style={{ alignSelf: "end" }}>
                <Button onClick={loadTransaksi} disabled={loading}>Terapkan</Button>
              </div>
            </div>
          </Card>

          <Card title={loading ? "Memuat…" : "Riwayat Transaksi"}>
            <div style={{ overflow: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>No. Invoice</th>
                    <th>Pelanggan</th>
                    <th>Qty</th>
                    <th>Total</th>
                    <th>Metode</th>
                    <th>Status</th>
                    <th>Kasir</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {!rowsTrx.length && !loading && (
                    <tr>
                      <td colSpan={9} style={{ color: "#64748b" }}>Tidak ada data</td>
                    </tr>
                  )}
                  {rowsTrx.map((r) => (
                    <tr key={r.id}>
                      <td>{(r.created_at || "").slice(0, 10)}</td>
                      <td>{r.invoice_no || r.id}</td>
                      <td>{r.customer}</td>
                      <td>{r.qty}</td>
                      <td>{fmtIDR(r.total ?? (Number(r.qty)*Number(r.price)))}</td>
                      <td>{r.method}</td>
                      <td>{r.status}</td>
                      <td>{r.cashier || r.created_by || "-"}</td>
                      <td style={{ display: "flex", gap: 6 }}>
                        <Button size="sm" className="secondary" onClick={() => alert(JSON.stringify(r, null, 2))}>
                          📋 Detail
                        </Button>
                        <Button size="sm" onClick={() => handleAddNote(r)}>
                          📝 Catatan
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* ===================== RIWAYAT HUTANG ===================== */}
      {tab === "hutang" && (
        <>
          <Card title="Filter Hutang">
            <div className="grid" style={{ gridTemplateColumns: "1fr auto", gap: 8 }}>
              <Input
                placeholder="Nama pelanggan / No. Invoice"
                value={qDebt}
                onChange={(e) => setQDebt(e.target.value)}
              />
              <Button onClick={loadHutang} disabled={loading}>Cari</Button>
            </div>
            <div style={{ marginTop: 8, padding: "10px 12px", background: "#fff7ed", border: "1px solid #fdba74", borderRadius: 8 }}>
              <b>Total Hutang Belum Lunas: {fmtIDR(totalDebt)}</b>
            </div>
          </Card>

          <Card title={loading ? "Memuat…" : "Daftar Hutang (Belum Lunas)"}>
            <div style={{ overflow: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>No. Invoice</th>
                    <th style={{ minWidth: 180 }}>Pelanggan</th>
                    <th>Qty</th>
                    <th>Total Hutang</th>
                    <th style={{ minWidth: 260 }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {!rowsDebt.length && !loading && (
                    <tr>
                      <td colSpan={6} style={{ color: "#64748b" }}>Tidak ada data hutang</td>
                    </tr>
                  )}
                  {rowsDebt.map((r) => (
                    <tr key={r.id}>
                      <td>{(r.created_at || "").slice(0, 10)}</td>
                      <td>{r.invoice_no || r.id}</td>
                      <td><b>{r.customer}</b></td>
                      <td>{r.qty}</td>
                      <td>{fmtIDR(r.total)}</td>
                      <td style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Button onClick={() => handlePayDebt(r)}>{loading ? "Memproses…" : "💳 Tandai Lunas"}</Button>
                        <a href={buildWhatsappUrl(r)} target="_blank" rel="noreferrer">
                          <Button className="secondary" type="button">📞 Hubungi</Button>
                        </a>
                        <Button className="secondary" type="button" onClick={() => handleAddNote(r)}>📝 Catatan</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
