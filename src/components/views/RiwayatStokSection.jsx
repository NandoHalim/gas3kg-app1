import React, { useEffect, useMemo, useState } from "react";
import Card from "../ui/Card.jsx";
import Input from "../ui/Input.jsx";
import Button from "../ui/Button.jsx";
import { COLORS, MIN_DATE } from "../../utils/constants.js";
import { maxAllowedDate, fmtIDR } from "../../utils/helpers.js";
import { DataService } from "../../services/DataService.js";
import { useToast } from "../../context/ToastContext.jsx";

// util kecil untuk badge
const Badge = ({ children, tone="neutral" }) => {
  const map = {
    neutral: { bg:"#eef2ff", fg:"#3730a3" },
    plus:    { bg:"#dcfce7", fg:"#166534" },
    minus:   { bg:"#fee2e2", fg:"#991b1b" },
    isi:     { bg:"#e0f2fe", fg:"#075985" },
    kosong:  { bg:"#fef3c7", fg:"#92400e" },
  };
  const c = map[tone] || map.neutral;
  return (
    <span style={{background:c.bg,color:c.fg,fontSize:12,padding:"3px 8px",borderRadius:999}}>
      {children}
    </span>
  );
};

// terjemahkan note teknis jadi “manusiawi”
function humanize(note="") {
  const n = note.toLowerCase();
  // contoh pola umum (bisa kamu tambah kapan saja)
  if (n.includes("void") || n.includes("dibatalkan") || n.includes("reason"))
    return "Pembatalan (Void)";
  if (n.includes("jual") || n.includes("terjual") || n.includes("penjualan"))
    return "Penjualan";
  if (n.includes("beli") || n.includes("supplier") || n.includes("agen"))
    return "Pembelian / Dari Agen";
  if (n.includes("tukar kosong") || n.includes("restok isi"))
    return "Restok ISI (tukar kosong)";
  if (n.includes("koreksi") || n.includes("adjust"))
    return "Koreksi Stok";
  return note || "Mutasi Stok";
}

export default function RiwayatStokSection() {
  const toast = useToast();

  // filter
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [jenis, setJenis] = useState("ALL");      // ALL | ISI | KOSONG
  const [mutasi, setMutasi] = useState("ALL");    // ALL | MASUK | KELUAR
  const [keyword, setKeyword] = useState("");     // cari pada keterangan/note

  // data
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const data = await DataService.getStockHistory({
        from: from || undefined,
        to: to || undefined,
        jenis, // server sudah support penyaringan jenis stok
        limit: 600,
      });
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      toast?.show?.({ type:"error", message:`❌ ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  // filter FE: mutasi (masuk/keluar) + keyword
  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (mutasi === "MASUK" && !(r.masuk > 0)) return false;
      if (mutasi === "KELUAR" && !(r.keluar > 0)) return false;
      const kw = keyword.trim().toLowerCase();
      if (kw) {
        const hay = (r.keterangan + " " + (r.raw_note||"")).toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
  }, [rows, mutasi, keyword]);

  // re-keterangan manusiawi
  const normalized = useMemo(() => {
    return filtered.map(r => ({
      ...r,
      friendly: humanize(r.raw_note || r.keterangan),
    }));
  }, [filtered]);

  // summary
  const totalMasuk  = normalized.reduce((a,b)=> a + Number(b.masuk||0), 0);
  const totalKeluar = normalized.reduce((a,b)=> a + Number(b.keluar||0), 0);

  return (
    <>
      <Card title="Filter Riwayat Stok">
        <div className="grid" style={{gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:12}}>
          <div>
            <label>Dari Tanggal</label>
            <Input type="date" min={MIN_DATE} max={maxAllowedDate()} value={from} onChange={e=>setFrom(e.target.value)} />
          </div>
          <div>
            <label>Sampai</label>
            <Input type="date" min={MIN_DATE} max={maxAllowedDate()} value={to} onChange={e=>setTo(e.target.value)} />
          </div>
          <div>
            <label>Jenis Stok</label>
            <select value={jenis} onChange={e=>setJenis(e.target.value)} style={selStyle}>
              <option value="ALL">Semua</option>
              <option value="ISI">Isi</option>
              <option value="KOSONG">Kosong</option>
            </select>
          </div>
          <div>
            <label>Jenis Mutasi</label>
            <select value={mutasi} onChange={e=>setMutasi(e.target.value)} style={selStyle}>
              <option value="ALL">Semua</option>
              <option value="MASUK">Masuk (+)</option>
              <option value="KELUAR">Keluar (−)</option>
            </select>
          </div>
          <div>
            <label>Keterangan / Kata Kunci</label>
            <Input placeholder="mis: void, penjualan, agen, budi…" value={keyword} onChange={e=>setKeyword(e.target.value)} />
          </div>
          <div style={{display:"flex",alignItems:"flex-end",gap:8}}>
            <Button onClick={load} disabled={loading}>{loading?"Memuat…":"Terapkan"}</Button>
            <Button className="secondary" disabled={loading} onClick={()=>{
              setFrom(""); setTo(""); setJenis("ALL"); setMutasi("ALL"); setKeyword(""); load();
            }}>Reset</Button>
          </div>
        </div>
      </Card>

      <Card title={`Riwayat Stok ${loading ? "(memuat…)" : ""}`}>
        {/* Summary chip */}
        <div style={{display:"flex", gap:8, marginBottom:10, flexWrap:"wrap"}}>
          <Badge tone="plus">Total Masuk: {totalMasuk}</Badge>
          <Badge tone="minus">Total Keluar: {totalKeluar}</Badge>
        </div>

        <div style={{ overflow:"auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{minWidth:130}}>Tanggal & Waktu</th>
                <th>Jenis</th>
                <th style={{minWidth:220}}>Keterangan</th>
                <th style={{textAlign:"right"}}>Masuk</th>
                <th style={{textAlign:"right"}}>Keluar</th>
                <th style={{textAlign:"right"}}>Sisa Stok</th>
              </tr>
            </thead>
            <tbody>
              {!normalized.length && !loading && (
                <tr><td colSpan={6} style={{color:"#64748b"}}>Tidak ada data</td></tr>
              )}
              {normalized.map(r => (
                <tr key={r.id}>
                  <td>{r.waktu || r.tanggal}</td>
                  <td>
                    <Badge tone={r.code==="ISI"?"isi":"kosong"}>{r.code}</Badge>
                  </td>
                  <td>{r.friendly}</td>
                  <td style={{textAlign:"right", color: r.masuk? "#166534": undefined}}>
                    {r.masuk || ""}
                  </td>
                  <td style={{textAlign:"right", color: r.keluar? "#991b1b": undefined}}>
                    {r.keluar || ""}
                  </td>
                  <td style={{textAlign:"right"}}>{(r.sisa ?? "")===""?"-":r.sisa}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{marginTop:8, fontSize:12, color:"#64748b"}}>
          * “Sisa Stok” otomatis tersedia bila view <code>stock_logs_with_balance</code> ada.
        </div>
      </Card>
    </>
  );
}

const selStyle = {
  padding:"10px 12px",
  border:"1px solid #cbd5e1",
  borderRadius:8,
  width:"100%",
};
