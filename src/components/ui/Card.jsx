// src/components/ui/Card.jsx
import * as React from "react";
import {
  Card as MuiCard,
  CardHeader,
  CardContent,
  IconButton,
  Collapse,
  Tooltip,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

function ExpandIconButton({ expanded, ...props }) {
  return (
    <IconButton
      {...props}
      sx={{
        transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform .2s ease",
      }}
    >
      <ExpandMoreIcon />
    </IconButton>
  );
}

/**
 * Props:
 * - title: string
 * - action: ReactNode (aksi custom di header)
 * - onRefresh: ()=>void (opsional tombol refresh)
 * - collapsible: boolean (default false)
 * - defaultExpanded: boolean (default true jika collapsible)
 * - sx: style sx MUI utk <Card>
 */
export default function Card({
  title,
  action,
  onRefresh,
  collapsible = false,
  defaultExpanded = true,
  sx,
  children,
}) {
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  const rightActions = (
    <div style={{ display: "inline-flex", gap: 4 }}>
      {onRefresh && (
        <Tooltip title="Muat ulang">
          <IconButton onClick={onRefresh}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      )}
      {action || null}
      {collapsible && (
        <Tooltip title={expanded ? "Tutup" : "Buka"}>
          <ExpandIconButton
            expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
          />
        </Tooltip>
      )}
    </div>
  );

  return (
    <MuiCard sx={{ borderRadius: 2, ...sx }}>
      {(title || onRefresh || action || collapsible) && (
        <CardHeader title={title || ""} action={rightActions} />
      )}
      {collapsible ? (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <CardContent>{children}</CardContent>
        </Collapse>
      ) : (
        <CardContent>{children}</CardContent>
      )}
    </MuiCard>
  );
}
