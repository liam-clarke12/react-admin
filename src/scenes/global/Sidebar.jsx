// src/components/Sidebar/index.jsx
import { useEffect, useMemo, useState } from "react";
import { ProSidebar, Menu, MenuItem } from "react-pro-sidebar";
import { Box, IconButton, Typography, Tooltip, Divider, Avatar } from "@mui/material";
import "react-pro-sidebar/dist/css/styles.css";
import { Link, useLocation } from "react-router-dom";

// Icons
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import BakeryDiningRoundedIcon from "@mui/icons-material/BakeryDiningRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import WarehouseRoundedIcon from "@mui/icons-material/WarehouseRounded";
import AddCircleRoundedIcon from "@mui/icons-material/AddCircleRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import LocalPizzaRoundedIcon from "@mui/icons-material/LocalPizzaRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import EventNoteRoundedIcon from "@mui/icons-material/EventNoteRounded";
import MenuOpenRoundedIcon from "@mui/icons-material/MenuOpenRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import KeyboardArrowRightRoundedIcon from '@mui/icons-material/KeyboardArrowRightRounded';

import { fetchUserAttributes } from "aws-amplify/auth";

const brand = {
  text: "#1e293b",
  subtext: "#64748b",
  border: "#f1f5f9",
  surface: "#ffffff",
  primary: "#7C3AED",
  primaryLight: "rgba(124, 58, 237, 0.08)",
  hover: "#f8fafc",
};

const HRP_ACCESS_CODE = "210100";
const HRP_UNLOCK_KEY = "dae_hrp_unlocked_dev";

const Item = ({ title, to, icon, selected, setSelected, isCollapsed }) => {
  const active = selected === title;
  return (
    <MenuItem
      active={active}
      onClick={() => setSelected(title)}
      icon={icon}
      style={{ listStyleType: "none", margin: "2px 12px" }}
    >
      <Link to={to} style={{ textDecoration: "none", color: active ? brand.primary : brand.text }}>
        <Typography sx={{ fontWeight: active ? 700 : 500, fontSize: "0.85rem" }}>
          {title}
        </Typography>
      </Link>
    </MenuItem>
  );
};

const Sidebar = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [selected, setSelected] = useState("Dashboard");
  const [mrpOpen, setMrpOpen] = useState(false);
  const [hrpOpen, setHrpOpen] = useState(false);
  const [hrpUnlocked, setHrpUnlocked] = useState(() => localStorage.getItem(HRP_UNLOCK_KEY) === "true");

  // User Profile State
  const [profile, setProfile] = useState({ firstName: "", lastName: "", jobTitle: "" });

  useEffect(() => {
    (async () => {
      try {
        const attrs = await fetchUserAttributes();
        setProfile({
          firstName: attrs?.given_name || "",
          lastName: attrs?.family_name || "",
          jobTitle: attrs?.["custom:jobTitle"] || "Admin"
        });
      } catch (e) { console.warn(e); }
    })();
  }, []);

  // Update selection based on path
  useEffect(() => {
    const path = location.pathname;
    const isMrp = ["/GoodsIn", "/IngredientsInventory", "/recipes", "/stock_inventory", "/daily_production", "/stock_usage", "/goods_out"].includes(path);
    const isHrp = ["/Employees", "/Roles", "/hrp/leave", "/Roster"].includes(path);
    if (isMrp) setMrpOpen(true);
    if (isHrp) setHrpOpen(true);
  }, [location.pathname]);

  const SectionHeader = ({ label, icon, open, onToggle }) => (
    <Box
      onClick={onToggle}
      sx={{
        display: "flex", alignItems: "center", justifyContent: isCollapsed ? "center" : "space-between",
        px: 2, py: 1.2, mx: 1.5, mt: 1, cursor: "pointer", borderRadius: "8px",
        "&:hover": { bgcolor: brand.hover }
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        {icon}
        {!isCollapsed && (
          <Typography sx={{ fontWeight: 700, fontSize: "0.75rem", color: brand.subtext, letterSpacing: "0.05rem" }}>
            {label}
          </Typography>
        )}
      </Box>
      {!isCollapsed && (open ? <KeyboardArrowDownRoundedIcon sx={{ fontSize: 18, color: brand.subtext }} /> : <KeyboardArrowRightRoundedIcon sx={{ fontSize: 18, color: brand.subtext }} />)}
    </Box>
  );

  return (
    <Box sx={{
      "& .pro-sidebar-inner": { background: `${brand.surface} !important` },
      "& .pro-sidebar": { borderRight: `1px solid ${brand.border}` },
      "& .pro-menu-item": { transition: "all 0.2s" },
      "& .pro-menu-item.active": {
        backgroundColor: `${brand.primaryLight} !important`,
        borderRadius: "8px",
        "& svg": { color: `${brand.primary} !important` },
        "&:before": { content: '""', position: "absolute", left: -12, height: "60%", width: "4px", bgcolor: brand.primary, borderRadius: "0 4px 4px 0" }
      },
      "& .pro-inner-item:hover": { background: "transparent !important" },
    }}>
      <ProSidebar collapsed={isCollapsed} width={260} collapsedWidth={80} style={{ position: "fixed", height: "100vh" }}>
        
        {/* Header / Logo */}
        <Box sx={{ p: 2, mb: 2, display: "flex", alignItems: "center", justifyContent: isCollapsed ? "center" : "space-between" }}>
          {!isCollapsed && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
               <Box sx={{ width: 32, height: 32, bgcolor: brand.primary, borderRadius: "8px", display: "grid", placeItems: "center" }}>
                  <LocalPizzaRoundedIcon sx={{ color: "#fff", fontSize: 20 }} />
               </Box>
               <Typography sx={{ fontWeight: 800, color: brand.text, fontSize: "1.1rem" }}>Hupes</Typography>
            </Box>
          )}
          <IconButton onClick={() => setIsCollapsed(!isCollapsed)}>
            <MenuOpenRoundedIcon sx={{ transform: isCollapsed ? "rotate(180deg)" : "none", transition: "0.3s" }} />
          </IconButton>
        </Box>

        <Menu iconShape="circle">
          <Item title="Dashboard" to="/dashboard" icon={<HomeRoundedIcon sx={{ fontSize: 20 }} />} selected={selected} setSelected={setSelected} isCollapsed={isCollapsed} />
          
          <Divider sx={{ my: 2, mx: 3, borderColor: brand.border }} />

          <SectionHeader label="PRODUCTION" icon={<WarehouseRoundedIcon sx={{ fontSize: 18, color: brand.subtext }} />} open={mrpOpen} onToggle={() => setMrpOpen(!mrpOpen)} />
          {mrpOpen && !isCollapsed && (
            <Box sx={{ pl: 1 }}>
              <Item title="Goods In" to="/GoodsIn" icon={<LocalShippingRoundedIcon sx={{ fontSize: 18 }} />} selected={selected} setSelected={setSelected} />
              <Item title="Inventory" to="/IngredientsInventory" icon={<BakeryDiningRoundedIcon sx={{ fontSize: 18 }} />} selected={selected} setSelected={setSelected} />
              <Item title="Recipes" to="/recipes" icon={<DescriptionRoundedIcon sx={{ fontSize: 18 }} />} selected={selected} setSelected={setSelected} />
              <Item title="Production" to="/daily_production" icon={<AddCircleRoundedIcon sx={{ fontSize: 18 }} />} selected={selected} setSelected={setSelected} />
              <Item title="Usage" to="/stock_usage" icon={<Inventory2RoundedIcon sx={{ fontSize: 18 }} />} selected={selected} setSelected={setSelected} />
            </Box>
          )}

          <SectionHeader label="PEOPLE" icon={<PeopleAltRoundedIcon sx={{ fontSize: 18, color: brand.subtext }} />} open={hrpOpen} onToggle={() => setHrpOpen(!hrpOpen)} />
          {hrpOpen && !isCollapsed && (
            <Box sx={{ pl: 1 }}>
              <Item title="Roster" to="/Roster" icon={<CalendarMonthRoundedIcon sx={{ fontSize: 18 }} />} selected={selected} setSelected={setSelected} />
              <Item title="Leave" to="/hrp/leave" icon={<EventNoteRoundedIcon sx={{ fontSize: 18 }} />} selected={selected} setSelected={setSelected} />
              <Item title="Employees" to="/Employees" icon={<BadgeRoundedIcon sx={{ fontSize: 18 }} />} selected={selected} setSelected={setSelected} />
            </Box>
          )}
        </Menu>

        {/* Footer Profile */}
        {!isCollapsed && (
          <Box sx={{ position: "absolute", bottom: 20, left: 20, right: 20, p: 1.5, borderRadius: "12px", border: `1px solid ${brand.border}`, display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: brand.primary, fontWeight: 700, fontSize: "0.8rem" }}>
                {profile.firstName[0]}{profile.lastName[0]}
            </Avatar>
            <Box sx={{ overflow: "hidden" }}>
                <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: brand.text, whiteSpace: "nowrap" }}>
                    {profile.firstName} {profile.lastName}
                </Typography>
                <Typography sx={{ fontSize: "0.7rem", color: brand.subtext, whiteSpace: "nowrap" }}>
                    {profile.jobTitle}
                </Typography>
            </Box>
          </Box>
        )}
      </ProSidebar>
    </Box>
  );
};

export default Sidebar;