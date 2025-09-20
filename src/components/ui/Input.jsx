// src/components/ui/Input.jsx
import * as React from "react";
import { TextField, IconButton, InputAdornment, Tooltip } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

/**
 * Props kompatibel lama + MUI:
 * - label, placeholder, type, value, onChange, disabled, required
 * - error, helperText
 * - fullWidth (default true)
 */
export default function Input({
  value,
  onChange,
  label,
  placeholder,
  type = "text",
  error,
  helperText,
  fullWidth = true,
  disabled,
  required,
  ...rest
}) {
  const showClear = !!value && !disabled;

  return (
    <TextField
      variant="outlined"
      fullWidth={fullWidth}
      label={label}
      placeholder={placeholder}
      type={type}
      value={value ?? ""}
      onChange={onChange}
      disabled={disabled}
      required={required}
      error={!!error}
      helperText={helperText}
      InputProps={{
        endAdornment: showClear ? (
          <InputAdornment position="end">
            <Tooltip title="Bersihkan">
              <IconButton
                size="small"
                onClick={() => {
                  const e = { target: { value: "" } };
                  onChange?.(e);
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </InputAdornment>
        ) : null,
      }}
      {...rest}
    />
  );
}
