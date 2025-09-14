import React, { useState } from "react";
import Card from "../ui/Card.jsx";
import Input from "../ui/Input.jsx";
import Button from "../ui/Button.jsx";

export default function PelangganView() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <div style={{display:"flex", alignItems:"center", gap:12, marginBottom:16}}>
        <h1 style={{margin:0}}>Data Pelanggan</h1>
        <div style={{marginLeft:"auto"}}>
          <Button onClick={()=>setShowForm(s=>!s)}>{showForm?"Tutup":"Tambah Pelanggan"}</Button>
        </div>
      </div>

      {showForm && (
        <Card title="Tambah Pelanggan">
          <div className="grid">
            <div>
              <label>Nama</label>
              <Input placeholder="Mis. Ibu Ayu" />
            </div>
            <div>
              <label>Kontak</label>
              <Input placeholder="No. HP / Alamat" />
            </div>
            <div>
              <label>Keterangan</label>
              <Input placeholder="Opsional" />
            </div>
          </div>
          <div style={{display:"flex", justifyContent:"flex-end", marginTop:12, gap:8}}>
            <Button className="secondary" onClick={()=>setShowForm(false)}>Batal</Button>
            <Button>Simpan</Button>
          </div>
        </Card>
      )}

      <Card title="Daftar Pelanggan">
        <div style={{overflow:"auto"}}>
          <table className="table">
            <thead>
              <tr>
                <th>Nama</th><th>Kontak</th><th>Keterangan</th><th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Ibu Ayu</td><td>08xx…</td><td>Pelanggan rutin</td>
                <td><Button className="secondary" size="sm">Riwayat</Button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
