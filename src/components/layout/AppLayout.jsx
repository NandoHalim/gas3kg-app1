import React, { useState } from "react";
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
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import InventoryIcon from "@mui/icons-material/Inventory";
import HistoryIcon from "@mui/icons-material/History";
import PeopleIcon from "@mui/icons-material/People";
import CampaignIcon from "@mui/icons-material/Campaign";
import DescriptionIcon from "@mui/icons-material/Description";
import SettingsIcon from "@mui/icons-material/Settings";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";

import { NavLink, useLocation, useNavigate } from "react-router-dom";

const drawerWidth = 220;

export default function AppLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bottomNav, setBottomNav] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Daftar menu utama
  const menuItems = [
    { label: "Dashboard", icon: <HomeIcon />, path: "/" },
    { label: "Transaksi", icon: <SwapHorizIcon />, path: "/transaksi" },
    { label: "Stok", icon: <InventoryIcon />, path: "/stok" },
    { label: "Riwayat", icon: <HistoryIcon />, path: "/riwayat" },
    { label: "Pelanggan", icon: <PeopleIcon />, path: "/pelanggan" },
    { label: "Broadcast", icon: <CampaignIcon />, path: "/broadcast" },
    { label: "Laporan", icon: <DescriptionIcon />, path: "/laporan" },
    { label: "Pengaturan", icon: <SettingsIcon />, path: "/pengaturan" },
  ];

  // Sinkronkan Bottom Nav dengan route aktif
  React.useEffect(() => {
    const idx = menuItems.findIndex((m, i) => {
      if (i > 3) return false; // hanya 4 pertama utk bottom nav
      return location.pathname === m.path;
    });
    if (idx >= 0) setBottomNav(idx);
  }, [location.pathname]);

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap>
          Gas 3KG Manager
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.label} disablePadding>
            <ListItemButton component={NavLink} to={item.path}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: "flex" }}>
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

      {/* Drawer untuk sidebar */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
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
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Konten utama */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar /> {/* spacer utk AppBar */}
        {children}
      </Box>

      {/* Bottom Navigation untuk mobile */}
      <Paper
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          display: { xs: "block", sm: "none" },
        }}
        elevation={3}
      >
        <BottomNavigation
          value={bottomNav}
          onChange={(e, newValue) => {
            setBottomNav(newValue);
            navigate(menuItems[newValue].path);
          }}
          showLabels
        >
          {menuItems.slice(0, 4).map((item) => (
            <BottomNavigationAction
              key={item.label}
              label={item.label}
              icon={item.icon}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
