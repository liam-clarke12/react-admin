// src/components/Topbar/index.jsx
import { useState, useEffect } from "react";
import {
  Box, IconButton, Typography, Avatar, Stack, Badge, Tooltip, InputAdornment, 
  TextField, Autocomplete, Popover, MenuItem, Divider, Dialog, DialogTitle, 
  DialogContent, DialogContentText, DialogActions, Button
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import SettingsIcon from "@mui/icons-material/Settings";
import KeyboardCommandKeyIcon from '@mui/icons-material/KeyboardCommandKey';
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

const pageOptions = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Goods In", path: "/GoodsIn" },
  { label: "Recipes", path: "/recipes" },
  { label: "Employees", path: "/Employees" },
];

export default function Topbar() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { goodsInRows } = useData();

  const [isDark, setIsDark] = useState(() => localStorage.getItem("theme-mode") === "dark");
  const brand = getBrand(isDark);

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
          jobTitle: attrs?.["custom:jobTitle"] || "Manager"
        });
      } catch (e) {}
    })();
  }, []);

  return (
    <Box sx={{
      position: "sticky", top: 0, zIndex: 1100, px: 3, py: 1.5,
      backgroundColor: brand.surface,
      backdropFilter: "blur(12px)",
      borderBottom: `1px solid ${brand.border}`,
      transition: "background 0.3s, border 0.3s"
    }}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        
        <Typography sx={{ fontWeight: 700, color: brand.text, fontSize: "0.9rem", display: { xs: "none", md: "block" } }}>
          Hupes Production
        </Typography>

        {/* Center: Search */}
        <Box sx={{ width: { xs: "60%", sm: 400 } }}>
          <Autocomplete
            options={pageOptions}
            onChange={(_, sel) => sel && navigate(sel.path)}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                placeholder="Search..."
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
                  }
                }}
              />
            )}
          />
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton onClick={toggleTheme} sx={{ color: brand.subtext }}>
            {isDark ? <LightModeOutlinedIcon fontSize="small" /> : <DarkModeOutlinedIcon fontSize="small" />}
          </IconButton>

          <IconButton onClick={(e) => setNotifAnchor(e.currentTarget)} sx={{ color: brand.subtext }}>
            <Badge variant="dot" color="error"><NotificationsNoneIcon fontSize="small" /></Badge>
          </IconButton>

          <Divider orientation="vertical" flexItem sx={{ height: 20, mx: 1, alignSelf: "center", borderColor: brand.border }} />

          <Box onClick={(e) => setProfileAnchor(e.currentTarget)} sx={{ display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer", p: 0.5, borderRadius: "20px", "&:hover": { bgcolor: brand.border } }}>
            <Box sx={{ textAlign: "right", display: { xs: "none", sm: "block" } }}>
                <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: brand.text, lineHeight: 1 }}>{profile.firstName}</Typography>
                <Typography sx={{ fontSize: "0.65rem", color: brand.subtext }}>{profile.jobTitle}</Typography>
            </Box>
            <Avatar sx={{ width: 30, height: 30, bgcolor: brand.primary, fontSize: "0.8rem" }}>{profile.firstName?.[0]}</Avatar>
          </Box>
        </Stack>
      </Box>

      {/* Profile Menu Popover */}
      <Popover 
        open={Boolean(profileAnchor)} 
        anchorEl={profileAnchor} 
        onClose={() => setProfileAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        slotProps={{ paper: { sx: { mt: 1, width: 200, borderRadius: "12px", bgcolor: brand.surface, border: `1px solid ${brand.border}`, boxShadow: brand.shadow } } }}
      >
        <Box sx={{ p: 1 }}>
          <MenuItem onClick={() => navigate("/account")} sx={{ borderRadius: "8px", gap: 1.5, py: 1 }}>
            <PersonIcon sx={{ fontSize: 18, color: brand.subtext }} />
            <Typography variant="body2" sx={{ color: brand.text }}>Account</Typography>
          </MenuItem>
          <MenuItem onClick={() => setLogoutOpen(true)} sx={{ borderRadius: "8px", gap: 1.5, py: 1, color: "error.main" }}>
            <LogoutIcon sx={{ fontSize: 18 }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Logout</Typography>
          </MenuItem>
        </Box>
      </Popover>

      {/* Logout Dialog */}
      <Dialog open={logoutOpen} onClose={() => setLogoutOpen(false)} PaperProps={{ sx: { borderRadius: "16px", bgcolor: brand.surface } }}>
        <DialogTitle sx={{ color: brand.text, fontWeight: 700 }}>Confirm Logout</DialogTitle>
        <DialogContent><DialogContentText sx={{ color: brand.subtext }}>Are you sure you want to sign out?</DialogContentText></DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setLogoutOpen(false)} sx={{ color: brand.subtext }}>Cancel</Button>
          <Button variant="contained" onClick={signOut} sx={{ bgcolor: "#ef4444", "&:hover": { bgcolor: "#dc2626" }, borderRadius: "8px" }}>Logout</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}