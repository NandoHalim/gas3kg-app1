// src/components/views/Dashboard/ui/EmptyStateRow.jsx
import React from "react";
import { TableRow, TableCell, Stack, Typography, Button } from "@mui/material";
import InboxIcon from "@mui/icons-material/Inbox";

/**
 * Props:
 * - colSpan: number (wajib untuk melebar di tabel)
 * - message?: string | ReactNode
 * - hint?: string
 * - actionLabel?: string
 * - onAction?: () => void
 */
export default function EmptyStateRow({
  colSpan = 1,
  message = "Tidak ada data",
  hint,
  actionLabel,
  onAction,
}) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} sx={{ py: 6 }}>
        <Stack spacing={1} alignItems="center" justifyContent="center">
          <InboxIcon color="disabled" sx={{ fontSize: 36 }} />
          <Typography variant="body2" color="text.secondary" align="center">
            {message}
          </Typography>
          {hint && (
            <Typography variant="caption" color="text.secondary" align="center">
              {hint}
            </Typography>
          )}
          {actionLabel && onAction && (
            <Button size="small" variant="outlined" onClick={onAction} sx={{ mt: 0.5 }}>
              {actionLabel}
            </Button>
          )}
        </Stack>
      </TableCell>
    </TableRow>
  );
}
