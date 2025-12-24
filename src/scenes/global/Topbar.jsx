// src/components/Topbar/index.jsx
import {
  Box,
  IconButton,
  Popover,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  TextField,
  Snackbar,
  Alert,
  CircularProgress,
  Avatar,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Divider,
  Stack,
  Badge,
  Tooltip,
  InputAdornment
} from "@mui/material";
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";
import PersonIcon from "@mui/icons-material/Person";
import SupportIcon from "@mui/icons-material/SupportAgent";
import KeyboardCommandKeyIcon from '@mui/icons-material/KeyboardCommandKey';

import { useState, useEffect } from "react";
import { useData } from "../../contexts/DataContext";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const brand = {
  text: "#1e293b",
  subtext: "#64748b",
  border: "#f1f5f9",
  surface: "rgba(255, 255, 255, 0.8)",
  primary: "#7C3AED",
  primaryDark: "#5B21B6",
  focusRing: "rgba(124, 58, 237, 0.12)",
  shadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
};

const pageOptions = [
  { label: "Dashboard", path: "/" },
  { label: "Goods In", path: "/GoodsIn" },
  { label: "Recipes", path: "/recipes" },
  { label: "Ingredients Inventory", path: "/IngredientsInventory" },
  { label: "Daily Production Log", path: "/daily_production" },
  { label: "Stock Inventory", path: "/stock_inventory" },
  { label: "Stock Usage", path: "/stock_usage" },
  { label: "Goods Out", path: "/goods_out" },
  { label: "Settings", path: "/settings" },
  { label: "Account", path: "/account" },
];

const filterOptions = createFilterOptions({
  matchFrom: "start",
  stringify: (option) => option.label,
});

export default function Topbar() {
  const { goodsInRows } = useData();
  const { cognitoId, signOut } = useAuth();
  const navigate = useNavigate();

  const [inputValue, setInputValue] = useState("");
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem("notifications");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [profileAnchor, setProfileAnchor] = useState(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [snack, setSnack] = useState({ open: false, severity: "info", message: "" });
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const seen = new Set(notifications.map((n) => n.barcode));
    const check = () => {
      const now = new Date();
      const expired = Array.isArray(goodsInRows) ? goodsInRows.filter((r) => r?.expiryDate && new Date(r.expiryDate) < now) : [];
      const still = notifications.filter((n) => expired.some((r) => r.barCode === n.barcode));
      const fresh = expired.filter((r) => r?.barCode && !seen.has(r.barCode)).map((r) => ({
        message: `${r.ingredient} expired`,
        barcode: r.barCode,
      }));
      if (fresh.length || still.length !== notifications.length) {
        const updated = [...still, ...fresh];
        setNotifications(updated);
        localStorage.setItem("notifications", JSON.stringify(updated));
      }
    };
    check();
    const id = setInterval(check, 10000);
    return () => clearInterval(id);
  }, [goodsInRows]);

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      navigate("/login");
    } catch (err) {
      setSnack({ open: true, severity: "error", message: "Logout failed" });
    } finally { setLoggingOut(false); }
  };

  const userInitials = (id) => {
    if (!id) return "?";
    return String(id).slice(0, 2).toUpperCase();
  };

  return (
    <Box
      sx={{
        position: "sticky", top: 0, zIndex: 1100, px: 3, py: 1.5,
        backgroundColor: brand.surface,
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid",
        borderColor: "rgba(229, 231, 235, 0.5)",
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center">
        
        {/* Left Side: Brand/Context Info */}
        <Box sx={{ display: { xs: "none", md: "block" } }}>
           <Typography sx={{ fontWeight: 700, color: brand.text, fontSize: "0.9rem" }}>
             Hupes Production
           </Typography>
        </Box>

        {/* Center: SaaS Command Search */}
        <Box sx={{ width: { xs: "60%", sm: 400 }, position: "relative" }}>
          <Autocomplete
            freeSolo
            options={pageOptions}
            onInputChange={(_, value) => setInputValue(value)}
            onChange={(_, sel) => sel?.path && navigate(sel.path)}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search command..."
                size="small"
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: brand.subtext, fontSize: 18 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <Box sx={{ 
                        display: { xs: "none", sm: "flex" }, 
                        alignItems: "center", gap: 0.5, px: 1, py: 0.2, 
                        bgcolor: brand.border, borderRadius: 1.5, opacity: 0.6 
                    }}>
                        <KeyboardCommandKeyIcon sx={{ fontSize: 12 }} />
                        <Typography sx={{ fontSize: 10, fontWeight: 700 }}>K</Typography>
                    </Box>
                  )
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px",
                    bgcolor: "rgba(248, 250, 252, 0.8)",
                    transition: "0.2s",
                    "& fieldset": { borderColor: brand.border },
                    "&:hover fieldset": { borderColor: brand.primary },
                    "&.Mui-focused": {
                        bgcolor: "#fff",
                        boxShadow: `0 0 0 4px ${brand.focusRing}`
                    }
                  }
                }}
              />
            )}
          />
        </Box>

        {/* Right Side: Actions */}
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Tooltip title="Notifications">
            <IconButton 
              onClick={(e) => setNotifAnchor(e.currentTarget)}
              sx={{ color: brand.subtext, "&:hover": { color: brand.primary, bgcolor: brand.focusRing } }}
            >
              <Badge badgeContent={notifications.length} color="error" variant="dot">
                <NotificationsNoneIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ height: 24, alignSelf: "center" }} />

          <Box 
            onClick={(e) => setProfileAnchor(e.currentTarget)}
            sx={{ 
                display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer", 
                pl: 1, pr: 0.5, py: 0.5, borderRadius: "99px",
                "&:hover": { bgcolor: brand.border }
            }}
          >
            <Box sx={{ textAlign: "right", display: { xs: "none", sm: "block" } }}>
                <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: brand.text, lineHeight: 1 }}>
                    Production Mgr
                </Typography>
                <Typography sx={{ fontSize: "0.7rem", color: brand.subtext }}>
                    Active
                </Typography>
            </Box>
            <Avatar sx={{ width: 32, height: 32, bgcolor: brand.primary, fontSize: "0.8rem", fontWeight: 700 }}>
              {userInitials(cognitoId)}
            </Avatar>
          </Box>
        </Stack>
      </Box>

      {/* --- POPOVERS --- */}

      {/* Notifications Popover */}
      <Popover
        open={Boolean(notifAnchor)}
        anchorEl={notifAnchor}
        onClose={() => setNotifAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        slotProps={{ paper: { sx: { width: 320, mt: 1.5, borderRadius: "16px", boxShadow: brand.shadow, border: `1px solid ${brand.border}` } } }}
      >
        <Box sx={{ p: 2, bgcolor: brand.surfaceMuted }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Activity</Typography>
        </Box>
        <List sx={{ p: 1 }}>
          {notifications.length === 0 ? (
            <Typography sx={{ p: 2, fontSize: "0.85rem", color: brand.subtext, textAlign: "center" }}>No new alerts</Typography>
          ) : (
            notifications.map((n, i) => (
              <ListItemButton key={i} onClick={() => { navigate("/GoodsIn", { state: { focusBar: n.barcode } }); setNotifAnchor(null); }} sx={{ borderRadius: "8px" }}>
                <ListItemAvatar>
                    <Avatar sx={{ bgcolor: "rgba(220, 38, 38, 0.1)", color: "#dc2626" }}><NotificationsNoneIcon fontSize="small" /></Avatar>
                </ListItemAvatar>
                <ListItemText primary={n.message} primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: 600 }} secondary={n.barcode} />
              </ListItemButton>
            ))
          )}
        </List>
      </Popover>

      {/* Profile Popover */}
      <Popover
        open={Boolean(profileAnchor)}
        anchorEl={profileAnchor}
        onClose={() => setProfileAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        slotProps={{ paper: { sx: { width: 240, mt: 1.5, borderRadius: "16px", boxShadow: brand.shadow, border: `1px solid ${brand.border}` } } }}
      >
        <Box sx={{ p: 1 }}>
            <MenuItem onClick={() => { navigate("/account"); setProfileAnchor(null); }} sx={{ borderRadius: "8px", py: 1 }}>
                <PersonIcon sx={{ mr: 1.5, fontSize: 20, color: brand.subtext }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Profile</Typography>
            </MenuItem>
            <MenuItem onClick={() => { navigate("/settings"); setProfileAnchor(null); }} sx={{ borderRadius: "8px", py: 1 }}>
                <SettingsIcon sx={{ mr: 1.5, fontSize: 20, color: brand.subtext }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Settings</Typography>
            </MenuItem>
            <MenuItem onClick={() => { navigate("/support"); setProfileAnchor(null); }} sx={{ borderRadius: "8px", py: 1 }}>
                <SupportIcon sx={{ mr: 1.5, fontSize: 20, color: brand.subtext }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Support</Typography>
            </MenuItem>
            <Divider sx={{ my: 1 }} />
            <MenuItem onClick={() => setLogoutDialogOpen(true)} sx={{ borderRadius: "8px", py: 1, color: "error.main" }}>
                <LogoutIcon sx={{ mr: 1.5, fontSize: 20 }} />
                <Typography variant="body2" sx={{ fontWeight: 700 }}>Logout</Typography>
            </MenuItem>
        </Box>
      </Popover>

      {/* Logout Dialog */}
      <Dialog open={logoutDialogOpen} onClose={() => setLogoutDialogOpen(false)} PaperProps={{ sx: { borderRadius: "20px", p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Signing out?</DialogTitle>
        <DialogContent><DialogContentText>You will need to log back in to manage your kitchen production.</DialogContentText></DialogContent>
        <DialogActions sx={{ pb: 2, px: 3 }}>
          <Button onClick={() => setLogoutDialogOpen(false)} sx={{ textTransform: "none", color: brand.subtext }}>Stay logged in</Button>
          <Button 
            variant="contained" 
            disableElevation 
            onClick={handleConfirmLogout} 
            sx={{ bgcolor: "#ef4444", "&:hover": { bgcolor: "#dc2626" }, textTransform: "none", borderRadius: "10px", px: 3 }}
          >
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}