import React, { useState } from "react";
import Card from "../ui/Card.jsx";
import Input from "../ui/Input.jsx";
import Button from "../ui/Button.jsx";

export default function RiwayatSections() {
  const [tab, setTab] = useState("transaksi");

  return (
    <div>
      <div style={{display:"flex", alignItems:"center", gap:12, marginBottom:16}}>
        <h1 style={{margin:0}}>Riwayat</h1>
        <div style={{marginLeft:"auto", display:"flex", gap:8}}>
          <Button className={tab==="transaksi"?"primary":""} onClick={()=>setTab("transaksi")}>Transaksi</Button>
          <Button className={tab==="hutang"?"primary":""} onClick={()=>setTab("hutang")}>Hutang</Button>
          <Button className={tab==="stok"?"primary":""} onClick={()=>setTab("stok")}>Stok</Button>
        </div>
      </div>

      {tab==="transaksi" && (
        <Card title="Riwayat Transaksi">
          <div className="grid">
            <div><label>Tanggal Dari</label><Input type="date" /></div>
            <div><label>Tanggal Sampai</label><Input type="date" /></div>
            <div>
              <label>Metode</label>
              <select><option>Semua</option><option>TUNAI</option><option>HUTANG</option></select>
            </div>
            <div>
              <label>Status</label>
              <select><option>Semua</option><option>LUNAS</option><option>BELUM</option></select>
            </div>
          </div>
          <div style={{marginTop:12}}>… tabel transaksi …</div>
        </Card>
      )}

      {tab==="hutang" && (
        <Card title="Riwayat Hutang">
          <div style={{marginTop:12}}>… tabel hutang …</div>
        </Card>
      )}

      {tab==="stok" && (
        <Card title="Riwayat Mutasi Stok">
          <div style={{marginTop:12}}>… tabel mutasi stok …</div>
        </Card>
      )}
    </div>
  );
}
