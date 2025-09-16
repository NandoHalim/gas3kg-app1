import React, { useEffect, useMemo, useState } from "react";
import Card from "../ui/Card.jsx";
import Input from "../ui/Input.jsx";
import Button from "../ui/Button.jsx";
import { COLORS, MIN_DATE } from "../../utils/constants.js";
import { fmtIDR, maxAllowedDate } from "../../utils/helpers.js";
import { DataService } from "../../services/DataService.js";
import { useToast } from "../../context/ToastContext.jsx";

const VOID_REASONS = [
  "Salah Input Data",
  "Batal oleh Pelanggan",
  "Barang Rusak",
  "Lainnya",
];

export default function RiwayatSections() {
  const toast = useToast();
  const [tab, setTab] = useState("transaksi"); // transaksi | hutang | stok

  // ---------------- TRX ----------------
  const [fFrom, setFFrom] = useState("");
  const [fTo, setFTo] = useState("");
  const [fMethod, setFMethod] = useState("ALL"); // ALL | TUNAI | HUTANG
  const [fStatus, setFStatus] = useState("ALL"); // ALL | LUNAS | BELUM | DIBATALKAN
  const [fCashier, setFCashier] = useState("");
  const [q, setQ] = useState("");
  const [trxRows, setTrxRows] = useState([]);
  const [trxLoading, setTrxLoading] = useState(false);

  // State untuk VOID
  const [voidOpen, setVoidOpen] = useState(false);
  const [voidSale, setVoidSale] = useState(null); // {id, customer, qty, total, created_at, status}
  const [voidReason, setVoidReason] = useState("");
  const [voidOther, setVoidOther] = useState("");
  const finalReason = useMemo(
    () => (voidReason === "Lainnya" ? voidOther.trim() : voidReason),
    [voidReason, voidOther]
  );

  const loadTrx = async () => {
    try {
      setTrxLoading(true);
      const rows = await DataService.getSalesHistory({
        from: fFrom || undefined,
        to: fTo || undefined,
        method: fMethod,
        status: fStatus,
        cashier: fCashier || undefined,
        q: q || undefined,
        limit: 300,
      });
      setTrxRows(rows);
    } catch (e) {
      toast?.show?.({ type: "error", message: `❌ ${e.message}` });
    } finally {
      setTrxLoading(false);
    }
  };

  // ---------------- HUTANG ----------------
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
      const rows = await DataService.getDebts({ query: keyword, limit: 300 });
      setDebts(rows);
    } catch (e) {
      toast?.show?.({ type: "error", message: `❌ ${e.message}` });
    } finally {
      setDebtLoading(false);
    }
  };

  // ---------------- STOK ----------------
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
        limit: 300,
      });
      setStokRows(rows);
    } catch (e) {
      toast?.show?.({ type: "error", message: `❌ ${e.message}` });
    } finally {
      setStokLoading(false);
    }
  };

  // muat saat tab pindah
  useEffect(() => {
    if (tab === "transaksi") loadTrx();
    if (tab === "hutang") loadDebts();
    if (tab === "stok") loadStok();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // --- handler buka modal VOID ---
  const openVoidModal = (row) => {
    setVoidSale(row);
    setVoidReason("");
    setVoidOther("");
    setVoidOpen(true);
  };

  const closeVoidModal = () => {
    setVoidOpen(false);
    setVoidSale(null);
    setVoidReason("");
    setVoidOther("");
  };

  // --- submit VOID ---
  const onConfirmVoid = async (e) => {
    e?.preventDefault?.();
    if (!voidSale) return;
    if (!finalReason) {
      toast?.show?.({ type: "error", message: "Alasan wajib dipilih/diisi" });
      return;
    }
    // pagar FE: pastikan eligible (<=2 hari & belum dibatalkan)
    if (!DataService.canVoidOnClient(voidSale, 2)) {
      toast?.show?.({ type: "error", message: "Transaksi tidak bisa dibatalkan (di luar batas waktu atau sudah dibatalkan)" });
      return;
    }
    try {
      await DataService.voidSale({ sale_id: voidSale.id, reason: finalReason });
      toast?.show?.({ type: "success", message: "✅ Transaksi dibatalkan (VOID) dan stok dipulihkan" });
      closeVoidModal();
      // reload cepat
      loadTrx();
      loadStok();
    } catch (err) {
      toast?.show?.({ type: "error", message: `❌ ${err.message}` });
    }
  };

  const selStyle = {
    padding: "10px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    width: "100%",
  };

  return (
    <div>
      {/* Header + Tabs */}
      <div style={{display:"flex", alignItems:"center", gap:12, marginBottom:16}}>
        <h1 style={{margin:0}}>Riwayat</h1>
        <div style={{marginLeft:"auto", display:"flex", gap:8}}>
          <Button className={tab==="transaksi"?"primary":""} onClick={()=>setTab("transaksi")}>Transaksi</Button>
          <Button className={tab==="hutang"?"primary":""} onClick={()=>setTab("hutang")}>Hutang</Button>
          <Button className={tab==="stok"?"primary":""} onClick={()=>setTab("stok")}>Stok</Button>
        </div>
      </div>

      {/* ===== RIWAYAT TRANSAKSI ===== */}
      {tab==="transaksi" && (
        <>
          <Card title="Filter">
            <div className="grid" style={{gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))", gap:12}}>
              <div>
                <label>Tanggal Dari</label>
                <Input type="date" min={MIN_DATE} max={maxAllowedDate()} value={fFrom} onChange={(e)=>setFFrom(e.target.value)} />
              </div>
              <div>
                <label>Tanggal Sampai</label>
                <Input type="date" min={MIN_DATE} max={maxAllowedDate()} value={fTo} onChange={(e)=>setFTo(e.target.value)} />
              </div>
              <div>
                <label>Metode</label>
                <select value={fMethod} onChange={(e)=>setFMethod(e.target.value)} style={selStyle}>
                  <option value="ALL">Semua</option>
                  <option value="TUNAI">TUNAI</option>
                  <option value="HUTANG">HUTANG</option>
                </select>
              </div>
              <div>
                <label>Status</label>
                <select value={fStatus} onChange={(e)=>setFStatus(e.target.value)} style={selStyle}>
                  <option value="ALL">Semua</option>
                  <option value="LUNAS">LUNAS</option>
                  <option value="BELUM">BELUM</option>
                  <option value="DIBATALKAN">DIBATALKAN</option>
                </select>
              </div>
              <div>
                <label>Kasir</label>
                <Input placeholder="Nama kasir" value={fCashier} onChange={(e)=>setFCashier(e.target.value)} />
              </div>
              <div>
                <label>Pencarian (ID/Nama)</label>
                <Input placeholder="cth: 123 atau Ayu" value={q} onChange={(e)=>setQ(e.target.value)} />
              </div>
              <div style={{display:"flex", alignItems:"flex-end", gap:8}}>
                <Button onClick={loadTrx} disabled={trxLoading}>{trxLoading?"Memuat…":"Terapkan"}</Button>
                <Button className="secondary" onClick={()=>{
                  setFFrom(""); setFTo(""); setFMethod("ALL"); setFStatus("ALL"); setFCashier(""); setQ(""); loadTrx();
                }} disabled={trxLoading}>Reset</Button>
              </div>
            </div>
          </Card>

          <Card title={`Riwayat Transaksi ${trxLoading?"(memuat…)":""}`}>
            <div style={{overflow:"auto"}}>
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
                  {!trxRows.length && !trxLoading && (
                    <tr><td colSpan={9} style={{color:COLORS.secondary}}>Tidak ada data</td></tr>
                  )}
                  {trxRows.map(r=>{
                    const isCancelled = String(r.status||"").toUpperCase()==="DIBATALKAN";
                    const canVoid = !isCancelled && DataService.canVoidOnClient(r, 2);
                    return (
                      <tr key={r.id} style={{opacity: isCancelled ? .7 : 1}}>
                        <td>{String(r.created_at||"").slice(0,10)}</td>
                        <td>{isCancelled ? `VOID-${r.id}` : r.id}</td>
                        <td>{r.customer || "PUBLIC"}</td>
                        <td>{r.qty}</td>
                        <td>{fmtIDR(r.total || (r.qty||0)*(r.price||0))}</td>
                        <td>{r.method}</td>
                        <td>
                          <span className="badge" style={{
                            background: isCancelled ? "#e5e7eb" : (r.status==="LUNAS" ? "#dcfce7" : "#fee2e2"),
                            color: isCancelled ? "#374151" : (r.status==="LUNAS" ? "#166534" : "#991b1b")
                          }}>
                            {r.status || "-"}
                          </span>
                        </td>
                        <td>{r.cashier || r.kasir || "-"}</td>
                        <td style={{whiteSpace:"nowrap"}}>
                          <Button size="sm" className="secondary" title="Lihat Detail">📋</Button>{" "}
                          <Button size="sm" className="secondary" title="Tambah Catatan">📝</Button>{" "}
                          <Button
                            size="sm"
                            className={canVoid ? "danger" : "secondary"}
                            disabled={!canVoid}
                            title={canVoid ? "Batalkan (VOID)" : "Tidak dapat dibatalkan"}
                            onClick={()=>openVoidModal(r)}
                          >
                            ❌ Void
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Modal/Sheet Void */}
          {voidOpen && (
            <Card title={`Batalkan Transaksi (ID: ${voidSale?.id})`}>
              <form onSubmit={onConfirmVoid} className="grid" style={{gap:12}}>
                <div style={{display:"grid", gap:6}}>
                  <div style={{display:"flex", justifyContent:"space-between"}}>
                    <span>Pelanggan</span><b>{voidSale?.customer || "PUBLIC"}</b>
                  </div>
                  <div style={{display:"flex", justifyContent:"space-between"}}>
                    <span>Qty</span><b>{voidSale?.qty}</b>
                  </div>
                  <div style={{display:"flex", justifyContent:"space-between"}}>
                    <span>Total</span><b>{fmtIDR(voidSale?.total || (voidSale?.qty||0)*(voidSale?.price||0))}</b>
                  </div>
                  <div style={{display:"flex", justifyContent:"space-between"}}>
                    <span>Tanggal</span><b>{String(voidSale?.created_at||"").slice(0,10)}</b>
                  </div>
                </div>

                <div>
                  <label>Alasan Pembatalan</label>
                  <select value={voidReason} onChange={e=>setVoidReason(e.target.value)} style={{
                    padding:"10px 12px", border:"1px solid #cbd5e1", borderRadius:8, width:"100%"
                  }}>
                    <option value="">Pilih alasan…</option>
                    {VOID_REASONS.map(v=><option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                {voidReason==="Lainnya" && (
                  <div>
                    <label>Alasan (ketik)</label>
                    <Input value={voidOther} onChange={e=>setVoidOther(e.target.value)} placeholder="Tulis alasan…" />
                  </div>
                )}

                <div style={{display:"flex", justifyContent:"flex-end", gap:8}}>
                  <Button type="button" className="secondary" onClick={closeVoidModal}>Batal</Button>
                  <Button type="submit" className="danger">Konfirmasi Void</Button>
                </div>
                <div style={{fontSize:12, color:COLORS.secondary}}>
                  *Void akan mengembalikan stok, menandai transaksi asli sebagai <b>DIBATALKAN</b>, dan mencatat mutasi stok.
                </div>
              </form>
            </Card>
          )}
        </>
      )}

      {/* ===== RIWAYAT HUTANG ===== */}
      {tab==="hutang" && (
        <>
          <Card title="Filter Hutang">
            <div className="grid" style={{gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))", gap:12}}>
              <div>
                <label>Nama Pelanggan</label>
                <Input placeholder="Cari nama pelanggan" value={hNama} onChange={(e)=>setHNama(e.target.value)} />
              </div>
              <div>
                <label>Pencarian (ID/Nama)</label>
                <Input placeholder="cth: 123 atau Ayu" value={hQ} onChange={(e)=>setHQ(e.target.value)} />
              </div>
              <div style={{display:"flex", alignItems:"flex-end", gap:8}}>
                <Button onClick={loadDebts} disabled={debtLoading}>{debtLoading?"Memuat…":"Terapkan"}</Button>
                <Button className="secondary" onClick={()=>{ setHNama(""); setHQ(""); loadDebts(); }} disabled={debtLoading}>Reset</Button>
              </div>
            </div>
          </Card>

          <Card title={`Riwayat Hutang — Total Belum Lunas: ${fmtIDR(totalHutang)} ${debtLoading?"(memuat…)":""}`}>
            <div style={{overflow:"auto"}}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>No. Invoice</th>
                    <th style={{minWidth:140}}>Pelanggan</th>
                    <th>Qty</th>
                    <th>Total Hutang</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {!debts.length && !debtLoading && (
                    <tr><td colSpan={6} style={{color:COLORS.secondary}}>Tidak ada hutang</td></tr>
                  )}
                  {debts.map(d=>(
                    <tr key={d.id}>
                      <td>{String(d.created_at||"").slice(0,10)}</td>
                      <td>{d.id}</td>
                      <td style={{fontWeight:600}}>{d.customer}</td>
                      <td>{d.qty}</td>
                      <td>{fmtIDR(d.total)}</td>
                      <td style={{whiteSpace:"nowrap"}}>
                        <Button size="sm" className="primary" onClick={()=>{
                          toast?.show?.({type:"info", message:"Buka menu Transaksi > Bayar Hutang untuk melunasi."});
                        }}>💳 Bayar</Button>{" "}
                        <Button size="sm" className="secondary" onClick={()=>{
                          toast?.show?.({type:"info", message:"Fitur kontak otomatis aktif bila nomor pelanggan tersimpan."});
                        }}>📞 Hubungi</Button>{" "}
                        <Button size="sm" className="secondary" onClick={()=>{
                          toast?.show?.({type:"info", message:"Fitur catatan akan diaktifkan berikutnya."});
                        }}>📝 Catatan</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* ===== RIWAYAT STOK ===== */}
      {tab==="stok" && (
        <>
          <Card title="Filter Mutasi Stok">
            <div className="grid" style={{gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))", gap:12}}>
              <div>
                <label>Tanggal Dari</label>
                <Input type="date" min={MIN_DATE} max={maxAllowedDate()} value={sFrom} onChange={(e)=>setSFrom(e.target.value)} />
              </div>
              <div>
                <label>Tanggal Sampai</label>
                <Input type="date" min={MIN_DATE} max={maxAllowedDate()} value={sTo} onChange={(e)=>setSTo(e.target.value)} />
              </div>
              <div>
                <label>Jenis Stok</label>
                <select value={sJenis} onChange={(e)=>setSJenis(e.target.value)} style={selStyle}>
                  <option value="ALL">Semua</option>
                  <option value="ISI">ISI</option>
                  <option value="KOSONG">KOSONG</option>
                </select>
              </div>
              <div style={{display:"flex", alignItems:"flex-end", gap:8}}>
                <Button onClick={loadStok} disabled={stokLoading}>{stokLoading?"Memuat…":"Terapkan"}</Button>
                <Button className="secondary" onClick={()=>{ setSFrom(""); setSTo(""); setSJenis("ALL"); loadStok(); }} disabled={stokLoading}>Reset</Button>
              </div>
            </div>
          </Card>

          <Card title={`Riwayat Mutasi Stok ${stokLoading?"(memuat…)":""}`}>
            <div style={{overflow:"auto"}}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Keterangan</th>
                    <th style={{textAlign:"right"}}>Masuk</th>
                    <th style={{textAlign:"right"}}>Keluar</th>
                    <th style={{textAlign:"right"}}>Sisa Stok</th>
                  </tr>
                </thead>
                <tbody>
                  {!stokRows.length && !stokLoading && (
                    <tr><td colSpan={5} style={{color:COLORS.secondary}}>Tidak ada data</td></tr>
                  )}
                  {stokRows.map(r=>(
                    <tr key={r.id}>
                      <td>{r.tanggal}</td>
                      <td>{r.keterangan}</td>
                      <td style={{textAlign:"right"}}>{r.masuk || ""}</td>
                      <td style={{textAlign:"right"}}>{r.keluar || ""}</td>
                      <td style={{textAlign:"right"}}>{(r.sisa ?? "")==="" ? "-" : r.sisa}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{marginTop:8, fontSize:12, color:COLORS.secondary}}>
              *Kolom “Sisa Stok” otomatis bila view <code>stock_logs_with_balance</code> tersedia.
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
