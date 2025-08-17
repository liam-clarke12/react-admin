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
} from "@mui/material";
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import ArrowCircleRightOutlinedIcon from "@mui/icons-material/ArrowCircleRightOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";

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
      const expired = goodsInRows.filter((r) => new Date(r.expiryDate) < now);
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
    return () => clearInterval(id);
  }, [goodsInRows, notifications]);

  // notification handlers
  const handleNotifClick = (e) => setNotifAnchor(e.currentTarget);
  const handleCloseNotif = () => setNotifAnchor(null);
  const handleNotificationClick = () => {
    navigate("/GoodsIn");
    setNotifications([]);
    localStorage.setItem("notifications", JSON.stringify([]));
    handleCloseNotif();
  };

  // profile handlers
  const handleProfileClick = (e) => setProfileAnchor(e.currentTarget);
  const handleCloseProfile = () => setProfileAnchor(null);
  const handleLogoutClick = () => setLogoutDialogOpen(true);

  // Robust logout flow:
  //  - call signOut() if present
  //  - if it throws, log error
  //  - clear common local storage keys we know about (notifications etc)
  //  - navigate to /login and force a full reload to clear any in-memory state
  const handleConfirmLogout = async () => {
    setLogoutDialogOpen(false);
    // close profile popover immediately
    setProfileAnchor(null);
    setLoggingOut(true);

    try {
      console.log("[Topbar] Starting signOut()");
      if (signOut && typeof signOut === "function") {
        // call your app's signOut
        await signOut();
        console.log("[Topbar] signOut() completed (useAuth)");
      } else if (window && window.Auth && typeof window.Auth.signOut === "function") {
        // fallback for aws-amplify if exposed globally (rare)
        await window.Auth.signOut();
        console.log("[Topbar] signOut() completed (window.Auth)");
      } else {
        console.warn("[Topbar] No signOut function available on useAuth or window.Auth — continuing with local cleanup");
      }

      // Success message to user
      setSnack({ open: true, severity: "success", message: "Logged out successfully" });
    } catch (err) {
      // If signOut throws, log it and still perform cleanup
      console.error("[Topbar] signOut failed:", err);
      setSnack({ open: true, severity: "warning", message: "Logout encountered an error, clearing local state" });
    } finally {
      // Defensive cleanup
      try {
        // clear notifications we store
        localStorage.removeItem("notifications");
        // remove other likely local keys used for auth/session
        localStorage.removeItem("amplify-authenticator"); // example; add your keys if present
        // remove Cognito prefixed keys (best-effort)
        Object.keys(localStorage).forEach((k) => {
          if (k.startsWith("CognitoIdentityServiceProvider") || k.startsWith("aws-amplify"))
            localStorage.removeItem(k);
        });
      } catch (e) {
        console.warn("[Topbar] error clearing localStorage during logout cleanup", e);
      }

      // Try client-side navigation first
      try {
        navigate("/login");
      } catch (navErr) {
        console.warn("[Topbar] navigate('/login') failed:", navErr);
      }

      // Force a hard redirect so in-memory state is cleared
      try {
        window.location.replace("/login");
      } catch (replaceErr) {
        // very unlikely, but log and fallback to location.href
        console.warn("[Topbar] window.location.replace failed:", replaceErr);
        window.location.href = "/login";
      } finally {
        setLoggingOut(false); // in case redirect didn't happen immediately (dev)
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
          <IconButton
            onClick={handleNotifClick}
            sx={{
              position: "relative",
              background: "#f1f5f9",
              border: `1px solid ${brand.border}`,
              borderRadius: 999,
              width: 40,
              height: 40,
              "&:hover": { background: "#e2e8f0" },
            }}
          >
            <NotificationsOutlinedIcon sx={{ color: brand.text }} />
            {notifications.length > 0 && (
              <Box
                component="span"
                sx={{
                  backgroundColor: brand.red,
                  color: "white",
                  borderRadius: "50%",
                  width: 18,
                  height: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "absolute",
                  top: -2,
                  right: -2,
                  fontSize: 10,
                  fontWeight: 800,
                  boxShadow: brand.shadow,
                }}
              >
                {notifications.length}
              </Box>
            )}
          </IconButton>

          <IconButton
            onClick={handleProfileClick}
            sx={{
              background: "#f1f5f9",
              border: `1px solid ${brand.border}`,
              borderRadius: 999,
              width: 40,
              height: 40,
              "&:hover": { background: "#e2e8f0" },
            }}
          >
            <PersonOutlinedIcon sx={{ color: brand.text }} />
          </IconButton>
        </Box>
      </Box>

      {/* Notification Popover */}
      <Popover
        open={Boolean(notifAnchor)}
        anchorEl={notifAnchor}
        onClose={handleCloseNotif}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 14,
              border: `1px solid ${brand.border}`,
              boxShadow: brand.shadow,
              overflow: "hidden",
            },
          },
        }}
      >
        <Box minWidth={320}>
          <Box
            sx={{
              background: `linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark})`,
              color: "#fff",
              px: 2,
              py: 1,
            }}
          >
            <Typography variant="body2" fontWeight="bold">
              Notifications
            </Typography>
          </Box>
          <Box p={2}>
            {notifications.length > 0 ? (
              notifications.map((n, i) => (
                <Box
                  key={i}
                  sx={{
                    borderBottom:
                      i < notifications.length - 1
                        ? `1px solid ${brand.border}`
                        : "none",
                    py: "8px",
                  }}
                >
                  <Grid
                    container
                    alignItems="center"
                    justifyContent="space-between"
                    wrap="nowrap"
                  >
                    <Grid item xs>
                      <Typography
                        variant="body2"
                        sx={{ color: brand.text, pr: 1 }}
                      >
                        {n.message}
                      </Typography>
                    </Grid>
                    <Grid item>
                      <IconButton
                        onClick={handleNotificationClick}
                        sx={{
                          color: brand.primary,
                          p: 0.5,
                          "&:hover": { color: brand.primaryDark },
                        }}
                      >
                        <ArrowCircleRightOutlinedIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Box>
              ))
            ) : (
              <Typography variant="body2" sx={{ color: brand.subtext }}>
                You have no notifications
              </Typography>
            )}
          </Box>
        </Box>
      </Popover>

      {/* Profile Popover */}
      <Popover
        open={Boolean(profileAnchor)}
        anchorEl={profileAnchor}
        onClose={handleCloseProfile}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 14,
              border: `1px solid ${brand.border}`,
              boxShadow: brand.shadow,
            },
          },
        }}
      >
        <Box minWidth={240} p={1.5}>
          <Typography
            variant="body2"
            fontWeight="bold"
            px={1.5}
            sx={{ color: brand.text }}
          >
            Account ID: {cognitoId || "Not available"}
          </Typography>
          <Box height="1px" bgcolor={brand.border} my={1} />
          <MenuItem
            onClick={() => {
              handleCloseProfile();
              navigate("/account");
            }}
          >
            <AccountCircleOutlinedIcon fontSize="small" />{" "}
            <Box component="span" ml={1}>
              Account
            </Box>
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleCloseProfile();
              navigate("/settings");
            }}
          >
            <SettingsOutlinedIcon fontSize="small" />{" "}
            <Box component="span" ml={1}>
              Settings
            </Box>
          </MenuItem>
          <MenuItem
            onClick={handleLogoutClick}
            sx={{ color: brand.red }}
            disabled={loggingOut}
          >
            <LogoutOutlinedIcon fontSize="small" />{" "}
            <Box component="span" ml={1}>
              Logout
            </Box>
          </MenuItem>
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
