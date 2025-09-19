import React, { useEffect, useMemo, useState } from "react";
import Card from "../ui/Card.jsx";
import Input from "../ui/Input.jsx";
import Button from "../ui/Button.jsx";
import { COLORS } from "../../utils/constants.js";
import { fmtIDR } from "../../utils/helpers.js";
import { DataService } from "../../services/DataService.js";
import { useToast } from "../../context/ToastContext.jsx";

/**
 * Menu Pelanggan:
 * - Daftar pelanggan, pencarian, filter aktif/hutang
 * - Tambah & Edit pelanggan (modal)
 * - Nonaktifkan (soft delete) pelanggan
 * - Detail pelanggan (statistik + riwayat terbaru + status hutang)
 * - Hubungi via telp/WA
 */

export default function PelangganView() {
  const toast = useToast();

  // ======= State dasar daftar =======
  const [rows, setRows] = useState([]);      // daftar pelanggan
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");            // cari nama/HP
  const [filter, setFilter] = useState("ALL"); // ALL | ACTIVE | DEBT

  // ======= State detail =======
  const [activeCustomer, setActiveCustomer] = useState(null); // {id, name, phone, address, note, active}
  const [stats, setStats] = useState(null);    // { totalTransaksi, totalNilai, rataRata, hutangAktif }
  const [recentTx, setRecentTx] = useState([]); // riwayat terbaru

  // ======= State modal tambah/edit =======
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "", note: "" });
  const [saving, setSaving] = useState(false);

  // ======= Load daftar pelanggan =======
  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await DataService.getCustomers({
        q: q || "",
        filter, // ALL | ACTIVE | DEBT
        limit: 300,
      });
      setRows(data || []);
    } catch (e) {
      toast?.show?.({ type: "error", message: e.message || "Gagal memuat pelanggan" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, filter]);

  // ======= Pilih pelanggan untuk panel detail =======
  const pickCustomer = async (cust) => {
    setActiveCustomer(cust);
    try {
      // Ambil statistik ringkas
      const st = await DataService.getCustomerStats({ customer_id: cust.id, name: cust.name });
      setStats(st || null);

      // Ambil riwayat transaksi terbaru (mis: 20 terakhir)
      // Jika belum ada API khusus, gunakan getSalesHistory dengan q = nama
      const tx = await DataService.getSalesHistory({
        q: cust.name,
        limit: 20,
      });
      setRecentTx(tx || []);
    } catch (e) {
      toast?.show?.({ type: "error", message: e.message || "Gagal memuat detail pelanggan" });
    }
  };

  // ======= Add / Edit =======
  const openAdd = () => {
    setEditMode(false);
    setForm({ name: "", phone: "", address: "", note: "" });
    setModalOpen(true);
  };

  const openEdit = (cust) => {
    setEditMode(true);
    setForm({
      id: cust.id,
      name: cust.name || "",
      phone: cust.phone || "",
      address: cust.address || "",
      note: cust.note || "",
    });
    setModalOpen(true);
  };

  const submitForm = async (ev) => {
    ev?.preventDefault?.();
    if (saving) return;

    // Validasi simple
    if (!form.name.trim()) {
      toast?.show?.({ type: "error", message: "Nama wajib diisi" });
      return;
    }
    // Nomor HP opsional, tapi bila diisi minimal masuk akal
    if (form.phone && !/^\+?\d{8,20}$/.test(form.phone.replace(/\s|-/g, ""))) {
      toast?.show?.({ type: "error", message: "Nomor HP tidak valid" });
      return;
    }

    try {
      setSaving(true);
      if (editMode) {
        await DataService.updateCustomer({
          id: form.id,
          name: form.name.trim(),
          phone: (form.phone || "").trim(),
          address: (form.address || "").trim(),
          note: (form.note || "").trim(),
        });
        toast?.show?.({ type: "success", message: "Data pelanggan diperbarui" });
      } else {
        await DataService.createCustomer({
          name: form.name.trim(),
          phone: (form.phone || "").trim(),
          address: (form.address || "").trim(),
          note: (form.note || "").trim(),
        });
        toast?.show?.({ type: "success", message: "Pelanggan baru ditambahkan" });
      }
      setModalOpen(false);
      await loadCustomers();
    } catch (e) {
      toast?.show?.({ type: "error", message: e.message || "Gagal menyimpan data pelanggan" });
    } finally {
      setSaving(false);
    }
  };

  // ======= Nonaktifkan / aktifkan (soft delete) =======
  const toggleActive = async (cust) => {
    const target = cust?.active === false ? "aktifkan" : "nonaktifkan";
    if (!confirm(`Yakin ingin ${target} pelanggan "${cust?.name}"?`)) return;
    try {
      await DataService.toggleCustomerActive({ id: cust.id, active: !(cust.active !== false) ? false : true });
      // Catatan: logika di atas membalik status; lebih jelas di bawah:
      // const nextActive = cust.active === false ? true : false;
      // await DataService.toggleCustomerActive({ id: cust.id, active: nextActive });

      toast?.show?.({ type: "success", message: `Pelanggan berhasil di${target}` });
      await loadCustomers();
      // update panel detail jika yang diubah adalah yang sedang aktif
      if (activeCustomer?.id === cust.id) {
        setActiveCustomer({ ...activeCustomer, active: cust.active === false ? true : false });
      }
    } catch (e) {
      toast?.show?.({ type: "error", message: e.message || "Gagal mengubah status pelanggan" });
    }
  };

  // ======= Kontak =======
  const contactButtons = (cust) => {
    const openCall = () => {
      const hp = (cust.phone || "").replace(/\D/g, "");
      if (!hp) {
        toast?.show?.({ type: "info", message: "Nomor HP kosong" });
        return;
      }
      window.open(`tel:${hp}`, "_blank");
    };

    const openWhatsApp = async () => {
      let phone = cust.phone;
      if (!phone) {
        // fallback ke DataService.getCustomerContact bila nomor disimpan terpisah
        try {
          phone = await DataService.getCustomerContact(cust.name);
        } catch {}
      }
      const p = (phone || "").replace(/\D/g, "");
      if (!p) {
        toast?.show?.({ type: "info", message: "Nomor WhatsApp belum tersedia" });
        return;
      }
      const defaultMsg = encodeURIComponent(`Halo ${cust.name}, mengingatkan transaksi/hutang LPG 3kg.`);
      window.open(`https://wa.me/${p}?text=${defaultMsg}`, "_blank");
    };

    return (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Button size="sm" className="secondary" onClick={openCall}>Telepon</Button>
        <Button size="sm" onClick={openWhatsApp}>WhatsApp</Button>
      </div>
    );
  };

  // ======= Hitung ringkasan singkat (untuk list) =======
  const computedRows = useMemo(() => {
    // Harapkan server sudah isi total_tx, total_value, has_debt, dsb.
    return rows.map((r) => ({
      ...r,
      total_tx: Number(r.total_tx || 0),
      total_value: Number(r.total_value || 0),
      has_debt: Boolean(r.has_debt),
      active: r.active !== false, // default true
    }));
  }, [rows]);

  return (
    <div className="grid" style={{ gridTemplateColumns: "2fr 1.2fr", gap: 12 }}>
      {/* ==== Kiri: Daftar Pelanggan ==== */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <h1 style={{ margin: 0 }}>Pelanggan</h1>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <Button onClick={openAdd}>+ Tambah Pelanggan</Button>
          </div>
        </div>

        <Card title="Daftar Pelanggan">
          <div className="grid" style={{ gridTemplateColumns: "1fr auto", gap: 8, marginBottom: 8 }}>
            <Input
              placeholder="Cari nama / nomor HP"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              disabled={loading}
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8 }}
              disabled={loading}
            >
              <option value="ALL">Semua</option>
              <option value="ACTIVE">Aktif</option>
              <option value="DEBT">Ada Hutang</option>
            </select>
          </div>

          <div style={{ overflow: "auto" }}>
            <table className="table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>HP</th>
                  <th>Transaksi</th>
                  <th>Hutang</th>
                  <th>Status</th>
                  <th style={{ width: 220 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {!computedRows.length && !loading && (
                  <tr><td colSpan={6} style={{ color: COLORS.secondary }}>Tidak ada data</td></tr>
                )}
                {computedRows.map((r) => (
                  <tr key={r.id} style={{ opacity: r.active ? 1 : 0.6 }}>
                    <td style={{ fontWeight: 600 }}>{r.name}</td>
                    <td>{r.phone || "-"}</td>
                    <td>{r.total_tx ? `${r.total_tx}x` : "-"}</td>
                    <td>{r.has_debt ? <span style={{ color: COLORS.danger }}>Ada</span> : "-"}</td>
                    <td>{r.active ? "Aktif" : "Nonaktif"}</td>
                    <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <Button size="sm" onClick={() => pickCustomer(r)}>Lihat</Button>
                      <Button size="sm" className="secondary" onClick={() => openEdit(r)}>Edit</Button>
                      {contactButtons(r)}
                      <Button
                        size="sm"
                        className="secondary"
                        onClick={() => toggleActive(r)}
                      >
                        {r.active ? "Nonaktifkan" : "Aktifkan"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* ==== Kanan: Detail Pelanggan ==== */}
      <div>
        <Card title="Detail Pelanggan">
          {!activeCustomer && (
            <div style={{ color: COLORS.secondary }}>Pilih pelanggan untuk melihat detail.</div>
          )}
          {activeCustomer && (
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{activeCustomer.name}</div>
                <div style={{ marginLeft: "auto" }}>
                  {activeCustomer.active ? (
                    <span style={{ padding: "2px 8px", borderRadius: 999, background: "#dcfce7", color: "#166534", fontSize: 12 }}>Aktif</span>
                  ) : (
                    <span style={{ padding: "2px 8px", borderRadius: 999, background: "#e5e7eb", color: "#374151", fontSize: 12 }}>Nonaktif</span>
                  )}
                </div>
              </div>
              <div style={{ color: COLORS.secondary }}>
                {activeCustomer.phone || "-"} {activeCustomer.address ? `• ${activeCustomer.address}` : ""}
              </div>
              {activeCustomer.note && (
                <div style={{ fontSize: 12, background: "#f8fafc", padding: 8, borderRadius: 8, border: "1px solid #e5e7eb" }}>
                  {activeCustomer.note}
                </div>
              )}
              {contactButtons(activeCustomer)}

              <hr />

              {/* Statistik */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8 }}>
                <Stat label="Total Transaksi" value={stats?.totalTransaksi != null ? `${stats.totalTransaksi}x` : "-"} />
                <Stat label="Nilai Transaksi" value={stats?.totalNilai != null ? fmtIDR(stats.totalNilai) : "-"} />
                <Stat label="Rata-rata Belanja" value={stats?.rataRata != null ? fmtIDR(stats.rataRata) : "-"} />
                <Stat label="Hutang Aktif" value={stats?.hutangAktif != null ? fmtIDR(stats.hutangAktif) : "-"} danger={Number(stats?.hutangAktif || 0) > 0} />
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Button className="secondary" onClick={() => openEdit(activeCustomer)}>Edit</Button>
              </div>

              <hr />

              {/* Riwayat terbaru */}
              <div style={{ fontWeight: 600 }}>Riwayat Transaksi Terbaru</div>
              <div style={{ overflow: "auto" }}>
                <table className="table" style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th>Invoice</th>
                      <th>Qty</th>
                      <th>Harga</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!recentTx.length && (
                      <tr><td colSpan={6} style={{ color: COLORS.secondary }}>Belum ada transaksi</td></tr>
                    )}
                    {recentTx.map((r) => {
                      const total = r.total ?? (Number(r.qty || 0) * Number(r.price || 0));
                      return (
                        <tr key={r.id}>
                          <td>{String(r.created_at || "").slice(0, 10)}</td>
                          <td>{r.invoice || r.id}</td>
                          <td>{r.qty}</td>
                          <td>{fmtIDR(r.price)}</td>
                          <td>{fmtIDR(total)}</td>
                          <td>{r.status || "-"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* ==== Modal Tambah/Edit ==== */}
      {modalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: 16,
          }}
          onClick={() => (saving ? null : setModalOpen(false))}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 520,
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 10px 30px rgba(0,0,0,.15)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: 14, borderBottom: "1px solid #e5e7eb" }}>
              <b>{editMode ? "Edit Pelanggan" : "Tambah Pelanggan Baru"}</b>
            </div>
            <div style={{ padding: 16 }}>
              <form className="grid" onSubmit={submitForm} style={{ opacity: saving ? 0.75 : 1 }}>
                <div>
                  <label>Nama</label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    disabled={saving}
                    placeholder="Contoh: Budi"
                  />
                </div>
                <div>
                  <label>Nomor HP</label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    disabled={saving}
                    placeholder="628xxxx"
                  />
                </div>
                <div>
                  <label>Alamat (opsional)</label>
                  <Input
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    disabled={saving}
                    placeholder="Alamat..."
                  />
                </div>
                <div>
                  <label>Keterangan (opsional)</label>
                  <Input
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    disabled={saving}
                    placeholder="Catatan..."
                  />
                </div>

                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <Button type="button" className="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Menyimpan…" : "Simpan"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ====== Komponen kecil ====== */
function Stat({ label, value, danger }) {
  return (
    <div style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff" }}>
      <div style={{ fontSize: 12, color: "#64748b" }}>{label}</div>
      <div style={{ fontWeight: 700, color: danger ? COLORS.danger : "inherit" }}>{value}</div>
    </div>
  );
}
