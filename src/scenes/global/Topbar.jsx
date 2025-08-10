// src/components/Topbar/index.jsx (or wherever your Topbar lives)
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

// --- Nory-like brand tokens ---
const brand = {
  text: "#0f172a",
  subtext: "#334155",
  border: "#e5e7eb",
  surface: "#ffffff",
  surfaceMuted: "#f8fafc",
  primary: "#2563eb",
  primaryDark: "#1d4ed8",
  focusRing: "rgba(37, 99, 235, 0.35)",
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

// Only show suggestions when input has at least 1 character
const filterOptions = createFilterOptions({
  matchFrom: "start",
  stringify: (option) => option.label,
  trim: true,
});

export default function Topbar() {
  const { goodsInRows } = useData();
  const { cognitoId, signOut } = useAuth();
  const navigate = useNavigate();

  // state for autocomplete input
  const [inputValue, setInputValue] = useState("");
  // state for notifications
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem("notifications");
    return saved ? JSON.parse(saved) : [];
  });
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [profileAnchor, setProfileAnchor] = useState(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  // update notifications every 5s
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
  const handleConfirmLogout = async () => {
    setLogoutDialogOpen(false);
    await signOut();
    navigate("/login");
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
          {/* Removed dark/light mode toggle as requested */}

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
          <MenuItem onClick={() => navigate("/account")}>
            <AccountCircleOutlinedIcon fontSize="small" />{" "}
            <Box component="span" ml={1}>
              Account
            </Box>
          </MenuItem>
          <MenuItem onClick={() => navigate("/settings")}>
            <SettingsOutlinedIcon fontSize="small" />{" "}
            <Box component="span" ml={1}>
              Settings
            </Box>
          </MenuItem>
          <MenuItem onClick={handleLogoutClick} sx={{ color: brand.red }}>
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
          >
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
