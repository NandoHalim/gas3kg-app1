import React from "react";
import { Card, Stack, Box, Typography, Chip } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { fmtIDR } from "../../../../utils/helpers.js";

const fmtPct = (n) => (n === null || n === undefined) ? "–" : `${(Number(n)).toFixed(1)}%`;

function ComparisonCard({ title, current, previous, growth, type = "qty" }) {
  const isPositive = growth > 0;
  const theme = useTheme();
  
  return (
    <Card variant="outlined" sx={{ 
      p: 2, 
      background: alpha(isPositive ? theme.palette.success.main : theme.palette.error.main, 0.05),
      border: `1px solid ${alpha(isPositive ? theme.palette.success.main : theme.palette.error.main, 0.2)}`
    }}>
      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
        {title}
      </Typography>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
        <Box>
          <Typography variant="h6" fontWeight={700}>
            {type === 'currency' ? fmtIDR(current) : current}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            vs {type === 'currency' ? fmtIDR(previous) : previous} sebelumnya
          </Typography>
        </Box>
        <Chip
          label={`${isPositive ? '+' : ''}${fmtPct(growth)}`}
          color={isPositive ? 'success' : 'error'}
          variant="filled"
          size="small"
        />
      </Stack>
    </Card>
  );
}

export default ComparisonCard;