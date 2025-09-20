// src/components/views/PelangganView.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Stack, Typography, Card, CardHeader, CardContent, Button,
  TextField, Select, MenuItem, Dialog, DialogTitle, DialogContent,
  DialogActions, Table, TableHead, TableBody, TableRow, TableCell,
  Chip, Divider, Tooltip, Grid
} from "@mui/material";
import { COLORS } from "../../utils/constants.js";
import { fmtIDR } from "../../utils/helpers.js";
import { DataService } from "../../services/DataService.js";
import { useToast } from "../../context/ToastContext.jsx";

/* ======================
   Helpers & Validators
   ====================== */
const onlyLettersSpaces = (s) => s.replace(/[^A-Za-z\s]/g, "");
const normalizePhone62 = (raw) => {
  let val = String(raw || "").replace(/\D/g, "");
  if (!val.startsWith("62")) {
    val = "62" + val.replace(/^0+/, "");
  }
  if (val === "" || val === "6" || val === "62") return "62";
  return val;
};
const isValidPhone62 = (p) => /^62[0-9]{8,15}$/.test(String(p || "").trim());
const isValidName = (n) => /^[A-Za-z\s]+$/.test(String(n || "").trim());

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

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (!form.name.trim() || !isValidName(form.name)) {
      toast?.show?.({ type: "error", message: "Nama hanya boleh huruf dan spasi" });
      return;
    }
    if (!isValidPhone62(form.phone)) {
      toast?.show?.({ type: "error", message: "Nomor HP harus dimulai dengan 62 (min 10 digit)" });
      return;
    }
    try {
      setSaving(true);
      if (mode === "edit" && initial?.id) {
        await DataService.updateCustomer({ id: initial.id, ...form });
        toast?.show?.({ type: "success", message: "Data pelanggan diperbarui" });
      } else {
        await DataService.createCustomer(form);
        toast?.show?.({ type: "success", message: "Pelanggan baru ditambahkan" });
      }
      onSaved?.();
    } catch (e2) {
      toast?.show?.({ type: "error", message: e2.message || "Gagal menyimpan" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box component="form" onSubmit={submit} sx={{ display: "grid", gap: 2 }}>
      <TextField label="Nama" fullWidth value={form.name}
        onChange={(e) => setForm({ ...form, name: onlyLettersSpaces(e.target.value) })}
        disabled={saving} />
      <TextField label="Nomor HP" fullWidth value={form.phone}
        onChange={(e) => setForm({ ...form, phone: normalizePhone62(e.target.value) })}
        helperText="Nomor harus diawali 62 (bukan 0). Contoh: 628123456789"
        disabled={saving} />
      <TextField label="Alamat (opsional)" fullWidth value={form.address}
        onChange={(e) => setForm({ ...form, address: e.target.value })}
        disabled={saving} />
      <TextField label="Keterangan (opsional)" fullWidth value={form.note}
        onChange={(e) => setForm({ ...form, note: e.target.value })}
        disabled={saving} />

      <Stack direction="row" spacing={1} justifyContent="flex-end">
        <Button variant="outlined" onClick={onCancel} disabled={saving}>Batal</Button>
        <Button variant="contained" type="submit" disabled={saving}>
          {saving ? "Menyimpan…" : "Simpan"}
        </Button>
      </Stack>
    </Box>
  );
}

/* =======================
   Detail Pelanggan
   ======================= */
function CustomerDetail({ customer, open, onClose }) {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [recentTx, setRecentTx] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!open || !customer) return;
      try {
        const st = await DataService.getCustomerStats({ customer_id: customer.id, name: customer.name });
        const tx = await DataService.getSalesHistory({ q: customer.name, limit: 10 });
        if (alive) {
          setStats(st || null);
          setRecentTx(tx || []);
        }
      } catch (e) {
        toast?.show?.({ type: "error", message: e.message || "Gagal memuat detail" });
      }
    })();
    return () => { alive = false; };
  }, [open, customer]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Detail Pelanggan: {customer?.name}</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary">
          {customer?.phone || "-"} {customer?.address && `• ${customer.address}`}
        </Typography>
        {customer?.note && (
          <Box sx={{ mt: 1, p: 1, bgcolor: "#f8fafc", borderRadius: 1, border: "1px solid #e5e7eb" }}>
            {customer.note}
          </Box>
        )}
        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={6}><Stat label="Total Transaksi" value={stats?.totalTransaksi ? `${stats.totalTransaksi}x` : "-"} /></Grid>
          <Grid item xs={6}><Stat label="Nilai Transaksi" value={stats?.totalNilai != null ? fmtIDR(stats.totalNilai) : "-"} /></Grid>
          <Grid item xs={6}><Stat label="Rata-rata Belanja" value={stats?.rataRata != null ? fmtIDR(stats.rataRata) : "-"} /></Grid>
          <Grid item xs={6}><Stat label="Hutang Aktif" value={stats?.hutangAktif ? fmtIDR(stats.hutangAktif) : "-"} danger={Number(stats?.hutangAktif) > 0} /></Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2">Riwayat Transaksi Terbaru</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Tanggal</TableCell>
              <TableCell>Invoice</TableCell>
              <TableCell>Qty</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!recentTx.length && (
              <TableRow><TableCell colSpan={5} align="center">Belum ada transaksi</TableCell></TableRow>
            )}
            {recentTx.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{String(r.created_at || "").slice(0, 10)}</TableCell>
                <TableCell>{r.invoice || r.id}</TableCell>
                <TableCell>{r.qty}</TableCell>
                <TableCell>{fmtIDR(r.total ?? (r.qty * r.price))}</TableCell>
                <TableCell>{r.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Tutup</Button>
      </DialogActions>
    </Dialog>
  );
}

/* =======================
   Main View
   ======================= */
export default function PelangganView() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("ALL");

  const [modalAdd, setModalAdd] = useState(false);
  const [modalEdit, setModalEdit] = useState(null);
  const [modalDetail, setModalDetail] = useState(null);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await DataService.getCustomers({ q, filter, limit: 300 });
      setRows(data || []);
    } catch (e) {
      toast?.show?.({ type: "error", message: e.message });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { loadCustomers(); }, [q, filter]);

  const computedRows = useMemo(() => (rows || []).map((r) => ({
    ...r,
    has_debt: !!r.has_debt,
    active: r.active !== false,
  })), [rows]);

  const toggleActive = async (cust) => {
    const target = cust.active ? "nonaktifkan" : "aktifkan";
    if (!window.confirm(`Yakin ingin ${target} pelanggan "${cust.name}"?`)) return;
    try {
      await DataService.toggleCustomerActive({ id: cust.id, active: !cust.active });
      toast?.show?.({ type: "success", message: `Pelanggan ${target}` });
      await loadCustomers();
    } catch (e) {
      toast?.show?.({ type: "error", message: e.message });
    }
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center">
        <Typography variant="h5" fontWeight={700}>Pelanggan</Typography>
        <Box sx={{ ml: "auto" }}>
          <Button variant="contained" onClick={() => setModalAdd(true)}>+ Tambah</Button>
        </Box>
      </Stack>

      <Card>
        <CardHeader title="Daftar Pelanggan" />
        <CardContent>
          <Stack direction="row" spacing={2} mb={2}>
            <TextField placeholder="Cari nama / HP" value={q} onChange={(e) => setQ(e.target.value)} fullWidth />
            <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <MenuItem value="ALL">Semua</MenuItem>
              <MenuItem value="ACTIVE">Aktif</MenuItem>
              <MenuItem value="DEBT">Ada Hutang</MenuItem>
            </Select>
          </Stack>

          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nama</TableCell>
                <TableCell>HP</TableCell>
                <TableCell>Transaksi</TableCell>
                <TableCell>Hutang</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!computedRows.length && !loading && (
                <TableRow><TableCell colSpan={6} align="center">Tidak ada data</TableCell></TableRow>
              )}
              {computedRows.map((r) => (
                <TableRow key={r.id} sx={{ opacity: r.active ? 1 : 0.5 }}>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>{r.phone}</TableCell>
                  <TableCell>{r.total_tx ? `${r.total_tx}x` : "-"}</TableCell>
                  <TableCell>
                    {r.has_debt ? <Chip label="Ada" color="error" size="small" /> : "-"}
                  </TableCell>
                  <TableCell>{r.active ? "Aktif" : "Nonaktif"}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Button size="small" onClick={() => setModalDetail(r)}>Lihat</Button>
                      <Button size="small" variant="outlined" onClick={() => setModalEdit(r)}>Edit</Button>
                      <Button size="small" variant="outlined" onClick={() => toggleActive(r)}>
                        {r.active ? "Nonaktifkan" : "Aktifkan"}
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal Add */}
      <Dialog open={modalAdd} onClose={() => setModalAdd(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Tambah Pelanggan</DialogTitle>
        <DialogContent><CustomerForm mode="add" onCancel={() => setModalAdd(false)} onSaved={() => { setModalAdd(false); loadCustomers(); }} /></DialogContent>
      </Dialog>

      {/* Modal Edit */}
      <Dialog open={!!modalEdit} onClose={() => setModalEdit(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Pelanggan</DialogTitle>
        <DialogContent><CustomerForm mode="edit" initial={modalEdit} onCancel={() => setModalEdit(null)} onSaved={() => { setModalEdit(null); loadCustomers(); }} /></DialogContent>
      </Dialog>

      {/* Modal Detail */}
      <CustomerDetail customer={modalDetail} open={!!modalDetail} onClose={() => setModalDetail(null)} />
    </Stack>
  );
}

/* ========== Small Stat Card ========== */
function Stat({ label, value, danger }) {
  return (
    <Box sx={{ p: 1, borderRadius: 1, border: "1px solid #e5e7eb", bgcolor: "#fff" }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="subtitle2" fontWeight={700} color={danger ? "error" : "inherit"}>
        {value}
      </Typography>
    </Box>
  );
}
