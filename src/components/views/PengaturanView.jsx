// src/components/views/PengaturanView.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Card,
  CardHeader,
  CardContent,
  Grid,
  TextField,
  Button,
  Divider,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  TableContainer,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Skeleton,
  Checkbox,
  ListItemText,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import UploadIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import SettingsSuggestIcon from "@mui/icons-material/SettingsSuggest";
import ShieldIcon from "@mui/icons-material/Shield";

import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { DataService } from "../../services/DataService.js";
import { DEFAULT_PRICE, PRICE_OPTIONS, PAYMENT_METHODS } from "../../utils/constants.js";
import { fmtIDR } from "../../utils/helpers.js";

/* ===== Komponen ===== */
export default function PengaturanView() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const role = user?.role || "user";

  // 🚨 Paksa redirect jika bukan admin
  useEffect(() => {
    if (role !== "admin") {
      // opsional info singkat
      toast?.show?.({ type: "warning", message: "Akses khusus admin." });
      navigate("/", { replace: true });
    }
  }, [role, navigate, toast]);

  if (role !== "admin") {
    // render kosong sebentar agar tidak flicker sebelum redirect
    return null;
  }

  return <SettingsAdmin />;
}

/* ===== Halaman pengaturan utk admin ===== */
function SettingsAdmin() {
  const toast = useToast();

  // state settings
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [businessName, setBusinessName] = useState("");
  const [defaultPrice, setDefaultPrice] = useState(DEFAULT_PRICE);
  const [hpp, setHpp] = useState(0);
  const [paymentMethods, setPaymentMethods] = useState(PAYMENT_METHODS);

  // users
  const [users, setUsers] = useState([]);
  the
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [busy, setBusy] = useState(false);

  // dialog reset all
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const s = await DataService.getSettings();
        if (!alive) return;
        setBusinessName(s.business_name || "");
        setDefaultPrice(Number(s.default_price || DEFAULT_PRICE));
        setHpp(Number(s.hpp || 0));
        setPaymentMethods(Array.isArray(s.payment_methods) ? s.payment_methods : PAYMENT_METHODS);

        const u = await DataService.getUsers();
        if (!alive) return;
        setUsers(Array.isArray(u) ? u : []);
        setErr("");
      } catch (e) {
        if (!alive) return;
        setErr(e.message || "Gagal memuat pengaturan");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const summary = useMemo(() => {
    return {
      hargaLabel: fmtIDR(defaultPrice),
      hppLabel: hpp > 0 ? fmtIDR(hpp) : "-",
      metodeLabel: (paymentMethods || []).join(", "),
    };
  }, [defaultPrice, hpp, paymentMethods]);

  const saveSettings = async () => {
    try {
      setBusy(true);
      await DataService.saveSettings({
        business_name: businessName.trim(),
        default_price: Number(defaultPrice) || DEFAULT_PRICE,
        hpp: Number(hpp) || 0,
        payment_methods: paymentMethods,
      });
      toast?.show?.({ type: "success", message: "Pengaturan disimpan." });
    } catch (e) {
      toast?.show?.({ type: "error", message: e.message || "Gagal menyimpan pengaturan" });
    } finally {
      setBusy(false);
    }
  };

  const addUser = async () => {
    const email = newEmail.trim();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast?.show?.({ type: "error", message: "Email tidak valid" });
      return;
    }
    try {
      setBusy(true);
      await DataService.addUser({ email, role: newRole });
      const u = await DataService.getUsers();
      setUsers(u || []);
      setNewEmail("");
      setNewRole("user");
      toast?.show?.({ type: "success", message: "User ditambahkan." });
    } catch (e) {
      toast?.show?.({ type: "error", message: e.message || "Gagal menambah user" });
    } finally {
      setBusy(false);
    }
  };

  const changeUserRole = async (id, role) => {
    try {
      setBusy(true);
      await DataService.updateUserRole({ user_id: id, role });
      const u = await DataService.getUsers();
      setUsers(u || []);
      toast?.show?.({ type: "success", message: "Role diperbarui." });
    } catch (e) {
      toast?.show?.({ type: "error", message: e.message || "Gagal update role" });
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async (id) => {
    try {
      setBusy(true);
      await DataService.resetUserPassword({ user_id: id });
      toast?.show?.({ type: "success", message: "Permintaan reset password dikirim." });
    } catch (e) {
      toast?.show?.({ type: "error", message: e.message || "Gagal reset password" });
    } finally {
      setBusy(false);
    }
  };

  const onExport = async () => {
    try {
      setBusy(true);
      await DataService.exportAll();
      toast?.show?.({ type: "success", message: "Backup diexport." });
    } catch (e) {
      toast?.show?.({ type: "error", message: e.message || "Gagal export" });
    } finally {
      setBusy(false);
    }
  };

  const onImport = async (file) => {
    if (!file) return;
    try {
      setBusy(true);
      await DataService.importAll(file);
      toast?.show?.({ type: "success", message: "Import selesai." });
    } catch (e) {
      toast?.show?.({ type: "error", message: e.message || "Gagal import" });
    } finally {
      setBusy(false);
    }
  };

  const onHardReset = async () => {
    try {
      setBusy(true);
      await DataService.hardResetAll();
      toast?.show?.({ type: "success", message: "Hard reset berhasil." });
      setConfirmReset(false);
    } catch (e) {
      toast?.show?.({ type: "error", message: e.message || "Gagal hard reset" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack spacing={2} sx={{ pb: { xs: 8, md: 2 } }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography variant="h5" fontWeight={800}>Pengaturan</Typography>
        <Chip icon={<SettingsSuggestIcon />} label="Admin Only" size="small" color="default" sx={{ ml: 1 }} />
      </Stack>

      {err && <Alert severity="error" variant="outlined">{err}</Alert>}

      {/* 1.1 — Pengaturan Dasar (Harga Default & HPP) */}
      <Card>
        <CardHeader title="Pengaturan Dasar" />
        <CardContent>
          {loading ? (
            <Stack spacing={1}>
              <Skeleton height={36} /><Skeleton height={36} /><Skeleton height={36} />
            </Stack>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Nama Usaha"
                  fullWidth
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="default-price-label">Harga Default</InputLabel>
                  <Select
                    labelId="default-price-label"
                    label="Harga Default"
                    value={defaultPrice}
                    onChange={(e) => setDefaultPrice(Number(e.target.value))}
                  >
                    {PRICE_OPTIONS.map((p) => (
                      <MenuItem key={p} value={p}>{fmtIDR(p)}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  type="number"
                  label="HPP per Tabung"
                  fullWidth
                  value={hpp}
                  onChange={(e) => setHpp(Math.max(0, Number(e.target.value || 0)))}
                  helperText="Digunakan untuk hitung Laba Rugi"
                  inputProps={{ min: 0 }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="payment-methods-label">Metode Pembayaran Aktif</InputLabel>
                  <Select
                    multiple
                    labelId="payment-methods-label"
                    label="Metode Pembayaran Aktif"
                    value={paymentMethods}
                    onChange={(e) => setPaymentMethods(e.target.value)}
                    renderValue={(selected) => selected.join(", ")}
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <MenuItem key={m} value={m}>
                        <Checkbox checked={paymentMethods.indexOf(m) > -1} />
                        <ListItemText primary={m} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Chip label={`Harga default: ${summary.hargaLabel}`} />
                  <Chip label={`HPP: ${summary.hppLabel}`} />
                  <Chip label={`Metode: ${summary.metodeLabel}`} />
                </Stack>
              </Grid>

              <Grid item xs={12}>
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button
                    startIcon={<SaveIcon />}
                    variant="contained"
                    onClick={saveSettings}
                    disabled={busy}
                  >
                    Simpan Pengaturan
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* 4 — Manajemen User (sederhana / FE placeholder) */}
      <Card>
        <CardHeader
          title="Pengguna & Hak Akses"
          action={<Chip icon={<AdminPanelSettingsIcon />} label="Admin mengelola user" size="small" />}
        />
        <CardContent>
          {loading ? (
            <Stack spacing={1}>
              <Skeleton height={36} /><Skeleton height={36} /><Skeleton height={36} />
            </Stack>
          ) : (
            <>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email pengguna baru"
                    placeholder="nama@domain.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel id="new-role">Role</InputLabel>
                    <Select
                      labelId="new-role"
                      label="Role"
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                    >
                      <MenuItem value="user">user</MenuItem>
                      <MenuItem value="admin">admin</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md="auto">
                  <Button variant="contained" onClick={addUser} disabled={busy}>
                    Tambah User
                  </Button>
                </Grid>
              </Grid>

              <TableContainer component={Paper} sx={{ borderRadius: 1.5 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Email</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell align="right">Aksi</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {!users.length && (
                      <TableRow>
                        <TableCell colSpan={3} sx={{ color: "text.secondary" }}>
                          Belum ada user
                        </TableCell>
                      </TableRow>
                    )}
                    {users.map((u) => (
                      <TableRow key={u.id} hover>
                        <TableCell>{u.email}</TableCell>
                        <TableCell sx={{ minWidth: 160 }}>
                          <Select
                            size="small"
                            fullWidth
                            value={u.role}
                            onChange={(e) => changeUserRole(u.id, e.target.value)}
                            disabled={busy}
                          >
                            <MenuItem value="user">user</MenuItem>
                            <MenuItem value="admin">admin</MenuItem>
                          </Select>
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Reset password (placeholder)">
                            <span>
                              <IconButton onClick={() => resetPassword(u.id)} disabled={busy}>
                                <ShieldIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Hapus (nonaktifkan) — placeholder">
                            <span>
                              <IconButton disabled>
                                <DeleteIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </CardContent>
      </Card>

      {/* 6 — Backup & Restore */}
      <Card>
        <CardHeader title="Backup & Restore Data" />
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Button
                startIcon={<DownloadIcon />}
                variant="outlined"
                onClick={onExport}
                disabled={busy}
              >
                Export (Excel/JSON)
              </Button>
            </Grid>
            <Grid item>
              <Button
                component="label"
                startIcon={<UploadIcon />}
                variant="outlined"
                disabled={busy}
              >
                Import
                <input
                  hidden
                  type="file"
                  accept=".json,application/json"
                  onChange={(e) => onImport(e.target.files?.[0])}
                />
              </Button>
            </Grid>
          </Grid>
          <Box sx={{ mt: 1, color: "text.secondary", fontSize: 12 }}>
            Export akan menyimpan snapshot stok, penjualan, dan pelanggan.
          </Box>
        </CardContent>
      </Card>

      {/* 7 — Hard Reset */}
      <Card>
        <CardHeader title="Hard Reset (Hapus Semua Data)" />
        <CardContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Tindakan ini akan menghapus seluruh data di database (stok, log, penjualan, pelanggan). 
            Gunakan hanya bila Anda benar-benar yakin.
          </Alert>
          <Button
            color="error"
            variant="contained"
            startIcon={<RestartAltIcon />}
            onClick={() => setConfirmReset(true)}
            disabled={busy}
          >
            Hard Reset
          </Button>
        </CardContent>
      </Card>

      {/* Dialog konfirmasi reset */}
      <Dialog open={confirmReset} onClose={() => setConfirmReset(false)}>
        <DialogTitle>Konfirmasi Hard Reset</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Anda yakin ingin menghapus <b>semua</b> data? Tindakan ini tidak bisa dikembalikan.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmReset(false)}>Batal</Button>
          <Button color="error" variant="contained" onClick={onHardReset} disabled={busy}>
            Ya, hapus semuanya
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
