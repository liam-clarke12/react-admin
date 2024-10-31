import { useState } from "react";
import { ProSidebar, Menu, MenuItem } from "react-pro-sidebar";
import { Box, IconButton, Typography, useTheme } from "@mui/material";
import "react-pro-sidebar/dist/css/styles.css";
import { Link } from "react-router-dom";
import { tokens } from "../../themes";
import InventoryOutlinedIcon from '@mui/icons-material/InventoryOutlined';
import WarehouseOutlinedIcon from '@mui/icons-material/WarehouseOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import OutdoorGrillOutlinedIcon from '@mui/icons-material/OutdoorGrillOutlined';
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import PieChartOutlineOutlinedIcon from "@mui/icons-material/PieChartOutlineOutlined";
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import DeliveryDiningOutlinedIcon from '@mui/icons-material/DeliveryDiningOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import BakeryDiningOutlinedIcon from '@mui/icons-material/BakeryDiningOutlined';

const Item = ({ title, to, icon, selected, setSelected }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  return (
    <MenuItem
      active={selected === title}
      style={{
        color: colors.grey[100],
        listStyleType: 'none', // Ensure no bullet points
      }}
      onClick={() => setSelected(title)}
      icon={icon}
    >
      <Link to={to} style={{ textDecoration: 'none', color: colors.grey[100], width: '100%' }}>
        <Typography>{title}</Typography>
      </Link>
    </MenuItem>
  );
};

const Sidebar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selected, setSelected] = useState("Dashboard");
  

  return (
    <Box
      sx={{
        display: 'flex', // Use flex to align items
      }}
    >
      <Box
        sx={{
          width: isCollapsed ? '80px' : '150px',
          position: 'fixed', // Fixed position for the sidebar
          height: '100%', // Full height
          zIndex: 1000, // Make sure it stays above other content
          "& .pro-sidebar-inner": {
            background: `${colors.primary[400]} !important`,
          },
          "& .pro-icon-wrapper": {
            backgroundColor: "transparent !important",
          },
          "& .pro-inner-item": {
            padding: "5px 35px 5px 20px !important",
          },
          "& .pro-inner-item:hover": {
            color: "#868dfb !important",
          },
          "& .pro-menu-item.active": {
            color: "#6870fa !important",
          },
        }}
      >
        <ProSidebar collapsed={isCollapsed}>
          <Menu iconShape="square">
            {/* LOGO AND MENU ICON */}
            <MenuItem
              onClick={() => setIsCollapsed(!isCollapsed)}
              icon={isCollapsed ? <MenuOutlinedIcon /> : undefined}
              style={{
                margin: "10px 0 20px 0",
                color: colors.grey[100],
              }}
            >
              {!isCollapsed && (
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="right"
                  ml="15px"
                >
                  <IconButton onClick={() => setIsCollapsed(!isCollapsed)}>
                    <MenuOutlinedIcon />
                  </IconButton>
                </Box>
              )}
            </MenuItem>

            {!isCollapsed && (
              <Box mb="25px">
                <Box display="flex" justifyContent="center" alignItems="center">
                  <img
                    alt="profile-user"
                    width="100px"
                    height="100px"
                    src={`../../assets/user.png`}
                    style={{ cursor: "pointer", borderRadius: "50%" }}
                  />
                </Box>
                <Box textAlign="center">
                  <Typography
                    variant="h2"
                    color={colors.grey[100]}
                    fontWeight="bold"
                    sx={{ m: "10px 0 0 0" }}
                  >
                    Hupes
                  </Typography>
                  <Typography variant="h5" color={colors.greenAccent[500]}>
                    Admin
                  </Typography>
                </Box>
              </Box>
            )}

            <Box paddingLeft={isCollapsed ? undefined : "10%"}>
              <Item
                title="Dashboard"
                to="/"
                icon={<HomeOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />

              <Typography
                variant="h6"
                color={colors.grey[300]}
                sx={{ m: "15px 0 5px 20px" }}
              >
                Forms
              </Typography>
              <Item
                title="Goods In Form"
                to="/GoodsInForm"
                icon={<DeliveryDiningOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Recipe Form"
                to="/recipeform"
                icon={<ReceiptLongOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Recipe Production"
                to="/recipe_production"
                icon={<OutdoorGrillOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />

              <Typography
                variant="h6"
                color={colors.grey[300]}
                sx={{ m: "15px 0 5px 20px" }}
              >
                Data
              </Typography>
              <Item
                title="Goods In"
                to="/GoodsIn"
                icon={<LocalShippingOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Ingredients Inventory"
                to="/IngredientsInventory"
                icon={<BakeryDiningOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Recipes"
                to="/recipes"
                icon={<DescriptionOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Recipe Inventory"
                to="/recipe_inventory"
                icon={<WarehouseOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Production Log"
                to="/production_log"
                icon={<AddOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Stock Usage"
                to="/stock_usage"
                icon={<InventoryOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />

              <Typography
                variant="h6"
                color={colors.grey[300]}
                sx={{ m: "15px 0 5px 20px" }}
              >
                Charts
              </Typography>
              <Item
                title="Bar Chart"
                to="/bar"
                icon={<BarChartOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Pie Chart"
                to="/pie"
                icon={<PieChartOutlineOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Line Chart"
                to="/line"
                icon={<TimelineOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
              <Item
                title="Geography Chart"
                to="/geography"
                icon={<MapOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
            </Box>
          </Menu>
        </ProSidebar>
      </Box>

      {/* Main Content Area */}
      <Box
        sx={{
          marginLeft: isCollapsed ? '80px' : '250px', // Adjust based on sidebar width
          padding: isCollapsed ? '0px' : '12px',
          width: 'calc(100% - (isCollapsed ? 80px : 250px))', // Adjust width to account for sidebar
          height: '100vh',
          overflowY: 'auto',
          position: 'relative', // Ensure content is positioned correctly
        }}
      >
        {/* Your main content goes here */}
      </Box>
    </Box>
  );
};

export default Sidebar;
