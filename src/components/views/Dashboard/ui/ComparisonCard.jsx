// src/components/views/Dashboard/ui/ComparisonCard.jsx
import React from "react";
import { Card, CardContent, Stack, Typography, Chip } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";

/**
 * Props:
 * - title: string
 * - currentLabel?: string (default: "Saat ini")
 * - currentValue: string | number
 * - previousLabel?: string (default: "Sebelumnya")
 * - previousValue: string | number
 * - changePct?: number  (persen, bisa negatif)
 * - formatter?: (n) => string
 */
export default function ComparisonCard({
  title,
  currentLabel = "Saat ini",
  currentValue,
  previousLabel = "Sebelumnya",
  previousValue,
  changePct,
  formatter,
}) {
  const Icon = Number(changePct) >= 0 ? TrendingUpIcon : TrendingDownIcon;
  const color =
    changePct == null
      ? "default"
      : Number(changePct) > 0
      ? "success"
      : Number(changePct) < 0
      ? "error"
      : "default";
  const pctStr =
    changePct == null || !isFinite(changePct)
      ? "—"
      : `${changePct > 0 ? "+" : ""}${(Math.abs(changePct) < 0.1 ? changePct.toFixed(2) : changePct.toFixed(1))}%`;

  const show = (v) => (formatter ? formatter(v) : v);

  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent sx={{ p: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          {title}
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Stack sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {currentLabel}
            </Typography>
            <Typography variant="h6" fontWeight={800} sx={{ fontVariantNumeric: "tabular-nums" }}>
              {show(currentValue)}
            </Typography>
          </Stack>
          <Stack sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {previousLabel}
            </Typography>
            <Typography variant="h6" fontWeight={800} sx={{ fontVariantNumeric: "tabular-nums" }}>
              {show(previousValue)}
            </Typography>
          </Stack>
          <Chip
            size="small"
            color={color}
            icon={changePct == null ? undefined : <Icon fontSize="small" />}
            label={pctStr}
            variant={color === "default" ? "outlined" : "filled"}
            sx={{ fontWeight: 700 }}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}
