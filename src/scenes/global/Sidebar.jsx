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

/* ---------------- Theme helpers (sync with Topbar) ---------------- */

const getBrand = (isDark) => ({
  text: isDark ? "#f1f5f9" : "#1e293b",
  subtext: isDark ? "#94a3b8" : "#64748b",
  border: isDark ? "#1f2a44" : "#f1f5f9",
  surface: isDark ? "#0b1220" : "#ffffff",
  surfaceMuted: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc",
  primary: "#7C3AED",
  primaryLight: isDark
    ? "rgba(124, 58, 237, 0.18)"
    : "rgba(124, 58, 237, 0.08)",
  hover: isDark ? "rgba(124,58,237,0.14)" : "#f1f5f9",
  icon: isDark ? "#cbd5e1" : "#334155",
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
      <Link
        to={to}
        style={{
          textDecoration: "none",
          width: "100%",
          color: active ? brand.primary : brand.text,
        }}
      >
        <Typography sx={{ fontWeight: active ? 700 : 500, fontSize: "0.85rem" }}>
          {title}
        </Typography>
      </Link>
    </MenuItem>
  );
};

const LockedItem = ({
  title,
  to,
  icon,
  selected,
  setSelected,
  unlocked,
  requestUnlock,
  brand,
}) => {
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
        {!unlocked && (
          <LockRoundedIcon sx={{ fontSize: 14, color: brand.subtext, opacity: 0.55 }} />
        )}
      </Link>
    </MenuItem>
  );
};

const Sidebar = () => {
  const theme = useTheme();
  tokens(theme.palette.mode);
  const location = useLocation();

  // read & listen for Topbar theme toggle
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem("theme-mode") === "dark"
  );
  useEffect(() => {
    const onThemeChanged = () =>
      setIsDark(localStorage.getItem("theme-mode") === "dark");
    window.addEventListener("themeChanged", onThemeChanged);
    return () => window.removeEventListener("themeChanged", onThemeChanged);
  }, []);

  const brand = useMemo(() => getBrand(isDark), [isDark]);

  // ✅ start expanded
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [selected, setSelected] = useState("Dashboard");

  // ✅ start open on app load
  const [mrpOpen, setMrpOpen] = useState(true);
  const [hrpOpen, setHrpOpen] = useState(true);

  const [hrpUnlocked, setHrpUnlocked] = useState(() => {
    try {
      return localStorage.getItem(HRP_UNLOCK_KEY) === "true";
    } catch {
      return false;
    }
  });

  const requestHrpUnlock = () => {
    if (hrpUnlocked) return;
    const code = window.prompt(
      "HRP is under construction.\n\nEnter access code to unlock (dev):"
    );
    if (code === null) return;
    if (String(code).trim() === HRP_ACCESS_CODE) {
      try {
        localStorage.setItem(HRP_UNLOCK_KEY, "true");
      } catch {}
      setHrpUnlocked(true);
      window.alert("✅ HRP unlocked (dev).");
    } else {
      window.alert("🚧 Coming soon / under construction.\n\nIncorrect code.");
    }
  };

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    jobTitle: "",
    company: "",
  });
  const [, setProfileLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const attrs = await fetchUserAttributes();
        if (!mounted) return;
        const firstName =
          attrs?.given_name || (attrs?.name ? String(attrs.name).split(" ")[0] : "");
        const lastName =
          attrs?.family_name || (attrs?.name ? String(attrs.name).split(" ").pop() : "");
        setProfile({
          firstName,
          lastName,
          jobTitle: attrs?.["custom:jobTitle"] || "",
          company: attrs?.["custom:Company"] || "",
        });
      } catch (e) {
        setProfile({ firstName: "", lastName: "", jobTitle: "User", company: "" });
      } finally {
        if (mounted) setProfileLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const path = location.pathname;
    const mapping = {
      "/dashboard": "Dashboard",
      "/GoodsIn": "Goods In",
      "/IngredientsInventory": "Ingredients Inventory",
      "/recipes": "Recipes",
      "/stock_inventory": "Stock Inventory",
      "/daily_production": "Daily Production",
      "/stock_usage": "Stock Usage",
      "/goods_out": "Goods Out",
      "/Employees": "Employees",
      "/Roles": "Roles",
      "/hrp/roles": "Roles",
      "/hrp/skills": "Skills & Training",
      "/Roster": "Roster",
      "/hrp/roster": "Roster",
      "/hrp/leave": "Leave Requests",
    };
    if (mapping[path]) setSelected(mapping[path]);

    // if user lands inside a section route, keep section open
    const isMrp = [
      "/GoodsIn",
      "/IngredientsInventory",
      "/recipes",
      "/stock_inventory",
      "/daily_production",
      "/stock_usage",
      "/goods_out",
    ].includes(path);
    const isHrp = [
      "/Employees",
      "/Roles",
      "/hrp/roles",
      "/hrp/skills",
      "/Roster",
      "/hrp/roster",
      "/hrp/leave",
    ].includes(path);
    if (isMrp) setMrpOpen(true);
    if (isHrp) setHrpOpen(true);
  }, [location.pathname]);

  const SectionHeader = useMemo(() => {
    return function Inner({ label, icon, open, onToggle }) {
      return (
        <Box
          onClick={onToggle}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: isCollapsed ? "center" : "space-between",
            px: 2,
            py: 1.2,
            mx: 1.5,
            mt: 1,
            cursor: "pointer",
            borderRadius: "8px",
            "&:hover": { bgcolor: brand.hover },
            transition: "background 0.2s ease",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ color: brand.subtext, display: "flex" }}>{icon}</Box>
            {!isCollapsed && (
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: "0.7rem",
                  color: brand.subtext,
                  letterSpacing: "0.05rem",
                  textTransform: "uppercase",
                }}
              >
                {label}
              </Typography>
            )}
          </Box>
          {!isCollapsed &&
            (open ? (
              <ExpandMoreRoundedIcon sx={{ fontSize: 16, color: brand.subtext }} />
            ) : (
              <ChevronRightRoundedIcon sx={{ fontSize: 16, color: brand.subtext }} />
            ))}
        </Box>
      );
    };
  }, [isCollapsed, brand.hover, brand.subtext]);

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
          transition: "background 0.25s ease, border 0.25s ease, width 0.3s ease",
          "& .pro-sidebar-inner": { background: `${brand.surface} !important` },

          // ✅ remove circles around icons (iconShape="square" + override wrapper)
          "& .pro-icon-wrapper": {
            backgroundColor: "transparent !important",
            borderRadius: "0 !important",
          },

          // keep pro-sidebar content aligned with dark mode colors
          "& .pro-menu-item": { transition: "all 0.2s" },
          "& .pro-menu-item.active": {
            backgroundColor: `${brand.primaryLight} !important`,
            borderRadius: "8px",
            "& svg": { color: `${brand.primary} !important` },
            "&:before": {
              content: '""',
              position: "absolute",
              left: -12,
              height: "64%",
              width: "4px",
              bgcolor: brand.primary,
              borderRadius: "0 4px 4px 0",
            },
          },
          "& .pro-inner-item:hover": { background: "transparent !important" },

          // icon + text default colors
          "& .pro-item-content": { color: `${brand.text} !important` },
          "& .pro-icon-wrapper svg": { color: `${brand.icon} !important` },
        }}
      >
        {/* ✅ Use a flex column wrapper so footer stays at bottom */}
        <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
          <ProSidebar collapsed={isCollapsed}>
            {/* Header */}
            <Box
              sx={{
                p: 2,
                mb: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: isCollapsed ? "center" : "space-between",
              }}
            >
              {!isCollapsed && (
                <Typography
                  sx={{ fontWeight: 800, color: brand.text, fontSize: "1.1rem", ml: 1 }}
                >
                  Hupes
                </Typography>
              )}
              <IconButton
                onClick={() => setIsCollapsed(!isCollapsed)}
                sx={{
                  color: brand.subtext,
                  borderRadius: "12px",
                  "&:hover": { bgcolor: brand.hover },
                }}
              >
                <MenuOpenRoundedIcon
                  sx={{
                    color: brand.subtext,
                    transform: isCollapsed ? "rotate(180deg)" : "none",
                    transition: "0.3s",
                  }}
                />
              </IconButton>
            </Box>

            {/* Menu */}
            <Menu iconShape="square">
              <Item
                title="Dashboard"
                to="/dashboard"
                icon={<HomeOutlinedIcon sx={{ fontSize: 20 }} />}
                selected={selected}
                setSelected={setSelected}
                brand={brand}
              />

              <SectionHeader
                label="MRP"
                icon={<FolderOutlinedIcon sx={{ fontSize: 18 }} />}
                open={mrpOpen}
                onToggle={() => setMrpOpen(!mrpOpen)}
              />
              {(mrpOpen || isCollapsed) && (
                <Box sx={{ display: isCollapsed ? "none" : "block" }}>
                  <Item
                    title="Goods In"
                    to="/GoodsIn"
                    icon={<LocalShippingOutlinedIcon sx={{ fontSize: 18 }} />}
                    selected={selected}
                    setSelected={setSelected}
                    brand={brand}
                  />
                  <Item
                    title="Ingredients Inventory"
                    to="/IngredientsInventory"
                    icon={<BakeryDiningOutlinedIcon sx={{ fontSize: 18 }} />}
                    selected={selected}
                    setSelected={setSelected}
                    brand={brand}
                  />
                  <Item
                    title="Recipes"
                    to="/recipes"
                    icon={<DescriptionOutlinedIcon sx={{ fontSize: 18 }} />}
                    selected={selected}
                    setSelected={setSelected}
                    brand={brand}
                  />
                  <Item
                    title="Stock Inventory"
                    to="/stock_inventory"
                    icon={<WarehouseOutlinedIcon sx={{ fontSize: 18 }} />}
                    selected={selected}
                    setSelected={setSelected}
                    brand={brand}
                  />
                  <Item
                    title="Daily Production"
                    to="/daily_production"
                    icon={<AddOutlinedIcon sx={{ fontSize: 18 }} />}
                    selected={selected}
                    setSelected={setSelected}
                    brand={brand}
                  />
                  <Item
                    title="Stock Usage"
                    to="/stock_usage"
                    icon={<InventoryOutlinedIcon sx={{ fontSize: 18 }} />}
                    selected={selected}
                    setSelected={setSelected}
                    brand={brand}
                  />
                  <Item
                    title="Goods Out"
                    to="/goods_out"
                    icon={<NoCrashOutlinedIcon sx={{ fontSize: 18 }} />}
                    selected={selected}
                    setSelected={setSelected}
                    brand={brand}
                  />
                </Box>
              )}

              <SectionHeader
                label="HRP"
                icon={<GroupWorkOutlinedIcon sx={{ fontSize: 18 }} />}
                open={hrpOpen}
                onToggle={() => setHrpOpen(!hrpOpen)}
              />
              {(hrpOpen || isCollapsed) && (
                <Box sx={{ display: isCollapsed ? "none" : "block" }}>
                  <LockedItem
                    title="Roster"
                    to="/Roster"
                    icon={<CalendarMonthOutlinedIcon sx={{ fontSize: 18 }} />}
                    selected={selected}
                    setSelected={setSelected}
                    unlocked={hrpUnlocked}
                    requestUnlock={requestHrpUnlock}
                    brand={brand}
                  />
                  <LockedItem
                    title="Employees"
                    to="/Employees"
                    icon={<PeopleAltOutlinedIcon sx={{ fontSize: 18 }} />}
                    selected={selected}
                    setSelected={setSelected}
                    unlocked={hrpUnlocked}
                    requestUnlock={requestHrpUnlock}
                    brand={brand}
                  />
                  <LockedItem
                    title="Roles"
                    to="/Roles"
                    icon={<BadgeOutlinedIcon sx={{ fontSize: 18 }} />}
                    selected={selected}
                    setSelected={setSelected}
                    unlocked={hrpUnlocked}
                    requestUnlock={requestHrpUnlock}
                    brand={brand}
                  />
                  <LockedItem
                    title="Leave Requests"
                    to="/hrp/leave"
                    icon={<EventNoteOutlinedIcon sx={{ fontSize: 18 }} />}
                    selected={selected}
                    setSelected={setSelected}
                    unlocked={hrpUnlocked}
                    requestUnlock={requestHrpUnlock}
                    brand={brand}
                  />
                </Box>
              )}
            </Menu>
          </ProSidebar>

          {/* ✅ Proper footer that always stays at bottom of sidebar */}
          {!isCollapsed && (
            <Box sx={{ mt: "auto", px: 2, pb: 2 }}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: "12px",
                  border: `1px solid ${brand.border}`,
                  bgcolor: brand.surfaceMuted,
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: brand.primary,
                    fontSize: "0.75rem",
                    fontWeight: 700,
                  }}
                >
                  {profile.firstName ? profile.firstName[0] : "U"}
                </Avatar>
                <Box sx={{ overflow: "hidden" }}>
                  <Typography
                    sx={{
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: brand.text,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {profile.firstName} {profile.lastName}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.7rem",
                      color: brand.subtext,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {profile.jobTitle || "Admin"}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      <Box
        sx={{
          marginLeft: isCollapsed ? `${COLLAPSED_W}px` : `${EXPANDED_W}px`,
          width: `calc(100% - ${isCollapsed ? COLLAPSED_W : EXPANDED_W}px)`,
          minHeight: "100vh",
          background: "transparent",
          transition: "margin 0.3s",
        }}
      />
    </Box>
  );
};

export default Sidebar;
