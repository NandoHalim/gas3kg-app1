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

  // tab: transaksi | hutang
  const [tab, setTab] = useState("transaksi");

  // data dan loading
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // ===== Filter: Riwayat Transaksi =====
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [method, setMethod] = useState(""); // "", "TUNAI", "HUTANG"
  const [status, setStatus] = useState(""); // "", "LUNAS", "BELUM"
  const [cashier, setCashier] = useState(""); // kasir (opsional)
  const [q, setQ] = useState(""); // cari Invoice/Nama

  // ===== Filter: Riwayat Hutang =====
  const [qDebt, setQDebt] = useState(""); // cari Invoice/Nama
  const [nameDebt, setNameDebt] = useState(""); // nama pelanggan

  // Modal pelunasan (hutang)
  const [paying, setPaying] = useState(null); // { id, customer, total }

  const totalHutang = useMemo(
    () =>
      (rows || []).reduce((a, r) => a + (Number(r.total) || 0), 0),
    [rows]
  );

  const loadTransaksi = async () => {
    setLoading(true);
    try {
      const data = await DataService.getAllSales({
        from,
        to,
        method,  // wajib di menu (boleh "Semua" = "")
        status,  // wajib di menu (boleh "Semua" = "")
        cashier,
        query: q, // invoice / nama
        limit: 800,
      });
      setRows(data || []);
    } catch (e) {
      toast?.show?.({ type: "error", message: `❌ ${e.message}` });
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const loadHutang = async () => {
    setLoading(true);
    try {
      const data = await DataService.getDebtHistory({
        query: qDebt,
        customer: nameDebt,
        limit: 800,
      });
      setRows(data || []);
    } catch (e) {
      toast?.show?.({ type: "error", message: `❌ ${e.message}` });
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "transaksi") loadTransaksi();
    else if (tab === "hutang") loadHutang();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Aksi pelunasan HUTANG (wajib lunas penuh)
  const onPaid = async (ev) => {
    ev?.preventDefault?.();
    if (!paying) return;
    try {
      setLoading(true);
      await DataService.payDebt({
        sale_id: paying.id,
        amount: paying.total, // lunas penuh
        note: `Pelunasan via Riwayat Hutang: ${paying.customer || ""}`,
      });
      toast?.show?.({ type: "success", message: "✅ Hutang ditandai LUNAS" });
      setPaying(null);
      await loadHutang();
    } catch (e) {
      toast?.show?.({ type: "error", message: `❌ ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  // helper WA link (jika tidak ada nomor, tetap bisa kirim nama)
  const buildWaLink = (row) => {
    const msg = encodeURIComponent(
      `Halo ${row.customer || ""}, mohon konfirmasi pembayaran untuk transaksi LPG.\nTotal: ${fmtIDR(row.total)}\nInvoice: ${row.invoice_no || row.id}`
    );
    const phone = (row.phone || "").replace(/\D+/g, "");
    return phone ? `https://wa.me/${phone}?text=${msg}` : `https://wa.me/?text=${msg}`;
  };

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
                <select value={method} onChange={(e) => setMethod(e.target.value)} style={{ width: "100%", padding: 10, border: "1px solid #cbd5e1", borderRadius: 8 }}>
                  <option value="">Semua</option>
                  <option value="TUNAI">Tunai</option>
                  <option value="HUTANG">Hutang</option>
                </select>
              </div>
              <div>
                <label>Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: "100%", padding: 10, border: "1px solid #cbd5e1", borderRadius: 8 }}>
                  <option value="">Semua</option>
                  <option value="LUNAS">Lunas</option>
                  <option value="BELUM">Belum</option>
                </select>
              </div>
              <div>
                <label>Kasir</label>
                <Input placeholder="Nama kasir" value={cashier} onChange={(e) => setCashier(e.target.value)} />
              </div>
              <div>
                <label>Pencarian (Invoice/Nama)</label>
                <Input placeholder="INV-001 / Ayu" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <div style={{ alignSelf: "end" }}>
                <Button onClick={loadTransaksi} disabled={loading}>
                  Terapkan
                </Button>
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
                  {!rows.length && !loading && (
                    <tr>
                      <td colSpan={9} style={{ color: "#64748b" }}>
                        Tidak ada data transaksi
                      </td>
                    </tr>
                  )}
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>{(r.created_at || "").slice(0, 10)}</td>
                      <td>{r.invoice_no || r.id}</td>
                      <td>{r.customer || "-"}</td>
                      <td>{r.qty}</td>
                      <td>{fmtIDR(r.total)}</td>
                      <td>{r.method}</td>
                      <td>{r.status}</td>
                      <td>{r.cashier || "-"}</td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <Button size="sm" className="secondary" onClick={() => alert(JSON.stringify(r, null, 2))}>📋 Detail</Button>{" "}
                        <Button size="sm" className="secondary" onClick={() => toast?.show?.({ type: "info", message: "📝 Catatan: (coming soon)" })}>📝 Catatan</Button>
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
          {/* Summary total hutang */}
          <Card>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 8,
              background: "#fff7ed",
              border: "1px solid #fed7aa",
              borderRadius: 8
            }}>
              <b>Total Hutang Belum Lunas</b>
              <span style={{ fontSize: 18, fontWeight: 800, color: "#c2410c" }}>{fmtIDR(totalHutang)}</span>
            </div>
          </Card>

          {/* Filter sederhana (nama + pencarian invoice/nama) */}
          <Card title="Filter Hutang">
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 8 }}>
              <div>
                <label>Nama Pelanggan</label>
                <Input placeholder="cth: Ayu" value={nameDebt} onChange={(e) => setNameDebt(e.target.value)} />
              </div>
              <div>
                <label>Pencarian (Invoice/Nama)</label>
                <Input placeholder="INV-001 / Ayu" value={qDebt} onChange={(e) => setQDebt(e.target.value)} />
              </div>
              <div style={{ alignSelf: "end" }}>
                <Button onClick={loadHutang} disabled={loading}>Terapkan</Button>
              </div>
            </div>
          </Card>

          <Card title={loading ? "Memuat…" : "Riwayat Hutang (Belum Lunas)"}>
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
                  {!rows.length && !loading && (
                    <tr>
                      <td colSpan={6} style={{ color: "#64748b" }}>
                        Tidak ada data hutang
                      </td>
                    </tr>
                  )}
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>{(r.created_at || "").slice(0, 10)}</td>
                      <td>{r.invoice_no || r.id}</td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{r.customer || "-"}</div>
                        {r.phone && (
                          <div style={{ fontSize: 12, color: COLORS.secondary }}>{r.phone}</div>
                        )}
                      </td>
                      <td>{r.qty}</td>
                      <td>{fmtIDR(r.total)}</td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <Button
                          className="primary"
                          onClick={() => setPaying({ id: r.id, customer: r.customer, total: r.total })}
                          disabled={loading}
                        >
                          💳 Tandai Lunas
                        </Button>{" "}
                        <a
                          href={buildWaLink(r)}
                          target="_blank"
                          rel="noreferrer"
                          style={{ textDecoration: "none" }}
                          title="Hubungi via WhatsApp"
                        >
                          <Button className="secondary">📞 Hubungi</Button>
                        </a>{" "}
                        <Button
                          className="secondary"
                          onClick={() => toast?.show?.({ type: "info", message: "📝 Catatan: (coming soon)" })}
                        >
                          📝 Catatan
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal pelunasan sederhana */}
            {paying && (
              <div style={{ marginTop: 12 }}>
                <Card title={`Pelunasan — ${paying.customer || "PUBLIC"}`}>
                  <form onSubmit={onPaid} className="grid" style={{ gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Total Tagihan</span>
                      <b>{fmtIDR(paying.total)}</b>
                    </div>
                    {/* Dikunci: wajib lunas penuh */}
                    <Input type="number" value={paying.total} readOnly />
                    <div style={{ fontSize: 12, color: COLORS.secondary }}>
                      *Pembayaran wajib <b>tepat sama</b> dengan sisa hutang.
                    </div>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <Button type="button" className="secondary" onClick={() => setPaying(null)} disabled={loading}>Batal</Button>
                      <Button type="submit" disabled={loading}>{loading ? "Menyimpan…" : "Simpan"}</Button>
                    </div>
                  </form>
                </Card>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
