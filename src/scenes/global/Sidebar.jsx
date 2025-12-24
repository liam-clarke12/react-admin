// src/components/Sidebar/index.jsx
import { useEffect, useMemo, useState } from "react";
import { ProSidebar, Menu, MenuItem } from "react-pro-sidebar";
import { Box, IconButton, Typography, Avatar } from "@mui/material";
import "react-pro-sidebar/dist/css/styles.css";
import { Link, useLocation } from "react-router-dom";
import { fetchUserAttributes } from "aws-amplify/auth";

// Icons
import NoCrashOutlinedIcon from "@mui/icons-material/NoCrashOutlined";
import InventoryOutlinedIcon from "@mui/icons-material/InventoryOutlined";
import WarehouseOutlinedIcon from "@mui/icons-material/WarehouseOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import BakeryDiningOutlinedIcon from "@mui/icons-material/BakeryDiningOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import GroupWorkOutlinedIcon from "@mui/icons-material/GroupWorkOutlined";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import MenuOpenRoundedIcon from "@mui/icons-material/MenuOpenRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";

/** Dynamic Brand Colors based on Mode */
const getBrand = (isDark) => ({
  text: isDark ? "#f1f5f9" : "#1e293b",
  subtext: isDark ? "#94a3b8" : "#64748b",
  border: isDark ? "#334155" : "#f1f5f9",
  surface: isDark ? "#0f172a" : "#ffffff",
  surfaceMuted: isDark ? "#1e293b" : "#f8fafc",
  primary: "#7C3AED",
  primaryLight: isDark ? "rgba(124, 58, 237, 0.15)" : "rgba(124, 58, 237, 0.08)",
  hover: isDark ? "#1e293b" : "#f1f5f9",
});

const HRP_ACCESS_CODE = "210100";
const HRP_UNLOCK_KEY = "dae_hrp_unlocked_dev";

const Item = ({ title, to, icon, selected, setSelected, brand }) => {
  const active = selected === title;
  return (
    <MenuItem
      active={active}
      style={{ listStyleType: "none", margin: "2px 12px" }}
      onClick={() => setSelected(title)}
      icon={icon}
    >
      <Link to={to} style={{ textDecoration: "none", width: "100%", color: active ? brand.primary : brand.text }}>
        <Typography sx={{ fontWeight: active ? 700 : 500, fontSize: "0.85rem" }}>{title}</Typography>
      </Link>
    </MenuItem>
  );
};

const LockedItem = ({ title, to, icon, selected, setSelected, unlocked, requestUnlock, brand }) => {
  const active = selected === title;
  return (
    <MenuItem
      active={active}
      style={{ listStyleType: "none", margin: "2px 12px" }}
      onClick={(e) => {
        if (!unlocked) {
          e?.preventDefault?.();
          requestUnlock();
          return;
        }
        setSelected(title);
      }}
      icon={icon}
    >
      <Link to={unlocked ? to : "#"} style={{ textDecoration: "none", width: "100%", color: active ? brand.primary : brand.text, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography sx={{ fontWeight: active ? 700 : 500, fontSize: "0.85rem" }}>{title}</Typography>
        {!unlocked && <LockRoundedIcon sx={{ fontSize: 14, color: brand.subtext, opacity: 0.5 }} />}
      </Link>
    </MenuItem>
  );
};

const Sidebar = () => {
  const location = useLocation();
  const [isDark, setIsDark] = useState(() => localStorage.getItem("theme-mode") === "dark");
  const brand = getBrand(isDark);

  // Theme Sync Listener
  useEffect(() => {
    const handleThemeChange = () => setIsDark(localStorage.getItem("theme-mode") === "dark");
    window.addEventListener("themeChanged", handleThemeChange);
    return () => window.removeEventListener("themeChanged", handleThemeChange);
  }, []);

  const [isCollapsed, setIsCollapsed] = useState(true);
  const [selected, setSelected] = useState("Dashboard");
  const [mrpOpen, setMrpOpen] = useState(false);
  const [hrpOpen, setHrpOpen] = useState(false);
  const [hrpUnlocked, setHrpUnlocked] = useState(() => localStorage.getItem(HRP_UNLOCK_KEY) === "true");
  const [profile, setProfile] = useState({ firstName: "", lastName: "", jobTitle: "" });

  useEffect(() => {
    (async () => {
      try {
        const attrs = await fetchUserAttributes();
        const firstName = attrs?.given_name || (attrs?.name ? String(attrs.name).split(" ")[0] : "");
        const lastName = attrs?.family_name || (attrs?.name ? String(attrs.name).split(" ").pop() : "");
        setProfile({ firstName, lastName, jobTitle: attrs?.["custom:jobTitle"] || "Admin" });
      } catch (e) { console.error(e); }
    })();
  }, []);

  const requestHrpUnlock = () => {
    if (hrpUnlocked) return;
    const code = window.prompt("Enter access code to unlock HRP (dev):");
    if (code === HRP_ACCESS_CODE) {
      localStorage.setItem(HRP_UNLOCK_KEY, "true");
      setHrpUnlocked(true);
    }
  };

  useEffect(() => {
    const path = location.pathname;
    const isMrp = ["/GoodsIn", "/IngredientsInventory", "/recipes", "/stock_inventory", "/daily_production", "/stock_usage", "/goods_out"].includes(path);
    const isHrp = ["/Employees", "/Roles", "/Roster"].includes(path);
    if (isMrp) setMrpOpen(true);
    if (isHrp) setHrpOpen(true);
  }, [location.pathname]);

  const COLLAPSED_W = 80;
  const EXPANDED_W = 260;

  return (
    <Box sx={{
      width: isCollapsed ? `${COLLAPSED_W}px` : `${EXPANDED_W}px`,
      position: "fixed", height: "100vh", zIndex: 1000,
      borderRight: `1px solid ${brand.border}`,
      background: brand.surface,
      transition: "width 0.3s, background 0.3s",
      "& .pro-sidebar-inner": { background: `${brand.surface} !important`, display: "flex", flexDirection: "column" },
      "& .pro-sidebar-layout": { display: "flex", flexDirection: "column", height: "100%" },
      "& .pro-menu-item.active": {
        backgroundColor: `${brand.primaryLight} !important`,
        borderRadius: "8px",
        "& svg": { color: `${brand.primary} !important` },
      },
    }}>
      <ProSidebar collapsed={isCollapsed}>
        <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: isCollapsed ? "center" : "space-between" }}>
          {!isCollapsed && <Typography sx={{ fontWeight: 800, color: brand.text, fontSize: "1.1rem" }}>Hupes</Typography>}
          <IconButton onClick={() => setIsCollapsed(!isCollapsed)} sx={{ color: brand.text }}>
            <MenuOpenRoundedIcon sx={{ transform: isCollapsed ? "rotate(180deg)" : "none" }} />
          </IconButton>
        </Box>

        <Box sx={{ flexGrow: 1, overflowY: "auto", "&::-webkit-scrollbar": { width: "0px" } }}>
          <Menu iconShape="circle">
            <Item title="Dashboard" to="/dashboard" icon={<HomeOutlinedIcon sx={{ fontSize: 20 }} />} selected={selected} setSelected={setSelected} brand={brand} />
            
            <Box onClick={() => setMrpOpen(!mrpOpen)} sx={{ p: "10px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 2 }}>
              <FolderOutlinedIcon sx={{ color: brand.subtext, fontSize: 18 }} />
              {!isCollapsed && <Typography sx={{ color: brand.subtext, fontSize: "0.7rem", fontWeight: 700, flexGrow: 1 }}>MRP</Typography>}
              {!isCollapsed && (mrpOpen ? <ExpandMoreRoundedIcon sx={{ fontSize: 16, color: brand.subtext }} /> : <ChevronRightRoundedIcon sx={{ fontSize: 16, color: brand.subtext }} />)}
            </Box>
            {mrpOpen && !isCollapsed && (
              <>
                <Item title="Goods In" to="/GoodsIn" icon={<LocalShippingOutlinedIcon sx={{ fontSize: 18 }} />} selected={selected} setSelected={setSelected} brand={brand} />
                <Item title="Recipes" to="/recipes" icon={<DescriptionOutlinedIcon sx={{ fontSize: 18 }} />} selected={selected} setSelected={setSelected} brand={brand} />
              </>
            )}

            <Box onClick={() => setHrpOpen(!hrpOpen)} sx={{ p: "10px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 2 }}>
              <GroupWorkOutlinedIcon sx={{ color: brand.subtext, fontSize: 18 }} />
              {!isCollapsed && <Typography sx={{ color: brand.subtext, fontSize: "0.7rem", fontWeight: 700, flexGrow: 1 }}>HRP</Typography>}
              {!isCollapsed && (hrpOpen ? <ExpandMoreRoundedIcon sx={{ fontSize: 16, color: brand.subtext }} /> : <ChevronRightRoundedIcon sx={{ fontSize: 16, color: brand.subtext }} />)}
            </Box>
            {hrpOpen && !isCollapsed && (
              <>
                <LockedItem title="Roster" to="/Roster" icon={<CalendarMonthOutlinedIcon sx={{ fontSize: 18 }} />} selected={selected} setSelected={setSelected} unlocked={hrpUnlocked} requestUnlock={requestHrpUnlock} brand={brand} />
                <LockedItem title="Employees" to="/Employees" icon={<PeopleAltOutlinedIcon sx={{ fontSize: 18 }} />} selected={selected} setSelected={setSelected} unlocked={hrpUnlocked} requestUnlock={requestHrpUnlock} brand={brand} />
              </>
            )}
          </Menu>
        </Box>

        {!isCollapsed && (
          <Box sx={{ p: 2, mt: "auto", borderTop: `1px solid ${brand.border}` }}>
            <Box sx={{ p: 1.5, borderRadius: "12px", bgcolor: brand.surfaceMuted, display: "flex", alignItems: "center", gap: 1.5 }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: brand.primary, fontWeight: 700, fontSize: "0.8rem" }}>{profile.firstName?.[0]}</Avatar>
              <Box sx={{ overflow: "hidden" }}>
                <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: brand.text, whiteSpace: "nowrap" }}>{profile.firstName} {profile.lastName}</Typography>
                <Typography sx={{ fontSize: "0.7rem", color: brand.subtext, whiteSpace: "nowrap" }}>{profile.jobTitle}</Typography>
              </Box>
            </Box>
          </Box>
        )}
      </ProSidebar>
    </Box>
  );
};

export default Sidebar;