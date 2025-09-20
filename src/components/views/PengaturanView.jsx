import React, { useEffect, useState } from "react";
import { DataService } from "../../services/DataService.js";
import {
  Box,
  Stack,
  Typography,
  Card,
  CardHeader,
  CardContent,
  TextField,
  Button,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";

export default function PengaturanView() {
  const [settings, setSettings] = useState({});
  const [users, setUsers] = useState([]);
  const [email, setEmail] = useState("");

  useEffect(() => {
    (async () => {
      const s = await DataService.getSettings();
      const u = await DataService.getUsers();
      setSettings(s || {});
      setUsers(u || []);
    })();
  }, []);

  const save = async () => {
    await DataService.saveSettings(settings);
    alert("Pengaturan tersimpan!");
  };

  const addUser = async () => {
    if (!email) return;
    await DataService.addUser({ email, role: "user" });
    const u = await DataService.getUsers();
    setUsers(u);
    setEmail("");
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={700}>
        Pengaturan
      </Typography>

      <Card>
        <CardHeader title="Umum" />
        <CardContent>
          <Stack spacing={2}>
            <TextField
              label="Nama Toko"
              value={settings.storeName || ""}
              onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
            />
            <TextField
              label="Alamat"
              value={settings.address || ""}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
            />
            <Button variant="contained" onClick={save}>
              Simpan
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Manajemen User (dummy)" />
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1}>
              <TextField
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
              />
              <Button variant="contained" onClick={addUser}>
                Tambah
              </Button>
            </Stack>

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.role}</TableCell>
                  </TableRow>
                ))}
                {!users.length && (
                  <TableRow>
                    <TableCell colSpan={2} sx={{ color: "text.secondary" }}>
                      Belum ada user
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Stack>
        </CardContent>
      </Card>

      <Divider />

      <Stack direction="row" spacing={2}>
        <Button
          variant="outlined"
          color="error"
          onClick={async () => {
            if (window.confirm("Yakin reset semua data?")) {
              await DataService.hardResetAll();
              alert("Data sudah direset!");
            }
          }}
        >
          Reset Semua Data
        </Button>
        <Button variant="outlined" onClick={() => DataService.exportAll()}>
          Export Data
        </Button>
      </Stack>
    </Stack>
  );
}
