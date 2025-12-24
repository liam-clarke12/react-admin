// src/components/Sidebar/index.jsx
import { useEffect, useMemo, useState } from "react";
import { ProSidebar, Menu, MenuItem } from "react-pro-sidebar";
import {
  Box,
  IconButton,
  Typography,
  Tooltip,
  Divider,
} from "@mui/material";
import "react-pro-sidebar/dist/css/styles.css";
import { Link, useLocation } from "react-router-dom";

// Icons
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import InventoryOutlinedIcon from "@mui/icons-material/InventoryOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import BakeryDiningOutlinedIcon from "@mui/icons-material/BakeryDiningOutlined";

const getSidebarTheme = (isDark) => ({
  bg: isDark ? "#0b1220" : "#ffffff",
  bg2: isDark ? "#0f172a" : "#f8fafc",
  border: isDark ? "#1f2a44" : "#e5e7eb",
  text: isDark ? "#e5e7eb" : "#0f172a",
  subtext: isDark ? "#94a3b8" : "#64748b",
  hover: isDark ? "rgba(124,58,237,0.16)" : "rgba(124,58,237,0.10)",
  active: "#7C3AED",
  activeBg: isDark ? "rgba(124,58,237,0.18)" : "rgba(124,58,237,0.12)",
});

const Item = ({ title, to, icon, selected, setSelected, theme }) => {
  return (
    <MenuItem
      active={selected === title}
      onClick={() => setSelected(title)}
      icon={icon}
      style={{
        color: theme.text,
        borderRadius: 10,
        margin: "4px 8px",
      }}
    >
      <Typography style={{ fontWeight: 600, fontSize: 13 }}>{title}</Typography>
      <Link to={to} />
    </MenuItem>
  );
};

export default function Sidebar() {
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem("theme-mode") === "dark"
  );

  // keep sidebar synced with Topbar toggle
  useEffect(() => {
    const onThemeChanged = () => {
      setIsDark(localStorage.getItem("theme-mode") === "dark");
    };
    window.addEventListener("themeChanged", onThemeChanged);
    return () => window.removeEventListener("themeChanged", onThemeChanged);
  }, []);

  const theme = useMemo(() => getSidebarTheme(isDark), [isDark]);

  // auto-select based on URL path
  const selected = useMemo(() => {
    const p = (location.pathname || "").toLowerCase();
    if (p.startsWith("/dashboard")) return "Dashboard";
    if (p.startsWith("/goodsin")) return "Goods In";
    if (p.startsWith("/recipes")) return "Recipes";
    if (p.startsWith("/employees")) return "Employees";
    if (p.startsWith("/production")) return "Production";
    return "Dashboard";
  }, [location.pathname]);

  const [selectedItem, setSelectedItem] = useState(selected);

  // keep state aligned if user navigates without clicking sidebar
  useEffect(() => {
    setSelectedItem(selected);
  }, [selected]);

  return (
    <Box
      sx={{
        position: "sticky",
        top: 0,
        height: "100vh",
        borderRight: `1px solid ${theme.border}`,
        background: theme.bg,
        transition: "background 0.25s ease, border 0.25s ease",
        "& .pro-sidebar-inner": {
          background: `${theme.bg} !important`,
        },
        "& .pro-icon-wrapper": {
          backgroundColor: "transparent !important",
          color: `${theme.subtext} !important`,
        },
        "& .pro-inner-item": {
          padding: "10px 14px !important",
          borderRadius: "10px !important",
        },
        "& .pro-inner-item:hover": {
          backgroundColor: `${theme.hover} !important`,
          color: `${theme.text} !important`,
        },
        "& .pro-menu-item.active": {
          backgroundColor: `${theme.activeBg} !important`,
          color: `${theme.text} !important`,
        },
        "& .pro-menu-item.active .pro-icon-wrapper": {
          color: `${theme.active} !important`,
        },
      }}
    >
      <ProSidebar collapsed={isCollapsed}>
        <Menu iconShape="circle">
          {/* Header */}
          <Box
            sx={{
              px: isCollapsed ? 1 : 2,
              py: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: isCollapsed ? "center" : "space-between",
              gap: 1,
            }}
          >
            {!isCollapsed && (
              <Box>
                <Typography
                  variant="h6"
                  sx={{ color: theme.text, fontWeight: 800, lineHeight: 1 }}
                >
                  Hupes
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: theme.subtext, fontWeight: 600 }}
                >
                  Production
                </Typography>
              </Box>
            )}

            <Tooltip title={isCollapsed ? "Expand" : "Collapse"}>
              <IconButton
                onClick={() => setIsCollapsed((v) => !v)}
                size="small"
                sx={{
                  color: theme.subtext,
                  border: `1px solid ${theme.border}`,
                  borderRadius: "10px",
                  bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#fff",
                  "&:hover": { bgcolor: theme.bg2 },
                }}
              >
                <MenuOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <Divider sx={{ borderColor: theme.border, opacity: 0.8 }} />

          {/* Menu Items */}
          <Box sx={{ py: 1 }}>
            <Item
              title="Dashboard"
              to="/dashboard"
              icon={<HomeOutlinedIcon />}
              selected={selectedItem}
              setSelected={setSelectedItem}
              theme={theme}
            />
            <Item
              title="Goods In"
              to="/GoodsIn"
              icon={<LocalShippingOutlinedIcon />}
              selected={selectedItem}
              setSelected={setSelectedItem}
              theme={theme}
            />
            <Item
              title="Recipes"
              to="/recipes"
              icon={<BakeryDiningOutlinedIcon />}
              selected={selectedItem}
              setSelected={setSelectedItem}
              theme={theme}
            />
            <Item
              title="Inventory"
              to="/inventory"
              icon={<InventoryOutlinedIcon />}
              selected={selectedItem}
              setSelected={setSelectedItem}
              theme={theme}
            />
            <Item
              title="Production"
              to="/production"
              icon={<DescriptionOutlinedIcon />}
              selected={selectedItem}
              setSelected={setSelectedItem}
              theme={theme}
            />
            <Item
              title="Employees"
              to="/Employees"
              icon={<PeopleAltOutlinedIcon />}
              selected={selectedItem}
              setSelected={setSelectedItem}
              theme={theme}
            />
          </Box>

          {/* Footer */}
          <Box
            sx={{
              mt: "auto",
              px: 2,
              pb: 2,
              pt: 1,
              color: theme.subtext,
            }}
          >
            {!isCollapsed && (
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                Theme: {isDark ? "Dark" : "Light"}
              </Typography>
            )}
          </Box>
        </Menu>
      </ProSidebar>
    </Box>
  );
}
