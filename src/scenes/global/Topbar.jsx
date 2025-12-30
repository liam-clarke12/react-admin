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
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import InventoryOutlinedIcon from "@mui/icons-material/InventoryOutlined";
import WarehouseOutlinedIcon from "@mui/icons-material/WarehouseOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import BakeryDiningOutlinedIcon from "@mui/icons-material/BakeryDiningOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import GroupWorkOutlinedIcon from "@mui/icons-material/GroupWorkOutlined";

import { fetchUserAttributes } from "aws-amplify/auth";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";

const getBrand = (isDark) => ({
  text: isDark ? "#f1f5f9" : "#1e293b",
  subtext: isDark ? "#94a3b8" : "#64748b",
  border: isDark ? "#334155" : "#f1f5f9",
  surface: isDark ? "rgba(15, 23, 42, 0.9)" : "rgba(255, 255, 255, 0.8)",
  surfaceMuted: isDark ? "#1e293b" : "#f8fafc",
  primary: "#7C3AED",
  shadow: isDark ? "0 4px 20px rgba(0,0,0,0.5)" : "0 4px 20px rgba(0,0,0,0.05)",
});

/**
 * ✅ Search options = ALL sidebar routes + account routes
 * You can add more here anytime and it will appear in search immediately.
 */
const pageOptions = [
  // Core
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

  // (If/when you use these routes)
  { label: "HRP Roles", path: "/hrp/roles", icon: <GroupWorkOutlinedIcon fontSize="small" /> },
  { label: "Skills & Training", path: "/hrp/skills", icon: <GroupWorkOutlinedIcon fontSize="small" /> },
  { label: "HRP Roster", path: "/hrp/roster", icon: <CalendarMonthOutlinedIcon fontSize="small" /> },

  // Account
  { label: "Account", path: "/account", icon: <PersonIcon fontSize="small" /> },
];

export default function Topbar() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { goodsInRows } = useData();

  const [isDark, setIsDark] = useState(() => localStorage.getItem("theme-mode") === "dark");
  const brand = useMemo(() => getBrand(isDark), [isDark]);

  const toggleTheme = () => {
    const newMode = isDark ? "light" : "dark";
    setIsDark(!isDark);
    localStorage.setItem("theme-mode", newMode);
    window.dispatchEvent(new Event("themeChanged"));
  };

  const [profile, setProfile] = useState({ firstName: "", lastName: "", jobTitle: "" });

  // ✅ Notifications popover
  const [notifAnchor, setNotifAnchor] = useState(null);

  // ✅ Profile popover
  const [profileAnchor, setProfileAnchor] = useState(null);

  // ✅ Logout dialog
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
      } catch (e) {
        setProfile({ firstName: "User", lastName: "", jobTitle: "Manager" });
      }
    })();
  }, []);

  // ✅ Notification count example (you can wire this to real data later)
  const notifCount = 0; // set to >0 to show dot
  const notifOpen = Boolean(notifAnchor);
  const profileOpen = Boolean(profileAnchor);

  const handleLogout = async () => {
    try {
      await signOut();
    } finally {
      // ✅ Redirect to sign-in/out page after logout
      navigate("/", { replace: true }); // change "/" if your auth route is different (e.g. "/auth" or "/sign-in")
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
        <Typography
          sx={{
            fontWeight: 700,
            color: brand.text,
            fontSize: "0.9rem",
            display: { xs: "none", md: "block" },
          }}
        >
          Hupes Production
        </Typography>

        {/* Center: Search */}
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

          {/* ✅ Notifications now opens */}
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

      {/* ✅ Notifications Popover */}
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
          <Typography sx={{ fontWeight: 900, color: brand.text, mb: 1 }}>
            Notifications
          </Typography>

          {notifCount === 0 ? (
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
              <Typography sx={{ color: brand.subtext, fontSize: "0.75rem", mt: 0.5 }}>
                (Wire this to your real alerts when ready.)
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: "grid", gap: 1 }}>
              {/* Example notification item */}
              <Box
                sx={{
                  p: 1.25,
                  borderRadius: "10px",
                  bgcolor: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc",
                  border: `1px solid ${brand.border}`,
                  cursor: "pointer",
                  "&:hover": { borderColor: brand.primary },
                }}
              >
                <Typography sx={{ color: brand.text, fontWeight: 800, fontSize: "0.85rem" }}>
                  Example notification
                </Typography>
                <Typography sx={{ color: brand.subtext, fontSize: "0.75rem", mt: 0.25 }}>
                  Click to view details…
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Popover>

      {/* Profile Menu Popover */}
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
          <DialogContentText sx={{ color: brand.subtext }}>
            Are you sure you want to sign out?
          </DialogContentText>
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
