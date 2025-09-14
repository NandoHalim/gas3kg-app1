import React, { useState } from "react";
import Card from "../ui/Card.jsx";
import Input from "../ui/Input.jsx";
import Button from "../ui/Button.jsx";
import PenjualanView from "./PenjualanView.jsx"; // sudah ada
import { COLORS } from "../../utils/constants.js";

export default function TransaksiView({ stocks={}, onSaved }) {
  const [tab, setTab] = useState("penjualan");

  return (
    <div>
      <div style={{display:"flex", alignItems:"center", gap:12, marginBottom:16}}>
        <h1 style={{margin:0}}>Transaksi</h1>
        <div style={{marginLeft:"auto", display:"flex", gap:8}}>
          <Button className={tab==="penjualan"?"primary":""} onClick={()=>setTab("penjualan")}>Penjualan Baru</Button>
          <Button className={tab==="hutang"?"primary":""} onClick={()=>setTab("hutang")}>Bayar Hutang</Button>
        </div>
      </div>

      {tab==="penjualan" && (
        <PenjualanView stocks={stocks} onSaved={onSaved} onCancel={()=>{}} />
      )}

      {tab==="hutang" && (
        <Card title="Bayar Hutang">
          <div className="grid">
            <div>
              <label>Cari Pelanggan</label>
              <Input placeholder="Nama / No. Nota" />
            </div>
            <div>
              <label>Nominal Pembayaran</label>
              <Input type="number" min={0} placeholder="0" />
            </div>
            <div>
              <label>Catatan</label>
              <Input placeholder="Opsional" />
            </div>
          </div>
          <div style={{display:"flex", justifyContent:"flex-end", marginTop:12, gap:8}}>
            <Button className="secondary">Batal</Button>
            <Button>Bayar</Button>
          </div>
          <div style={{marginTop:12, fontSize:12, color:COLORS.secondary}}>
            *Placeholder: hubungkan ke RPC pembayaran hutang dan update status transaksi terkait.
          </div>
        </Card>
      )}
    </div>
  );
}
