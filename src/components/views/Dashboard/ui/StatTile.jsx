import React from "react";
import { Card, CardContent, Stack, Box, Typography, Skeleton } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

function StatTile({ title, value, subtitle, color = "primary", icon, loading = false }) {
  const theme = useTheme();
  
  return (
    <Card sx={{ 
      height: "100%", 
      display: "flex",
      background: `linear(135deg, ${alpha(theme.palette[color].main, 0.1)} 0%, ${alpha(theme.palette[color].main, 0.05)} 100%)`,
      border: `1px solid ${alpha(theme.palette[color].main, 0.2)}`,
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        transform: { xs: 'none', sm: 'translateY(-2px)' }, // Hover hanya di desktop
        boxShadow: { xs: theme.shadows[1], sm: theme.shadows[4] },
      }
    }}>
      <CardContent sx={{ 
        flex: 1, 
        display: "flex", 
        alignItems: "center", 
        // MOBILE-FIRST: Padding kecil dulu, besar di desktop
        py: { xs: 2, sm: 3 },
        px: { xs: 2, sm: 3 },
        '&:last-child': { pb: { xs: 2, sm: 3 } }
      }}>
        <Stack direction="row" spacing={{ xs: 1.5, sm: 2 }} alignItems="center" sx={{ width: "100%" }}>
          {/* MOBILE-FIRST: Icon size responsive */}
          <Box
            sx={(theme) => ({
              width: { xs: 44, sm: 56 },
              height: { xs: 44, sm: 56 },
              borderRadius: { xs: 1.5, sm: 2 },
              display: "grid",
              placeItems: "center",
              bgcolor: alpha(theme.palette[color].main, 0.15),
              color: `${color}.main`,
              flexShrink: 0,
            })}
          >
            {React.cloneElement(icon, { 
              fontSize: { xs: "small", sm: "medium" } 
            })}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* MOBILE-FIRST: Typography scale */}
            <Typography
              variant="h4"
              fontWeight={700}
              noWrap
              sx={{ 
                typography: { xs: "h6", sm: "h5", md: "h4" }, // Mobile kecil, desktop besar
                color: `${color}.main`,
                fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' }
              }}
            >
              {loading ? <Skeleton variant="text" width={80} /> : value}
            </Typography>
            {/* MOBILE-FIRST: Subtitle responsive */}
            <Typography
              color="text.secondary"
              sx={{ 
                typography: { xs: "body2", sm: "subtitle1" }, 
                display: "block", 
                minHeight: { xs: 20, sm: 24 },
                fontWeight: { xs: 500, sm: 600 },
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}
              noWrap
            >
              {loading ? <Skeleton variant="text" width={120} /> : subtitle}
            </Typography>
            {/* MOBILE-FIRST: Title hide on mobile */}
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ 
                display: { xs: "none", sm: "block" }, // Sembunyikan di mobile
                fontWeight: 500,
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}
            >
              {title}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default React.memo(StatTile);