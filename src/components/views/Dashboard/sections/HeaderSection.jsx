import React from "react";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

function HeaderSection() {
  const theme = useTheme();

  return (
    <Box>
      <Typography 
        variant="h3" 
        fontWeight={800} 
        gutterBottom
        sx={{ 
          typography: { xs: "h4", sm: "h3" },
          background: `linear(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
        }}
      >
        Dashboard
      </Typography>
      <Typography 
        color="text.secondary" 
        variant="h6"
        sx={{ typography: { xs: "body1", sm: "h6" } }}
      >
        Ringkasan performa bisnis dan analitik penjualan
      </Typography>
    </Box>
  );
}

export default HeaderSection;