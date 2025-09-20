import React, { useState } from "react";
import { DataService } from "../../services/DataService.js";
import { todayStr } from "../../utils/helpers.js";
import { useToast } from "../../context/ToastContext.jsx";

import {
  Box,
  Stack,
  Typography,
  Card,
  CardHeader,
  CardContent,
  TextField,
  Button,
  Alert,
  Grid,
} from "@mui/material";

export default function StokView({ stocks = {}, onSaved }) {
  const toast = useToast();

  // Form state
  const [qtyIsi, setQtyIsi] = useState(1);
  const [dateIsi, setDateIsi] = useState(todayStr());
  const [noteIsi, setNoteIsi] = useState("isi dari agen (tukar kosong)");

  const [qtyKosong, setQtyKosong] = useState(1);
  const [dateKosong, setDateKosong] = useState(todayStr());
  const [noteKosong, setNoteKosong] = useState("beli tabung");

  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const stokISI = Number(stocks?.ISI || 0);
  const stokKOSONG = Number(stocks?.KOSONG || 0);

  const saveIsi = async () => {
    setErr("");
    try {
      setSaving(true);
      const snap = await DataService.addIsi({
        qty: Number(qtyIsi),
        date: dateIsi,
        note: noteIsi,
      });
      toast?.show?.({ type: "success", message: "Stok ISI berhasil ditambah" });
      onSaved?.(snap);
    } catch (e) {
      setErr(e.message || "Gagal tambah stok ISI");
      toast?.show?.({ type: "error", message: e.message || "Gagal tambah stok ISI" });
    } finally {
      setSaving(false);
    }
  };

  const saveKosong = async () => {
    setErr("");
    try {
      setSaving(true);
      const snap = await DataService.addKosong({
        qty: Number(qtyKosong),
        date: dateKosong,
        note: noteKosong,
      });
      toast?.show?.({ type: "success", message: "Stok KOSONG berhasil ditambah" });
      onSaved?.(snap);
    } catch (e) {
      setErr(e.message || "Gagal tambah stok KOSONG");
      toast?.show?.({ type: "error", message: e.message || "Gagal tambah stok KOSONG" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={700}>
        Stok
      </Typography>

      {err && (
        <Alert severity="error" onClose={() => setErr("")}>
          {err}
        </Alert>
      )}

      <Grid container spacing={2}>
        {/* Tambah ISI */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Tambah Stok ISI (tukar dari KOSONG)" />
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Qty"
                    type="number"
                    value={qtyIsi}
                    onChange={(e) => setQtyIsi(Math.max(0, parseInt(e.target.value || 0, 10)))}
                    inputProps={{ min: 1 }}
                    sx={{ width: 140 }}
                  />
                  <TextField
                    label="Tanggal"
                    type="date"
                    value={dateIsi}
                    onChange={(e) => setDateIsi(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ width: 220 }}
                  />
                </Stack>

                <TextField
                  label="Catatan"
                  value={noteIsi}
                  onChange={(e) => setNoteIsi(e.target.value)}
                  placeholder="Keterangan (opsional)"
                  fullWidth
                />

                <Stack direction="row" spacing={2} alignItems="center">
                  <Button variant="contained" onClick={saveIsi} disabled={saving}>
                    {saving ? "Menyimpan…" : "Simpan"}
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    Stok KOSONG saat ini: <b>{stokKOSONG}</b> (harus cukup untuk ditukar).
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Tambah KOSONG */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Tambah Stok KOSONG (beli tabung)" />
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Qty"
                    type="number"
                    value={qtyKosong}
                    onChange={(e) =>
                      setQtyKosong(Math.max(0, parseInt(e.target.value || 0, 10)))
                    }
                    inputProps={{ min: 1 }}
                    sx={{ width: 140 }}
                  />
                  <TextField
                    label="Tanggal"
                    type="date"
                    value={dateKosong}
                    onChange={(e) => setDateKosong(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ width: 220 }}
                  />
                </Stack>

                <TextField
                  label="Catatan"
                  value={noteKosong}
                  onChange={(e) => setNoteKosong(e.target.value)}
                  placeholder="Keterangan (opsional)"
                  fullWidth
                />

                <Stack direction="row" spacing={2} alignItems="center">
                  <Button variant="contained" onClick={saveKosong} disabled={saving}>
                    {saving ? "Menyimpan…" : "Simpan"}
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    Stok ISI saat ini: <b>{stokISI}</b>.
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Snapshot stok sekarang */}
      <Box sx={{ mt: 1, color: "text.secondary" }}>
        <Typography variant="body2">
          Snapshot: ISI <b>{stokISI}</b> • KOSONG <b>{stokKOSONG}</b>
        </Typography>
      </Box>
    </Stack>
  );
}
