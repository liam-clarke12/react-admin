// src/components/Sidebar/index.jsx
import { useEffect, useMemo, useState } from "react";
import { ProSidebar, Menu, MenuItem } from "react-pro-sidebar";
import { Box, IconButton, Typography, useTheme, Avatar } from "@mui/material";
import "react-pro-sidebar/dist/css/styles.css";
import { Link, useLocation } from "react-router-dom";
import { tokens } from "../../themes";

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
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import MenuOpenRoundedIcon from "@mui/icons-material/MenuOpenRounded";

import { fetchUserAttributes } from "aws-amplify/auth";

/** * HELPER: Dynamic Brand Colors 
 * Swaps colors based on the current MUI theme mode 
 */
const getBrandColors = (mode) => ({
  text: mode === "dark" ? "#f1f5f9" : "#1e293b",
  subtext: mode === "dark" ? "#94a3b8" : "#64748b",
  border: mode === "dark" ? "#334155" : "#f1f5f9",
  surface: mode === "dark" ? "#0f172a" : "#ffffff",
  surfaceMuted: mode === "dark" ? "#1e293b" : "#f8fafc",
  primary: "#7C3AED",
  primaryLight: mode === "dark" ? "rgba(124, 58, 237, 0.15)" : "rgba(124, 58, 237, 0.08)",
  hover: mode === "dark" ? "#1e293b" : "#f1f5f9",
});

const HRP_ACCESS_CODE = "210100";
const HRP_UNLOCK_KEY = "dae_hrp_unlocked_dev";

/* ---------------- Sub-Components ---------------- */

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
        <Typography sx={{ fontWeight: active ? 700 : 500, fontSize: "0.85rem" }}>
          {title}
        </Typography>
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
      <Link
        to={unlocked ? to : "#"}
        style={{
          textDecoration: "none",
          width: "100%",
          color: active ? brand.primary : brand.text,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography sx={{ fontWeight: active ? 700 : 500, fontSize: "0.85rem" }}>
          {title}
        </Typography>
        {!unlocked && <LockRoundedIcon sx={{ fontSize: 14, color: brand.subtext, opacity: 0.5 }} />}
      </Link>
    </MenuItem>
  );
};

const Sidebar = () => {
  const theme = useTheme();
  const brand = getBrandColors(theme.palette.mode);
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState(true);
  const [selected, setSelected] = useState("Dashboard");
  const [mrpOpen, setMrpOpen] = useState(false);
  const [hrpOpen, setHrpOpen] = useState(false);

  const [hrpUnlocked, setHrpUnlocked] = useState(() => {
    try { return localStorage.getItem(HRP_UNLOCK_KEY) === "true"; } catch { return false; }
  });

  const requestHrpUnlock = () => {
    if (hrpUnlocked) return;
    const code = window.prompt("HRP is under construction.\n\nEnter access code to unlock (dev):");
    if (code === null) return;
    if (String(code).trim() === HRP_ACCESS_CODE) {
      try { localStorage.setItem(HRP_UNLOCK_KEY, "true"); } catch {}
      setHrpUnlocked(true);
      window.alert("✅ HRP unlocked (dev).");
    } else {
      window.alert("🚧 Coming soon / under construction.\n\nIncorrect code.");
    }
  };

  const [profile, setProfile] = useState({ firstName: "", lastName: "", jobTitle: "", company: "" });
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const attrs = await fetchUserAttributes();
        if (!mounted) return;
        const firstName = attrs?.given_name || (attrs?.name ? String(attrs.name).split(" ")[0] : "");
        const lastName = attrs?.family_name || (attrs?.name ? String(attrs.name).split(" ").pop() : "");
        setProfile({ firstName, lastName, jobTitle: attrs?.["custom:jobTitle"] || "", company: attrs?.["custom:Company"] || "" });
      } catch (e) {
        setProfile({ firstName: "", lastName: "", jobTitle: "User", company: "" });
      } finally {
        if (mounted) setProfileLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const path = location.pathname;
    const mapping = {
      "/dashboard": "Dashboard", "/GoodsIn": "Goods In", "/IngredientsInventory": "Ingredients Inventory",
      "/recipes": "Recipes", "/stock_inventory": "Stock Inventory", "/daily_production": "Daily Production",
      "/stock_usage": "Stock Usage", "/goods_out": "Goods Out", "/Employees": "Employees",
      "/Roles": "Roles", "/hrp/roles": "Roles", "/hrp/skills": "Skills & Training",
      "/Roster": "Roster", "/hrp/roster": "Roster", "/hrp/leave": "Leave Requests",
    };
    if (mapping[path]) setSelected(mapping[path]);

    const isMrp = ["/GoodsIn", "/IngredientsInventory", "/recipes", "/stock_inventory", "/daily_production", "/stock_usage", "/goods_out"].includes(path);
    const isHrp = ["/Employees", "/Roles", "/hrp/roles", "/hrp/skills", "/Roster", "/hrp/roster", "/hrp/leave"].includes(path);
    if (isMrp) setMrpOpen(true);
    if (isHrp) setHrpOpen(true);
  }, [location.pathname]);

  const SectionHeader = useMemo(() => {
    return function Inner({ label, icon, open, onToggle }) {
      return (
        <Box
          onClick={onToggle}
          sx={{
            display: "flex", alignItems: "center", justifyContent: isCollapsed ? "center" : "space-between",
            px: 2, py: 1.2, mx: 1.5, mt: 1, cursor: "pointer", borderRadius: "8px",
            "&:hover": { bgcolor: brand.hover }
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ color: brand.subtext, display: "flex" }}>{icon}</Box>
            {!isCollapsed && (
              <Typography sx={{ fontWeight: 700, fontSize: "0.7rem", color: brand.subtext, letterSpacing: "0.05rem", textTransform: "uppercase" }}>
                {label}
              </Typography>
            )}
          </Box>
          {!isCollapsed && (open ? <ExpandMoreRoundedIcon sx={{ fontSize: 16, color: brand.subtext }} /> : <ChevronRightRoundedIcon sx={{ fontSize: 16, color: brand.subtext }} />)}
        </Box>
      );
    };
  }, [isCollapsed, brand]); // Added brand as dependency

  const COLLAPSED_W = 80;
  const EXPANDED_W = 260;

  return (
    <Box display="flex">
      <Box
        sx={{
          width: isCollapsed ? `${COLLAPSED_W}px` : `${EXPANDED_W}px`,
          position: "fixed",
          height: "100vh",
          zIndex: 1000,
          borderRight: `1px solid ${brand.border}`,
          background: brand.surface,
          transition: "width 0.3s, background 0.3s, border 0.3s",
          "& .pro-sidebar": { height: "100vh" },
          "& .pro-sidebar-inner": { 
            background: `${brand.surface} !important`,
            display: "flex",
            flexDirection: "column" 
          },
          "& .pro-sidebar-layout": { 
            display: "flex", 
            flexDirection: "column",
            height: "100%" 
          },
          "& .pro-menu-item.active": {
            backgroundColor: `${brand.primaryLight} !important`,
            borderRadius: "8px",
            "& svg": { color: `${brand.primary} !important` },
            "&:before": { 
              content: '""', 
              position: "absolute", 
              left: 0, 
              height: "64%", 
              width: "4px", 
              bgcolor: brand.primary, 
              borderRadius: "0 4px 4px 0" 
            }
          },
          "& .pro-inner-item:hover": { background: "transparent !important" },
        }}
      >
        <ProSidebar collapsed={isCollapsed}>
          {/* 1. HEADER */}
          <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: isCollapsed ? "center" : "space-between" }}>
            {!isCollapsed && (
              <Typography sx={{ fontWeight: 800, color: brand.text, fontSize: "1.1rem", ml: 1 }}>Hupes</Typography>
            )}
            <IconButton onClick={() => setIsCollapsed(!isCollapsed)} sx={{ color: brand.text }}>
              <MenuOpenRoundedIcon sx={{ transform: isCollapsed ? "rotate(180deg)" : "none", transition: "0.3s" }} />
            </IconButton>
          </Box>

          {/* 2. SCROLLABLE MENU SECTION */}
          <Box sx={{ flexGrow: 1, overflowY: "auto", overflowX: "hidden", 
            "&::-webkit-scrollbar": { width: "4px" },
            "&::-webkit-scrollbar-thumb": { backgroundColor: "transparent" },
            "&:hover::-webkit-scrollbar-thumb": { backgroundColor: mode === "dark" ? "#475569" : "#e2e8f0" }
          }}>
            <Menu iconShape="circle">
              <Item title="Dashboard" to="/dashboard" icon={<HomeOutlinedIcon sx={{ fontSize: 20 }} />} selected={selected} setSelected={setSelected} brand={brand} />
              
              <SectionHeader label="MRP" icon={<FolderOutlinedIcon sx={{ fontSize: 18 }} />} open={mrpOpen} onToggle={() => setMrpOpen(!mrpOpen)} />
              {(mrpOpen || isCollapsed) && (
                <Box sx={{ display: isCollapsed ? "none" : "block" }}>
                  <Item title="Goods In" to="/GoodsIn" icon={<LocalShippingOutlinedIcon sx={{ fontSize: 18 }} />} selected={selected} setSelected={setSelected} brand={brand} />
                  <Item title="Ingredients Inventory" to="/IngredientsInventory" icon={<BakeryDiningOutlinedIcon sx={{ fontSize: 18 }} />} selected={selected} setSelected={setSelected} brand={brand} />
                  <Item title="Recipes" to="/recipes" icon={<DescriptionOutlinedIcon sx={{ fontSize: 18 }} />} selected={selected} setSelected={setSelected} brand={brand} />
                  <Item title="Stock Inventory" to="/stock_inventory" icon={<WarehouseOutlinedIcon sx={{ fontSize: 18 }} />} selected={selected} setSelected={setSelected} brand={brand} />
                  <Item title="Daily Production" to="/daily_production" icon={<AddOutlinedIcon sx={{ fontSize: 18 }} />} selected={selected} setSelected={setSelected} brand={brand} />
                  <Item title="Stock Usage" to="/stock_usage" icon={<InventoryOutlinedIcon sx={{ fontSize: 18 }} />} selected={selected} setSelected={setSelected} brand={brand} />
                  <Item title="Goods Out" to="/goods_out" icon={<NoCrashOutlinedIcon sx={{ fontSize: 18 }} />} selected={selected} setSelected={setSelected} brand={brand} />
                </Box>
              )}

              <SectionHeader label="HRP" icon={<GroupWorkOutlinedIcon sx={{ fontSize: 18 }} />} open={hrpOpen} onToggle={() => setHrpOpen(!hrpOpen)} />
              {(hrpOpen || isCollapsed) && (
                <Box sx={{ display: isCollapsed ? "none" : "block" }}>
                  <LockedItem title="Roster" to="/Roster" icon={<CalendarMonthOutlinedIcon sx={{ fontSize: 18 }} />} selected={selected} setSelected={setSelected} unlocked={hrpUnlocked} requestUnlock={requestHrpUnlock} brand={brand} />
                  <LockedItem title="Employees" to="/Employees" icon={<PeopleAltOutlinedIcon sx={{ fontSize: 18 }} />} selected={selected} setSelected={setSelected} unlocked={hrpUnlocked} requestUnlock={requestHrpUnlock} brand={brand} />
                  <LockedItem title="Roles" to="/Roles" icon={<BadgeOutlinedIcon sx={{ fontSize: 18 }} />} selected={selected} setSelected={setSelected} unlocked={hrpUnlocked} requestUnlock={requestHrpUnlock} brand={brand} />
                  <LockedItem title="Leave Requests" to="/hrp/leave" icon={<EventNoteOutlinedIcon sx={{ fontSize: 18 }} />} selected={selected} setSelected={setSelected} unlocked={hrpUnlocked} requestUnlock={requestHrpUnlock} brand={brand} />
                </Box>
              )}
            </Menu>
          </Box>

          {/* 3. PINNED PROFILE SECTION */}
          {!isCollapsed && (
            <Box sx={{ p: 2, mt: "auto", borderTop: `1px solid ${brand.border}` }}>
              <Box sx={{ 
                p: 1.5, 
                borderRadius: "12px", 
                border: `1px solid ${brand.border}`, 
                bgcolor: brand.surfaceMuted, 
                display: "flex", 
                alignItems: "center", 
                gap: 1.5 
              }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: brand.primary, fontSize: "0.75rem", fontWeight: 700 }}>
                  {profile.firstName ? profile.firstName[0] : "U"}
                </Avatar>
                <Box sx={{ overflow: "hidden" }}>
                  <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: brand.text, whiteSpace: "nowrap" }}>
                    {profile.firstName} {profile.lastName}
                  </Typography>
                  <Typography sx={{ fontSize: "0.7rem", color: brand.subtext, whiteSpace: "nowrap" }}>
                    {profile.jobTitle || "Admin"}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </ProSidebar>
      </Box>

      {/* Main Content Spacer */}
      <Box sx={{ 
        marginLeft: isCollapsed ? `${COLLAPSED_W}px` : `${EXPANDED_W}px`, 
        width: `calc(100% - ${isCollapsed ? COLLAPSED_W : EXPANDED_W}px)`,
        minHeight: "100vh", background: "transparent", transition: "margin 0.3s"
      }} />
    </Box>
  );
};

export default Sidebar;