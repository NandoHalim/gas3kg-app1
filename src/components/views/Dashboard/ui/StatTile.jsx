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
        transform: 'translateY(-2px)',
        boxShadow: theme.shadows[4],
      }
    }}>
      <CardContent sx={{ flex: 1, display: "flex", alignItems: "center", py: 3, px: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ width: "100%" }}>
          <Box
            sx={(theme) => ({
              width: 56,
              height: 56,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              bgcolor: alpha(theme.palette[color].main, 0.15),
              color: `${color}.main`,
              flexShrink: 0,
            })}
          >
            {icon}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h4"
              fontWeight={700}
              noWrap
              sx={{ 
                typography: { xs: "h5", sm: "h4" },
                color: `${color}.main`
              }}
            >
              {loading ? <Skeleton variant="text" width={80} /> : value}
            </Typography>
            <Typography
              color="text.secondary"
              sx={{ 
                typography: { xs: "body2", sm: "subtitle1" }, 
                display: "block", 
                minHeight: 24,
                fontWeight: 600 
              }}
              noWrap
            >
              {loading ? <Skeleton variant="text" width={120} /> : subtitle}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ 
                display: { xs: "none", sm: "block" },
                fontWeight: 500
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

export default StatTile;
