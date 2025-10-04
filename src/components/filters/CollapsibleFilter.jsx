import React, { useState } from "react";
import {
  Card, CardHeader, CardContent, IconButton, Collapse, useMediaQuery
} from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";

export default function CollapsibleFilter({ title, children }) {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Card>
      <CardHeader
        title={title}
        action={
          isMobile && (
            <IconButton onClick={() => setOpen(!open)}>
              {open ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          )
        }
        onClick={isMobile ? () => setOpen(!open) : undefined}
        sx={isMobile ? { cursor: "pointer" } : {}}
      />
      <Collapse in={!isMobile || open}>
        <CardContent>{children}</CardContent>
      </Collapse>
    </Card>
  );
}
