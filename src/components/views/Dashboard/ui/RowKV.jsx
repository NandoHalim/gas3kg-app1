// src/components/views/Dashboard/ui/RowKV.jsx
import React from "react";
import { Stack, Typography, Skeleton, IconButton, Tooltip } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

/**
 * Baris key–value untuk ringkasan.
 *
 * Props:
 * - k: string | ReactNode (label kiri)
 * - v: string | number | ReactNode (nilai kanan)
 * - loading?: boolean
 * - copyable?: boolean  // kalau true & v string → tampil ikon copy
 * - mono?: boolean      // font monospace untuk angka/nilai
 */
export default function RowKV({ k, v, loading = false, copyable = false, mono = false }) {
  const canCopy = copyable && typeof v === "string" && v.length > 0;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(v);
    } catch {
      // no-op
    }
  };

  if (loading) {
    return (
      <Stack direction="row" alignItems="center" spacing={1} sx={{ py: 0.5 }}>
        <Skeleton variant="text" width={120} />
        <Skeleton variant="text" width={80} sx={{ ml: "auto" }} />
      </Stack>
    );
  }

  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ py: 0.5 }}>
      <Typography variant="body2" color="text.secondary">
        {k}
      </Typography>
      <Typography
        variant="body2"
        fontWeight={800}
        sx={{
          ml: "auto",
          fontVariantNumeric: "tabular-nums",
          ...(mono ? { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" } : null),
        }}
      >
        {v}
      </Typography>
      {canCopy && (
        <Tooltip title="Salin">
          <IconButton size="small" onClick={copy} edge="end" sx={{ ml: 0.5 }}>
            <ContentCopyIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );
}
