// src/components/views/PelangganView.jsx
import React, { useEffect, useMemo, useState } from "react";
import Card from "../ui/Card.jsx";
import Input from "../ui/Input.jsx";
import Button from "../ui/Button.jsx";
import { COLORS } from "../../utils/constants.js";
import { fmtIDR } from "../../utils/helpers.js";
import { DataService } from "../../services/DataService.js";
import { useToast } from "../../context/ToastContext.jsx";

/* ======================
   Helpers & Validators
   ====================== */
const onlyLettersSpaces = (s) => s.replace(/[^A-Za-z\s]/g, "");
const normalizePhone62 = (raw) => {
  // keep digits only
  let val = String(raw || "").replace(/\D/g, "");
  // drop leading zeros then enforce 62 prefix
  if (!val.startsWith("62")) {
    val = "62" + val.replace(/^0+/, "");
  }
  // prevent removing prefix accidentally
  if (val === "" || val === "6" || val === "62") return "62";
  return val;
};
// final check: must start with 62 and have 8-15 more digits (total 10-17)
const isValidPhone62 = (p) => /^62[0-9]{8,15}$/.test(String(p || "").trim());
const isValidName = (n) => /^[A-Za-z\s]+$/.test(String(n || "").trim());

/* ===============
   Reusable Modal
   =============== */
function Modal({ open, title, children, onClose, width = 560 }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.25)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={() => onClose?.()}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: width,
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 12px 30px rgba(0,0,0,.15)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: 14, borderBottom: "1px solid #e5e7eb" }}>
          <b>{title}</b>
        </div>
        <div style={{ padding: 16 }}>{children}</div>
      </div>
    </div>
  );
}

/* =======================
   Form Tambah / Edit
   ======================= */
function CustomerForm({ mode = "add", initial, onCancel, onSaved }) {
  const toast = useToast();

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: initial?.name || "",
    phone: normalizePhone62(initial?.phone ?? "62"),
    address: initial?.address || "",
    note: initial?.note || "",
  });

  const onChangeName = (e) =>
    setForm((p) => ({ ...p, name: onlyLettersSpaces(e.target.value) }));

  const onChangePhone = (e) =>
    setForm((p) => ({ ...p, phone: normalizePhone62(e.target.value) }));

  const submit = async (ev) => {
    ev?.preventDefault?.();
    if (saving) return;

    // Validasi
    if (!form.name.trim() || !isValidName(form.name)) {
      toast?.show?.({ type: "error", message: "Nama hanya boleh huruf dan spasi" });
      return;
    }
    if (!isValidPhone62(form.phone)) {
      toast?.show?.({
        type: "error",
        message: "Nomor HP harus dimulai dengan 62 dan hanya angka (min 10 digit)",
      });
      return;
    }

    try {
      setSaving(true);
      if (mode === "edit" && initial?.id) {
        await DataService.updateCustomer({
          id: initial.id,
          name: form.name.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          note: form.note.trim(),
        });
        toast?.show?.({ type: "success", message: "Data pelanggan diperbarui" });
      } else {
        await DataService.createCustomer({
          name: form.name.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          note: form.note.trim(),
        });
        toast?.show?.({ type: "success", message: "Pelanggan baru ditambahkan" });
      }
      onSaved?.();
    } catch (e) {
      toast?.show?.({ type: "error", message: e.message || "Gagal menyimpan pelanggan" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid" style={{ gap: 10 }}>
      <div>
        <label>Nama</label>
        <Input
          value={form.name}
          onChange={onChangeName}
          placeholder="Contoh: Budi"
          disabled={saving}
        />
      </div>

      <div>
        <label>Nomor HP</label>
        <Input
          value={form.phone}
          onChange={onChangePhone}
          disabled={saving}
          placeholder="62xxxxxxxxxx"
        />
        <div style={{ fontSize: 12, color: COLORS.secondary, marginTop: 4 }}>
          Nomor harus diawali 62 (bukan 0). Contoh: 628123456789.
        </div>
      </div>

      <div>
        <label>Alamat (opsional)</label>
        <Input
          value={form.address}
          onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
          disabled={saving}
        />
      </div>

      <div>
        <label>Keterangan (opsional)</label>
        <Input
          value={form.note}
          onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
          disabled={saving}
        />
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Button type="button" className="secondary" onClick={onCancel} disabled={saving}>
          Batal
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Menyimpan…" : "Simpan"}
        </Button>
      </div>
    </form>
  );
}

/* =======================
   Detail Pelanggan (Modal)
   ======================= */
function CustomerDetail({ customer, open, onClose }) {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [recentTx, setRecentTx] = useState([]);
  const c = customer;

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!open || !c) return;
      try {
        const st = await DataService.getCustomerStats({ customer_id: c.id, name: c.name });
        const tx = await DataService.getSalesHistory({ q: c.name, limit: 20 });
        if (alive) {
          setStats(st || null);
          setRecentTx(tx || []);
        }
      } catch (e) {
        toast?.show?.({ type: "error", message: e.message || "Gagal memuat detail" });
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, c?.id]);

  const openCall = () => {
    const hp = String(c?.phone || "").replace(/\D/g, "");
    if (!hp) {
      toast?.show?.({ type: "info", message: "Nomor HP kosong" });
      return;
    }
    window.open(`tel:${hp}`, "_blank");
  };

  const openWA = async () => {
    let phone = c?.phone;
    if (!phone) {
      try {
        phone = await DataService.getCustomerContact(c?.name);
      } catch {}
    }
    const p = String(phone || "").replace(/\D/g, "");
    if (!p) {
      toast?.show?.({ type: "info", message: "Nomor WhatsApp belum tersedia" });
      return;
    }
    const msg = encodeURIComponent(`Halo ${c?.name}, mengingatkan transaksi/hutang LPG 3kg.`);
    window.open(`https://wa.me/${p}?text=${msg}`, "_blank");
  };

  return (
    <Modal open={open} title={`Detail Pelanggan: ${c?.name || "-"}`} onClose={onClose} width={760}>
      {!c ? (
        <div style={{ color: COLORS.secondary }}>Tidak ada data.</div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ color: COLORS.secondary }}>
            {c.phone || "-"} {c.address ? `• ${c.address}` : ""}
          </div>
          {c.note && (
            <div
              style={{
                fontSize: 12,
                background: "#f8fafc",
                padding: 8,
                borderRadius: 8,
                border: "1px solid #e5e7eb",
              }}
            >
              {c.note}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Button className="secondary" onClick={openCall}>Telepon</Button>
            <Button onClick={openWA}>WhatsApp</Button>
          </div>

          <hr />

          {/* Statistik */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8 }}>
            <Stat label="Total Transaksi" value={stats?.totalTransaksi != null ? `${stats.totalTransaksi}x` : "-"} />
            <Stat label="Nilai Transaksi" value={stats?.totalNilai != null ? fmtIDR(stats.totalNilai) : "-"} />
            <Stat label="Rata-rata Belanja" value={stats?.rataRata != null ? fmtIDR(stats.rataRata) : "-"} />
            <Stat
              label="Hutang Aktif"
              value={stats?.hutangAktif != null ? fmtIDR(stats.hutangAktif) : "-"}
              danger={Number(stats?.hutangAktif || 0) > 0}
            />
          </div>

          <hr />

          {/* Riwayat Terbaru */}
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

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button onClick={onClose}>Tutup</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* =======================
   Komponen Utama (List)
   ======================= */
export default function PelangganView() {
  const toast = useToast();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("ALL"); // ALL | ACTIVE | DEBT

  // Modal state
  const [modalAdd, setModalAdd] = useState(false);
  const [modalEdit, setModalEdit] = useState(null); // object customer
  const [modalDetail, setModalDetail] = useState(null); // object customer

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await DataService.getCustomers({ q, filter, limit: 300 });
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

  const computedRows = useMemo(
    () =>
      (rows || []).map((r) => ({
        ...r,
        total_tx: Number(r.total_tx || 0),
        total_value: Number(r.total_value || 0),
        has_debt: !!r.has_debt,
        active: r.active !== false,
      })),
    [rows]
  );

  const toggleActive = async (cust) => {
    const target = cust?.active ? "nonaktifkan" : "aktifkan";
    if (!confirm(`Yakin ingin ${target} pelanggan "${cust?.name}"?`)) return;
    try {
      await DataService.toggleCustomerActive({ id: cust.id, active: !cust.active });
      toast?.show?.({ type: "success", message: `Pelanggan berhasil di${target}` });
      await loadCustomers();
    } catch (e) {
      toast?.show?.({ type: "error", message: e.message || "Gagal mengubah status pelanggan" });
    }
  };

  return (
    <div className="grid" style={{ gridTemplateColumns: "1fr", gap: 12 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <h1 style={{ margin: 0 }}>Pelanggan</h1>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <Button onClick={() => setModalAdd(true)}>+ Tambah Pelanggan</Button>
        </div>
      </div>

      <Card title="Daftar Pelanggan">
        {/* Filter Bar */}
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

        {/* Table */}
        <div style={{ overflow: "auto" }}>
          <table className="table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Nama</th>
                <th>HP</th>
                <th>Transaksi</th>
                <th>Hutang</th>
                <th>Status</th>
                <th style={{ width: 260 }}>Aksi</th>
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
                    <Button size="sm" onClick={() => setModalDetail(r)}>Lihat</Button>
                    <Button size="sm" className="secondary" onClick={() => setModalEdit(r)}>Edit</Button>
                    <Button size="sm" className="secondary" onClick={() => toggleActive(r)}>
                      {r.active ? "Nonaktifkan" : "Aktifkan"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal: Tambah */}
      <Modal open={modalAdd} title="Tambah Pelanggan Baru" onClose={() => setModalAdd(false)}>
        <CustomerForm
          mode="add"
          onCancel={() => setModalAdd(false)}
          onSaved={async () => {
            setModalAdd(false);
            await loadCustomers();
          }}
        />
      </Modal>

      {/* Modal: Edit */}
      <Modal
        open={!!modalEdit}
        title={`Edit Pelanggan${modalEdit ? `: ${modalEdit.name}` : ""}`}
        onClose={() => setModalEdit(null)}
      >
        {modalEdit && (
          <CustomerForm
            mode="edit"
            initial={modalEdit}
            onCancel={() => setModalEdit(null)}
            onSaved={async () => {
              setModalEdit(null);
              await loadCustomers();
            }}
          />
        )}
      </Modal>

      {/* Modal: Detail */}
      <CustomerDetail
        customer={modalDetail}
        open={!!modalDetail}
        onClose={() => setModalDetail(null)}
      />
    </div>
  );
}

/* ========== Small stat card ========== */
function Stat({ label, value, danger }) {
  return (
    <div style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff" }}>
      <div style={{ fontSize: 12, color: "#64748b" }}>{label}</div>
      <div style={{ fontWeight: 700, color: danger ? COLORS.danger : "inherit" }}>{value}</div>
    </div>
  );
}
