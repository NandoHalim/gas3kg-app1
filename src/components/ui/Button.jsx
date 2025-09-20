// src/components/ui/Button.jsx
import * as React from "react";
import MuiButton from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";

/**
 * Props (kompatibel lama + tambahan interaktif):
 * - className: "secondary" -> outlined, "danger" -> color=error
 * - variant: contained | outlined | text
 * - color: primary | secondary | error | success | warning | info
 * - loading: boolean
 * - startIcon, endIcon: ReactNode
 */
export default function Button({
  children,
  className = "",
  variant,
  color,
  loading = false,
  startIcon,
  endIcon,
  disabled,
  ...props
}) {
  const isSecondary = className.includes("secondary") && !variant;
  const isDanger = className.includes("danger") && !color;

  const finalVariant = variant || (isSecondary ? "outlined" : "contained");
  const finalColor = color || (isDanger ? "error" : "primary");
  const isDisabled = disabled || loading;

  return (
    <MuiButton
      disableElevation
      variant={finalVariant}
      color={finalColor}
      startIcon={!loading ? startIcon : null}
      endIcon={!loading ? endIcon : null}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <CircularProgress size={18} />
          <span>Mohon tunggu…</span>
        </span>
      ) : (
        children
      )}
    </MuiButton>
  );
}
