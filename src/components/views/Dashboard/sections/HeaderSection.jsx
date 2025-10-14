import React from "react";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useMediaQuery } from "@mui/material";

function HeaderSection() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ px: isMobile ? 1 : 0 }}>
      <Typography 
        variant={isMobile ? "h5" : "h3"} 
        fontWeight={800} 
        gutterBottom
        sx={{ 
          background: `linear(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
          textAlign: isMobile ? 'center' : 'left',
          fontSize: isMobile ? '1.8rem' : 'inherit'
        }}
      >
        Dashboard
      </Typography>
      <Typography 
        color="text.secondary" 
        variant={isMobile ? "body2" : "h6"}
        sx={{ 
          textAlign: isMobile ? 'center' : 'left',
          fontSize: isMobile ? '0.9rem' : 'inherit'
        }}
      >
        Ringkasan performa bisnis dan analitik penjualan
      </Typography>
    </Box>
  );
}

export default HeaderSection;