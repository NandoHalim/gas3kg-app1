import React from "react";
import { Box, Stack, Typography } from "@mui/material";

function fmtDateLong(d = new Date()) {
  try {
    return d.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export default function HeaderSection() {
  const now = new Date();

  return (
    <Box
      component="header"
      className="sticky"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 5,
        bgcolor: "background.paper",
        borderBottom: "1px solid",
        borderColor: "divider",
        px: { xs: 2, md: 3 },
        py: 1.5,
        borderRadius: 2,
      }}
    >
      <Stack direction="row" alignItems="baseline" spacing={1}>
        <Typography variant="h5" fontWeight={800}>
          Dashboard
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Typography variant="caption" color="text.secondary">
          {fmtDateLong(now)} · update {now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
        </Typography>
      </Stack>
    </Box>
  );
}
