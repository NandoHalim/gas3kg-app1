import React, { useEffect, useState } from "react";
import { DataService } from "../../services/DataService.js";
import { fmtIDR } from "../../utils/helpers.js";
import {
  Box,
  Stack,
  Typography,
  Card,
  CardHeader,
  CardContent,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  Skeleton,
  Alert,
  TextField,
  Button,
} from "@mui/material";

export default function LaporanView() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setErr("");
      const data = await DataService.getSalesHistory({
        from: from || undefined,
        to: to || undefined,
        limit: 2000,
      });
      setRows(data);
    } catch (e) {
      setErr(e.message || "Gagal memuat laporan");
    } finally {
      setLoading(false);
    }
  };

  // Ringkasan
  const omzet = rows.reduce((a, r) => a + Number(r.total || 0), 0);
  const laba = rows.reduce((a, r) => a + (Number(r.laba || 0)), 0);

  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={700}>
        Laporan
      </Typography>

      <Card>
        <CardHeader title="Filter Periode" />
        <CardContent>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <TextField
              label="Dari Tanggal"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Sampai Tanggal"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Button variant="contained" onClick={load} disabled={loading}>
              Tampilkan
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {err && <Alert severity="error">{err}</Alert>}

      <Card>
        <CardHeader title="Ringkasan" />
        <CardContent>
          {loading ? (
            <Skeleton height={40} />
          ) : (
            <Stack spacing={1}>
              <Typography>Omzet: {fmtIDR(omzet)}</Typography>
              <Typography>Laba: {fmtIDR(laba)}</Typography>
            </Stack>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Detail Transaksi" />
        <CardContent>
          {loading ? (
            <Skeleton height={200} />
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Tanggal</TableCell>
                    <TableCell>Pelanggan</TableCell>
                    <TableCell>Metode</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Harga</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{(r.created_at || "").slice(0, 10)}</TableCell>
                      <TableCell>{r.customer || "PUBLIC"}</TableCell>
                      <TableCell>{r.method}</TableCell>
                      <TableCell align="right">{r.qty}</TableCell>
                      <TableCell align="right">{fmtIDR(r.price)}</TableCell>
                      <TableCell align="right">{fmtIDR(r.total)}</TableCell>
                    </TableRow>
                  ))}
                  {!rows.length && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ color: "text.secondary" }}>
                        Tidak ada data
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}
