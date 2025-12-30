// src/components/Topbar/index.jsx
import { useState, useEffect, useMemo } from "react";
import {
  Box,
  IconButton,
  Typography,
  Avatar,
  Stack,
  Badge,
  TextField,
  Autocomplete,
  Popover,
  MenuItem,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";

import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import BakeryDiningOutlinedIcon from "@mui/icons-material/BakeryDiningOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import WarehouseOutlinedIcon from "@mui/icons-material/WarehouseOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import InventoryOutlinedIcon from "@mui/icons-material/InventoryOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import GroupWorkOutlinedIcon from "@mui/icons-material/GroupWorkOutlined";

import { fetchUserAttributes } from "aws-amplify/auth";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const getBrand = (isDark) => ({
  text: isDark ? "#f1f5f9" : "#1e293b",
  subtext: isDark ? "#94a3b8" : "#64748b",
  border: isDark ? "#334155" : "#f1f5f9",
  surface: isDark ? "rgba(15, 23, 42, 0.9)" : "rgba(255, 255, 255, 0.8)",
  surfaceMuted: isDark ? "#1e293b" : "#f8fafc",
  primary: "#7C3AED",
  primaryDark: "#5B21B6",
  shadow: isDark ? "0 4px 20px rgba(0,0,0,0.5)" : "0 4px 20px rgba(0,0,0,0.05)",
});

/**
 * ✅ Add ALL routes you want searchable here (sidebar + account + any others)
 */
const pageOptions = [
  { label: "Dashboard", path: "/dashboard", icon: <HomeOutlinedIcon fontSize="small" /> },

  // MRP
  { label: "Goods In", path: "/GoodsIn", icon: <LocalShippingOutlinedIcon fontSize="small" /> },
  { label: "Ingredients Inventory", path: "/IngredientsInventory", icon: <BakeryDiningOutlinedIcon fontSize="small" /> },
  { label: "Recipes", path: "/recipes", icon: <DescriptionOutlinedIcon fontSize="small" /> },
  { label: "Stock Inventory", path: "/stock_inventory", icon: <WarehouseOutlinedIcon fontSize="small" /> },
  { label: "Daily Production", path: "/daily_production", icon: <AddOutlinedIcon fontSize="small" /> },
  { label: "Stock Usage", path: "/stock_usage", icon: <InventoryOutlinedIcon fontSize="small" /> },
  { label: "Goods Out", path: "/goods_out", icon: <InventoryOutlinedIcon fontSize="small" /> },

  // HRP
  { label: "Roster", path: "/Roster", icon: <CalendarMonthOutlinedIcon fontSize="small" /> },
  { label: "Employees", path: "/Employees", icon: <PeopleAltOutlinedIcon fontSize="small" /> },
  { label: "Roles", path: "/Roles", icon: <BadgeOutlinedIcon fontSize="small" /> },
  { label: "Leave Requests", path: "/hrp/leave", icon: <EventNoteOutlinedIcon fontSize="small" /> },
  { label: "HRP Roles", path: "/hrp/roles", icon: <GroupWorkOutlinedIcon fontSize="small" /> },
  { label: "Skills & Training", path: "/hrp/skills", icon: <GroupWorkOutlinedIcon fontSize="small" /> },
  { label: "HRP Roster", path: "/hrp/roster", icon: <CalendarMonthOutlinedIcon fontSize="small" /> },

  // Account
  { label: "Account", path: "/account", icon: <PersonIcon fontSize="small" /> },

  // Auth page (so you can also jump to it manually)
  { label: "Sign In / Sign Out", path: "/auth", icon: <LogoutIcon fontSize="small" /> },
];

export default function Topbar() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const [isDark, setIsDark] = useState(() => localStorage.getItem("theme-mode") === "dark");
  const brand = useMemo(() => getBrand(isDark), [isDark]);

  const toggleTheme = () => {
    const newMode = isDark ? "light" : "dark";
    setIsDark(!isDark);
    localStorage.setItem("theme-mode", newMode);
    window.dispatchEvent(new Event("themeChanged"));
  };

  const [profile, setProfile] = useState({ firstName: "", lastName: "", jobTitle: "" });

  const [notifAnchor, setNotifAnchor] = useState(null);
  const [profileAnchor, setProfileAnchor] = useState(null);
  const [logoutOpen, setLogoutOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const attrs = await fetchUserAttributes();
        setProfile({
          firstName: attrs?.given_name || "User",
          lastName: attrs?.family_name || "",
          jobTitle: attrs?.["custom:jobTitle"] || "Manager",
        });
      } catch {
        setProfile({ firstName: "User", lastName: "", jobTitle: "Manager" });
      }
    })();
  }, []);

  const notifCount = 0;
  const notifOpen = Boolean(notifAnchor);
  const profileOpen = Boolean(profileAnchor);

  /**
   * ✅ Logout + redirect that does NOT require manual refresh
   */
  const handleLogout = async () => {
    setLogoutOpen(false);
    setProfileAnchor(null);
    setNotifAnchor(null);

    const targetAuthRoute = "/auth"; // <-- change if your auth route is different

    try {
      await Promise.resolve(signOut?.());
    } catch (e) {
      console.error("signOut error:", e);
    } finally {
      navigate(targetAuthRoute, { replace: true });

      window.setTimeout(() => {
        if (window.location.pathname !== targetAuthRoute) {
          window.location.assign(targetAuthRoute);
        }
      }, 150);
    }
  };

  return (
    <Box
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 1100,
        px: 3,
        py: 1.5,
        backgroundColor: brand.surface,
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${brand.border}`,
        transition: "background 0.3s, border 0.3s",
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center">
        {/* ✅ Brand (bigger + logo beside it, like LandingPage) */}
        <Box
          onClick={() => navigate("/dashboard")}
          role="button"
          aria-label="Go to dashboard"
          sx={{
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            gap: 1,
            cursor: "pointer",
            userSelect: "none",
            "&:hover .brand-text": { color: brand.primaryDark },
          }}
        >
          <Typography
            className="brand-text"
            sx={{
              fontWeight: 900,
              fontSize: "1.25rem", // ✅ bigger
              color: brand.text,
              transition: "color .15s ease",
              letterSpacing: "-0.01em",
              lineHeight: 1,
            }}
          >
            Hupes
          </Typography>

          <Box
            component="img"
            src="/user.png"
            alt="Logo"
            sx={{
              height: 34,
              width: "auto",
              ml: 0.5,
              pointerEvents: "none",
              filter: isDark ? "brightness(1.05) contrast(1.05)" : "none",
            }}
          />
        </Box>

        {/* Search */}
        <Box sx={{ width: { xs: "60%", sm: 420 } }}>
          <Autocomplete
            options={pageOptions}
            getOptionLabel={(o) => o.label || ""}
            isOptionEqualToValue={(a, b) => a.path === b.path}
            onChange={(_, sel) => sel && navigate(sel.path)}
            renderOption={(props, option) => (
              <li {...props} key={option.path}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, width: "100%" }}>
                  <Box sx={{ color: brand.subtext, display: "flex" }}>{option.icon}</Box>
                  <Typography sx={{ color: brand.text, fontWeight: 700, fontSize: "0.85rem" }}>
                    {option.label}
                  </Typography>
                  <Box sx={{ ml: "auto", color: brand.subtext, fontSize: "0.75rem" }}>
                    {option.path}
                  </Box>
                </Box>
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                placeholder="Search pages..."
                InputProps={{
                  ...params.InputProps,
                  startAdornment: <SearchIcon sx={{ color: brand.subtext, fontSize: 18, mr: 1 }} />,
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px",
                    color: brand.text,
                    bgcolor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
                    "& fieldset": { borderColor: brand.border },
                    "&:hover fieldset": { borderColor: brand.primary },
                  },
                }}
              />
            )}
          />
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton onClick={toggleTheme} sx={{ color: brand.subtext }}>
            {isDark ? <LightModeOutlinedIcon fontSize="small" /> : <DarkModeOutlinedIcon fontSize="small" />}
          </IconButton>

          {/* Notifications */}
          <IconButton onClick={(e) => setNotifAnchor(e.currentTarget)} sx={{ color: brand.subtext }}>
            <Badge variant={notifCount > 0 ? "dot" : "standard"} color="error">
              <NotificationsNoneIcon fontSize="small" />
            </Badge>
          </IconButton>

          <Divider
            orientation="vertical"
            flexItem
            sx={{ height: 20, mx: 1, alignSelf: "center", borderColor: brand.border }}
          />

          {/* Profile trigger */}
          <Box
            onClick={(e) => setProfileAnchor(e.currentTarget)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              cursor: "pointer",
              p: 0.5,
              borderRadius: "20px",
              "&:hover": { bgcolor: brand.border },
            }}
          >
            <Box sx={{ textAlign: "right", display: { xs: "none", sm: "block" } }}>
              <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: brand.text, lineHeight: 1 }}>
                {profile.firstName}
              </Typography>
              <Typography sx={{ fontSize: "0.65rem", color: brand.subtext }}>{profile.jobTitle}</Typography>
            </Box>
            <Avatar sx={{ width: 30, height: 30, bgcolor: brand.primary, fontSize: "0.8rem" }}>
              {profile.firstName?.[0] || "U"}
            </Avatar>
          </Box>
        </Stack>
      </Box>

      {/* Notifications Popover */}
      <Popover
        open={notifOpen}
        anchorEl={notifAnchor}
        onClose={() => setNotifAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              width: 320,
              borderRadius: "12px",
              bgcolor: brand.surface,
              border: `1px solid ${brand.border}`,
              boxShadow: brand.shadow,
              overflow: "hidden",
            },
          },
        }}
      >
        <Box sx={{ p: 1.5 }}>
          <Typography sx={{ fontWeight: 900, color: brand.text, mb: 1 }}>Notifications</Typography>

          <Box
            sx={{
              p: 1.5,
              borderRadius: "10px",
              bgcolor: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc",
              border: `1px solid ${brand.border}`,
            }}
          >
            <Typography sx={{ color: brand.subtext, fontSize: "0.85rem", fontWeight: 600 }}>
              No notifications yet.
            </Typography>
          </Box>
        </Box>
      </Popover>

      {/* Profile Menu */}
      <Popover
        open={profileOpen}
        anchorEl={profileAnchor}
        onClose={() => setProfileAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              width: 210,
              borderRadius: "12px",
              bgcolor: brand.surface,
              border: `1px solid ${brand.border}`,
              boxShadow: brand.shadow,
            },
          },
        }}
      >
        <Box sx={{ p: 1 }}>
          <MenuItem onClick={() => navigate("/account")} sx={{ borderRadius: "8px", gap: 1.5, py: 1 }}>
            <PersonIcon sx={{ fontSize: 18, color: brand.subtext }} />
            <Typography variant="body2" sx={{ color: brand.text }}>
              Account
            </Typography>
          </MenuItem>

          <MenuItem
            onClick={() => setLogoutOpen(true)}
            sx={{ borderRadius: "8px", gap: 1.5, py: 1, color: "error.main" }}
          >
            <LogoutIcon sx={{ fontSize: 18 }} />
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              Logout
            </Typography>
          </MenuItem>
        </Box>
      </Popover>

      {/* Logout Dialog */}
      <Dialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        PaperProps={{ sx: { borderRadius: "16px", bgcolor: brand.surface } }}
      >
        <DialogTitle sx={{ color: brand.text, fontWeight: 900 }}>Confirm Logout</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: brand.subtext }}>Are you sure you want to sign out?</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setLogoutOpen(false)} sx={{ color: brand.subtext }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleLogout}
            sx={{
              bgcolor: "#ef4444",
              "&:hover": { bgcolor: "#dc2626" },
              borderRadius: "8px",
              fontWeight: 900,
            }}
          >
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
