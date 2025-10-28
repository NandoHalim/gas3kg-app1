import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate, Outlet } from "react-router-dom";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AppBar, Box, CssBaseline, Divider, Drawer, IconButton, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography,
  BottomNavigation, BottomNavigationAction, Paper, Button
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
import LogoutIcon from "@mui/icons-material/Logout";

import { useAuth } from "../../context/AuthContext.jsx";
import { useSettings } from "../../context/SettingsContext.jsx";
import { DataService } from "../../services/DataService.js";

const drawerWidth = 220;
const BN_HEIGHT = 64;

// Prefetch ringan: petakan key → dynamic import (tidak mengubah routing)
const prefetchMap = {
  dashboard: () => import("../views/Dashboard/index.jsx"),
  transaksi: () => import("../views/TransaksiView.jsx"),
  stok: () => import("../views/StokView.jsx"),
  riwayat: () => import("../views/RiwayatView.jsx"),
  pelanggan: () => import("../views/PelangganView.jsx"),
  broadcast: () => import("../views/BroadcastView.jsx"),
  laporan: () => import("../views/LaporanView.jsx"),
  pengaturan: () => import("../views/PengaturanView.jsx"),
};
const prefetchRoute = (key) => {
  try {
    const fn = prefetchMap[key];
    if (typeof fn === "function") fn();
  } catch {
    /* abaikan error prefetch */
  }
};

export default function AppLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bottomNav] = useState("dashboard");
  const navigate = useNavigate();
  const location = useLocation();

  const { user, signOut } = useAuth();
  const { settings } = useSettings();

  const [isAdmin, setIsAdmin] = useState(false);

  // Resolve role admin langsung dari DB (app_admins)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!user?.id) {
          alive && setIsAdmin(false);
          return;
        }
        const role = await DataService.getUserRoleById(user.id);
        alive && setIsAdmin(String(role).toLowerCase() === "admin");
      } catch {
        alive && setIsAdmin(false);
      }
    })();
    return () => { alive = false; };
  }, [user?.id]);

  const businessName =
    (settings?.business_name && String(settings.business_name).trim()) ||
    "Gas 3KG Manager";

  const handleDrawerToggle = () => setMobileOpen((s) => !s);

  // menu dibentuk berdasarkan role (render tiap perubahan role)
  const menuItems = useMemo(() => {
    const base = [
      { key: "dashboard", label: "Dashboard", icon: <HomeIcon />, path: "/" },
      { key: "transaksi", label: "Transaksi", icon: <SwapHorizIcon />, path: "/transaksi" },
      { key: "stok", label: "Stok", icon: <InventoryIcon />, path: "/stok" },
      { key: "riwayat", label: "Riwayat", icon: <HistoryIcon />, path: "/riwayat/transaksi" },
      { key: "pelanggan", label: "Pelanggan", icon: <PeopleIcon />, path: "/pelanggan" },
      { key: "broadcast", label: "Broadcast", icon: <CampaignIcon />, path: "/broadcast" },
      { key: "laporan", label: "Laporan", icon: <DescriptionIcon />, path: "/laporan" },
    ];
    if (isAdmin) {
      base.push({
        key: "pengaturan",
        label: "Pengaturan",
        icon: <SettingsIcon />,
        path: "/pengaturan",
      });
    }
    return base;
  }, [isAdmin]);

  const activeKey = useMemo(() => {
    const p = location.pathname;
    if (p.startsWith("/transaksi")) return "transaksi";
    if (p.startsWith("/stok")) return "stok";
    if (p.startsWith("/riwayat")) return "riwayat";
    if (p.startsWith("/pelanggan")) return "pelanggan";
    if (p.startsWith("/broadcast")) return "broadcast";
    if (p.startsWith("/laporan")) return "laporan";
    if (p.startsWith("/pengaturan")) return "pengaturan";
    return "dashboard";
  }, [location.pathname]);

  // Drawer kiri
  const drawer = (
    <Box role="presentation">
      <Toolbar>
        <Typography variant="h6" noWrap sx={{ pr: 1 }}>
          {businessName}
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.key} disablePadding>
            <ListItemButton
              component={NavLink}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              // Prefetch saat hover/tap
              onMouseEnter={() => prefetchRoute(item.key)}
              onTouchStart={() => prefetchRoute(item.key)}
            >
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

          {/* Judul dinamis dari Pengaturan Dasar */}
          <Typography variant="h6" noWrap sx={{ flex: 1 }}>
            {businessName}
          </Typography>

          {/* Tombol LOGOUT kanan atas */}
          <Button
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={async () => {
              await signOut();
              navigate("/");
            }}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        {/* Mobile drawer */}
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

        {/* Desktop drawer */}
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

      {/* Konten + Animasi Halaman */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          px: { xs: 1.5, sm: 3 },
          py: { xs: 1.5, sm: 3 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10, filter: "blur(3px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(3px)" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {children ?? <Outlet />}
          </motion.div>
        </AnimatePresence>
      </Box>

      {/* Bottom nav (mobile) */}
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
            value={activeKey}
            onChange={(_, newValue) => {
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
                // Prefetch saat hover/tap
                onMouseEnter={() => prefetchRoute(item.key)}
                onTouchStart={() => prefetchRoute(item.key)}
              />
            ))}
          </BottomNavigation>
        </Paper>,
        document.body
      )}
    </Box>
  );
}
