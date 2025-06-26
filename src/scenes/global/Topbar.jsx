import { 
    Box, IconButton, useTheme, Popover, Typography, Grid, MenuItem, Dialog, DialogActions, DialogContent, 
    DialogContentText, DialogTitle, Button 
} from "@mui/material";
import { useContext, useState, useEffect } from "react";
import { ColorModeContext, tokens } from "../../themes";
import InputBase from "@mui/material/InputBase"; 
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import SearchIcon from "@mui/icons-material/Search";
import ArrowCircleRightOutlinedIcon from "@mui/icons-material/ArrowCircleRightOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined"; 
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined"; 
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import { useData } from "../../contexts/DataContext"; 
import { useAuth } from "../../contexts/AuthContext";  
import { useNavigate } from "react-router-dom"; 

const Topbar = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const colorMode = useContext(ColorModeContext);
    const { goodsInRows } = useData(); 
    const { cognitoId, signOut } = useAuth();  
    const navigate = useNavigate();

    const [notifications, setNotifications] = useState(() => {
        const savedNotifications = localStorage.getItem('notifications');
        return savedNotifications ? JSON.parse(savedNotifications) : [];
    });

    const [notifAnchor, setNotifAnchor] = useState(null);
    const [profileAnchor, setProfileAnchor] = useState(null);
    const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

    const handleNotifClick = (event) => {
        setNotifAnchor(event.currentTarget);
    };

    const handleCloseNotif = () => {
        setNotifAnchor(null);
    };

    const handleProfileClick = (event) => {
        setProfileAnchor(event.currentTarget);
    };

    const handleCloseProfile = () => {
        setProfileAnchor(null);
    };

    const handleNotificationClick = () => {
        navigate("/GoodsIn");
        setNotifications([]);  
        localStorage.setItem('notifications', JSON.stringify([])); 
        handleCloseNotif();
    };

    const handleLogoutClick = () => {
        setLogoutDialogOpen(true);
    };

    const handleConfirmLogout = async () => {
        setLogoutDialogOpen(false);
        await signOut();
        navigate("/login");
    };

    useEffect(() => {
        const notifiedBarcodes = new Set(notifications.map(notification => notification.barcode));

        const checkNotifications = () => {
            const currentDate = new Date();
            const expiredRows = goodsInRows.filter(row => new Date(row.expiryDate) < currentDate);

            const activeNotifications = notifications.filter(notification => 
                expiredRows.some(row => row.barCode === notification.barcode)
            );

            const newNotifications = expiredRows
                .filter(row => !notifiedBarcodes.has(row.barCode))
                .map(row => ({
                    message: `Your ${row.ingredient} (${row.barCode}) has expired!`,
                    barcode: row.barCode
                }));

            if (newNotifications.length > 0 || activeNotifications.length !== notifications.length) {
                const updatedNotifications = [...activeNotifications, ...newNotifications];
                setNotifications(updatedNotifications);
                localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
            }
        };

        const interval = setInterval(checkNotifications, 5000);
        return () => clearInterval(interval);

    }, [goodsInRows, notifications]);

    return (
        <Box display="flex" justifyContent="space-between" p={2}>
            {/* Search Bar */}
            <Box display="flex" backgroundColor={colors.primary[400]} borderRadius="3px">
                <InputBase sx={{ ml: 2, flex: 1 }} placeholder="Search" />
                <IconButton type="button" sx={{ p: 1 }}>
                    <SearchIcon />
                </IconButton>
            </Box>

            {/* Icons */}
            <Box display="flex" position="relative">
                <IconButton onClick={colorMode.toggleColorMode}>
                    {theme.palette.mode === 'dark' ? (
                        <DarkModeOutlinedIcon />
                    ) : (
                        <LightModeOutlinedIcon />
                    )}
                </IconButton>

                {/* Notifications Icon */}
                <IconButton onClick={handleNotifClick} style={{ position: 'relative' }}>
                    <NotificationsOutlinedIcon />
                    {notifications.length > 0 && (
                        <span style={{
                            backgroundColor: colors.red[500],
                            color: 'white',
                            borderRadius: '50%',
                            width: '16px',
                            height: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'absolute',
                            top: -2,
                            right: -1,
                            fontSize: '10px',
                        }}>
                            {notifications.length}
                        </span>
                    )}
                </IconButton>

                {/* Profile Icon */}
                <IconButton onClick={handleProfileClick}>
                    <PersonOutlinedIcon />
                </IconButton>
            </Box>

            {/* Notification Dropdown */}
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
                            notifications.map((notification, index) => (
                                <Box 
                                    key={index} 
                                    sx={{
                                        borderBottom: index < notifications.length - 1 ? `1px solid ${colors.primary[300]}` : 'none',
                                        paddingY: '8px',
                                    }}
                                >
                                    <Grid container alignItems="center" justifyContent="space-between">
                                        <Grid item>
                                            <Typography variant="body2">{notification.message}</Typography>
                                        </Grid>
                                        <Grid item>
                                            <IconButton 
                                                onClick={handleNotificationClick}
                                                sx={{ color: colors.blueAccent[500], padding: 0 }}
                                            >
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

            {/* Profile Dropdown */}
            <Popover
                open={Boolean(profileAnchor)}
                anchorEl={profileAnchor}
                onClose={handleCloseProfile}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                transformOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Box minWidth={220} p={1.5}>
                    <Typography variant="body2" fontWeight="bold" px={1.5}>Account ID: {cognitoId || "Not available"}</Typography>
                    <Box height="1px" bgcolor={colors.primary[300]} my={1} />

                    <MenuItem onClick={() => navigate("/account")}>
                    <Box display="flex" alignItems="center">
                        <AccountCircleOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
                        <Typography variant="body2">Account</Typography>
                    </Box>
                    </MenuItem>
                    <MenuItem onClick={() => navigate("/settings")}>
                    <Box display="flex" alignItems="center">
                        <SettingsOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
                        <Typography variant="body2">Settings</Typography>
                    </Box>
                    </MenuItem>
                    <MenuItem onClick={handleLogoutClick} sx={{ color: colors.red[500] }}>
                    <Box display="flex" alignItems="center">
                        <LogoutOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
                        <Typography variant="body2">Logout</Typography>
                    </Box>
                    </MenuItem>
                </Box>
            </Popover>

            {/* Logout Confirmation Dialog */}
            <Dialog open={logoutDialogOpen} onClose={() => setLogoutDialogOpen(false)}>
                <DialogTitle>Confirm Logout</DialogTitle>
                <DialogContent><DialogContentText>Are you sure you want to log out?</DialogContentText></DialogContent>
                <DialogActions>
                    <Button onClick={() => setLogoutDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleConfirmLogout} color="error">Logout</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Topbar;
