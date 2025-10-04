import React from "react";
import { TableRow, TableCell, Box, Typography } from "@mui/material";
import InsightsOutlined from "@mui/icons-material/InsightsOutlined";

function EmptyStateRow({ colSpan = 5, message = "Tidak ada data", hint }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} align="center" sx={{ py: 6 }}>
        <Box sx={{ color: "text.secondary" }}>
          <InsightsOutlined sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
          <Typography variant="body1" gutterBottom fontWeight={600}>
            {message}
          </Typography>
          {hint && <Typography variant="body2">{hint}</Typography>}
        </Box>
      </TableCell>
    </TableRow>
  );
}

export default EmptyStateRow;