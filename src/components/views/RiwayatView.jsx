import React, { useEffect, useMemo, useState } from "react";
import Card from "../ui/Card.jsx";
import Input from "../ui/Input.jsx";
import Button from "../ui/Button.jsx";
import { COLORS, MIN_DATE } from "../../utils/constants.js";
import { fmtIDR, maxAllowedDate } from "../../utils/helpers.js";
import { DataService } from "../../services/DataService.js";
import { useToast } from "../../context/ToastContext.jsx";

function Tabs({ active, onChange }) {
  const items = [
    { k: "trx", label: "Riwayat Transaksi" },
    { k: "stok", label: "Riwayat Stok" },
    { k: "hutang", label: "Riwayat Hutang" },
  ];
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
      {items.map((t) => (
        <Button
          key={t.k}
          className={active === t.k ? "primary" : ""}
          onClick={() => onChange(t.k)}
        >
          {t.label}
        </Button>
      ))}
    </div>
  );
}

export default function RiwayatView() {
  const toast = useToast();
  const [tab, setTab] = useState("trx"); // 'trx' | 'stok' | 'hutang'

  // ---------------------------
  // Riwayat Transaksi
  // ---------------------------
  const [fFrom, setFFrom] = useState("");
  const [fTo, setFTo] = useState("");
  const [fMethod, setFMethod] = useState("ALL"); // ALL | TUNAI | HUTANG
  const [fStatus, setFStatus] = useState("ALL"); // ALL | LUNAS | BELUM
  const [q, setQ] = useState("");
  const [trxRows, setTrxRows] = useState([]);
  const [trxLoading, setTrxLoading] = useState(false);

  const loadTrx = async () => {
    try {
      setTrxLoading(true);
      const rows = await DataService.getSalesHistory({
        from: fFrom || undefined,
        to: fTo || undefined,
        method: fMethod,
        status: fStatus,
        q: q || undefined,
        limit: 800,
      });
      setTrxRows(rows);
    } catch (e) {
      toast?.show?.({ type: "error", message: `❌ ${e.message}` });
    } finally {
      setTrxLoading(false);
    }
  };

  // ---------------------------
  // Riwayat Stok
  // ---------------------------
  const [sFrom, setSFrom] = useState("");
  const [sTo, setSTo] = useState("");
  const [sJenis, setSJenis] = useState("ALL"); // ALL | ISI | KOSONG
  const [stokRows, setStokRows] = useState([]);
  const [stokLoading, setStokLoading] = useState(false);

  const loadStok = async () => {
    try {
      setStokLoading(true);
      const rows = await DataService.getStockHistory({
        from: sFrom || undefined,
        to: sTo || undefined,
        jenis: sJenis,
        limit: 500,
      });
      setStokRows(rows);
    } catch (e) {
      toast?.show?.({ type: "error", message: `❌ ${e.message}` });
    } finally {
      setStokLoading(false);
    }
  };

  // ---------------------------
  // Riwayat Hutang (belum lunas)
  // ---------------------------
  const [hNama, setHNama] = useState("");
  const [hQ, setHQ] = useState("");
  const [debts, setDebts] = useState([]);
  const [debtLoading, setDebtLoading] = useState(false);
  const totalHutang = useMemo(
    () => debts.reduce((a, b) => a + (Number(b.total) || 0), 0),
    [debts]
  );

  const loadDebts = async () => {
    try {
      setDebtLoading(true);
      const keyword = [hNama, hQ].filter(Boolean).join(" ").trim();
      const rows = await DataService.getDebts({
        query: keyword,
        limit: 500,
      });
      setDebts(rows);
    } catch (e) {
      toast?.show?.({ type: "error", message: `❌ ${e.message}` });
    } finally {
      setDebtLoading(false);
    }
  };

  // muat data saat tab diganti (sekali)
  useEffect(() => {
    if (tab === "trx") loadTrx();
    if (tab === "stok") loadStok();
    if (tab === "hutang") loadDebts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Riwayat</h1>
      </div>

      <Tabs active={tab} onChange={setTab} />

      {/* ----------------- RIWAYAT TRANSAKSI ----------------- */}
      {tab === "trx" && (
        <>
          <Card title="Filter Transaksi">
            <div
              className="grid"
              style={{
                gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))",
                gap: 12,
              }}
            >
              <div>
                <label>Dari Tanggal</label>
                <Input
                  type="date"
                  min={MIN_DATE}
                  max={maxAllowedDate()}
                  value={fFrom}
                  onChange={(e) => setFFrom(e.target.value)}
                />
              </div>
              <div>
                <label>Sampai</label>
                <Input
                  type="date"
                  min={MIN_DATE}
                  max={maxAllowedDate()}
                  value={fTo}
                  onChange={(e) => setFTo(e.target.value)}
                />
              </div>
              <div>
                <label>Metode Bayar</label>
                <select
                  value={fMethod}
                  onChange={(e) => setFMethod(e.target.value)}
                  style={{
                    padding: "10px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: 8,
                    width: "100%",
                  }}
                >
                  <option value="ALL">Semua</option>
                  <option value="TUNAI">Tunai</option>
                  <option value="HUTANG">Hutang</option>
                </select>
              </div>
              <div>
                <label>Status Bayar</label>
                <select
                  value={fStatus}
                  onChange={(e) => setFStatus(e.target.value)}
                  style={{
                    padding: "10px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: 8,
                    width: "100%",
                  }}
                >
                  <option value="ALL">Semua</option>
                  <option value="LUNAS">Lunas</option>
                  <option value="BELUM">Belum Lunas</option>
                </select>
              </div>
              <div>
                <label>Pencarian (Invoice/Nama)</label>
                <Input
                  placeholder="INV-001 / Ayu"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                <Button onClick={loadTrx} disabled={trxLoading}>
                  {trxLoading ? "Memuat…" : "Terapkan"}
                </Button>
                <Button
                  className="secondary"
                  onClick={() => {
                    setFFrom("");
                    setFTo("");
                    setFMethod("ALL");
                    setFStatus("ALL");
                    setQ("");
                    loadTrx();
                  }}
                  disabled={trxLoading}
                >
                  Reset
                </Button>
              </div>
            </div>
          </Card>

          <Card title={`Riwayat Transaksi ${trxLoading ? "(memuat…)" : ""}`}>
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
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {!trxRows.length && !trxLoading && (
                    <tr>
                      <td colSpan={8} style={{ color: COLORS.secondary }}>
                        Tidak ada data
                      </td>
                    </tr>
                  )}
                  {trxRows.map((r) => (
                    <tr key={r.id}>
                      <td>{String(r.created_at || "").slice(0, 10)}</td>
                      <td>{r.invoice || r.id}</td>
                      <td>{r.customer || "PUBLIC"}</td>
                      <td>{r.qty}</td>
                      <td>{fmtIDR(r.total || (r.qty || 0) * (r.price || 0))}</td>
                      <td>{r.method}</td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            background:
                              r.status === "LUNAS" ? "#dcfce7" : "#fee2e2",
                            color: r.status === "LUNAS" ? "#166534" : "#991b1b",
                          }}
                        >
                          {r.status || "-"}
                        </span>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <Button size="sm" className="secondary" title="Detail">
                          📋
                        </Button>{" "}
                        <Button size="sm" className="secondary" title="Catatan">
                          📝
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

      {/* ----------------- RIWAYAT STOK ----------------- */}
      {tab === "stok" && (
        <>
          <Card title="Filter Riwayat Stok">
            <div
              className="grid"
              style={{
                gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))",
                gap: 12,
              }}
            >
              <div>
                <label>Dari Tanggal</label>
                <Input
                  type="date"
                  min={MIN_DATE}
                  max={maxAllowedDate()}
                  value={sFrom}
                  onChange={(e) => setSFrom(e.target.value)}
                />
              </div>
              <div>
                <label>Sampai</label>
                <Input
                  type="date"
                  min={MIN_DATE}
                  max={maxAllowedDate()}
                  value={sTo}
                  onChange={(e) => setSTo(e.target.value)}
                />
              </div>
              <div>
                <label>Jenis Stok</label>
                <select
                  value={sJenis}
                  onChange={(e) => setSJenis(e.target.value)}
                  style={{
                    padding: "10px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: 8,
                    width: "100%",
                  }}
                >
                  <option value="ALL">Semua</option>
                  <option value="ISI">Isi</option>
                  <option value="KOSONG">Kosong</option>
                </select>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                <Button onClick={loadStok} disabled={stokLoading}>
                  {stokLoading ? "Memuat…" : "Terapkan"}
                </Button>
                <Button
                  className="secondary"
                  onClick={() => {
                    setSFrom("");
                    setSTo("");
                    setSJenis("ALL");
                    loadStok();
                  }}
                  disabled={stokLoading}
                >
                  Reset
                </Button>
              </div>
            </div>
          </Card>

          <Card title={`Riwayat Stok ${stokLoading ? "(memuat…)" : ""}`}>
            <div style={{ overflow: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Keterangan</th>
                    <th style={{ textAlign: "right" }}>Masuk</th>
                    <th style={{ textAlign: "right" }}>Keluar</th>
                    <th style={{ textAlign: "right" }}>Sisa Stok</th>
                  </tr>
                </thead>
                <tbody>
                  {!stokRows.length && !stokLoading && (
                    <tr>
                      <td colSpan={5} style={{ color: COLORS.secondary }}>
                        Tidak ada data
                      </td>
                    </tr>
                  )}
                  {stokRows.map((r) => (
                    <tr key={r.id}>
                      <td>{r.tanggal}</td>
                      <td>{r.keterangan}</td>
                      <td style={{ textAlign: "right" }}>{r.masuk || ""}</td>
                      <td style={{ textAlign: "right" }}>{r.keluar || ""}</td>
                      <td style={{ textAlign: "right" }}>
                        {(r.sisa ?? "") === "" ? "-" : r.sisa}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: COLORS.secondary }}>
              *Kolom “Sisa Stok” otomatis bila view <code>stock_logs_with_balance</code> tersedia.
            </div>
          </Card>
        </>
      )}

      {/* ----------------- RIWAYAT HUTANG ----------------- */}
      {tab === "hutang" && (
        <>
          <Card title="Filter Hutang">
            <div
              className="grid"
              style={{
                gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))",
                gap: 12,
              }}
            >
              <div>
                <label>Nama Pelanggan</label>
                <Input
                  placeholder="Cari nama pelanggan"
                  value={hNama}
                  onChange={(e) => setHNama(e.target.value)}
                />
              </div>
              <div>
                <label>Pencarian (Invoice/Nama)</label>
                <Input
                  placeholder="INV-001 / Ayu"
                  value={hQ}
                  onChange={(e) => setHQ(e.target.value)}
                />
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                <Button onClick={loadDebts} disabled={debtLoading}>
                  {debtLoading ? "Memuat…" : "Terapkan"}
                </Button>
                <Button
                  className="secondary"
                  onClick={() => {
                    setHNama("");
                    setHQ("");
                    loadDebts();
                  }}
                  disabled={debtLoading}
                >
                  Reset
                </Button>
              </div>
            </div>
          </Card>

          <Card
            title={`Riwayat Hutang — Total Belum Lunas: ${fmtIDR(
              totalHutang
            )} ${debtLoading ? "(memuat…)" : ""}`}
          >
            <div style={{ overflow: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>No. Invoice</th>
                    <th style={{ minWidth: 140 }}>Pelanggan</th>
                    <th>Qty</th>
                    <th>Total Hutang</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {!debts.length && !debtLoading && (
                    <tr>
                      <td colSpan={6} style={{ color: COLORS.secondary }}>
                        Tidak ada hutang
                      </td>
                    </tr>
                  )}
                  {debts.map((d) => (
                    <tr key={d.id}>
                      <td>{String(d.created_at || "").slice(0, 10)}</td>
                      <td>{d.invoice || d.id}</td>
                      <td style={{ fontWeight: 600 }}>{d.customer}</td>
                      <td>{d.qty}</td>
                      <td>{fmtIDR(d.total)}</td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <Button
                          size="sm"
                          className="primary"
                          title="Tandai Lunas (buka halaman Transaksi > Bayar Hutang)"
                          onClick={() =>
                            toast?.show?.({
                              type: "info",
                              message:
                                "Buka menu Transaksi > Bayar Hutang untuk melunasi.",
                            })
                          }
                        >
                          💳 Bayar
                        </Button>{" "}
                        <Button
                          size="sm"
                          className="secondary"
                          title="Hubungi via WhatsApp"
                          onClick={() =>
                            toast?.show?.({
                              type: "info",
                              message:
                                "Fitur kontak otomatis akan aktif setelah nomor pelanggan disimpan.",
                            })
                          }
                        >
                          📞 Hubungi
                        </Button>{" "}
                        <Button
                          size="sm"
                          className="secondary"
                          title="Tambah Catatan"
                          onClick={() =>
                            toast?.show?.({
                              type: "info",
                              message:
                                "Fitur catatan akan diaktifkan di iterasi berikutnya.",
                            })
                          }
                        >
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
    </div>
  );
}
