// src/components/views/PengaturanView.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Stack, Typography, Card, CardHeader, CardContent, Grid, TextField, Button,
  Chip, Table, TableHead, TableRow, TableCell, TableBody, Paper, TableContainer,
  MenuItem, Select, FormControl, InputLabel, IconButton, Tooltip, Alert, Dialog,
  DialogTitle, DialogContent, DialogActions, Skeleton, Checkbox, ListItemText,
  Tabs, Tab
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import UploadIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import SettingsSuggestIcon from "@mui/icons-material/SettingsSuggest";
import ShieldIcon from "@mui/icons-material/Shield";
import LockResetIcon from "@mui/icons-material/LockReset";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import PersonAddIcon from "@mui/icons-material/PersonAddAlt";

import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { useSettings } from "../../context/SettingsContext.jsx";
import { DataService } from "../../services/DataService.js";
import { DEFAULT_PRICE, PRICE_OPTIONS, PAYMENT_METHODS } from "../../utils/constants.js";
import { fmtIDR } from "../../utils/helpers.js";

/* ===== Wrapper: resolve role & redirect non-admin ===== */
export default function PengaturanView() {
  const { user, initializing } = useAuth();
  const [role, setRole] = useState(null);

  useEffect(() => {
    let on = true;
    (async () => {
      if (initializing) return;
      if (!user) { on && setRole("user"); return; }
      const r = await DataService.getUserRoleById(user.id).catch(()=>"user");
      on && setRole((r || "user").toLowerCase());
    })();
    return () => { on = false; };
  }, [user, initializing]);

  if (initializing || role == null) {
    return (
      <Stack spacing={2}>
        <Typography variant="h5" fontWeight={800}>Pengaturan</Typography>
        <Skeleton height={40} /><Skeleton height={160} /><Skeleton height={240} />
      </Stack>
    );
  }

  if (role !== "admin") {
    return (
      <Box>
        <Typography variant="h5" fontWeight={800} gutterBottom>Pengaturan</Typography>
        <Alert severity="warning" variant="outlined">
          Menu ini hanya tersedia untuk <b>admin</b>.
        </Alert>
      </Box>
    );
  }

  return <SettingsAdmin />;
}

/* ===== Halaman pengaturan utk admin ===== */
function SettingsAdmin() {
  const toast = useToast();
  const { user } = useAuth(); // diperlukan untuk actorId
  const { settings, loading: settingsLoading, saveSettings, changePassword } = useSettings();

  // TAB
  const [tab, setTab] = useState(0); // 0: Pengaturan Dasar, 1: Manajemen User

  // state settings (local form)
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [businessName, setBusinessName] = useState("");
  const [defaultPrice, setDefaultPrice] = useState(DEFAULT_PRICE);
  const [hpp, setHpp] = useState(0);
  const [paymentMethods, setPaymentMethods] = useState(PAYMENT_METHODS);

  // users
  const [users, setUsers] = useState([]);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("user");

  // busy flags
  const [busy, setBusy] = useState(false);
  const [userBusyId, setUserBusyId] = useState(null);

  // ganti password (admin sendiri)
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newPass2, setNewPass2] = useState("");

  // dialog konfirmasi
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [confirmPwdOpen, setConfirmPwdOpen] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  // dialog user mgmt
  const [confirmUserResetOpen, setConfirmUserResetOpen] = useState({ open: false, id: null });
  const [confirmUserDeleteOpen, setConfirmUserDeleteOpen] = useState({ open: false, id: null, email: "" });
  const [confirmUserRoleOpen, setConfirmUserRoleOpen] = useState({ open: false, id: null, email: "", makeAdmin: true });

  // initial load dari DataService + sinkron ke SettingContext
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const s = await DataService.getSettings();
        if (!alive) return;
        const merged = { ...settings, ...(s || {}) };

        setBusinessName(merged.business_name || "");
        setDefaultPrice(Number(merged.default_price || DEFAULT_PRICE));
        setHpp(Number(merged.hpp || 0));
        setPaymentMethods(
          Array.isArray(merged.payment_methods) ? merged.payment_methods : PAYMENT_METHODS
        );

        await fetchUsers();
        setErr("");
      } catch (e) {
        if (!alive) return;
        setErr(e.message || "Gagal memuat pengaturan");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [settingsLoading]);

  const summary = useMemo(() => ({
    hargaLabel: fmtIDR(defaultPrice),
    hppLabel: hpp > 0 ? fmtIDR(hpp) : "-",
    metodeLabel: (paymentMethods || []).join(", "),
  }), [defaultPrice, hpp, paymentMethods]);

  /* ====== SETTINGS actions ====== */
  const doSaveSettings = async () => {
    try {
      setBusy(true);
      const safeName = String(businessName || "").trim() || settings.business_name || "Usaha Saya";
      await saveSettings({
        business_name: safeName,
        default_price: Number(defaultPrice) || DEFAULT_PRICE,
        hpp: Number(hpp) || 0,
        payment_methods: paymentMethods,
      });
      toast?.show?.({ type: "success", message: "Pengaturan disimpan (global)." });
    } catch (e) {
      toast?.show?.({ type: "error", message: e.message || "Gagal menyimpan pengaturan" });
    } finally {
      setBusy(false);
      setConfirmSaveOpen(false);
    }
  };

  const doChangePassword = async () => {
    if (!newPass || newPass !== newPass2) {
      toast?.show?.({ type: "error", message: "Password baru tidak cocok" });
      return;
    }
    try {
      setBusy(true);
      await changePassword(oldPass, newPass);
      toast?.show?.({ type: "success", message: "Password berhasil diubah." });
      setOldPass(""); setNewPass(""); setNewPass2("");
    } catch (e) {
      toast?.show?.({ type: "error", message: e.message || "Gagal mengubah password" });
    } finally {
      setBusy(false);
      setConfirmPwdOpen(false);
    }
  };

  const doHardReset = async () => {
    try {
      setBusy(true);
      await DataService.hardResetAll();
      toast?.show?.({ type: "success", message: "Hard reset berhasil." });
    } catch (e) {
      toast?.show?.({ type: "error", message: e.message || "Gagal hard reset" });
    } finally {
      setBusy(false);
      setConfirmResetOpen(false);
    }
  };

  /* ====== USER MANAGEMENT (pakai DataService) ====== */
  async function fetchUsers() {
    try {
      const arr = await DataService.getAllLocalUsers();
      setUsers(arr);
    } catch (e) {
      toast?.show?.({ type: "error", message: e.message || "Gagal memuat pengguna" });
      setUsers([]);
    }
  }

  const addUser = async () => {
    const email = newEmail.trim();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast?.show?.({ type: "error", message: "Email tidak valid" });
      return;
    }
    try {
      setBusy(true);
      await DataService.manageUser({
        actorId: user?.id,
        userId: email, // bisa email atau UID; fungsi SQL kamu harus handle
        action: "set_role",
        role: newRole,
      });
      setNewEmail("");
      setNewRole("user");
      await fetchUsers();
      toast?.show?.({ type: "success", message: "User ditambahkan / diundang." });
    } catch (e) {
      toast?.show?.({ type: "error", message: e.message || "Gagal menambah user" });
    } finally {
      setBusy(false);
    }
  };

  const doResetUserData = async (id) => {
    try {
      setUserBusyId(id);
      await DataService.manageUser({
        actorId: user?.id,
        userId: id,
        action: "flag_reset",
      });
      toast?.show?.({ type: "success", message: "User ditandai untuk reset data." });
    } catch (e) {
      toast?.show?.({ type: "error", message: e.message || "Gagal reset user" });
    } finally {
      setUserBusyId(null);
      setConfirmUserResetOpen({ open: false, id: null });
    }
  };

  const doDeleteUser = async (id) => {
    try {
      setUserBusyId(id);
      await DataService.manageUser({
        actorId: user?.id,
        userId: id,
        action: "delete_local",
      });
      await fetchUsers();
      toast?.show?.({ type: "success", message: "User dihapus dari lokal." });
    } catch (e) {
      toast?.show?.({ type: "error", message: e.message || "Gagal menghapus user" });
    } finally {
      setUserBusyId(null);
      setConfirmUserDeleteOpen({ open: false, id: null, email: "" });
    }
  };

  const doToggleAdmin = async (id, makeAdmin) => {
    try {
      setUserBusyId(id);
      await DataService.manageUser({
        actorId: user?.id,
        userId: id,
        action: "set_role",
        role: makeAdmin ? "admin" : "user",
      });
      await fetchUsers();
      toast?.show?.({ type: "success", message: makeAdmin ? "User dijadikan admin." : "Hak admin dicabut." });
    } catch (e) {
      toast?.show?.({ type: "error", message: e.message || "Gagal mengubah role" });
    } finally {
      setUserBusyId(null);
      setConfirmUserRoleOpen({ open: false, id: null, email: "", makeAdmin: true });
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

  return (
    <Stack spacing={2} sx={{ pb: { xs: 8, md: 2 } }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography variant="h5" fontWeight={800}>Pengaturan</Typography>
        <Chip icon={<SettingsSuggestIcon />} label="Admin Only" size="small" sx={{ ml: 1 }} />
        <Box sx={{ ml: "auto" }} />
      </Stack>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable">
        <Tab label="Pengaturan Dasar" />
        <Tab label="Manajemen User" icon={<AdminPanelSettingsIcon />} iconPosition="start" />
      </Tabs>

      {err && <Alert severity="error" variant="outlined">{err}</Alert>}

      {/* ======= TAB 0: PENGATURAN DASAR ======= */}
      {tab === 0 && (
        <>
          <Card>
            <CardHeader title="Pengaturan Dasar (Global)" />
            <CardContent>
              {loading ? (
                <Stack spacing={1}><Skeleton height={36}/><Skeleton height={36}/><Skeleton height={36}/></Stack>
              ) : (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Nama Usaha"
                      fullWidth
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Toko Gas 3KG"
                      helperText="Tidak akan disimpan kosong — akan memakai nama terakhir yang valid."
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
                      helperText="Untuk perhitungan Laba Rugi"
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
                    <Stack direction="row" spacing={1} flexWrap="wrap">
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
                        onClick={() => setConfirmSaveOpen(true)}
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

          {/* Ganti Password (admin sendiri) */}
          <Card>
            <CardHeader title="Ganti Password" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    type="password" label="Password Lama" fullWidth
                    value={oldPass} onChange={(e)=>setOldPass(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    type="password" label="Password Baru" fullWidth
                    value={newPass} onChange={(e)=>setNewPass(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    type="password" label="Ulangi Password Baru" fullWidth
                    value={newPass2} onChange={(e)=>setNewPass2(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Stack direction="row" justifyContent="flex-end">
                    <Button
                      startIcon={<LockResetIcon />} variant="outlined"
                      onClick={() => setConfirmPwdOpen(true)} disabled={busy}
                    >
                      Ganti Password
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Backup & Restore */}
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

          {/* Hard Reset */}
          <Card>
            <CardHeader title="Hard Reset (Hapus Semua Data)" />
            <CardContent>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Tindakan ini akan menghapus seluruh data (stok, log, penjualan, pelanggan).
                Pastikan Anda sudah melakukan backup.
              </Alert>
              <Button
                color="error"
                variant="contained"
                startIcon={<RestartAltIcon />}
                onClick={() => setConfirmResetOpen(true)}
                disabled={busy}
              >
                Hard Reset
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {/* ======= TAB 1: MANAJEMEN USER ======= */}
      {tab === 1 && (
        <Card>
          <CardHeader
            title="Manajemen User"
            action={<Chip icon={<AdminPanelSettingsIcon />} label="Admin mengelola user" size="small" />}
          />
          <CardContent>
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
                  Tambah / Undang
                </Button>
              </Grid>
            </Grid>

            <TableContainer component={Paper} sx={{ borderRadius: 1.5 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Email / UID</TableCell>
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
                    <TableRow key={u.user_id || u.id} hover>
                      <TableCell>{u.email || u.user_id}</TableCell>
                      <TableCell sx={{ textTransform: "lowercase", fontWeight: 600 }}>
                        {u.role || (u.is_admin ? "admin" : "user")}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Reset data user">
                          <span>
                            <IconButton
                              onClick={() => setConfirmUserResetOpen({ open: true, id: u.user_id || u.id })}
                              disabled={userBusyId === (u.user_id || u.id)}
                            >
                              <ShieldIcon />
                            </IconButton>
                          </span>
                        </Tooltip>

                        {(u.role || (u.is_admin ? "admin" : "user")) === "admin" ? (
                          <Tooltip title="Cabut hak admin">
                            <span>
                              <IconButton
                                onClick={() =>
                                  setConfirmUserRoleOpen({
                                    open: true,
                                    id: u.user_id || u.id,
                                    email: u.email || u.user_id,
                                    makeAdmin: false
                                  })
                                }
                                disabled={userBusyId === (u.user_id || u.id)}
                              >
                                <PersonRemoveIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Jadikan admin">
                            <span>
                              <IconButton
                                onClick={() =>
                                  setConfirmUserRoleOpen({
                                    open: true,
                                    id: u.user_id || u.id,
                                    email: u.email || u.user_id,
                                    makeAdmin: true
                                  })
                                }
                                disabled={userBusyId === (u.user_id || u.id)}
                              >
                                <PersonAddIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}

                        <Tooltip title="Hapus user (local meta)">
                          <span>
                            <IconButton
                              onClick={() =>
                                setConfirmUserDeleteOpen({
                                  open: true,
                                  id: u.user_id || u.id,
                                  email: u.email || u.user_id
                                })
                              }
                              disabled={userBusyId === (u.user_id || u.id)}
                            >
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
          </CardContent>
        </Card>
      )}

      {/* ====== Dialog Konfirmasi (Settings) ====== */}
      <Dialog open={confirmSaveOpen} onClose={() => setConfirmSaveOpen(false)}>
        <DialogTitle>Konfirmasi</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Apakah Anda yakin ingin <b>menyimpan</b> perubahan Pengaturan Dasar?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmSaveOpen(false)}>Batal</Button>
          <Button variant="contained" onClick={doSaveSettings} disabled={busy}>
            Ya, Simpan
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmPwdOpen} onClose={() => setConfirmPwdOpen(false)}>
        <DialogTitle>Konfirmasi</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Apakah Anda yakin ingin <b>mengganti password</b> akun ini?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmPwdOpen(false)}>Batal</Button>
          <Button variant="contained" onClick={doChangePassword} disabled={busy}>
            Ya, Ganti Password
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmResetOpen} onClose={() => setConfirmResetOpen(false)}>
        <DialogTitle>Konfirmasi Hard Reset</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Tindakan ini akan <b>menghapus semua data</b> dan tidak dapat dibatalkan.
            Apakah Anda yakin?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmResetOpen(false)}>Batal</Button>
          <Button color="error" variant="contained" onClick={doHardReset} disabled={busy}>
            Ya, Hapus Semua
          </Button>
        </DialogActions>
      </Dialog>

      {/* ====== Dialog Konfirmasi (User Mgmt) ====== */}
      <Dialog
        open={confirmUserResetOpen.open}
        onClose={() => setConfirmUserResetOpen({ open: false, id: null })}
      >
        <DialogTitle>Reset Data User</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Tindakan ini akan <b>menghapus data transaksi & stok milik user tersebut</b>.
            Lanjutkan?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmUserResetOpen({ open: false, id: null })}>Batal</Button>
          <Button
            startIcon={<ShieldIcon />}
            variant="contained"
            onClick={() => doResetUserData(confirmUserResetOpen.id)}
            disabled={userBusyId === confirmUserResetOpen.id}
          >
            Ya, Reset
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmUserDeleteOpen.open}
        onClose={() => setConfirmUserDeleteOpen({ open: false, id: null, email: "" })}
      >
        <DialogTitle>Hapus User</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Hapus user <b>{confirmUserDeleteOpen.email}</b> dari metadata lokal?
            (Akun auth tidak dihapus dari Auth.)
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmUserDeleteOpen({ open: false, id: null, email: "" })}>Batal</Button>
          <Button
            color="error"
            variant="contained"
            startIcon={<DeleteIcon />}
            onClick={() => doDeleteUser(confirmUserDeleteOpen.id)}
            disabled={userBusyId === confirmUserDeleteOpen.id}
          >
            Ya, Hapus
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmUserRoleOpen.open}
        onClose={() => setConfirmUserRoleOpen({ open: false, id: null, email: "", makeAdmin: true })}
      >
        <DialogTitle>{confirmUserRoleOpen.makeAdmin ? "Jadikan Admin" : "Cabut Hak Admin"}</DialogTitle>
        <DialogContent dividers>
          <Typography>
            {confirmUserRoleOpen.makeAdmin
              ? <>Jadikan <b>{confirmUserRoleOpen.email}</b> sebagai admin?</>
              : <>Cabut hak admin dari <b>{confirmUserRoleOpen.email}</b>?</>}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmUserRoleOpen({ open: false, id: null, email: "", makeAdmin: true })}>Batal</Button>
          <Button
            variant="contained"
            onClick={() => doToggleAdmin(confirmUserRoleOpen.id, confirmUserRoleOpen.makeAdmin)}
            disabled={userBusyId === confirmUserRoleOpen.id}
          >
            Ya, Lanjutkan
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
