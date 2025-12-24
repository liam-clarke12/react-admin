// src/scenes/FeaturesPage/index.jsx
import React from "react";
import {
  Box,
  Button,
  Typography,
  Container,
  Grid,
  Paper,
  Stack,
  Divider,
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
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

// Brand Tokens (Consistent with Landing Page)
const brand = {
  text: "#1e293b",
  subtext: "#64748b",
  primary: "#7C3AED", // Nory Purple
  primaryDark: "#5B21B6",
  accent: "#10B981", // Fresh Green
  surface: "#ffffff",
  surfaceMuted: "#F8FAFC",
  border: "#f1f5f9",
};

// Reusable Feature Card Component
const FeatureCard = ({ icon, title, children }) => (
  <Paper
    elevation={0}
    sx={{
      height: "100%",
      p: 4,
      borderRadius: "20px",
      border: `1px solid ${brand.border}`,
      background: brand.surface,
      transition: "transform 0.3s ease, box-shadow 0.3s ease",
      "&:hover": {
        transform: "translateY(-5px)",
        boxShadow: "0 12px 24px rgba(0,0,0,0.05)",
        borderColor: brand.primary,
      },
    }}
  >
    <Box
      sx={{
        display: "inline-flex",
        p: 1.5,
        borderRadius: "12px",
        bgcolor: "rgba(124, 58, 237, 0.08)", // Light purple bg for icon
        color: brand.primary,
        mb: 2,
      }}
    >
      {icon}
    </Box>
    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, color: brand.text }}>
      {title}
    </Typography>
    <Typography variant="body1" sx={{ color: brand.subtext, lineHeight: 1.6 }}>
      {children}
    </Typography>
  </Paper>
);

const FeaturesPage = () => {
  const navigate = useNavigate();

  const handleSignIn = () => navigate("/login");
  const goHome = () => navigate("/");

  const handleNavClick = (item) => {
    if (item === "Contact") return navigate("/contact");
    if (item === "Features") return navigate("/features");
    if (item === "About") return goHome();
  };

  const featureList = [
    {
      icon: <Inventory2Icon fontSize="medium" />,
      title: "Real-time Stock",
      desc: "Live inventory levels across ingredients and finished goods—no more guessing or spreadsheets.",
    },
    {
      icon: <QrCodeScannerIcon fontSize="medium" />,
      title: "Barcode & Labels",
      desc: "Scan and print barcodes to speed up goods-in and trace batches instantly.",
    },
    {
      icon: <RestaurantMenuIcon fontSize="medium" />,
      title: "Recipe-driven Production",
      desc: "Convert recipes to production runs, auto-issue ingredients, and track yields accurately.",
    },
    {
      icon: <EventAvailableIcon fontSize="medium" />,
      title: "Expiry & Batch Tracking",
      desc: "Monitor shelf-life and lot numbers. Catch issues early with proactive alerts.",
    },
    {
      icon: <LocalShippingIcon fontSize="medium" />,
      title: "Goods In & Out",
      desc: "Fast intake, accurate pick/pack, and clear audit trails from supplier to customer.",
    },
    {
      icon: <InsightsIcon fontSize="medium" />,
      title: "Waste & Yield Insights",
      desc: "Understand shrink, batch variances, and margins to optimize production costs.",
    },
    {
      icon: <NotificationsActiveIcon fontSize="medium" />,
      title: "Smart Notifications",
      desc: "Automatic reminders for expiries and exceptions—stay ahead of problems.",
    },
    {
      icon: <StorefrontIcon fontSize="medium" />,
      title: "Multi-site Ready",
      desc: "Manage inventory across multiple kitchens or warehouses with unified visibility.",
    },
    {
      icon: <HubIcon fontSize="medium" />,
      title: "Simple Integrations",
      desc: "Import recipes or stock via CSV today; connect via API as you grow.",
    },
  ];

  return (
    <Box sx={{ backgroundColor: brand.surface, minHeight: "100vh", fontFamily: "Inter, sans-serif" }}>
      
      {/* --- HEADER (Copied & Adapted from LandingPage) --- */}
      <Box
        component="nav"
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          py: 2,
          px: { xs: 2, md: 8 },
          position: "sticky",
          top: 0,
          zIndex: 1000,
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(10px)",
          borderBottom: `1px solid ${brand.border}`,
        }}
      >
        {/* Logo Section */}
        <Box
          onClick={goHome}
          role="button"
          aria-label="Go to home"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            cursor: "pointer",
            userSelect: "none",
            "&:hover .brand-text": { color: brand.primaryDark },
          }}
        >
          <img
            src="/user.png"
            alt="Logo"
            style={{ height: 40, width: "auto", objectFit: "contain" }}
          />
          <Typography
            className="brand-text"
            sx={{
              fontWeight: 800,
              fontSize: "1.5rem",
              color: brand.text,
              letterSpacing: "-0.5px",
              transition: "color .15s ease",
            }}
          >
            Hupes
          </Typography>
        </Box>

        {/* Links & Action */}
        <Stack direction="row" spacing={4} alignItems="center">
          {["Features", "About", "Contact"].map((item) => (
            <Typography
              key={item}
              onClick={() => handleNavClick(item)}
              sx={{
                display: { xs: "none", md: "block" },
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.95rem",
                color: item === "Features" ? brand.primary : brand.subtext, // Highlight current page
                "&:hover": { color: brand.primary },
                transition: "0.2s",
              }}
            >
              {item}
            </Typography>
          ))}
          <Button
            variant="contained"
            disableElevation
            onClick={handleSignIn}
            sx={{
              borderRadius: "12px",
              px: 3,
              py: 1,
              textTransform: "none",
              fontWeight: 700,
              backgroundColor: brand.primary,
              "&:hover": { backgroundColor: brand.primaryDark },
            }}
          >
            Sign In
          </Button>
        </Stack>
      </Box>

      {/* --- HERO SECTION FOR FEATURES --- */}
      <Box sx={{ bgcolor: brand.surfaceMuted, pt: 10, pb: 8, borderBottom: `1px solid ${brand.border}` }}>
        <Container maxWidth="lg" sx={{ textAlign: "center" }}>
          <Box
            sx={{
              display: "inline-block",
              px: 2,
              py: 0.5,
              mb: 3,
              borderRadius: "20px",
              bgcolor: "rgba(16, 185, 129, 0.1)", // Green tint
              color: brand.accent,
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
              Powerful Capabilities
            </Typography>
          </Box>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 900,
              fontSize: { xs: "2.5rem", md: "3.5rem" },
              color: brand.text,
              mb: 3,
            }}
          >
            Everything you need to run <br /> a <span style={{ color: brand.primary }}>smarter kitchen</span>.
          </Typography>
          <Typography
            sx={{
              fontSize: "1.125rem",
              color: brand.subtext,
              maxWidth: "700px",
              mx: "auto",
              lineHeight: 1.6,
            }}
          >
            Stop using spreadsheets to manage complex production. Hupes gives you 
            traceability, recipe management, and inventory control in one modern platform.
          </Typography>
        </Container>
      </Box>

      {/* --- FEATURE GRID --- */}
      <Container id="features" sx={{ py: 12 }}>
        <Grid container spacing={4}>
          {featureList.map((item, index) => (
            <Grid item xs={12} md={4} key={index}>
              <FeatureCard icon={item.icon} title={item.title}>
                {item.desc}
              </FeatureCard>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* --- CTA SECTION --- */}
      <Container maxWidth="md" sx={{ mb: 12 }}>
        <Paper
          elevation={0}
          sx={{
            bgcolor: brand.text, // Dark slate background
            color: "white",
            borderRadius: "32px",
            p: { xs: 4, md: 8 },
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decorative Circle */}
          <Box
            sx={{
              position: "absolute",
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              borderRadius: "50%",
              bgcolor: brand.primary,
              opacity: 0.2,
            }}
          />

          <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
            Ready to optimize your production?
          </Typography>
          <Typography sx={{ color: "#94a3b8", mb: 4, fontSize: "1.1rem" }}>
            Join forward-thinking food brands tracking their efficiency with Hupes.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              onClick={handleSignIn}
              sx={{
                bgcolor: brand.primary,
                color: "white",
                fontWeight: 700,
                px: 4,
                py: 1.5,
                borderRadius: "12px",
                textTransform: "none",
                "&:hover": { bgcolor: brand.primaryDark },
              }}
            >
              Get Started for Free
            </Button>
          </Stack>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={3}
            justifyContent="center"
            sx={{ mt: 6, opacity: 0.8 }}
          >
            {["No credit card required", "14-day free trial", "Cancel anytime"].map((text) => (
              <Box key={text} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CheckCircleIcon sx={{ color: brand.accent, fontSize: 20 }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>{text}</Typography>
              </Box>
            ))}
          </Stack>
        </Paper>
      </Container>

      {/* --- FOOTER --- */}
      <Box sx={{ py: 6, textAlign: "center", borderTop: `1px solid ${brand.border}`, bgcolor: brand.surface }}>
        <Typography variant="body2" sx={{ color: brand.subtext }}>
          © {new Date().getFullYear()} Hupes Technologies. Built for the future of food.
        </Typography>
      </Box>
    </Box>
  );
};

export default FeaturesPage;