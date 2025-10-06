// src/components/Sidebar/index.jsx
import { useEffect, useState } from "react";
import { ProSidebar, Menu, MenuItem } from "react-pro-sidebar";
import { Box, IconButton, Typography, useTheme, Tooltip, Divider } from "@mui/material";
import "react-pro-sidebar/dist/css/styles.css";
import { Link } from "react-router-dom";
import { tokens } from "../../themes";
import NoCrashOutlinedIcon from '@mui/icons-material/NoCrashOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import InventoryOutlinedIcon from '@mui/icons-material/InventoryOutlined';
import WarehouseOutlinedIcon from '@mui/icons-material/WarehouseOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import OutdoorGrillOutlinedIcon from '@mui/icons-material/OutdoorGrillOutlined';
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import DeliveryDiningOutlinedIcon from '@mui/icons-material/DeliveryDiningOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import BakeryDiningOutlinedIcon from '@mui/icons-material/BakeryDiningOutlined';

// ✅ Amplify v6 modular auth API
import { fetchUserAttributes } from "aws-amplify/auth";

const brand = {
  text: "#0f172a",
  subtext: "#64748b",
  border: "#e5e7eb",
  surface: "#ffffff",
  surfaceMuted: "#f8fafc",
  primary: "#e11d48",
  primaryDark: "#be123c",
  hover: "#f1f5f9",
  focusRing: "rgba(225, 29, 72, 0.35)",
  shadow: "0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.08)",
};

// Single menu item component (keeps selected logic & routing)
const Item = ({ title, to, icon, selected, setSelected }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
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
        <Typography
          sx={{
            fontWeight: active ? 800 : 600,
            fontSize: 14,
          }}
        >
          {title}
        </Typography>
      </Link>
    </MenuItem>
  );
};

const Sidebar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [selected, setSelected] = useState("Dashboard");

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
          (attrs?.name ? String(attrs.name).trim().split(/\s+/).slice(0, -1).join(" ") : "");
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

  const fullName =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") || (profileLoading ? "Loading…" : "—");
  const subtitle = profileLoading
    ? "Loading…"
    : [profile.jobTitle, profile.company ? `at ${profile.company}` : ""]
        .filter(Boolean)
        .join(" ") || "—";

  const COLLAPSED_W = 80;
  const EXPANDED_W = 260;

  // Section separator component — adapts to collapsed/expanded states
  const SectionSeparator = ({ label }) => {
    if (isCollapsed) {
      // collapsed: small visual tick with tooltip
      return (
        <Box display="flex" justifyContent="center" alignItems="center" my={1}>
          <Tooltip title={label} placement="right">
            <Box
              sx={{
                width: 28,
                height: 4,
                borderRadius: 2,
                background: brand.hover,
                border: `1px solid ${brand.border}`,
              }}
            />
          </Tooltip>
        </Box>
      );
    }

    // expanded: caption + divider
    return (
      <Box sx={{ px: "18px", my: 1 }}>
        <Typography
          variant="caption"
          sx={{ color: brand.subtext, display: "block", fontWeight: 700, mb: 1 }}
        >
          {label}
        </Typography>
        <Divider sx={{ borderColor: brand.border }} />
      </Box>
    );
  };

  return (
    <Box display="flex">
      <Box
        sx={{
          width: isCollapsed ? `${COLLAPSED_W}px` : `${EXPANDED_W}px`,
          position: "fixed",
          height: "100vh",
          zIndex: 1000,

          // --- Nory look & react-pro-sidebar overrides ---
          borderRight: `1px solid ${brand.border}`,
          background: brand.surfaceMuted,

          "& .pro-sidebar-inner": {
            background: `${brand.surface} !important`,
            boxShadow: "none",
          },
          "& .pro-sidebar-layout": {
            background: "transparent !important",
          },
          "& .pro-sidebar > .pro-sidebar-inner > .pro-sidebar-layout .pro-sidebar-header": {
            border: "none",
          },

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
          "& .pro-menu-item.active .pro-inner-item, & .pro-menu-item.active .pro-inner-item:hover": {
            background: `linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark}) !important`,
            color: `#fff !important`,
            boxShadow: "0 8px 16px rgba(29,78,216,0.20), 0 2px 4px rgba(15,23,42,0.06)",
          },
          "& .pro-menu-item.active .pro-icon-wrapper, & .pro-menu-item.active svg": {
            color: `#fff !important`,
          },
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
                <Box
                  display="flex"
                  justifyContent="flex-end"
                  alignItems="center"
                  ml="8px"
                >
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
                  <Typography
                    variant="h6"
                    sx={{ color: brand.text, fontWeight: 800, m: "6px 0 0" }}
                  >
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

              {/* Section: Forms */}
              <SectionSeparator label="Forms" />

              <Item
                title="Goods In Form"
                to="/GoodsInForm"
                icon={<DeliveryDiningOutlinedIcon />}
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
              <Item
                title="Goods Out Form"
                to="/goods_out_form"
                icon={<Inventory2OutlinedIcon />}
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

              {/* Section: Data */}
              <SectionSeparator label="Data" />

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
            </Box>
          </Menu>
        </ProSidebar>
      </Box>

      {/* Main Content Area */}
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
        {/* Your main content goes here */}
      </Box>
    </Box>
  );
};

export default Sidebar;
