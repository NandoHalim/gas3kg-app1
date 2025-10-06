// src/components/views/Dashboard/ui/ErrorBanner.jsx
import React from "react";
import {
  Alert,
  AlertTitle,
  Typography,
  Button,
  IconButton,
  Stack,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import ReportProblemOutlined from "@mui/icons-material/ReportProblemOutlined";
import CloseIcon from "@mui/icons-material/Close";

/**
 * Props:
 * - message: string | ReactNode   (wajib)
 * - detail?: string | ReactNode   (opsional, teks kecil di bawah)
 * - severity?: 'error' | 'warning' | 'info' | 'success'  (default: 'error')
 * - title?: string                (default berdasarkan severity, mis. "Terjadi kesalahan")
 * - dense?: boolean               (default: false) — padding lebih rapat (cocok mobile)
 * - onRetry?: () => void          (opsional; kalau ada → tombol "Coba Lagi")
 * - onClose?: () => void          (opsional; kalau ada → ikon tutup)
 * - actionLabel?: string          (default: "Coba Lagi")
 * - icon?: ReactNode              (default: ReportProblemOutlined)
 */
export default function ErrorBanner({
  message,
  detail,
  severity = "error",
  title,
  dense = false,
  onRetry,
  onClose,
  actionLabel = "Coba Lagi",
  icon,
}) {
  const theme = useTheme();

  const color = theme.palette[severity]?.main ?? theme.palette.error.main;
  const bg = alpha(color, 0.06);
  const bd = alpha(color, 0.22);

  const defaultTitle =
    title ||
    (severity === "error"
      ? "Terjadi kesalahan"
      : severity === "warning"
      ? "Perlu perhatian"
      : severity === "info"
      ? "Informasi"
      : "Berhasil");

  return (
    <Alert
      severity={severity}
      icon={icon ?? <ReportProblemOutlined />}
      variant="outlined"
      aria-live={severity === "error" ? "assertive" : "polite"}
      sx={{
        borderRadius: 2,
        border: `1px solid ${bd}`,
        background: bg,
        px: dense ? 1.5 : 2,
        py: dense ? 1 : 1.25,
      }}
      action={
        (onRetry || onClose) && (
          <Stack direction="row" spacing={1} alignItems="center">
            {onRetry && (
              <Button
                size="small"
                color={severity === "error" ? "inherit" : severity}
                onClick={onRetry}
                sx={{ textTransform: "none", fontWeight: 600 }}
              >
                {actionLabel}
              </Button>
            )}
            {onClose && (
              <IconButton
                size="small"
                onClick={onClose}
                aria-label="Tutup pemberitahuan"
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
          </Stack>
        )
      }
    >
      <AlertTitle sx={{ m: 0, lineHeight: 1.2, fontWeight: 700 }}>
        {defaultTitle}
      </AlertTitle>
      <Typography variant="body2" sx={{ mt: 0.25 }}>
        {message}
      </Typography>
      {detail && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mt: 0.5 }}
        >
          {detail}
        </Typography>
      )}
    </Alert>
  );
}
