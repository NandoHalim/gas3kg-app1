// src/components/views/RiwayatView.jsx
import React, { useEffect, useState } from "react";
import Card from "../ui/Card.jsx";
import Input from "../ui/Input.jsx";
import Button from "../ui/Button.jsx";
import { COLORS } from "../../utils/constants.js";
import { fmtIDR } from "../../utils/helpers.js";
import { DataService } from "../../services/DataService.js";
import { useToast } from "../../context/ToastContext.jsx";

export default function RiwayatView() {
  const toast = useToast();
  const [tab, setTab] = useState("transaksi"); // transaksi | stok | hutang
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [method, setMethod] = useState("");
  const [status, setStatus] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      let data = [];
      if (tab === "transaksi") {
        data = await DataService.getAllSales({ from, to, method, status });
      } else if (tab === "stok") {
        data = await DataService.getStockHistory();
      } else if (tab === "hutang") {
        data = await DataService.getDebtHistory();
      }
      setRows(data);
    } catch (e) {
      toast?.show?.({ type: "error", message: `❌ ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tab]);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Riwayat</h1>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <Button className={tab === "transaksi" ? "primary" : ""} onClick={() => setTab("transaksi")}>
            Riwayat Transaksi
          </Button>
          <Button className={tab === "stok" ? "primary" : ""} onClick={() => setTab("stok")}>
            Riwayat Stok
          </Button>
          <Button className={tab === "hutang" ? "primary" : ""} onClick={() => setTab("hutang")}>
            Riwayat Hutang
          </Button>
        </div>
      </div>

      {/* Filter hanya untuk Transaksi */}
      {tab === "transaksi" && (
        <Card title="Filter">
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 8 }}>
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
              <select value={method} onChange={(e) => setMethod(e.target.value)} style={{ width: "100%", padding: 8 }}>
                <option value="">Semua</option>
                <option value="TUNAI">Tunai</option>
                <option value="HUTANG">Hutang</option>
              </select>
            </div>
            <div>
              <label>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: "100%", padding: 8 }}>
                <option value="">Semua</option>
                <option value="LUNAS">Lunas</option>
                <option value="BELUM">Belum</option>
              </select>
            </div>
            <div style={{ alignSelf: "end" }}>
              <Button onClick={loadData} disabled={loading}>
                Terapkan
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Tabel */}
      <Card title={loading ? "Memuat…" : `Daftar ${tab}`}>
        <div style={{ overflow: "auto" }}>
          <table className="table">
            <thead>
              {tab === "transaksi" && (
                <tr>
                  <th>Tanggal</th>
                  <th>Pelanggan</th>
                  <th>Qty</th>
                  <th>Harga</th>
                  <th>Total</th>
                  <th>Metode</th>
                  <th>Status</th>
                </tr>
              )}
              {tab === "stok" && (
                <tr>
                  <th>Tanggal</th>
                  <th>Kode</th>
                  <th>Perubahan</th>
                  <th>Catatan</th>
                </tr>
              )}
              {tab === "hutang" && (
                <tr>
                  <th>Tanggal</th>
                  <th>Pelanggan</th>
                  <th>Qty</th>
                  <th>Harga</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              )}
            </thead>
            <tbody>
              {!rows.length && !loading && (
                <tr>
                  <td colSpan={7} style={{ color: "#64748b" }}>
                    Tidak ada data
                  </td>
                </tr>
              )}
              {tab === "transaksi" &&
                rows.map((r) => (
                  <tr key={r.id}>
                    <td>{(r.created_at || "").slice(0, 10)}</td>
                    <td>{r.customer}</td>
                    <td>{r.qty}</td>
                    <td>{fmtIDR(r.price)}</td>
                    <td>{fmtIDR(r.total)}</td>
                    <td>{r.method}</td>
                    <td>{r.status}</td>
                  </tr>
                ))}
              {tab === "stok" &&
                rows.map((r) => (
                  <tr key={r.id}>
                    <td>{(r.created_at || "").slice(0, 10)}</td>
                    <td>{r.code}</td>
                    <td>{r.qty_change}</td>
                    <td>{r.note}</td>
                  </tr>
                ))}
              {tab === "hutang" &&
                rows.map((r) => (
                  <tr key={r.id}>
                    <td>{(r.created_at || "").slice(0, 10)}</td>
                    <td>{r.customer}</td>
                    <td>{r.qty}</td>
                    <td>{fmtIDR(r.price)}</td>
                    <td>{fmtIDR(r.total)}</td>
                    <td>{r.status}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
