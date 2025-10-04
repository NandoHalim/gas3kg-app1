import React from "react";
import { Card, CardHeader, CardContent, Stack, Button, Box, Typography } from "@mui/material";
import { alpha, useTheme, useMediaQuery } from "@mui/material/styles";
import ScheduleIcon from "@mui/icons-material/Schedule";
import AddIcon from "@mui/icons-material/Add";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import InsightsOutlined from "@mui/icons-material/InsightsOutlined";

function QuickActionsSection({ onAddTransaction, onAddStock, onViewReports }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const actions = [
    { 
      label: 'Tambah Transaksi', 
      icon: <AddIcon />, 
      color: 'primary',
      onClick: onAddTransaction
    },
    { 
      label: 'Tambah Stok', 
      icon: <Inventory2Icon />, 
      color: 'success',
      onClick: onAddStock
    },
    { 
      label: 'Lihat Laporan', 
      icon: <InsightsOutlined />, 
      color: 'info',
      onClick: onViewReports
    },
  ];

  return (
    <Card sx={{ 
      background: `linear(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
    }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScheduleIcon color="primary" />
            <Typography variant="h6" fontWeight={700}>Quick Actions</Typography>
          </Box>
        }
        subheader="Akses cepat ke fitur utama"
        sx={{ pb: 2, borderBottom: 1, borderColor: "divider" }}
      />
      <CardContent>
        <Stack direction={isMobile ? "column" : "row"} spacing={2} alignItems="center">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="contained"
              startIcon={action.icon}
              onClick={action.onClick}
              sx={{ 
                flex: 1,
                minWidth: isMobile ? '100%' : 140,
                py: 1.5,
                background: `linear(135deg, ${theme.palette[action.color].main}, ${theme.palette[action.color].dark})`,
                '&:hover': {
                  background: `linear(135deg, ${theme.palette[action.color].dark}, ${theme.palette[action.color].dark})`,
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.2s ease-in-out'
              }}
            >
              {isMobile ? action.label.split(' ')[0] : action.label}
            </Button>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default QuickActionsSection;