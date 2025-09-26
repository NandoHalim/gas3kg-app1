// src/components/views/StokView.jsx
import React, { useEffect, useState } from "react";
import { DataService } from "../../services/DataService.js";
import { useToast } from "../../context/ToastContext.jsx";
import { MIN_DATE } from "../../utils/constants.js";
import { todayStr, maxAllowedDate } from "../../utils/helpers.js";
import {
  Box,
  Stack,
  Typography,
  Card,
  CardHeader,
  CardContent,
  TextField,
  Button,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  useMediaQuery,
} from "@mui/material";

// 🔴 DEBUG COMPONENT - ALWAYS VISIBLE
const DebugPanel = () => {
  const width = window.innerWidth;
  let breakpoint = 'Unknown';
  
  if (width < 600) breakpoint = 'XS (Mobile)';
  else if (width < 900) breakpoint = 'SM (Tablet)';
  else if (width < 1200) breakpoint = 'MD (Desktop)';
  else if (width < 1536) breakpoint = 'LG (Large Desktop)';
  else breakpoint = 'XL (Extra Large)';

  return (
    <Box sx={{
      position: 'fixed',
      top: 10,
      right: 10,
      background: '#ff4444',
      color: 'white',
      padding: '8px 12px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: 'bold',
      zIndex: 10000,
      border: '2px solid white'
    }}>
      🐛 {breakpoint} - {width}px
    </Box>
  );
};

export default function StokView({ stocks = {}, onSaved }) {
  const toast = useToast();
  const isMobile = useMediaQuery('(max-width:899px)'); // 🔴 SIMPLE MEDIA QUERY
  const isDesktop = useMediaQuery('(min-width:900px)');

  const [snap, setSnap] = useState({
    ISI: Number(stocks.ISI || 0),
    KOSONG: Number(stocks.KOSONG || 0),
  });

  useEffect(() => {
    setSnap({ ISI: Number(stocks.ISI || 0), KOSONG: Number(stocks.KOSONG || 0) });
  }, [stocks]);

  // 🔴 CONSOLE DEBUG
  useEffect(() => {
    console.log('🔄 StokView rendered:', { isMobile, isDesktop, width: window.innerWidth });
  }, [isMobile, isDesktop]);

  return (
    <>
      <DebugPanel /> {/* 🔴 DEBUG PANEL */}
      
      <Box sx={{ p: 3, minHeight: '100vh', bgcolor: 'background.default' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" fontWeight={700}>Stok Management</Typography>
            <Typography color="text.secondary">Kelola stok tabung LPG</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Chip label={`ISI: ${snap.ISI}`} color="success" />
            <Chip label={`KOSONG: ${snap.KOSONG}`} color="primary" />
          </Box>
        </Box>

        {/* 🔴 GRID DEBUG */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6} lg={4}>
            <Card sx={{ 
              bgcolor: isDesktop ? '#e8f5e8' : 'white', // 🔴 GREEN jika desktop
              height: '100%',
              border: isDesktop ? '2px solid green' : '1px solid #ddd'
            }}>
              <CardHeader title="Tambah Stok Kosong" />
              <CardContent>
                <Typography>Card 1 - Desktop: {isDesktop ? 'YES' : 'NO'}</Typography>
                {/* ... form content ... */}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <Card sx={{ 
              bgcolor: isDesktop ? '#e8f5e8' : 'white',
              height: '100%',
              border: isDesktop ? '2px solid green' : '1px solid #ddd'
            }}>
              <CardHeader title="Restok Isi" />
              <CardContent>
                <Typography>Card 2 - Desktop: {isDesktop ? 'YES' : 'NO'}</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <Card sx={{ 
              bgcolor: isDesktop ? '#e8f5e8' : 'white',
              height: '100%',
              border: isDesktop ? '2px solid green' : '1px solid #ddd'
            }}>
              <CardHeader title="Penyesuaian Stok" />
              <CardContent>
                <Typography>Card 3 - Desktop: {isDesktop ? 'YES' : 'NO'}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </>
  );
}