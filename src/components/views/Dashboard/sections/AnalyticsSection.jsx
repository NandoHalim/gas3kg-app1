import React from "react";
import { Card, CardHeader, CardContent, Grid, Stack, Box, Typography, Skeleton } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import InsightsOutlined from "@mui/icons-material/InsightsOutlined";
import TopCustomersTable from "./TopCustomersTable.jsx";
import ComparisonsStack from "./ComparisonsStack.jsx";

function AnalyticsSection({ topCustomers, weekly, monthly, loading = false, onOpenCustomerHistory, isSmallMobile = false }) {
  const theme = useTheme();

  return (
    <Card sx={{
      background: `linear(135deg, ${alpha(theme.palette.warning.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
      border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`
    }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InsightsOutlined color="warning" />
            <Typography variant="h6" fontWeight={700}>Analitik Penjualan</Typography>
          </Box>
        }
        sx={{ pb: 2, borderBottom: 1, borderColor: "divider" }}
      />
      <CardContent>
        {loading ? (
          <Stack spacing={2}>
            <Skeleton height={40} />
            <Skeleton height={40} />
            <Skeleton height={40} />
          </Stack>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TopCustomersTable 
                rows={topCustomers}
                loading={loading}
                onOpenCustomerHistory={onOpenCustomerHistory}
                isSmallMobile={isSmallMobile}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <ComparisonsStack 
                weekly={weekly}
                monthly={monthly}
                loading={loading}
              />
            </Grid>
          </Grid>
        )}
      </CardContent>
    </Card>
  );
}

export default AnalyticsSection;
