import { Box, IconButton, useTheme, Popover, Typography, Grid } from "@mui/material";
import { useContext, useState } from "react"; 
import { ColorModeContext, tokens } from "../../themes";
import InputBase from "@mui/material/InputBase"; 
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import SearchIcon from "@mui/icons-material/Search";
import ArrowCircleRightOutlinedIcon from "@mui/icons-material/ArrowCircleRightOutlined";
import { useData } from "../../contexts/DataContext"; 
import { useNavigate } from "react-router-dom"; 

const Topbar = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const colorMode = useContext(ColorModeContext);
    const { notifications } = useData();
    const [anchorEl, setAnchorEl] = useState(null);
    const navigate = useNavigate();

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleNotificationClick = () => {
        navigate("/GoodsIn");
        handleClose();
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
                <Box p={2} minWidth={300}>
                    {notifications.length > 0 ? (
                        <Box>
                            {/* Table Header */}
                            <Grid container sx={{ borderBottom: `1px solid ${colors.primary[300]}`, paddingBottom: '8px', marginBottom: '8px' }}>
                                <Grid item xs={12}>
                                    <Typography variant="body2" fontWeight="bold">Notification</Typography>
                                </Grid>
                            </Grid>
                            {/* Notification Rows */}
                            {notifications.map((notification, index) => (
                                <Grid 
                                    container 
                                    key={index} 
                                    sx={{
                                        borderBottom: `1px solid ${colors.primary[300]}`,
                                        paddingY: '8px',
                                    }}
                                >
                                    <Grid item xs={12}>
                                        <Box display="flex" alignItems="center" justifyContent="space-between">
                                            <Typography variant="body2">{notification}</Typography>
                                            <IconButton 
                                                onClick={handleNotificationClick}
                                                sx={{
                                                    color: colors.greenAccent[500], // Set icon color to match subtitle color
                                                    padding: 0
                                                }}
                                            >
                                                <ArrowCircleRightOutlinedIcon />
                                            </IconButton>
                                        </Box>
                                    </Grid>
                                </Grid>
                            ))}
                        </Box>
                    ) : (
                        <Typography variant="body2">No notifications</Typography>
                    )}
                </Box>
            </Popover>
        </Box>
    );
};

export default Topbar;
