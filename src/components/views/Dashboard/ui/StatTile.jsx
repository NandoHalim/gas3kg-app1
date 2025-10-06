import React from "react";
import {
  Card,
  CardContent,
  Stack,
  Typography,
  Skeleton,
  Avatar,
  useTheme,
} from "@mui/material";

/**
 * Props:
 * - title: string
 * - value: number | string
 * - subtitle?: string
 * - icon?: ReactNode
 * - color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'default'
 * - loading?: boolean
 */
export default function StatTile({
  title,
  value,
  subtitle,
  icon,
  color = "primary",
  loading = false,
}) {
  const theme = useTheme();

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        flex: 1,
        minHeight: 112, // tinggi tetap (anti CLS)
        display: "flex",
      }}
    >
      <CardContent sx={{ p: 2, display: "flex", alignItems: "center", width: "100%" }}>
        {loading ? (
          <Stack spacing={1} sx={{ width: "100%" }}>
            <Skeleton variant="rounded" width={48} height={48} sx={{ borderRadius: 12 }} />
            <Skeleton variant="text" width="50%" />
            <Skeleton variant="text" width="70%" />
          </Stack>
        ) : (
          <Stack direction="row" spacing={2} sx={{ width: "100%" }} alignItems="center">
            <Avatar
              variant="rounded"
              sx={{
                bgcolor:
                  color === "default"
                    ? theme.palette.action.hover
                    : theme.palette[color]?.light || theme.palette.primary.light,
                color:
                  color === "default"
                    ? theme.palette.text.primary
                    : theme.palette[color]?.main || theme.palette.primary.main,
                width: 48,
                height: 48,
                borderRadius: 2,
              }}
            >
              {icon || null}
            </Avatar>

            <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ textTransform: "uppercase", letterSpacing: 0.4 }}
              >
                {title}
              </Typography>

              <Typography
                variant="h6"
                fontWeight={900}
                noWrap
                sx={{ fontVariantNumeric: "tabular-nums" }}
                title={String(value ?? "")}
              >
                {value ?? "—"}
              </Typography>

              {subtitle ? (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  noWrap
                  title={subtitle}
                  sx={{ display: "block" }}
                >
                  {subtitle}
                </Typography>
              ) : null}
            </Stack>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
