// src/components/Topbar/index.jsx
import {
  Box,
  IconButton,
  Popover,
  Typography,
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
  ListItemButton,
  ListItemAvatar,
  ListItemText,
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

const brand = {
  text: "#0f172a",
  subtext: "#334155",
  border: "#e5e7eb",
  surface: "#ffffff",
  surfaceMuted: "#f8fafc",
  primary: "#A3CDD5",      // Pantone 13-4520 TCX -> #A3CDD5
  primaryDark: "#82A4AA",  // companion darker tone
  focusRing: "rgba(163,205,213,0.18)", // primary at 18% opacity
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

  // Autocomplete / search
  const [inputValue, setInputValue] = useState("");

  // Notifications
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem("notifications");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [notifAnchor, setNotifAnchor] = useState(null);

  // Profile
  const [profileAnchor, setProfileAnchor] = useState(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  // UI state
  const [snack, setSnack] = useState({ open: false, severity: "info", message: "" });
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    // Maintain a set of seen barcodes so we only add fresh notifications
    const seen = new Set(notifications.map((n) => n.barcode));
    const check = () => {
      const now = new Date();
      const expired =
        Array.isArray(goodsInRows) && goodsInRows.length
          ? goodsInRows.filter((r) => r && r.expiryDate && new Date(r.expiryDate) < now)
          : [];
      // keep only notifications that still match an expired row
      const still = notifications.filter((n) => expired.some((r) => r.barCode === n.barcode));
      const fresh = expired
        .filter((r) => r && r.barCode && !seen.has(r.barCode))
        .map((r) => ({
          message: `Your ${r.ingredient || "ingredient"} (${r.barCode}) has expired!`,
          barcode: r.barCode,
        }));
      if (fresh.length || still.length !== notifications.length) {
        const updated = [...still, ...fresh];
        setNotifications(updated);
        try {
          localStorage.setItem("notifications", JSON.stringify(updated));
        } catch {}
      }
    };

    // run once + poll (poll is fine for small apps)
    check();
    const id = setInterval(check, 5000);
    return () => clearInterval(id);
  }, [goodsInRows]); // deliberately not including notifications to avoid tight loops

  // Notification handlers
  const handleNotifClick = (e) => setNotifAnchor(e.currentTarget);
  const handleCloseNotif = () => setNotifAnchor(null);

  const handleNotificationClick = (barcode) => {
    // navigate to GoodsIn and pass focusBar in location.state
    try {
      navigate("/GoodsIn", { state: { focusBar: barcode } });
    } catch {
      // fallback to pathname only
      window.location.href = "/GoodsIn";
    }
    // clear notifications visually (we already persisted to localStorage)
    setNotifications([]);
    try {
      localStorage.setItem("notifications", JSON.stringify([]));
    } catch {}
    handleCloseNotif();
  };

  // Profile / logout
  const handleProfileClick = (e) => setProfileAnchor(e.currentTarget);
  const handleCloseProfile = () => setProfileAnchor(null);
  const handleLogoutClick = () => setLogoutDialogOpen(true);

  const handleConfirmLogout = async () => {
    setLogoutDialogOpen(false);
    setProfileAnchor(null);
    setLoggingOut(true);
    try {
      if (typeof signOut === "function") await signOut();
      setSnack({ open: true, severity: "success", message: "Logged out successfully" });
    } catch (err) {
      console.error("signOut failed", err);
      setSnack({ open: true, severity: "warning", message: "Logout encountered an error" });
    } finally {
      // best-effort cleanup
      try {
        localStorage.removeItem("notifications");
        localStorage.removeItem("amplify-authenticator");
        Object.keys(localStorage).forEach((k) => {
          if (k.startsWith("CognitoIdentityServiceProvider") || k.startsWith("aws-amplify")) {
            localStorage.removeItem(k);
          }
        });
      } catch {}
      // navigate to login
      try {
        navigate("/login");
      } catch {}
      try {
        window.location.replace("/login");
      } catch {
        window.location.href = "/login";
      }
      setLoggingOut(false);
    }
  };

  const handleEnterKey = (currentValue) => {
    const match = pageOptions.find((o) => o.label.toLowerCase() === currentValue.toLowerCase());
    if (match) navigate(match.path);
  };

  const userInitials = (id) => {
    if (!id) return null;
    try {
      const parts = String(id).split(/[^A-Za-z0-9]+/).filter(Boolean);
      if (parts.length === 0) return String(id).slice(0, 2).toUpperCase();
      if (parts.length === 1) return String(parts[0]).slice(0, 2).toUpperCase();
      return (parts[0][0] + parts[1][0]).toUpperCase();
    } catch {
      return null;
    }
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
        {/* Search / page autocomplete */}
        <Box sx={{ width: { xs: "100%", sm: 380, md: 440 }, mr: 2 }}>
          <Autocomplete
            freeSolo
            options={pageOptions}
            filterOptions={(opts, state) =>
              state.inputValue.trim().length > 0 ? filterOptions(opts, state) : []
            }
            getOptionLabel={(opt) => (typeof opt === "string" ? opt : opt.label)}
            inputValue={inputValue}
            onInputChange={(_, value) => setInputValue(value)}
            onChange={(_, selected) => {
              if (selected?.path) navigate(selected.path);
            }}
            renderInput={(params) => {
              // merge params.InputProps safely so we don't clobber adornments
              const InputProps = { ...(params.InputProps || {}) };
              return (
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
                        boxShadow: `0 0 0 6px ${brand.focusRing}`,
                      },
                    },
                    "& .MuiInputBase-input": { py: 1.2 },
                    width: "100%",
                  }}
                  InputProps={{
                    ...InputProps,
                    endAdornment: (
                      <>
                        {InputProps.endAdornment}
                        <IconButton
                          onClick={() => handleEnterKey(inputValue)}
                          edge="end"
                          size="small"
                          aria-label="Go"
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
                            width: 32,
                            height: 32,
                          }}
                        >
                          <SearchIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </>
                    ),
                  }}
                />
              );
            }}
          />
        </Box>

        {/* Top-right icons */}
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
              aria-label="Notifications"
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
                p: 0.5,
              }}
              aria-label="Account"
            >
              {/* visible Avatar: brand-colored background and white content for contrast */}
              {cognitoId ? (
                <Avatar sx={{ bgcolor: brand.primary, color: "#fff", width: 30, height: 30, fontWeight: 800 }}>
                  {userInitials(cognitoId) || <PersonOutlinedIcon />}
                </Avatar>
              ) : (
                <Avatar sx={{ bgcolor: "#fff", color: brand.primary, width: 30, height: 30 }}>
                  <PersonOutlinedIcon />
                </Avatar>
              )}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Notification popover */}
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
          <Box
            sx={{
              background: `linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark})`,
              color: "#fff",
              px: 3,
              py: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              Notifications
            </Typography>
            <IconButton size="small" onClick={handleCloseNotif} sx={{ color: "#fff" }}>
              <ArrowCircleRightOutlinedIcon />
            </IconButton>
          </Box>

          <Box p={2} sx={{ maxHeight: 320, overflowY: "auto", background: brand.surface }}>
            {notifications.length === 0 ? (
              <Typography variant="body2" sx={{ color: brand.subtext }}>
                You have no notifications
              </Typography>
            ) : (
              <List disablePadding>
                {notifications.map((n, i) => {
                  const key = n.barcode || `${i}`;
                  return (
                    <Box key={key} sx={{ mb: i < notifications.length - 1 ? 1 : 0 }}>
                      <ListItemButton
                        onClick={() => handleNotificationClick(n.barcode)}
                        sx={{
                          borderRadius: 2,
                          px: 1,
                          py: 1,
                          "&:hover": { background: brand.surfaceMuted },
                        }}
                        aria-label={`Notification ${i + 1}`}
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
                            n.barcode ? (
                              <Typography variant="caption" sx={{ color: brand.subtext }}>
                                Barcode: {n.barcode}
                              </Typography>
                            ) : null
                          }
                        />
                        <IconButton edge="end" onClick={() => handleNotificationClick(n.barcode)} sx={{ color: brand.primary }}>
                          <ArrowCircleRightOutlinedIcon />
                        </IconButton>
                      </ListItemButton>
                      {i < notifications.length - 1 && <Divider sx={{ borderColor: brand.border }} />}
                    </Box>
                  );
                })}
              </List>
            )}
          </Box>
        </Box>
      </Popover>

      {/* Profile popover */}
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
          <Box sx={{ px: 3, py: 2, background: `linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark})`, color: "#fff" }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: "rgba(255,255,255,0.12)", color: "#fff", width: 56, height: 56 }}>
                {userInitials(cognitoId) || <PersonOutlinedIcon />}
              </Avatar>
              <Box>
                <Typography sx={{ fontWeight: 800 }}>{cognitoId ? "Account" : "Guest"}</Typography>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.9)" }}>
                  {cognitoId ? `${String(cognitoId).slice(0, 24)}${String(cognitoId).length > 24 ? "…" : ""}` : "Not signed in"}
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Box p={2} sx={{ background: brand.surface }}>
            <List disablePadding>
              <ListItemButton
                onClick={() => {
                  handleCloseProfile();
                  navigate("/account");
                }}
                sx={{ borderRadius: 1 }}
              >
                <AccountCircleOutlinedIcon fontSize="small" sx={{ mr: 1, color: brand.primary }} />
                <Typography>Account</Typography>
              </ListItemButton>

              <ListItemButton
                onClick={() => {
                  handleCloseProfile();
                  navigate("/settings");
                }}
                sx={{ mt: 1, borderRadius: 1 }}
              >
                <SettingsOutlinedIcon fontSize="small" sx={{ mr: 1, color: brand.primary }} />
                <Typography>Settings</Typography>
              </ListItemButton>

              <ListItemButton
                onClick={() => {
                  handleCloseProfile();
                  navigate("/support");
                }}
                sx={{ mt: 1, borderRadius: 1 }}
              >
                <SupportAgentOutlinedIcon fontSize="small" sx={{ mr: 1, color: brand.primary }} />
                <Typography>Support</Typography>
              </ListItemButton>
            </List>
          </Box>

          <Divider sx={{ borderColor: brand.border }} />

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
            >
              Logout
            </Button>
          </Box>
        </Box>
      </Popover>

      {/* Logout confirmation */}
      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        PaperProps={{
          sx: { borderRadius: 14, border: `1px solid ${brand.border}`, boxShadow: brand.shadow },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: brand.text }}>Confirm Logout</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: brand.subtext }}>Are you sure you want to log out?</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setLogoutDialogOpen(false)} sx={{ textTransform: "none", fontWeight: 700 }} disabled={loggingOut}>Cancel</Button>
          <Button onClick={handleConfirmLogout} color="error" sx={{ textTransform: "none", fontWeight: 800, borderRadius: 999, px: 2 }} disabled={loggingOut} startIcon={loggingOut ? <CircularProgress size={18} /> : null}>
            {loggingOut ? "Logging out…" : "Logout"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
