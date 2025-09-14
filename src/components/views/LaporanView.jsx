import React from "react";
import Card from "../ui/Card.jsx";
import Input from "../ui/Input.jsx";
import Button from "../ui/Button.jsx";
import { maxAllowedDate, todayStr } from "../../utils/helpers.js";

export default function LaporanView() {
  return (
    <div>
      <h1 style={{marginBottom:16}}>Laporan</h1>

      <Card title="Filter Periode">
        <div className="grid">
          <div>
            <label>Dari</label>
            <Input type="date" max={maxAllowedDate()} defaultValue={todayStr()} />
          </div>
          <div>
            <label>Sampai</label>
            <Input type="date" max={maxAllowedDate()} defaultValue={todayStr()} />
          </div>
        </div>
        <div style={{display:"flex", justifyContent:"flex-end", gap:8, marginTop:12}}>
          <Button className="secondary">Terapkan</Button>
          <Button>Refresh</Button>
        </div>
      </Card>

      <div className="grid" style={{marginTop:12}}>
        <Card title="Rekap Harian">
          <ul style={{marginTop:6}}>
            <li>Total Penjualan (tabung)</li>
            <li>Total Penjualan (uang)</li>
            <li>Piutang periode</li>
          </ul>
        </Card>
        <Card title="Ekspor">
          <div style={{display:"flex", gap:8}}>
            <Button>Ekspor Transaksi (Excel)</Button>
            <Button className="secondary">Ekspor Riwayat Stok (Excel)</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
