// src/components/views/RiwayatSections.jsx
import React, { useEffect, useMemo, useState } from "react";
import Card from "../ui/Card.jsx";
import Input from "../ui/Input.jsx";
import Button from "../ui/Button.jsx";
import { COLORS } from "../../utils/constants.js";
import { fmtIDR } from "../../utils/helpers.js";
import { DataService } from "../../services/DataService.js";
import { useToast } from "../../context/ToastContext.jsx";

export default function RiwayatSections() {
  const toast = useToast();
  const [tab, setTab] = useState("transaksi"); // transaksi | hutang | stok

  // ====== State: Transaksi
  const [tFrom, setTFrom] = useState("");
  const [tTo, setTTo] = useState("");
  const [tMethod, setTMethod] = useState("ALL"); // ALL | TUNAI | HUTANG
  const [tStatus, setTStatus] = useState("ALL"); // ALL | LUNAS | BELUM
  const [tCashier, setTCashier] = useState("");
  const [tQ, setTQ] = useState("");
  const [rowsTx, setRowsTx] = useState([]);
  const [loadingTx, setLoadingTx] = useState(false);

  // ====== State: Hutang
  const [qDebt, setQDebt] = useState("");
  const [rowsDebt, setRowsDebt] = useState([]);
  const [loadingDebt, setLoadingDebt] = useState(false);
  const totalDebt = useMemo(
    () => (rowsDebt || []).reduce((a, b) => a + Number(b.total || 0), 0),
    [rowsDebt]
  );

  // ====== State: Stok
  const [sFrom, setSFrom] = useState("");
  const [sTo, setSTo] = useState("");
  const [sJenis, setSJenis] = useState("ALL"); // ALL | ISI | KOSONG
  const [rowsStock, setRowsStock] = useState([]);
  const [loadingStock, setLoadingStock] = useState(false);

  // ====== Loaders (dipanggil ketika tab aktif & filter berubah)
  const loadTx = async () => {
    try {
      setLoadingTx(true);
      const data = await DataService.getSalesHistory({
        from: tFrom || undefined,
        to: (tTo && (tTo.length === 10 ? tTo + " 23:59:59" : tTo)) || undefined,
        method: tMethod,
        status: tStatus,
        cashier: tCashier || undefined,
        q: tQ || undefined,
        limit: 800,
      });
      setRowsTx(data || []);
    } catch (e) {
      toast?.show?.({ type: "error", message: `${e.message}` });
    } finally {
      setLoadingTx(false);
    }
  };

  const loadDebt = async () => {
    try {
      setLoadingDebt(true);
      const data = await DataService.getDebts({
        query: qDebt || "",
        limit: 300,
      });
      // tampilkan invoice_display bila ada (DataService.getDebts mengembalikan id)
      const mapped = (data || []).map((r) => ({
        ...r,
        invoice_display: r.invoice_display || `PLP/${String(r.created_at || "").slice(0,4)}/${String(r.created_at || "").slice(5,7)}/${String(r.id).padStart(3,"0")}`,
      }));
      setRowsDebt(mapped);
    } catch (e) {
      toast?.show?.({ type: "error", message: `${e.message}` });
    } finally {
      setLoadingDebt(false);
    }
  };

  const loadStock = async () => {
    try {
      setLoadingStock(true);
      const data = await DataService.getStockHistory({
        from: sFrom || undefined,
        to: (sTo && (sTo.length === 10 ? sTo + " 23:59:59" : sTo)) || undefined,
        jenis: sJenis,
        limit: 400,
      });
      setRowsStock(data || []);
    } catch (e) {
      toast?.show?.({ type: "error", message: `${e.message}` });
    } finally {
      setLoadingStock(false);
    }
  };

  // Trigger load sesuai tab
  useEffect(() => {
    if (tab === "transaksi") loadTx();
    if (tab === "hutang") loadDebt();
    if (tab === "stok") loadStock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div>
      {/* Header Tabs */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Riwayat</h1>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <Button className={tab === "transaksi" ? "primary" : ""} onClick={() => setTab("transaksi")}>
            Riwayat Transaksi
          </Button>
          <Button className={tab === "hutang" ? "primary" : ""} onClick={() => setTab("hutang")}>
            Riwayat Hutang
          </Button>
          <Button className={tab === "stok" ? "primary" : ""} onClick={() => setTab("stok")}>
            Riwayat Stok
          </Button>
        </div>
      </div>

      {/* ========= TRANSAKSI ========= */}
      {tab === "transaksi" && (
        <>
          <Card title="Filter Transaksi">
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
              <div>
                <label>Dari Tanggal</label>
                <Input type="date" value={tFrom} onChange={(e) => setTFrom(e.target.value)} />
              </div>
              <div>
                <label>Sampai</label>
                <Input type="date" value={tTo} onChange={(e) => setTTo(e.target.value)} />
              </div>
              <div>
                <label>Metode Bayar</label>
                <select value={tMethod} onChange={(e) => setTMethod(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1" }}>
                  <option value="ALL">Semua</option>
                  <option value="TUNAI">TUNAI</option>
                  <option value="HUTANG">HUTANG</option>
                </select>
              </div>
              <div>
                <label>Status Bayar</label>
                <select value={tStatus} onChange={(e) => setTStatus(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1" }}>
                  <option value="ALL">Semua</option>
                  <option value="LUNAS">LUNAS</option>
                  <option value="BELUM">BELUM</option>
                </select>
              </div>
              <div>
                <label>Kasir</label>
                <Input placeholder="Nama kasir" value={tCashier} onChange={(e) => setTCashier(e.target.value)} />
              </div>
              <div>
                <label>Pencarian (Invoice/Nama)</label>
                <Input placeholder="INV / Nama" value={tQ} onChange={(e) => setTQ(e.target.value)} />
              </div>
              <div style={{ alignSelf: "end" }}>
                <Button onClick={loadTx} disabled={loadingTx}>{loadingTx ? "Memuat…" : "Terapkan"}</Button>
              </div>
            </div>
          </Card>

          <Card title={`Riwayat Transaksi ${loadingTx ? "(memuat…)" : ""}`}>
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
                  </tr>
                </thead>
                <tbody>
                  {!rowsTx.length && !loadingTx && (
                    <tr><td colSpan={8} style={{ color: "#64748b" }}>Tidak ada data</td></tr>
                  )}
                  {rowsTx.map((r) => (
                    <tr key={r.id} style={{ color: r.status === "DIBATALKAN" ? "#b91c1c" : "inherit", opacity: r.status === "DIBATALKAN" ? 0.8 : 1 }}>
                      <td>{String(r.created_at || "").slice(0, 10)}</td>
                      <td>{r.invoice_display || `PLP/${String(r.created_at || "").slice(0,4)}/${String(r.created_at || "").slice(5,7)}/${String(r.id).padStart(3,"0")}`}</td>
                      <td>{r.customer || "PUBLIC"}</td>
                      <td>{r.qty}</td>
                      <td>{fmtIDR((Number(r.qty) || 0) * (Number(r.price) || 0))}</td>
                      <td>{r.method}</td>
                      <td>{r.status || "-"}</td>
                      <td>{r.kasir || r.cashier || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* ========= HUTANG ========= */}
      {tab === "hutang" && (
        <>
          <Card title="Filter Hutang">
            <div className="grid" style={{ gridTemplateColumns: "1fr auto", gap: 12 }}>
              <Input
                placeholder="Nama pelanggan / invoice"
                value={qDebt}
                onChange={(e) => setQDebt(e.target.value)}
              />
              <Button onClick={loadDebt} disabled={loadingDebt}>
                {loadingDebt ? "Memuat…" : "Terapkan"}
              </Button>
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: COLORS.secondary }}>
              Menampilkan transaksi HUTANG dengan status <b>belum lunas</b>.
            </div>
          </Card>

          <Card title={`Riwayat Hutang — Total: ${fmtIDR(totalDebt)}`}>
            <div style={{ overflow: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>No. Invoice</th>
                    <th>Pelanggan</th>
                    <th>Qty</th>
                    <th>Total Hutang</th>
                  </tr>
                </thead>
                <tbody>
                  {!rowsDebt.length && !loadingDebt && (
                    <tr><td colSpan={5} style={{ color: "#64748b" }}>Tidak ada data hutang</td></tr>
                  )}
                  {rowsDebt.map((d) => (
                    <tr key={d.id}>
                      <td>{String(d.created_at || "").slice(0, 10)}</td>
                      <td>{d.invoice_display || `PLP/${String(d.created_at || "").slice(0,4)}/${String(d.created_at || "").slice(5,7)}/${String(d.id).padStart(3,"0")}`}</td>
                      <td style={{ fontWeight: 600 }}>{d.customer || "PUBLIC"}</td>
                      <td>{d.qty}</td>
                      <td>{fmtIDR(d.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* ========= STOK ========= */}
      {tab === "stok" && (
        <>
          <Card title="Filter Mutasi Stok">
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
              <div>
                <label>Dari Tanggal</label>
                <Input type="date" value={sFrom} onChange={(e) => setSFrom(e.target.value)} />
              </div>
              <div>
                <label>Sampai</label>
                <Input type="date" value={sTo} onChange={(e) => setSTo(e.target.value)} />
              </div>
              <div>
                <label>Jenis Stok</label>
                <select value={sJenis} onChange={(e) => setSJenis(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1" }}>
                  <option value="ALL">Semua</option>
                  <option value="ISI">ISI</option>
                  <option value="KOSONG">KOSONG</option>
                </select>
              </div>
              <div style={{ alignSelf: "end" }}>
                <Button onClick={loadStock} disabled={loadingStock}>{loadingStock ? "Memuat…" : "Terapkan"}</Button>
              </div>
            </div>
          </Card>

          <Card title={`Riwayat Mutasi Stok ${loadingStock ? "(memuat…)" : ""}`}>
            <div style={{ overflow: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Keterangan</th>
                    <th>Masuk</th>
                    <th>Keluar</th>
                    <th>Sisa Stok</th>
                  </tr>
                </thead>
                <tbody>
                  {!rowsStock.length && !loadingStock && (
                    <tr><td colSpan={5} style={{ color: "#64748b" }}>Tidak ada data</td></tr>
                  )}
                  {rowsStock.map((r) => (
                    <tr key={r.id}>
                      <td>{r.tanggal}</td>
                      <td>{r.keterangan}</td>
                      <td>{r.masuk}</td>
                      <td>{r.keluar}</td>
                      <td>{r.sisa ?? "-"}</td>
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
