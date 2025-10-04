import React from "react";
import { Card, CardHeader, CardContent, Stack, Box, Typography, Chip, LinearProgress, Skeleton } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import Inventory2Icon from "@mui/icons-material/Inventory2";

const LOW_STOCK_THRESHOLD = 5;

function StockProgress({ isi, kosong, loading = false }) {
  const total = Math.max(isi + kosong, 1);
  const pctKosong = Math.round((kosong / total) * 100);
  const pctIsi = 100 - pctKosong;
  
  if (loading) return <Skeleton height={60} />;
  
  return (
    <Stack spacing={2}>
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="body2" fontWeight={600} color="success.main">
            Stok Isi ({isi})
          </Typography>
          <Typography variant="body2" fontWeight={600} color="text.secondary">
            {pctIsi}%
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={pctIsi}
          sx={{ 
            height: 12, 
            borderRadius: 6, 
            bgcolor: 'error.50',
            '& .MuiLinearProgress-bar': { 
              borderRadius: 6,
              background: `linear(90deg, #4CAF50, #66BB6A)`
            } 
          }}
        />
      </Box>
      
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="body2" fontWeight={600} color="error.main">
            Stok Kosong ({kosong})
          </Typography>
          <Typography variant="body2" fontWeight={600} color="text.secondary">
            {pctKosong}%
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={pctKosong}
          sx={{ 
            height: 12, 
            borderRadius: 6, 
            bgcolor: 'success.50',
            '& .MuiLinearProgress-bar': { 
              borderRadius: 6,
              background: `linear(90deg, #F44336, #EF5350)`
            } 
          }}
          color="error"
        />
      </Box>
      
      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ mt: 1 }}>
        <Chip 
          size="small" 
          label={`Total: ${isi + kosong} tabung`} 
          color="primary" 
          variant="outlined" 
        />
        {isi <= LOW_STOCK_THRESHOLD && (
          <Chip size="small" label="Stok Isi Menipis" color="warning" variant="filled" />
        )}
        {kosong <= LOW_STOCK_THRESHOLD && (
          <Chip size="small" label="Stok Kosong Menipis" color="warning" variant="filled" />
        )}
      </Stack>
    </Stack>
  );
}

function StockConditionCard({ isi, kosong, loading = false }) {
  const theme = useTheme();

  return (
    <Card sx={{
      background: `linear(135deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, ${alpha(theme.palette.secondary.main, 0.03)} 100%)`,
      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
    }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Inventory2Icon color="primary" />
            <Typography variant="h6" fontWeight={700}>Kondisi Stok</Typography>
          </Box>
        }
        subheader="Perbandingan stok isi vs kosong"
        sx={{ pb: 2, borderBottom: 1, borderColor: "divider" }}
      />
      <CardContent>
        <StockProgress isi={isi} kosong={kosong} loading={loading} />
      </CardContent>
    </Card>
  );
}

export default StockConditionCard;
