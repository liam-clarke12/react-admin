// src/components/Topbar/index.jsx
import {
  Box,
  IconButton,
  Popover,
  Typography,
  Grid,
  MenuItem,
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
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Divider,
  Stack,
  Badge,
  Tooltip,
} from "@mui/material";
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import ArrowCircleRightOutlinedIcon from "@mui/icons-material/ArrowCircleRightOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import SupportAgentOutlinedIcon from "@mui/icons-material/SupportAgentOutlined";

import { useState, useEffect } from "react";
import { useData } from "../../contexts/DataContext";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

// --- brand tokens (unchanged) ---
const brand = {
  text: "#0f172a",
  subtext: "#334155",
  border: "#e5e7eb",
  surface: "#ffffff",
  surfaceMuted: "#f8fafc",
  primary: "#e11d48",
  primaryDark: "#be123c",
  focusRing: "rgba(225, 29, 72, 0.35)",
  red: "#ef4444",
  shadow: "0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.08)",
};

const pageOptions = [
  { label: "Dashboard", path: "/" },
  { label: "Goods In", path: "/GoodsIn" },
  { label: "Goods In Form", path: "/GoodsInForm" },
  { label: "Recipes", path: "/recipes" },
  { label: "Recipe Form", path: "/recipeform" },
  { label: "Ingredients Inventory", path: "/IngredientsInventory" },
  { label: "Daily Production Log", path: "/daily_production" },
  { label: "Production Log Form", path: "/recipe_production" },
  { label: "Stock Inventory", path: "/stock_inventory" },
  { label: "Stock Usage", path: "/stock_usage" },
  { label: "Goods Out", path: "/goods_out" },
  { label: "Goods Out Form", path: "/goods_out_form" },
  { label: "Settings", path: "/settings" },
  { label: "Account", path: "/account" },
];

const filterOptions = createFilterOptions({
  matchFrom: "start",
  stringify: (option) => option.label,
  trim: true,
});

export default function Topbar() {
  const { goodsInRows } = useData();
  const { cognitoId, signOut } = useAuth();
  const navigate = useNavigate();

  // autocomplete state
  const [inputValue, setInputValue] = useState("");
  // notifications
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem("notifications");
    return saved ? JSON.parse(saved) : [];
  });
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [profileAnchor, setProfileAnchor] = useState(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  // snackbar for logout feedback
  const [snack, setSnack] = useState({ open: false, severity: "info", message: "" });
  // logout loading flag
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const seen = new Set(notifications.map((n) => n.barcode));
    const check = () => {
      const now = new Date();
      const expired = goodsInRows.filter((r) => r.expiryDate && new Date(r.expiryDate) < now);
      const still = notifications.filter((n) =>
        expired.some((r) => r.barCode === n.barcode)
      );
      const fresh = expired
        .filter((r) => !seen.has(r.barCode))
        .map((r) => ({
          message: `Your ${r.ingredient} (${r.barCode}) has expired!`,
          barcode: r.barCode,
        }));
      if (fresh.length || still.length !== notifications.length) {
        const updated = [...still, ...fresh];
        setNotifications(updated);
        localStorage.setItem("notifications", JSON.stringify(updated));
      }
    };
    const id = setInterval(check, 5000);
    // run once immediately
    check();
    return () => clearInterval(id);
  }, [goodsInRows]); // don't include notifications so we don't create a tight loop

  // notification handlers
  const handleNotifClick = (e) => setNotifAnchor(e.currentTarget);
  const handleCloseNotif = () => setNotifAnchor(null);
  const handleNotificationClick = () => {
    navigate("/GoodsIn");
    setNotifications([]);
    localStorage.setItem("notifications", JSON.stringify([]));
    handleCloseNotif();
  };

  const handleMarkAllRead = () => {
    setNotifications([]);
    localStorage.setItem("notifications", JSON.stringify([]));
    handleCloseNotif();
    setSnack({ open: true, severity: "success", message: "All notifications marked read" });
  };

  const handleViewAllNotifications = () => {
    navigate("/GoodsIn");
    handleCloseNotif();
  };

  // profile handlers
  const handleProfileClick = (e) => setProfileAnchor(e.currentTarget);
  const handleCloseProfile = () => setProfileAnchor(null);
  const handleLogoutClick = () => setLogoutDialogOpen(true);

  // Robust logout flow:
  const handleConfirmLogout = async () => {
    setLogoutDialogOpen(false);
    setProfileAnchor(null);
    setLoggingOut(true);

    try {
      if (signOut && typeof signOut === "function") {
        await signOut();
      } else if (window && window.Auth && typeof window.Auth.signOut === "function") {
        await window.Auth.signOut();
      } else {
        console.warn("[Topbar] No signOut function available — continuing with cleanup");
      }

      setSnack({ open: true, severity: "success", message: "Logged out successfully" });
    } catch (err) {
      console.error("[Topbar] signOut failed:", err);
      setSnack({ open: true, severity: "warning", message: "Logout encountered an error, clearing local state" });
    } finally {
      try {
        localStorage.removeItem("notifications");
        localStorage.removeItem("amplify-authenticator");
        Object.keys(localStorage).forEach((k) => {
          if (k.startsWith("CognitoIdentityServiceProvider") || k.startsWith("aws-amplify"))
            localStorage.removeItem(k);
        });
      } catch (e) {
        console.warn("[Topbar] error clearing localStorage during logout cleanup", e);
      }

      try {
        navigate("/login");
      } catch (navErr) {
        console.warn("[Topbar] navigate('/login') failed:", navErr);
      }

      try {
        window.location.replace("/login");
      } catch (replaceErr) {
        console.warn("[Topbar] window.location.replace failed:", replaceErr);
        window.location.href = "/login";
      } finally {
        setLoggingOut(false);
      }
    }
  };

  // when Enter pressed in the textfield
  const handleEnterKey = (currentValue) => {
    const match = pageOptions.find(
      (o) => o.label.toLowerCase() === currentValue.toLowerCase()
    );
    if (match) navigate(match.path);
  };

  // helper to create initials for avatar
  const userInitials = (id) => {
    if (!id) return "U";
    // take first 2 chars of id or split on non-alphanum
    const parts = String(id).split(/[^A-Za-z0-9]+/).filter(Boolean);
    if (parts.length === 0) return String(id).slice(0, 2).toUpperCase();
    if (parts.length === 1) return String(parts[0]).slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  return (
    <Box
      sx={{
        px: 2,
        py: 1.5,
        background: brand.surfaceMuted,
        position: "sticky",
        top: 0,
        zIndex: (t) => t.zIndex.appBar,
      }}
    >
      {/* Card-like topbar */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        sx={{
          px: 2,
          py: 1.5,
          border: `1px solid ${brand.border}`,
          borderRadius: 14,
          background: brand.surface,
          boxShadow: brand.shadow,
        }}
      >
        {/* Page-autocomplete */}
        <Box sx={{ width: { xs: "100%", sm: 380, md: 440 }, mr: 2 }}>
          <Autocomplete
            freeSolo
            options={pageOptions}
            filterOptions={(opts, state) =>
              state.inputValue.trim().length > 0
                ? filterOptions(opts, state)
                : []
            }
            getOptionLabel={(opt) =>
              typeof opt === "string" ? opt : opt.label
            }
            inputValue={inputValue}
            onInputChange={(_, value) => setInputValue(value)}
            onChange={(_, selected) => {
              if (selected?.path) navigate(selected.path);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                placeholder="Go to page…"
                size="small"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleEnterKey(inputValue);
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 12,
                    background: "#fff",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: brand.border,
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: brand.primary,
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: brand.primary,
                    },
                    "&.Mui-focused": {
                      boxShadow: `0 0 0 4px ${brand.focusRing}`,
                    },
                  },
                  "& .MuiInputBase-input": { py: 1.2 },
                }}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {params.InputProps.endAdornment}
                      <IconButton
                        onClick={() => handleEnterKey(inputValue)}
                        edge="end"
                        size="small"
                        sx={{
                          ml: 0.5,
                          borderRadius: 999,
                          color: "#fff",
                          background: `linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark})`,
                          boxShadow:
                            "0 8px 16px rgba(29,78,216,0.25), 0 2px 4px rgba(15,23,42,0.06)",
                          "&:hover": {
                            background: `linear-gradient(180deg, ${brand.primaryDark}, ${brand.primaryDark})`,
                          },
                          width: 28,
                          height: 28,
                        }}
                      >
                        <SearchIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </>
                  ),
                }}
              />
            )}
          />
        </Box>

        {/* Icons */}
        <Box display="flex" alignItems="center" gap={1}>
          <Tooltip title={notifications.length ? `${notifications.length} notifications` : "No notifications"}>
            <IconButton
              onClick={handleNotifClick}
              sx={{
                position: "relative",
                background: "#f1f5f9",
                border: `1px solid ${brand.border}`,
                borderRadius: 999,
                width: 44,
                height: 44,
                "&:hover": { background: "#e2e8f0" },
              }}
            >
              <Badge
                badgeContent={notifications.length}
                color="error"
                overlap="circular"
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
              >
                <NotificationsOutlinedIcon sx={{ color: brand.text }} />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title="Account">
            <IconButton
              onClick={handleProfileClick}
              sx={{
                background: "#f1f5f9",
                border: `1px solid ${brand.border}`,
                borderRadius: 999,
                width: 44,
                height: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                "&:hover": { background: "#e2e8f0" },
              }}
            >
              <Avatar sx={{ width: 28, height: 28, bgcolor: "transparent", color: brand.text }}>
                <PersonOutlinedIcon />
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Notification Popover - redesigned */}
      <Popover
        open={Boolean(notifAnchor)}
        anchorEl={notifAnchor}
        onClose={handleCloseNotif}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              width: 360,
              borderRadius: 14,
              border: `1px solid ${brand.border}`,
              boxShadow: "0 18px 36px rgba(15,23,42,0.12)",
              overflow: "hidden",
            },
          },
        }}
      >
        <Box>
          {/* header */}
          <Box
            sx={{
              background: `linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark})`,
              color: "#fff",
              px: 3,
              py: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                Notifications
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                {notifications.length} unread
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                size="small"
                onClick={handleMarkAllRead}
                sx={{
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.12)",
                  textTransform: "none",
                  borderRadius: 2,
                }}
              >
                Mark all read
              </Button>
              <Button
                size="small"
                onClick={handleViewAllNotifications}
                sx={{
                  color: "#fff",
                  background: "rgba(255,255,255,0.08)",
                  textTransform: "none",
                  borderRadius: 2,
                }}
              >
                View all
              </Button>
            </Box>
          </Box>

          {/* body */}
          <Box p={2} sx={{ maxHeight: 320, overflowY: "auto", background: brand.surface }}>
            {notifications.length === 0 ? (
              <Typography variant="body2" sx={{ color: brand.subtext }}>
                You have no notifications
              </Typography>
            ) : (
              <List disablePadding>
                {notifications.map((n, i) => (
                  <Box key={n.barcode || i} sx={{ mb: i < notifications.length - 1 ? 1 : 0 }}>
                    <ListItemButton
                      onClick={handleNotificationClick}
                      sx={{
                        borderRadius: 2,
                        px: 1,
                        py: 1,
                        "&:hover": { background: brand.surfaceMuted },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: "#fff", color: brand.primary, width: 36, height: 36 }}>
                          <NotificationsOutlinedIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography sx={{ color: brand.text, fontWeight: 700 }}>
                            {n.message}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" sx={{ color: brand.subtext }}>
                            {n.barcode ? `Barcode: ${n.barcode}` : ""}
                          </Typography>
                        }
                      />
                      <IconButton edge="end" onClick={handleNotificationClick} sx={{ color: brand.primary }}>
                        <ArrowCircleRightOutlinedIcon />
                      </IconButton>
                    </ListItemButton>
                    {i < notifications.length - 1 && <Divider sx={{ borderColor: brand.border }} />}
                  </Box>
                ))}
              </List>
            )}
          </Box>

          {/* footer */}
          <Box sx={{ px: 2, py: 1, borderTop: `1px solid ${brand.border}`, background: brand.surface }}>
            <Grid container alignItems="center" justifyContent="space-between">
              <Grid item>
                <Typography variant="caption" sx={{ color: brand.subtext }}>
                  Notifications are checked every 5s.
                </Typography>
              </Grid>
              <Grid item>
                <Button
                  size="small"
                  onClick={handleCloseNotif}
                  sx={{
                    textTransform: "none",
                    color: brand.primary,
                    fontWeight: 700,
                  }}
                >
                  Close
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Popover>

      {/* Profile Popover - redesigned */}
      <Popover
        open={Boolean(profileAnchor)}
        anchorEl={profileAnchor}
        onClose={handleCloseProfile}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              width: 300,
              borderRadius: 14,
              border: `1px solid ${brand.border}`,
              boxShadow: "0 18px 36px rgba(15,23,42,0.12)",
              overflow: "hidden",
            },
          },
        }}
      >
        <Box>
          {/* header */}
          <Box sx={{ px: 3, py: 2, background: `linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark})`, color: "#fff" }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: "rgba(255,255,255,0.12)", color: "#fff", width: 56, height: 56 }}>
                {userInitials(cognitoId)}
              </Avatar>
              <Box>
                <Typography sx={{ fontWeight: 800 }}>{cognitoId ? "Account" : "Guest"}</Typography>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.9)" }}>
                  {cognitoId ? `${String(cognitoId).slice(0, 24)}${String(cognitoId).length > 24 ? "…" : ""}` : "Not signed in"}
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* body */}
          <Box p={2} sx={{ background: brand.surface }}>
            <List disablePadding>
              <ListItem disablePadding>
                <MenuItem
                  onClick={() => {
                    handleCloseProfile();
                    navigate("/account");
                  }}
                  sx={{ width: "100%" }}
                >
                  <AccountCircleOutlinedIcon fontSize="small" sx={{ mr: 1, color: brand.primary }} />
                  <Box component="span">Account</Box>
                </MenuItem>
              </ListItem>

              <ListItem disablePadding>
                <MenuItem
                  onClick={() => {
                    handleCloseProfile();
                    navigate("/settings");
                  }}
                  sx={{ width: "100%" }}
                >
                  <SettingsOutlinedIcon fontSize="small" sx={{ mr: 1, color: brand.primary }} />
                  <Box component="span">Settings</Box>
                </MenuItem>
              </ListItem>

              <ListItem disablePadding>
                <MenuItem
                  onClick={() => {
                    handleCloseProfile();
                    navigate("/support");
                  }}
                  sx={{ width: "100%" }}
                >
                  <SupportAgentOutlinedIcon fontSize="small" sx={{ mr: 1, color: brand.primary }} />
                  <Box component="span">Support</Box>
                </MenuItem>
              </ListItem>
            </List>
          </Box>

          <Divider sx={{ borderColor: brand.border }} />

          {/* footer with logout action */}
          <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between", background: brand.surface }}>
            <Button
              onClick={() => {
                handleCloseProfile();
                navigate("/account");
              }}
              sx={{
                textTransform: "none",
                borderRadius: 999,
                px: 2,
                border: `1px solid ${brand.border}`,
              }}
            >
              View account
            </Button>

            <Button
              onClick={() => {
                handleCloseProfile();
                setLogoutDialogOpen(true);
              }}
              sx={{
                textTransform: "none",
                fontWeight: 800,
                borderRadius: 999,
                px: 2,
                color: "#fff",
                background: `linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark})`,
                "&:hover": { background: brand.primaryDark },
              }}
              startIcon={<LogoutOutlinedIcon />}
            >
              Logout
            </Button>
          </Box>
        </Box>
      </Popover>

      {/* Logout Confirmation */}
      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 14,
            border: `1px solid ${brand.border}`,
            boxShadow: brand.shadow,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: brand.text }}>
          Confirm Logout
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: brand.subtext }}>
            Are you sure you want to log out?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setLogoutDialogOpen(false)}
            sx={{ textTransform: "none", fontWeight: 700 }}
            disabled={loggingOut}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmLogout}
            color="error"
            sx={{
              textTransform: "none",
              fontWeight: 800,
              borderRadius: 999,
              px: 2,
            }}
            disabled={loggingOut}
            startIcon={loggingOut ? <CircularProgress size={18} /> : null}
          >
            {loggingOut ? "Logging out…" : "Logout"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snack for logout feedback */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          severity={snack.severity}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
