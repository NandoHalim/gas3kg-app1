import React from "react";
import { Card, CardContent, Stack, Box, Typography, Skeleton } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

// Valid color types untuk MUI
const VALID_COLORS = ['primary', 'secondary', 'error', 'warning', 'info', 'success'];

function StatTile({ title, value, subtitle, color = "primary", icon, loading = false }) {
  const theme = useTheme();
  
  // Validasi color - fallback ke primary jika invalid
  const safeColor = VALID_COLORS.includes(color) ? color : 'primary';
  
  // Safe color values
  const colorMain = theme.palette[safeColor]?.main || theme.palette.primary.main;
  const colorLight = alpha(colorMain, 0.15);
  const colorBorder = alpha(colorMain, 0.2);

  return (
    <Card sx={{ 
      height: "100%", 
      display: "flex",
      background: `linear-gradient(135deg, ${colorLight} 0%, ${alpha(colorMain, 0.05)} 100%)`,
      border: `1px solid ${colorBorder}`,
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        transform: { xs: 'none', sm: 'translateY(-2px)' },
        boxShadow: { xs: theme.shadows[1], sm: theme.shadows[4] },
      }
    }}>
      <CardContent sx={{ 
        flex: 1, 
        display: "flex", 
        alignItems: "center", 
        py: { xs: 2, sm: 3 },
        px: { xs: 2, sm: 3 },
        '&:last-child': { pb: { xs: 2, sm: 3 } }
      }}>
        <Stack direction="row" spacing={{ xs: 1.5, sm: 2 }} alignItems="center" sx={{ width: "100%" }}>
          <Box
            sx={{
              width: { xs: 44, sm: 56 },
              height: { xs: 44, sm: 56 },
              borderRadius: { xs: 1.5, sm: 2 },
              display: "grid",
              placeItems: "center",
              bgcolor: colorLight,
              color: colorMain,
              flexShrink: 0,
            }}
          >
            {icon && React.cloneElement(icon, { 
              fontSize: { xs: "small", sm: "medium" } 
            })}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              fontWeight={700}
              noWrap
              sx={{ 
                fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
                color: colorMain,
                lineHeight: 1.2
              }}
            >
              {loading ? <Skeleton variant="text" width="60%" /> : value}
            </Typography>
            <Typography
              color="text.secondary"
              sx={{ 
                display: "block", 
                minHeight: { xs: 20, sm: 24 },
                fontWeight: { xs: 500, sm: 600 },
                fontSize: { xs: '0.875rem', sm: '0.9rem' },
                lineHeight: 1.3,
                mt: 0.5
              }}
              noWrap
            >
              {loading ? <Skeleton variant="text" width="80%" /> : subtitle}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ 
                display: { xs: "none", sm: "block" },
                fontWeight: 500,
                fontSize: '0.75rem',
                mt: 0.5
              }}
            >
              {loading ? <Skeleton variant="text" width="60%" /> : title}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default React.memo(StatTile);