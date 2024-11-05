import { Box, IconButton, useTheme, Popover, Typography } from "@mui/material";
import { useContext, useState } from "react"; 
import { ColorModeContext, tokens } from "../../themes";
import InputBase from "@mui/material/InputBase"; 
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import SearchIcon from "@mui/icons-material/Search";
import { useData } from "../../contexts/DataContext"; 
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation

const Topbar = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const colorMode = useContext(ColorModeContext);
    const { notifications } = useData(); // Get notifications from context
    const [anchorEl, setAnchorEl] = useState(null);
    const navigate = useNavigate(); // Initialize useNavigate

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleNotificationClick = () => {
        navigate("/GoodsIn"); // Redirect to the Goods In page
        handleClose(); // Close the notification dropdown
    };

    const open = Boolean(anchorEl);

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
                <IconButton onClick={handleClick} style={{ position: 'relative' }}>
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
                <IconButton>
                    <SettingsOutlinedIcon />
                </IconButton>
                <IconButton>
                    <PersonOutlinedIcon />
                </IconButton>
            </Box>

            {/* Notification Dropdown */}
            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
            >
                <Box p={2} minWidth={200}>
                    {notifications.length > 0 ? (
                        notifications.map((notification, index) => (
                            <Typography 
                                key={index} 
                                variant="body2" 
                                onClick={handleNotificationClick} // Handle click to navigate
                                style={{ cursor: 'pointer' }} // Change cursor to pointer
                            >
                                {notification}
                            </Typography>
                        ))
                    ) : (
                        <Typography variant="body2">No notifications</Typography>
                    )}
                </Box>
            </Popover>
        </Box>
    );
};

export default Topbar;
