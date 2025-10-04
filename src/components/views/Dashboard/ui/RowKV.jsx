import React from "react";
import { Stack, Typography } from "@mui/material";

function RowKV({ k, v, vSx }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography variant="body1" color="text.secondary" fontWeight={500}>
        {k}
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: 600, ...vSx }}>
        {v}
      </Typography>
    </Stack>
  );
}

export default RowKV;