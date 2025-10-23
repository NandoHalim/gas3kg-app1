import React from "react";
import { Stack, Typography } from "@mui/material";

// Gunakan React.forwardRef untuk handle ref properly
const RowKV = React.forwardRef(function RowKV({ k, v, vSx, ...props }, ref) {
  return (
    <Stack 
      direction="row" 
      justifyContent="space-between" 
      alignItems="center"
      ref={ref} // ✅ Important: forward the ref
      {...props} // ✅ Important: spread other props
    >
      <Typography 
        variant="body1" 
        color="text.secondary" 
        fontWeight={500}
        sx={{ flex: 1 }} // ✅ Better layout
      >
        {k}
      </Typography>
      <Typography 
        variant="body1" 
        sx={{ 
          fontWeight: 600, 
          textAlign: 'right',
          minWidth: '120px', // ✅ Prevent layout shift
          ...vSx 
        }}
      >
        {v}
      </Typography>
    </Stack>
  );
});

// Tambahkan displayName untuk debugging yang lebih baik
RowKV.displayName = 'RowKV';

export default RowKV;