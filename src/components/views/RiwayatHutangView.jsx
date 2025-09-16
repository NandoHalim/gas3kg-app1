// src/components/views/RiwayatHutangView.jsx
import React, { useEffect, useState } from "react";
import Card from "../ui/Card.jsx";
import Input from "../ui/Input.jsx";
import Button from "../ui/Button.jsx";
import { fmtIDR } from "../../utils/helpers.js";
import { COLORS } from "../../utils/constants.js";
import { DataService } from "../../services/DataService.js";
import { useToast } from "../../context/ToastContext.jsx";

export default function RiwayatHutangView() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [total, setTotal] = useState(0);

  // filter
  const [customer, setCustomer] = useState("");
  const [qtext, setQtext] = useState("");

  // modal: bayar & catatan
  const [paying, setPaying] = useState(null); // {id, customer, total}
  const [noteSale, setNoteSale] = useState(null); // {id, customer}
  const [noteText, setNoteText] = useState("");

  const loadFirst = async () => {
    setLoading(true);
    try {
      const { rows, nextCursor, total } = await DataService.getDebtsPaged({
        limit: 20,
        qtext,
        customer,
      });
      setRows(rows);
      setNextCursor(nextCursor);
      setTotal(total);
    } catch (e) {
      toast?.show?.({ type: "error", message: `❌ ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!nextCursor) return;
    setLoading(true);
    try {
      const { rows: more, nextCursor: nc } = await DataService.getDebtsPaged({
        limit: 20,
        qtext,
        customer,
        cursorId: nextCursor,
      });
      setRows((prev) => [...prev, ...more]);
      setNextCursor(nc);
    } catch (e) {
      toast?.show?.({ type: "error", message: `❌ ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFirst();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // aksi bayar (wajib lunas)
  const submitPay = async (ev) => {
    ev?.preventDefault?.();
    if (!paying) return;
    try {
      setLoading(true);
      await DataService.payDebt({
        sale_id: paying.id,
        amount: paying.total, // dikunci lunas
        note: `Pelunasan: ${paying.customer || ""}`,
      });
      toast?.show?.({ type: "success", message: "✅ Hutang dilunasi" });
      setPaying(null);
      await loadFirst();
    } catch (e) {
      toast?.show?.({ type: "error", message: `❌ ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  // aksi catatan
  const submitNote = async (ev) => {
    ev?.preventDefault?.();
    if (!noteSale) return;
    try {
      setLoading(true);
      await DataService.addSaleNote({ sale_id: noteSale.id, note: noteText });
      toast?.show?.({ type: "success", message: "📝 Catatan disimpan" });
      setNoteSale(null);
      setNoteText("");
      await loadFirst();
    } catch (e) {
      toast?.show?.({ type: "error", message: `❌ ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  // kontak WA
  const openWA = async (cust) => {
    let phone = await DataService.getCustomerContact(cust);
    const defaultMsg = encodeURIComponent(
      `Halo ${cust}, mengingatkan pembayaran tabung LPG 3kg.`
    );
    if (!phone) {
      // minta input cepat
      const p = prompt("Nomor WhatsApp pelanggan (628xxxx):");
      if (!p) return;
      phone = p;
    }
    const url = `https://wa.me/${phone.replace(/\D/g, "")}?text=${defaultMsg}`;
    window.open(url, "_blank");
  };

  const totalHutang = rows.reduce(
    (a, r) => a + (Number(r.total) || (Number(r.qty) || 0) * (Number(r.price) || 0)),
    0
  );

  return (
    <div className="grid">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <h1 style={{ margin: 0 }}>Riwayat Hutang</h1>
        <div style={{ marginLeft: "auto", fontWeight: 600 }}>
          Total Belum Lunas: <span style={{ color: COLORS.danger }}>{fmtIDR(totalHutang)}</span>
        </div>
      </div>

      <Card title="Filter">
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
          <div>
            <label>Nama Pelanggan</label>
            <Input value={customer} onChange={(e) => setCustomer(e.target.value)} />
          </div>
          <div>
            <label>Pencarian (Invoice/Nama)</label>
            <Input value={qtext} onChange={(e) => setQtext(e.target.value)} placeholder="INV-001 / Ayu" />
          </div>
          <div style={{ display: "flex", alignItems: "end", gap: 8 }}>
            <Button onClick={loadFirst} disabled={loading}>Terapkan</Button>
            <Button className="secondary" onClick={() => { setCustomer(""); setQtext(""); }} disabled={loading}>Reset</Button>
          </div>
        </div>
      </Card>

      <Card title={`Daftar Hutang ${loading ? "(memuat…)" : ""}`}>
        <div style={{ overflow: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>No. Invoice</th>
                <th style={{ width: 220 }}>Pelanggan</th>
                <th>Qty</th>
                <th>Total Hutang</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {!rows.length && !loading && (
                <tr><td colSpan={6} style={{ color: "#64748b" }}>Tidak ada data</td></tr>
              )}
              {rows.map((r) => {
                const total = r.total ?? (Number(r.qty || 0) * Number(r.price || 0));
                return (
                  <tr key={r.id}>
                    <td>{(r.created_at || "").slice(0, 10)}</td>
                    <td>{r.invoice || r.id}</td>
                    <td style={{ fontWeight: 600 }}>{r.customer || "PUBLIC"}</td>
                    <td>{r.qty}</td>
                    <td>{fmtIDR(total)}</td>
                    <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <Button size="sm" onClick={() => setPaying({ id: r.id, customer: r.customer, total })}>💳 Bayar</Button>
                      <Button size="sm" className="secondary" onClick={() => openWA(r.customer)}>📞 Hubungi</Button>
                      <Button size="sm" className="secondary" onClick={() => { setNoteSale({ id: r.id, customer: r.customer }); setNoteText(r.note || ""); }}>📝 Catatan</Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {nextCursor && (
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <Button onClick={loadMore} disabled={loading}>
              {loading ? "Memuat…" : "Muat Lagi"}
            </Button>
          </div>
        )}
        <div style={{ marginTop: 8, fontSize: 12 }}>
          Menampilkan {rows.length} dari {total} transaksi hutang
        </div>
      </Card>

      {/* Modal bayar */}
      {paying && (
        <Card title={`Bayar Hutang — ${paying.customer || "PUBLIC"}`}>
          <form onSubmit={submitPay} className="grid" style={{ gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Total Tagihan</span>
              <b>{fmtIDR(paying.total)}</b>
            </div>
            <Input type="number" value={paying.total} readOnly />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Button type="button" className="secondary" onClick={() => setPaying(null)} disabled={loading}>Batal</Button>
              <Button type="submit" disabled={loading}>{loading ? "Menyimpan…" : "Tandai Lunas"}</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Modal catatan */}
      {noteSale && (
        <Card title={`Catatan — ${noteSale.customer || "PUBLIC"}`}>
          <form onSubmit={submitNote} className="grid" style={{ gap: 8 }}>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={4}
              style={{ width: "100%", padding: 10, border: "1px solid #cbd5e1", borderRadius: 8 }}
              placeholder="Hasil telepon: janji bayar besok…"
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Button type="button" className="secondary" onClick={() => setNoteSale(null)} disabled={loading}>Batal</Button>
              <Button type="submit" disabled={loading}>{loading ? "Menyimpan…" : "Simpan"}</Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
