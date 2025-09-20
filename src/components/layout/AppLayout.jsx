// src/components/layout/AppLayout.jsx
import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate, Outlet } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import InventoryIcon from "@mui/icons-material/Inventory";
import HistoryIcon from "@mui/icons-material/History";
import PeopleIcon from "@mui/icons-material/People";
import CampaignIcon from "@mui/icons-material/Campaign";
import DescriptionIcon from "@mui/icons-material/Description";
import SettingsIcon from "@mui/icons-material/Settings";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";

const drawerWidth = 220;
const BN_HEIGHT = 64; // tinggi bottom nav

export default function AppLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bottomNav, setBottomNav] = useState("dashboard");
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => setMobileOpen((s) => !s);

  // daftar menu
  const menuItems = [
    { key: "dashboard", label: "Dashboard", icon: <HomeIcon />, path: "/" },
    { key: "transaksi", label: "Transaksi", icon: <SwapHorizIcon />, path: "/transaksi" },
    { key: "stok", label: "Stok", icon: <InventoryIcon />, path: "/stok" },
    { key: "riwayat", label: "Riwayat", icon: <HistoryIcon />, path: "/riwayat" },
    { key: "pelanggan", label: "Pelanggan", icon: <PeopleIcon />, path: "/pelanggan" },
    { key: "broadcast", label: "Broadcast", icon: <CampaignIcon />, path: "/broadcast" },
    { key: "laporan", label: "Laporan", icon: <DescriptionIcon />, path: "/laporan" },
    { key: "pengaturan", label: "Pengaturan", icon: <SettingsIcon />, path: "/pengaturan" },
  ];

  // key aktif untuk bottom-nav (pakai startsWith biar tahan /route/sub)
  const activeKey = useMemo(() => {
    if (location.pathname.startsWith("/transaksi")) return "transaksi";
    if (location.pathname.startsWith("/stok")) return "stok";
    if (location.pathname.startsWith("/riwayat")) return "riwayat";
    return "dashboard";
  }, [location.pathname]);

  useEffect(() => {
    setBottomNav(activeKey);
  }, [activeKey]);

  const drawer = (
    <Box role="presentation">
      <Toolbar>
        <Typography variant="h6" noWrap>
          Gas 3KG Manager
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.key} disablePadding>
            <ListItemButton component={NavLink} to={item.path} onClick={() => setMobileOpen(false)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100svh",
        // beri ruang bawah untuk mobile agar konten tidak ketutup bottom-nav
        pb: { xs: `calc(${BN_HEIGHT}px + env(safe-area-inset-bottom))`, sm: 0 },
      }}
    >
      <CssBaseline />

      {/* AppBar */}
      <AppBar position="fixed" sx={{ zIndex: 1201 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap>
            Gas 3KG Manager
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        {/* mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>

        {/* desktop drawer */}
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      {/* konten utama */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          px: { xs: 1.5, sm: 3 },
          py: { xs: 1.5, sm: 3 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar /> {/* spacer untuk AppBar */}
        {/* dukung dua cara: children langsung atau via <Outlet/> */}
        {children ?? <Outlet />}
      </Box>

      {/* BOTTOM NAV — render via Portal agar fixed tidak terpengaruh parent */}
      {createPortal(
        <Paper
          elevation={8}
          square
          sx={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1200,
            display: { xs: "block", sm: "none" },
            pb: "env(safe-area-inset-bottom)",
          }}
        >
          <BottomNavigation
            value={bottomNav}
            onChange={(_, newValue) => {
              setBottomNav(newValue);
              const target = menuItems.find((m) => m.key === newValue);
              if (target) navigate(target.path);
            }}
            showLabels
            sx={{ height: BN_HEIGHT }}
          >
            {menuItems.slice(0, 4).map((item) => (
              <BottomNavigationAction
                key={item.key}
                value={item.key}
                label={item.label}
                icon={item.icon}
              />
            ))}
          </BottomNavigation>
        </Paper>,
        document.body
      )}
    </Box>
  );
}
