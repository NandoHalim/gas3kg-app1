// src/components/ui/StatCard.jsx
import * as React from "react";
import { Card, CardContent, Stack, Typography, LinearProgress, Box } from "@mui/material";

/**
 * Props:
 * - title: string
 * - value: number | string (akan dianimasikan jika number)
 * - subtitle: string
 * - icon: ReactNode (ikon besar di kiri)
 * - loading: boolean
 * - color: "primary" | "secondary" | "success" | "warning" | "error" | "info"
 * - format: (n:number)=>string (opsional format angka)
 */
export default function StatCard({
  title,
  value = 0,
  subtitle,
  icon,
  loading = false,
  color = "primary",
  format,
}) {
  const isNumber = typeof value === "number";
  const [display, setDisplay] = React.useState(isNumber ? 0 : value);

  // animasi count-up
  React.useEffect(() => {
    if (!isNumber) return;
    const target = Number(value) || 0;
    const duration = 500; // ms
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const current = Math.round(target * p);
      setDisplay(current);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);

  const shown =
    isNumber ? (format ? format(Number(display)) : `${display}`) : String(value);

  return (
    <Card sx={{ borderRadius: 2 }}>
      {loading && <LinearProgress color={color} />}
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center">
          {icon && (
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                bgcolor: `${color}.light`,
                color: `${color}.dark`,
                display: "grid",
                placeItems: "center",
              }}
            >
              {icon}
            </Box>
          )}
          <Stack spacing={0.25}>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {shown}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
