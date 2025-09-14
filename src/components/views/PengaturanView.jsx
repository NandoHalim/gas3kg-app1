import React, { useState } from "react";
import Card from "../ui/Card.jsx";
import Input from "../ui/Input.jsx";
import Button from "../ui/Button.jsx";

export default function PengaturanView() {
  const [tab, setTab] = useState("user");

  return (
    <div>
      <div style={{display:"flex", alignItems:"center", gap:12, marginBottom:16}}>
        <h1 style={{margin:0}}>Pengaturan</h1>
        <div style={{marginLeft:"auto", display:"flex", gap:8}}>
          <Button className={tab==="user"?"primary":""} onClick={()=>setTab("user")}>Kelola User</Button>
          <Button className={tab==="harga"?"primary":""} onClick={()=>setTab("harga")}>Harga Jual</Button>
          <Button className={tab==="backup"?"primary":""} onClick={()=>setTab("backup")}>Backup & Restore</Button>
        </div>
      </div>

      {tab==="user" && (
        <Card title="User (Kasir/Admin)">
          <div className="grid">
            <div>
              <label>Email</label><Input placeholder="kasir@toko.com" />
            </div>
            <div>
              <label>Role</label>
              <select style={{padding:"10px 12px", border:"1px solid #cbd5e1", borderRadius:8, width:"100%"}}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div style={{display:"flex", justifyContent:"flex-end", gap:8, marginTop:12}}>
            <Button className="secondary">Reset Password</Button>
            <Button>Simpan</Button>
          </div>
        </Card>
      )}

      {tab==="harga" && (
        <Card title="Harga Jual">
          <div className="grid">
            <div>
              <label>Harga Tabung 3kg</label><Input type="number" min={0} placeholder="e.g. 22000" />
            </div>
          </div>
          <div style={{display:"flex", justifyContent:"flex-end", gap:8, marginTop:12}}>
            <Button className="secondary">Batal</Button>
            <Button>Simpan</Button>
          </div>
        </Card>
      )}

      {tab==="backup" && (
        <Card title="Backup & Restore">
          <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
            <Button>Backup Data</Button>
            <Button className="secondary">Restore Data</Button>
          </div>
          <div style={{fontSize:12, marginTop:8, color:"#64748b"}}>
            *Placeholder: sambungkan ke endpoint/SQL export-import.
          </div>
        </Card>
      )}
    </div>
  );
}
