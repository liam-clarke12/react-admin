import { 
  Box, IconButton, useTheme, Popover, Typography, Grid, MenuItem, 
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button 
} from "@mui/material";
import { useContext, useState, useEffect } from "react";
import { ColorModeContext, tokens } from "../../themes";
import InputBase from "@mui/material/InputBase"; 
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import ArrowCircleRightOutlinedIcon from "@mui/icons-material/ArrowCircleRightOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined"; 
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined"; 
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import { useData } from "../../contexts/DataContext"; 
import { useAuth } from "../../contexts/AuthContext";  
import { useNavigate } from "react-router-dom"; 

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

export default function Topbar() {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const colorMode = useContext(ColorModeContext);
  const { goodsInRows } = useData();
  const { cognitoId, signOut } = useAuth();
  const navigate = useNavigate();

  // notifications state
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('notifications');
    return saved ? JSON.parse(saved) : [];
  });
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [profileAnchor, setProfileAnchor] = useState(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  // update notifications
  useEffect(() => {
    const notified = new Set(notifications.map(n => n.barcode));
    const check = () => {
      const now = new Date();
      const expired = goodsInRows.filter(r => new Date(r.expiryDate) < now);
      const still = notifications.filter(n => 
        expired.some(r => r.barCode === n.barcode)
      );
      const fresh = expired
        .filter(r => !notified.has(r.barCode))
        .map(r => ({
          message: `Your ${r.ingredient} (${r.barCode}) has expired!`,
          barcode: r.barCode
        }));
      if (fresh.length || still.length !== notifications.length) {
        const updated = [...still, ...fresh];
        setNotifications(updated);
        localStorage.setItem('notifications', JSON.stringify(updated));
      }
    };
    const id = setInterval(check, 5000);
    return () => clearInterval(id);
  }, [goodsInRows, notifications]);

  // notification handlers
  const handleNotifClick = e => setNotifAnchor(e.currentTarget);
  const handleCloseNotif = () => setNotifAnchor(null);
  const handleNotificationClick = () => {
    navigate("/GoodsIn");
    setNotifications([]);
    localStorage.setItem('notifications', JSON.stringify([]));
    handleCloseNotif();
  };

  // profile handlers
  const handleProfileClick = e => setProfileAnchor(e.currentTarget);
  const handleCloseProfile = () => setProfileAnchor(null);
  const handleLogoutClick = () => setLogoutDialogOpen(true);
  const handleConfirmLogout = async () => {
    setLogoutDialogOpen(false);
    await signOut();
    navigate("/login");
  };

  return (
    <Box display="flex" justifyContent="space-between" p={2}>
      {/* Page-autocomplete */}
      <Box width={300}>
        <Autocomplete
          freeSolo
          options={pageOptions}
          getOptionLabel={opt => typeof opt === 'string' ? opt : opt.label}
          onChange={(_, selected) => {
            if (selected?.path) navigate(selected.path);
          }}
          onInputChange={(_, value, reason) => {
            // nothing extra needed here for now
          }}
          renderInput={params => (
            <TextField
              {...params}
              variant="outlined"
              placeholder="Go to page…"
              size="small"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const match = pageOptions.find(
                    o => o.label.toLowerCase() === params.inputProps.value.toLowerCase()
                  );
                  if (match) navigate(match.path);
                }
              }}
            />
          )}
        />
      </Box>

      {/* Icons */}
      <Box display="flex" position="relative">
        <IconButton onClick={colorMode.toggleColorMode}>
          {theme.palette.mode === 'dark' 
            ? <DarkModeOutlinedIcon /> 
            : <LightModeOutlinedIcon />}
        </IconButton>

        <IconButton onClick={handleNotifClick} sx={{ position: 'relative' }}>
          <NotificationsOutlinedIcon />
          {notifications.length > 0 && (
            <Box component="span" sx={{
                backgroundColor: colors.red[500],
                color: 'white',
                borderRadius: '50%',
                width: 16,
                height: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'absolute',
                top: -2,
                right: -1,
                fontSize: 10,
              }}>
              {notifications.length}
            </Box>
          )}
        </IconButton>

        <IconButton onClick={handleProfileClick}>
          <PersonOutlinedIcon />
        </IconButton>
      </Box>

      {/* Notification Popover */}
      <Popover
        open={Boolean(notifAnchor)}
        anchorEl={notifAnchor}
        onClose={handleCloseNotif}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Box minWidth={300}>
          <Box sx={{ backgroundColor: colors.blueAccent[500], px: 2, py: 1 }}>
            <Typography variant="body2" fontWeight="bold">Notifications</Typography>
          </Box>
          <Box p={2}>
            {notifications.length > 0 ? (
              notifications.map((n, i) => (
                <Box key={i} sx={{
                    borderBottom: i < notifications.length - 1 ? `1px solid ${colors.primary[300]}` : 'none',
                    py: '8px'}}  
                >
                  <Grid container alignItems="center" justifyContent="space-between">
                    <Grid item>
                      <Typography variant="body2">{n.message}</Typography>
                    </Grid>
                    <Grid item>
                      <IconButton onClick={handleNotificationClick} sx={{ color: colors.blueAccent[500], p: 0 }}>
                        <ArrowCircleRightOutlinedIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Box>
              ))
            ) : (
              <Typography variant="body2">You have no notifications</Typography>
            )}
          </Box>
        </Box>
      </Popover>

      {/* Profile Popover */}
      <Popover
        open={Boolean(profileAnchor)}
        anchorEl={profileAnchor}
        onClose={handleCloseProfile}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Box minWidth={220} p={1.5}>
          <Typography variant="body2" fontWeight="bold" px={1.5}>
            Account ID: {cognitoId || "Not available"}
          </Typography>
          <Box height="1px" bgcolor={colors.primary[300]} my={1} />
          <MenuItem onClick={() => navigate("/account")}>
            <AccountCircleOutlinedIcon fontSize="small" /> Account
          </MenuItem>
          <MenuItem onClick={() => navigate("/settings")}>
            <SettingsOutlinedIcon fontSize="small" /> Settings
          </MenuItem>
          <MenuItem onClick={handleLogoutClick} sx={{ color: colors.red[500] }}>
            <LogoutOutlinedIcon fontSize="small" /> Logout
          </MenuItem>
        </Box>
      </Popover>

      {/* Logout Confirmation */}
      <Dialog open={logoutDialogOpen} onClose={() => setLogoutDialogOpen(false)}>
        <DialogTitle>Confirm Logout</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to log out?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogoutDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmLogout} color="error">Logout</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
