import React from "react";
import { Alert, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import ReportProblemOutlined from "@mui/icons-material/ReportProblemOutlined";

function ErrorBanner({ message, detail }) {
  const theme = useTheme();
  
  return (
    <Alert
      severity="error"
      icon={<ReportProblemOutlined />}
      variant="outlined"
      sx={{ 
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
        background: `${alpha(theme.palette.error.main, 0.05)}`
      }}
    >
      <Typography variant="subtitle1" fontWeight={600}>Terjadi kesalahan</Typography>
      <Typography variant="body2" sx={{ mt: 0.5 }}>{message}</Typography>
      {detail && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
          {detail}
        </Typography>
      )}
    </Alert>
  );
}

export default ErrorBanner;