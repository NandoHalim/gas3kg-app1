import React from "react";
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  Chip,
  Skeleton,
} from "@mui/material";

function fmtIDR(n = 0) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Number(n) || 0);
}

function fmtDate(d) {
  if (!d) return "—";
  const x = new Date(d);
  if (isNaN(x)) return "—";
  return x.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

function statusChip(status) {
  const s = String(status || "").toUpperCase();
  if (s === "LUNAS") return <Chip size="small" color="success" label="LUNAS" />;
  if (s === "DIBATALKAN") return <Chip size="small" color="default" variant="outlined" label="BATAL" />;
  if (s === "PIUTANG" || s === "BELUM LUNAS") return <Chip size="small" color="warning" label="PIUTANG" />;
  return <Chip size="small" label={status || "—"} variant="outlined" />;
}

/**
 * Props:
 * - rows: [{ id, invoice, customer, qty, price, method, status, created_at }]
 * - loading?: boolean
 * - isSmallMobile?: boolean
 */
export default function RecentTransactionsTable({ rows = [], loading = false }) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardHeader
        title={
          <Typography variant="h6" fontWeight={800}>
            Transaksi Terbaru
          </Typography>
        }
        sx={{ pb: 0 }}
      />
      <CardContent sx={{ pt: 2 }}>
        {loading ? (
          <Box>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={36} sx={{ mb: 1, borderRadius: 1 }} />
            ))}
          </Box>
        ) : rows.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Belum ada transaksi.
          </Typography>
        ) : (
          // NOTE:
          // - Horizontal scroll ditangani OLEH container di DashboardContainer (Box mx:-2 px:2 overflowX:auto)
          // - Di sini kita sediakan VERTICAL scroll + header sticky
          <Box sx={{ maxHeight: "60vh", overflowY: "auto" }}>
            <Table size="small" sx={{ minWidth: 720 }}>
              <TableHead>
                <TableRow>
                  {["Tanggal", "Invoice", "Pelanggan", "Qty", "Metode", "Status", "Nilai"].map((h) => (
                    <TableCell
                      key={h}
                      sx={{
                        position: "sticky",
                        top: 0,
                        zIndex: 1,
                        backgroundColor: "background.paper",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => {
                  const total =
                    r.total != null ? Number(r.total) : (Number(r.qty) || 0) * (Number(r.price) || 0);
                  return (
                    <TableRow hover key={r.id}>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>{fmtDate(r.created_at)}</TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>{r.invoice || `#${r.id}`}</TableCell>
                      <TableCell sx={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.customer || "—"}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>{r.qty}</TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>{r.method}</TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>{statusChip(r.status)}</TableCell>
                      <TableCell
                        align="right"
                        sx={{ whiteSpace: "nowrap", fontWeight: 800, fontVariantNumeric: "tabular-nums" }}
                      >
                        {fmtIDR(total)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
