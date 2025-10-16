// src/scenes/FeaturesPage/index.jsx
import React from "react";
import {
  Box,
  Button,
  Typography,
  Container,
  Grid,
  Paper,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

// Icons
import Inventory2Icon from "@mui/icons-material/Inventory2";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import InsightsIcon from "@mui/icons-material/Insights";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import StorefrontIcon from "@mui/icons-material/Storefront";
import HubIcon from "@mui/icons-material/Hub";

const brand = {
  text: "#0f172a",
  subtext: "#334155",
  border: "#e5e7eb",
  surface: "#ffffff",
  surfaceMuted: "#f8fafc",
  primary: "#A3CDD5",
  primaryDark: "#82A4AA",
  focusRing: "rgba(163,205,213,0.35)",
  shadow: "0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.08)",
};

const FeatureCard = ({ icon, title, children }) => (
  <Paper
    elevation={0}
    sx={{
      height: "100%",
      p: 3,
      borderRadius: 2,
      border: `1px solid ${brand.border}`,
      background: brand.surface,
      boxShadow: brand.shadow,
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
      <Box sx={{ display: "grid", placeItems: "center" }}>{icon}</Box>
      <Typography sx={{ fontWeight: 800, color: brand.text }}>{title}</Typography>
    </Box>
    <Typography sx={{ color: brand.subtext, lineHeight: 1.6 }}>{children}</Typography>
  </Paper>
);

const FeaturesPage = () => {
  const navigate = useNavigate();

  const goHome = () => navigate("/");
  const handleSignIn = () => navigate("/login");
  const handleNavClick = (item) => {
    if (item === "Contact") return navigate("/contact");
    if (item === "Features") return navigate("/features");
    if (item === "About") return goHome();
  };

  return (
    <Box sx={{ fontFamily: "Roboto, sans-serif" }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          py: 2,
          px: 4,
          backgroundColor: "#fff",
          borderBottom: `1px solid ${brand.border}`,
        }}
      >
        {/* Brand (clickable) */}
        <Box
          onClick={goHome}
          role="button"
          aria-label="Go to home"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            cursor: "pointer",
            userSelect: "none",
            "&:hover .brand-text": { color: brand.primaryDark },
          }}
        >
          <Typography
            className="brand-text"
            sx={{
              fontWeight: "bold",
              fontSize: "1.25rem",
              color: brand.text,
              transition: "color .15s ease",
            }}
          >
            Hupes
          </Typography>
          <img
            src="/user.png"
            alt="Logo"
            style={{ height: 40, marginRight: 8, pointerEvents: "none" }}
          />
        </Box>

        {/* Nav + Sign In */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
          {["Features", "About", "Contact"].map((item) => (
            <Typography
              key={item}
              onClick={() => handleNavClick(item)}
              sx={{
                cursor: "pointer",
                fontWeight: "bold",
                color: brand.primary,
                "&:hover": { color: brand.primaryDark },
                transition: "color .15s ease",
              }}
            >
              {item}
            </Typography>
          ))}
          <Button
            variant="contained"
            sx={{
              borderRadius: "999px",
              px: 2.5,
              fontWeight: 600,
              backgroundColor: brand.primary,
              "&:hover": { backgroundColor: brand.primaryDark },
              textTransform: "none",
            }}
            onClick={handleSignIn}
          >
            Sign In
          </Button>
        </Box>
      </Box>

      {/* Hero */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "46% 1fr" },
          minHeight: "80vh",
          background:
            "radial-gradient(800px 400px at 80% -20%, #ffe4ea 0%, rgba(255,228,234,0) 60%), linear-gradient(180deg, #fff 0%, #f8fafc 100%)",
        }}
      >
        {/* Left */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            px: { xs: 3, md: 8 },
            py: { xs: 6, md: 0 },
          }}
        >
          <Typography
            variant="h2"
            sx={{
              fontWeight: 900,
              mb: 2,
              lineHeight: 1.15,
              color: brand.text,
              fontSize: { xs: "2rem", md: "2.6rem" },
            }}
          >
            Everything you need to run a smarter kitchen.
          </Typography>
          <Typography sx={{ mb: 4, color: brand.subtext, fontSize: 16 }}>
            From goods-in to goods-out, Hupes gives you real-time stock, recipe-driven
            production, and crystal-clear traceability—wrapped in a clean, fast UI.
          </Typography>

          <Box>
            <Button
              variant="contained"
              sx={{
                borderRadius: "999px",
                px: 3,
                py: 1.25,
                fontWeight: 800,
                textTransform: "none",
                background: `linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark})`,
                boxShadow:
                  "0 8px 16px rgba(29,78,216,0.25), 0 2px 4px rgba(15,23,42,0.06)",
                "&:hover": {
                  background: `linear-gradient(180deg, ${brand.primaryDark}, ${brand.primaryDark})`,
                },
              }}
              onClick={() => navigate("/login")}
            >
              Get Started
            </Button>
          </Box>
        </Box>

        {/* Right image */}
        <Box
          sx={{
            display: { xs: "none", md: "block" },
            overflow: "hidden",
            maxWidth: "60%",
            margin: "auto",
            borderRadius: 16,
          }}
        >
          <img
            src="/assets/pexels-shvetsa-5953694.jpg"
            alt="Inventory illustration"
            style={{
              width: "100%",
              height: "auto",
              objectFit: "cover",
              borderRadius: 16,
            }}
          />
        </Box>
      </Box>

      {/* Features Grid */}
      <Container id="features" sx={{ py: 10 }}>
        <Typography
          variant="h4"
          sx={{ fontWeight: 700, textAlign: "center", mb: 6, color: brand.text }}
        >
          Powerful features, practical outcomes
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <FeatureCard
              icon={<Inventory2Icon sx={{ color: brand.primary }} />}
              title="Real-time Stock"
            >
              Live inventory levels across ingredients and finished goods—no more guessing.
            </FeatureCard>
          </Grid>
          <Grid item xs={12} md={4}>
            <FeatureCard
              icon={<QrCodeScannerIcon sx={{ color: brand.primary }} />}
              title="Barcode & Labels"
            >
              Scan and print barcodes to speed up goods-in and trace batches instantly.
            </FeatureCard>
          </Grid>
          <Grid item xs={12} md={4}>
            <FeatureCard
              icon={<RestaurantMenuIcon sx={{ color: brand.primary }} />}
              title="Recipe-driven Production"
            >
              Convert recipes to production runs, auto-issue ingredients, and track yields.
            </FeatureCard>
          </Grid>

          <Grid item xs={12} md={4}>
            <FeatureCard
              icon={<EventAvailableIcon sx={{ color: brand.primary }} />}
              title="Expiry & Batch Tracking"
            >
              Monitor shelf-life and lot numbers. Catch issues early with proactive alerts.
            </FeatureCard>
          </Grid>
          <Grid item xs={12} md={4}>
            <FeatureCard
              icon={<LocalShippingIcon sx={{ color: brand.primary }} />}
              title="Goods In & Out"
            >
              Fast intake, accurate pick/pack, and clear audit trails from supplier to customer.
            </FeatureCard>
          </Grid>
          <Grid item xs={12} md={4}>
            <FeatureCard
              icon={<InsightsIcon sx={{ color: brand.primary }} />}
              title="Waste & Yield Insights"
            >
              Understand shrink, batch variances, and margins to optimize production.
            </FeatureCard>
          </Grid>

          <Grid item xs={12} md={4}>
            <FeatureCard
              icon={<NotificationsActiveIcon sx={{ color: brand.primary }} />}
              title="Smart Notifications"
            >
              Automatic reminders for expiries and exceptions—stay ahead of problems.
            </FeatureCard>
          </Grid>
          <Grid item xs={12} md={4}>
            <FeatureCard
              icon={<StorefrontIcon sx={{ color: brand.primary }} />}
              title="Multi-site Ready"
            >
              Manage inventory across locations with unified visibility and controls.
            </FeatureCard>
          </Grid>
          <Grid item xs={12} md={4}>
            <FeatureCard
              icon={<HubIcon sx={{ color: brand.primary }} />}
              title="Simple Integrations"
            >
              Import recipes or stock via CSV today; API/EDI integrations as you grow.
            </FeatureCard>
          </Grid>
        </Grid>
      </Container>

      {/* Footer bar */}
      <Box sx={{ height: 60, backgroundColor: brand.primary }} />
    </Box>
  );
};

export default FeaturesPage;
