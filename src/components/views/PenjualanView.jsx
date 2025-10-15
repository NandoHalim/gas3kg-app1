// src/components/views/PelangganView.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Stack, Typography, Card, CardHeader, CardContent, Button,
  TextField, Select, MenuItem, Dialog, DialogTitle, DialogContent,
  DialogActions, Table, TableHead, TableBody, TableRow, TableCell,
  Chip, Divider, Tooltip, Grid,
  useTheme,
  useMediaQuery,
  IconButton,
  AppBar,
  Toolbar
} from "@mui/material";
import { COLORS } from "../../utils/constants.js";
import { fmtIDR } from "../../utils/helpers.js";
import { DataService } from "../../services/DataService.js";
import { useToast } from "../../context/ToastContext.jsx";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
    <Box component="form" onSubmit={submit} sx={{ display: "grid", gap: 3 }}>
      <TextField 
        label="Nama" 
        fullWidth 
        value={form.name}
        onChange={(e) => setForm({ ...form, name: onlyLettersSpaces(e.target.value) })}
        disabled={saving}
        size={isMobile ? "small" : "medium"}
      />
      <TextField 
        label="Nomor HP" 
        fullWidth 
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: normalizePhone62(e.target.value) })}
        helperText="Nomor harus diawali 62 (bukan 0). Contoh: 628123456789"
        disabled={saving}
        size={isMobile ? "small" : "medium"}
      />
      <TextField 
        label="Alamat (opsional)" 
        fullWidth 
        value={form.address}
        onChange={(e) => setForm({ ...form, address: e.target.value })}
        disabled={saving}
        size={isMobile ? "small" : "medium"}
        multiline
        rows={2}
      />
      <TextField 
        label="Keterangan (opsional)" 
        fullWidth 
        value={form.note}
        onChange={(e) => setForm({ ...form, note: e.target.value })}
        disabled={saving}
        size={isMobile ? "small" : "medium"}
        multiline
        rows={2}
      />

      <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2 }}>
        <Button 
          variant="outlined" 
          onClick={onCancel} 
          disabled={saving}
          size={isMobile ? "small" : "medium"}
        >
          Batal
        </Button>
        <Button 
          variant="contained" 
          type="submit" 
          disabled={saving}
          size={isMobile ? "small" : "medium"}
        >
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      fullScreen={isMobile}
    >
      {isMobile && (
        <AppBar position="static" elevation={1}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Detail Pelanggan
            </Typography>
            <IconButton edge="end" color="inherit" onClick={onClose}>
              <EditIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
      )}
      {!isMobile && <DialogTitle>Detail Pelanggan: {customer?.name}</DialogTitle>}
      <DialogContent dividers sx={{ pt: isMobile ? 2 : 1 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {customer?.phone || "-"} {customer?.address && `• ${customer.address}`}
        </Typography>
        {customer?.note && (
          <Box sx={{ mt: 1, p: 1.5, bgcolor: "#f8fafc", borderRadius: 1, border: "1px solid #e5e7eb" }}>
            <Typography variant="body2">{customer.note}</Typography>
          </Box>
        )}
        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}><Stat label="Total Transaksi" value={stats?.totalTransaksi ? `${stats.totalTransaksi}x` : "-"} /></Grid>
          <Grid item xs={12} sm={6}><Stat label="Nilai Transaksi" value={stats?.totalNilai != null ? fmtIDR(stats.totalNilai) : "-"} /></Grid>
          <Grid item xs={12} sm={6}><Stat label="Rata-rata Belanja" value={stats?.rataRata != null ? fmtIDR(stats.rataRata) : "-"} /></Grid>
          <Grid item xs={12} sm={6}><Stat label="Hutang Aktif" value={stats?.hutangAktif ? fmtIDR(stats.hutangAktif) : "-"} danger={Number(stats?.hutangAktif) > 0} /></Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" gutterBottom>Riwayat Transaksi Terbaru</Typography>
        <Table size="small" sx={{ minWidth: isMobile ? 600 : 'auto' }}>
          <TableHead>
            <TableRow>
              <TableCell>Tanggal</TableCell>
              <TableCell>Invoice</TableCell>
              <TableCell align="right">Qty</TableCell>
              <TableCell align="right">Total</TableCell>
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
                <TableCell align="right">{r.qty}</TableCell>
                <TableCell align="right">{fmtIDR(r.total ?? (r.qty * r.price))}</TableCell>
                <TableCell>
                  <Chip 
                    label={r.status} 
                    size="small" 
                    color={r.status === 'LUNAS' ? 'success' : 'warning'}
                    variant="outlined"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} size={isMobile ? "large" : "medium"} fullWidth={isMobile}>
          Tutup
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* =======================
   Main View
   ======================= */
export default function PelangganView() {
  const toast = useToast();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
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
    <Box sx={{ pb: { xs: 8, md: 2 } }}>
      {/* Header */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "stretch", sm: "center" }}>
            <Typography variant="h5" fontWeight={700} sx={{ flexGrow: 1 }}>
              Pelanggan
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => setModalAdd(true)}
              startIcon={<AddIcon />}
              size={isSmallMobile ? "medium" : "large"}
              fullWidth={isSmallMobile}
            >
              Tambah Pelanggan
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Search & Filter */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "stretch", sm: "center" }}>
            <TextField 
              placeholder="Cari nama / HP..." 
              value={q} 
              onChange={(e) => setQ(e.target.value)}
              fullWidth
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <Select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              size="small"
              fullWidth={isSmallMobile}
              startAdornment={
                <InputAdornment position="start">
                  <FilterListIcon fontSize="small" />
                </InputAdornment>
              }
            >
              <MenuItem value="ALL">Semua</MenuItem>
              <MenuItem value="ACTIVE">Aktif</MenuItem>
              <MenuItem value="DEBT">Ada Hutang</MenuItem>
            </Select>
          </Stack>
        </CardContent>
      </Card>

      {/* Customer Table */}
      <Card>
        <CardHeader title="Daftar Pelanggan" />
        <CardContent sx={{ p: 0 }}>
          <TableContainer sx={{ maxHeight: isMobile ? 'calc(100vh - 200px)' : '600px' }}>
            <Table stickyHeader size={isMobile ? "small" : "medium"}>
              <TableHead>
                <TableRow>
                  <TableCell>Nama</TableCell>
                  {!isSmallMobile && <TableCell>HP</TableCell>}
                  {!isMobile && <TableCell align="center">Transaksi</TableCell>}
                  <TableCell align="center">Hutang</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!computedRows.length && !loading && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        Tidak ada data pelanggan
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {computedRows.map((r) => (
                  <TableRow 
                    key={r.id} 
                    sx={{ 
                      opacity: r.active ? 1 : 0.6,
                      '&:hover': { backgroundColor: 'action.hover' }
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {r.name}
                      </Typography>
                      {isSmallMobile && (
                        <Typography variant="caption" color="text.secondary">
                          {r.phone}
                        </Typography>
                      )}
                    </TableCell>
                    {!isSmallMobile && (
                      <TableCell>
                        <Typography variant="body2">{r.phone}</Typography>
                      </TableCell>
                    )}
                    {!isMobile && (
                      <TableCell align="center">
                        <Typography variant="body2">
                          {r.total_tx ? `${r.total_tx}x` : "-"}
                        </Typography>
                      </TableCell>
                    )}
                    <TableCell align="center">
                      {r.has_debt ? (
                        <Chip label="Ada" color="error" size="small" />
                      ) : (
                        <Typography variant="body2" color="text.secondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={r.active ? "Aktif" : "Nonaktif"} 
                        color={r.active ? "success" : "default"}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Stack 
                        direction="row" 
                        spacing={0.5} 
                        justifyContent="center"
                        flexWrap="wrap"
                      >
                        <Tooltip title="Lihat Detail">
                          <IconButton 
                            size="small" 
                            onClick={() => setModalDetail(r)}
                            color="primary"
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton 
                            size="small" 
                            onClick={() => setModalEdit(r)}
                            color="secondary"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={r.active ? "Nonaktifkan" : "Aktifkan"}>
                          <IconButton 
                            size="small" 
                            onClick={() => toggleActive(r)}
                            color={r.active ? "warning" : "success"}
                          >
                            {r.active ? <ToggleOffIcon fontSize="small" /> : <ToggleOnIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Modal Add */}
      <Dialog 
        open={modalAdd} 
        onClose={() => setModalAdd(false)} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isSmallMobile}
      >
        <DialogTitle>Tambah Pelanggan</DialogTitle>
        <DialogContent>
          <CustomerForm 
            mode="add" 
            onCancel={() => setModalAdd(false)} 
            onSaved={() => { setModalAdd(false); loadCustomers(); }} 
          />
        </DialogContent>
      </Dialog>

      {/* Modal Edit */}
      <Dialog 
        open={!!modalEdit} 
        onClose={() => setModalEdit(null)} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isSmallMobile}
      >
        <DialogTitle>Edit Pelanggan</DialogTitle>
        <DialogContent>
          <CustomerForm 
            mode="edit" 
            initial={modalEdit} 
            onCancel={() => setModalEdit(null)} 
            onSaved={() => { setModalEdit(null); loadCustomers(); }} 
          />
        </DialogContent>
      </Dialog>

      {/* Modal Detail */}
      <CustomerDetail 
        customer={modalDetail} 
        open={!!modalDetail} 
        onClose={() => setModalDetail(null)} 
      />
    </Box>
  );
}

/* ========== Small Stat Card ========== */
function Stat({ label, value, danger }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ 
      p: 2, 
      borderRadius: 2, 
      border: "1px solid", 
      borderColor: "divider", 
      bgcolor: "background.paper",
      textAlign: 'center'
    }}>
      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
        {label}
      </Typography>
      <Typography 
        variant={isMobile ? "body1" : "subtitle1"} 
        fontWeight={700} 
        color={danger ? "error.main" : "text.primary"}
      >
        {value}
      </Typography>
    </Box>
  );
}