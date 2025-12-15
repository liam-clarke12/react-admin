// src/components/Sidebar/index.jsx
import { useEffect, useMemo, useState } from "react";
import { ProSidebar, Menu, MenuItem } from "react-pro-sidebar";
import {
  Box,
  IconButton,
  Typography,
  useTheme,
  Tooltip,
  Divider,
} from "@mui/material";
import "react-pro-sidebar/dist/css/styles.css";
import { Link, useLocation } from "react-router-dom";
import { tokens } from "../../themes";

import NoCrashOutlinedIcon from "@mui/icons-material/NoCrashOutlined";
import InventoryOutlinedIcon from "@mui/icons-material/InventoryOutlined";
import WarehouseOutlinedIcon from "@mui/icons-material/WarehouseOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import BakeryDiningOutlinedIcon from "@mui/icons-material/BakeryDiningOutlined";

// HRP icons
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";

// Section icons + chevrons
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import GroupWorkOutlinedIcon from "@mui/icons-material/GroupWorkOutlined";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";

// 🔒 Lock icon
import LockRoundedIcon from "@mui/icons-material/LockRounded";

// ✅ Amplify v6 modular auth API
import { fetchUserAttributes } from "aws-amplify/auth";

const brand = {
  text: "#0f172a",
  subtext: "#334155",
  border: "#e5e7eb",
  surface: "#ffffff",
  surfaceMuted: "#f8fafc",
  // Nory purple
  primary: "#7C3AED",
  primaryDark: "#5B21B6",
  focusRing: "rgba(124,58,237,0.18)",
  shadow: "0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.08)",
  hover: "#f1f5f9",
};

/* ---------------- Simple DEV gate for HRP ---------------- */
const HRP_ACCESS_CODE = "210100";
const HRP_UNLOCK_KEY = "dae_hrp_unlocked_dev";

/* ---------------- Menu Items ---------------- */

// Normal menu item
const Item = ({ title, to, icon, selected, setSelected }) => {
  const theme = useTheme();
  tokens(theme.palette.mode);
  const active = selected === title;

  return (
    <MenuItem
      active={active}
      style={{ listStyleType: "none" }}
      onClick={() => setSelected(title)}
      icon={icon}
    >
      <Link
        to={to}
        style={{
          textDecoration: "none",
          width: "100%",
          color: active ? "#fff" : brand.text,
        }}
      >
        <Typography sx={{ fontWeight: active ? 800 : 600, fontSize: 14 }}>
          {title}
        </Typography>
      </Link>
    </MenuItem>
  );
};

// Locked menu item (click prompts for code; only navigates if unlocked)
const LockedItem = ({
  title,
  to,
  icon,
  selected,
  setSelected,
  unlocked,
  requestUnlock,
}) => {
  const theme = useTheme();
  tokens(theme.palette.mode);
  const active = selected === title;

  return (
    <MenuItem
      active={active}
      style={{ listStyleType: "none" }}
      onClick={(e) => {
        // react-pro-sidebar passes synthetic; be safe
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
        onClick={(e) => {
          if (!unlocked) {
            e.preventDefault();
            requestUnlock();
          }
        }}
        style={{
          textDecoration: "none",
          width: "100%",
          color: active ? "#fff" : brand.text,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <Typography sx={{ fontWeight: active ? 800 : 600, fontSize: 14 }}>
          {title}
        </Typography>

        {/* lock badge (only when locked) */}
        {!unlocked && (
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              px: "8px",
              py: "3px",
              borderRadius: 999,
              border: `1px solid ${brand.border}`,
              background: brand.surfaceMuted,
              color: brand.subtext,
              fontSize: 12,
              fontWeight: 800,
              flex: "0 0 auto",
            }}
            title="Locked"
          >
            <LockRoundedIcon sx={{ fontSize: 16 }} />
            {!unlocked ? "Locked" : ""}
          </Box>
        )}
      </Link>
    </MenuItem>
  );
};

const Sidebar = () => {
  const theme = useTheme();
  tokens(theme.palette.mode);
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState(true);
  const [selected, setSelected] = useState("Dashboard");

  // Dropdown states
  const [mrpOpen, setMrpOpen] = useState(true);
  const [hrpOpen, setHrpOpen] = useState(true);

  // 🔒 HRP unlocked state (persisted)
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

    if (code === null) return; // cancelled

    if (String(code).trim() === HRP_ACCESS_CODE) {
      try {
        localStorage.setItem(HRP_UNLOCK_KEY, "true");
      } catch {
        // ignore
      }
      setHrpUnlocked(true);
      window.alert("✅ HRP unlocked (dev).");
    } else {
      window.alert("🚧 Coming soon / under construction.\n\nIncorrect code.");
    }
  };

  // 👇 Fetch profile from Cognito
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    jobTitle: "",
    company: "",
  });
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const attrs = await fetchUserAttributes();
        if (!mounted) return;
        const firstName =
          attrs?.given_name ||
          (attrs?.name
            ? String(attrs.name).trim().split(/\s+/).slice(0, -1).join(" ")
            : "");
        const lastName =
          attrs?.family_name ||
          (attrs?.name ? String(attrs.name).trim().split(/\s+/).slice(-1)[0] : "");
        const jobTitle = attrs?.["custom:jobTitle"] || "";
        const company = attrs?.["custom:Company"] || "";
        setProfile({ firstName, lastName, jobTitle, company });
      } catch (e) {
        console.warn("[Sidebar] Failed to fetch user attributes:", e);
        setProfile({ firstName: "", lastName: "", jobTitle: "", company: "" });
      } finally {
        if (mounted) setProfileLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // route → selected title
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

      // HRP (routes you already have)
      "/Employees": "Employees",
      "/Roles": "Roles",
      "/hrp/roles": "Roles",
      "/hrp/skills": "Skills & Training",
      "/Roster": "Roster",
      "/hrp/roster": "Roster",
      "/hrp/leave": "Leave Requests",
    };

    const matchedTitle = mapping[path];
    if (matchedTitle) setSelected(matchedTitle);
  }, [location.pathname]);

  // Auto-open correct dropdown based on route
  useEffect(() => {
    const path = location.pathname;

    const isMrpRoute =
      path === "/GoodsIn" ||
      path === "/IngredientsInventory" ||
      path === "/recipes" ||
      path === "/stock_inventory" ||
      path === "/daily_production" ||
      path === "/stock_usage" ||
      path === "/goods_out";

    const isHrpRoute =
      path === "/Employees" ||
      path === "/Roles" ||
      path === "/hrp/roles" ||
      path === "/hrp/skills" ||
      path === "/Roster" ||
      path === "/hrp/roster" ||
      path === "/hrp/leave";

    if (isMrpRoute) setMrpOpen(true);
    if (isHrpRoute) setHrpOpen(true);
  }, [location.pathname]);

  const fullName =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
    (profileLoading ? "Loading…" : "—");
  const subtitle = profileLoading
    ? "Loading…"
    : [profile.jobTitle, profile.company ? `at ${profile.company}` : ""]
        .filter(Boolean)
        .join(" ") || "—";

  const COLLAPSED_W = 80;
  const EXPANDED_W = 260;

  // Section header (dropdown trigger)
  const SectionHeader = useMemo(() => {
    return function SectionHeaderInner({ label, icon, open, onToggle }) {
      const content = (
        <Box
          onClick={onToggle}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onToggle();
          }}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: isCollapsed ? "center" : "space-between",
            gap: 10,
            px: isCollapsed ? 0 : "14px",
            mx: isCollapsed ? 0 : "10px",
            my: 0.5,
            height: 44,
            borderRadius: "12px",
            cursor: "pointer",
            userSelect: "none",
            border: `1px solid ${brand.border}`,
            background: brand.surfaceMuted,
            "&:hover": { background: brand.hover },
            outline: "none",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: 999,
                display: "grid",
                placeItems: "center",
                border: `1px solid ${brand.border}`,
                background: "#fff",
              }}
            >
              {icon}
            </Box>

            {!isCollapsed && (
              <Typography
                sx={{
                  fontWeight: 900,
                  fontSize: 13,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: brand.subtext,
                }}
              >
                {label}
              </Typography>
            )}
          </Box>

          {!isCollapsed && (
            <Box sx={{ color: brand.subtext, display: "grid", placeItems: "center" }}>
              {open ? <ExpandMoreRoundedIcon /> : <ChevronRightRoundedIcon />}
            </Box>
          )}
        </Box>
      );

      if (isCollapsed) {
        return (
          <Box my={1} display="flex" justifyContent="center">
            <Tooltip title={label} placement="right">
              <Box>{content}</Box>
            </Tooltip>
          </Box>
        );
      }

      return (
        <Box my={1}>
          {content}
          <Box sx={{ px: "18px", mt: 1 }}>
            <Divider sx={{ borderColor: brand.border }} />
          </Box>
        </Box>
      );
    };
  }, [isCollapsed]);

  return (
    <Box display="flex">
      <Box
        sx={{
          width: isCollapsed ? `${COLLAPSED_W}px` : `${EXPANDED_W}px`,
          position: "fixed",
          height: "100vh",
          zIndex: 1000,

          borderRight: `1px solid ${brand.border}`,
          background: brand.surfaceMuted,

          "& .pro-sidebar-inner": {
            background: `${brand.surface} !important`,
            boxShadow: "none",
          },
          "& .pro-sidebar-layout": {
            background: "transparent !important",
          },
          "& .pro-sidebar > .pro-sidebar-inner > .pro-sidebar-layout .pro-sidebar-header":
            { border: "none" },

          "& .pro-icon-wrapper": {
            backgroundColor: "transparent !important",
            borderRadius: "999px !important",
          },
          "& .pro-inner-item": {
            padding: "10px 14px 10px 14px !important",
            margin: "6px 10px",
            borderRadius: "12px",
            color: `${brand.text} !important`,
          },
          "& .pro-inner-item > a": {
            color: `${brand.text} !important`,
          },
          "& .pro-inner-item:hover": {
            background: `${brand.hover} !important`,
            color: `${brand.text} !important`,
          },
          "& .pro-menu-item.active .pro-inner-item, & .pro-menu-item.active .pro-inner-item:hover":
            {
              background: `linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark}) !important`,
              color: `#fff !important`,
              boxShadow:
                "0 8px 16px rgba(29,78,216,0.20), 0 2px 4px rgba(15,23,42,0.06)",
            },
          "& .pro-menu-item.active .pro-icon-wrapper, & .pro-menu-item.active svg":
            { color: `#fff !important` },
        }}
      >
        <ProSidebar collapsed={isCollapsed}>
          <Menu iconShape="square">
            {/* LOGO / BURGER */}
            <MenuItem
              onClick={() => setIsCollapsed(!isCollapsed)}
              icon={<MenuOutlinedIcon />}
              style={{
                margin: "10px 10px 16px",
                color: brand.text,
              }}
            >
              {!isCollapsed && (
                <Box display="flex" justifyContent="flex-end" alignItems="center" ml="8px">
                  <IconButton
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    size="small"
                    sx={{
                      borderRadius: 999,
                      background: brand.hover,
                      border: `1px solid ${brand.border}`,
                      "&:hover": { background: "#e2e8f0" },
                    }}
                  >
                    <MenuOutlinedIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}
            </MenuItem>

            {/* Profile (expanded only) */}
            {!isCollapsed && (
              <Box mb="18px">
                <Box display="flex" justifyContent="center" alignItems="center">
                  <img
                    alt="profile-user"
                    width="88"
                    height="88"
                    src={`../../assets/user.png`}
                    style={{
                      cursor: "pointer",
                      borderRadius: "50%",
                      border: `1px solid ${brand.border}`,
                    }}
                  />
                </Box>
                <Box textAlign="center" mt={1}>
                  <Typography variant="h6" sx={{ color: brand.text, fontWeight: 800, m: "6px 0 0" }}>
                    {fullName}
                  </Typography>
                  <Typography variant="body2" sx={{ color: brand.subtext }}>
                    {subtitle}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Items */}
            <Box paddingLeft={isCollapsed ? undefined : "8px"}>
              <Item
                title="Dashboard"
                to="/dashboard"
                icon={<HomeOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />

              {/* MRP dropdown */}
              <SectionHeader
                label="MRP"
                icon={<FolderOutlinedIcon fontSize="small" />}
                open={mrpOpen}
                onToggle={() => setMrpOpen((v) => !v)}
              />

              {mrpOpen && (
                <>
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
                    title="Stock Inventory"
                    to="/stock_inventory"
                    icon={<WarehouseOutlinedIcon />}
                    selected={selected}
                    setSelected={setSelected}
                  />
                  <Item
                    title="Daily Production"
                    to="/daily_production"
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
                  <Item
                    title="Goods Out"
                    to="/goods_out"
                    icon={<NoCrashOutlinedIcon />}
                    selected={selected}
                    setSelected={setSelected}
                  />
                </>
              )}

              {/* HRP dropdown */}
              <SectionHeader
                label="HRP"
                icon={<GroupWorkOutlinedIcon fontSize="small" />}
                open={hrpOpen}
                onToggle={() => setHrpOpen((v) => !v)}
              />

              {hrpOpen && (
                <>
                  {/* 🔒 Locked HRP pages (dev gate) */}
                  <LockedItem
                    title="Roster"
                    to="/Roster"
                    icon={<CalendarMonthOutlinedIcon />}
                    selected={selected}
                    setSelected={setSelected}
                    unlocked={hrpUnlocked}
                    requestUnlock={requestHrpUnlock}
                  />
                  <LockedItem
                    title="Employees"
                    to="/Employees"
                    icon={<PeopleAltOutlinedIcon />}
                    selected={selected}
                    setSelected={setSelected}
                    unlocked={hrpUnlocked}
                    requestUnlock={requestHrpUnlock}
                  />
                  <LockedItem
                    title="Roles"
                    to="/Roles"
                    icon={<BadgeOutlinedIcon />}
                    selected={selected}
                    setSelected={setSelected}
                    unlocked={hrpUnlocked}
                    requestUnlock={requestHrpUnlock}
                  />
                  <LockedItem
                    title="Skills & Training"
                    to="/hrp/skills"
                    icon={<SchoolOutlinedIcon />}
                    selected={selected}
                    setSelected={setSelected}
                    unlocked={hrpUnlocked}
                    requestUnlock={requestHrpUnlock}
                  />
                  <LockedItem
                    title="Leave Requests"
                    to="/hrp/leave"
                    icon={<EventNoteOutlinedIcon />}
                    selected={selected}
                    setSelected={setSelected}
                    unlocked={hrpUnlocked}
                    requestUnlock={requestHrpUnlock}
                  />
                </>
              )}
            </Box>
          </Menu>
        </ProSidebar>
      </Box>

      {/* Main Content Area / Layout wrapper */}
      <Box
        sx={{
          marginLeft: isCollapsed ? `${COLLAPSED_W}px` : `${EXPANDED_W}px`,
          padding: isCollapsed ? "0px" : "12px",
          width: `calc(100% - ${isCollapsed ? COLLAPSED_W : EXPANDED_W}px)`,
          minHeight: "100vh",
          overflowY: "auto",
          position: "relative",
          background: brand.surfaceMuted,
        }}
      >
        {/* Routes render in App.jsx */}
      </Box>
    </Box>
  );
};

export default Sidebar;
