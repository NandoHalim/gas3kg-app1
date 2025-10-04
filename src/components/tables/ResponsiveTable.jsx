import React from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Card, Stack, Typography, useMediaQuery
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

export default function ResponsiveTable({ columns = [], data = [], loading = false }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  if (isMobile) {
    return (
      <Stack spacing={1}>
        {data.map((row, idx) => (
          <Card key={idx} sx={{ p: 2 }}>
            <Stack spacing={1}>
              {columns.map((col) => (
                <Stack key={col.key} direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    {col.header}
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {col.render ? col.render(row) : row[col.key]}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Card>
        ))}
      </Stack>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table size="medium" sx={{ minWidth: 650 }}>
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell key={col.key}>{col.header}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={columns.length} align="center">
                Loading...
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, idx) => (
              <TableRow key={idx}>
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    {col.render ? col.render(row) : row[col.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
